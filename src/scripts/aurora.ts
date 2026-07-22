// @ts-nocheck
/* =========================================================================
   Aurora — animated hero background.

   Vanilla WebGL2 port of the React Bits "Aurora" background (which uses the
   `ogl` library + a simplex-noise aurora shader). No React, no ogl dependency
   — just a full-screen triangle and one fragment shader. The colour stops are
   tuned to the Serifa Lab palette (indigo → lime → indigo).

   Called by Hero.astro ONLY when motion is allowed (dynamically imported, so
   reduced-motion visitors never download it). Scoped to the hero:
     • the canvas lives inside .hero (clipped by its overflow:hidden)
     • an IntersectionObserver pauses the render loop when the hero scrolls out
     • the loop also pauses while the tab is hidden
   If WebGL2 is unavailable it bails silently (hero just shows the --shaft bg).
   ========================================================================= */

const VERT = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                              \\
  for (int i = 0; i < 2; i++) {                               \\
     ColorStop currentColor = colors[i];                      \\
     bool isInBetween = currentColor.position <= factor;      \\
     index = int(mix(float(index), float(i), float(isInBetween))); \\
  }                                                           \\
  ColorStop currentColor = colors[index];                     \\
  ColorStop nextColor = colors[index + 1];                    \\
  float range = nextColor.position - currentColor.position;   \\
  float lerpFactor = (factor - currentColor.position) / range;\\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}`;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function initAurora(canvas: HTMLCanvasElement, opts = {}) {
  const config = {
    // indigo (#5B54E8) → lime (#C6F24E) → indigo (#5B54E8)
    colorStops: ['#5B54E8', '#C6F24E', '#5B54E8'],
    amplitude: 1.0,
    blend: 0.5,
    speed: 0.8,
    ...opts,
  };

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  });
  if (!gl) return () => {}; // no WebGL2 → hero keeps the plain --shaft background

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return () => {};
  }
  gl.useProgram(program);

  // full-screen triangle
  const posLoc = gl.getAttribLocation(program, 'position');
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'uTime');
  const uAmplitude = gl.getUniformLocation(program, 'uAmplitude');
  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uBlend = gl.getUniformLocation(program, 'uBlend');
  const uColorStops = gl.getUniformLocation(program, 'uColorStops');

  // static uniforms
  gl.uniform1f(uAmplitude, config.amplitude);
  gl.uniform1f(uBlend, config.blend);
  gl.uniform3fv(uColorStops, new Float32Array(config.colorStops.flatMap(hexToRgb)));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for perf
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
  }

  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(canvas);
  else window.addEventListener('resize', resize);
  resize();

  // pause when the hero (canvas) is offscreen — scopes the sim to the first screen
  let visible = true;
  const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  let rafId = 0;
  function frame(t) {
    rafId = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    gl.uniform1f(uTime, t * 0.001 * config.speed);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  rafId = requestAnimationFrame(frame);

  // teardown (not used by the static site, but handy if ever needed)
  return () => {
    cancelAnimationFrame(rafId);
    io.disconnect();
    if (ro) ro.disconnect();
    else window.removeEventListener('resize', resize);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
