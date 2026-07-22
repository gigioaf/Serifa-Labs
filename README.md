# Serifa Lab

Site de marketing do **Serifa Lab** — estúdio de design & código. Estático,
construído em [Astro](https://astro.build), com **zero JavaScript por padrão**;
as animações (GSAP + ScrollTrigger) são uma "ilha" carregada só quando o
usuário permite movimento.

Portado 1:1 de `serifa-lab_12.html` (a fonte da verdade original). Layout,
paleta, tipografia, textos, logo e todos os efeitos foram preservados.

---

## Rodar o projeto

Requer **Node 22** (veja `.nvmrc`).

```bash
npm install        # instala dependências
npm run dev        # servidor de desenvolvimento → http://localhost:4321
npm run build      # gera o site estático em dist/
npm run preview    # serve o build de dist/ localmente
```

Scripts utilitários (não precisam rodar no dia a dia — já foram executados e os
resultados estão commitados):

```bash
npm run extract:logos   # re-extrai os PNGs do logo de serifa-lab_12.html → src/assets/
npm run gen:assets      # re-gera favicon + og-image + logo-serifa a partir do logo
```

---

## Estrutura

```
src/
  layouts/Base.astro        # <head>, SEO, Open Graph/Twitter, JSON-LD, fontes, tokens
  components/
    Nav.astro  Hero.astro  Seal.astro  Manifesto.astro  Stats.astro
    Services.astro          # 4 painéis sticky        (data/services.json)
    Work.astro              # grade de cards + artes em CSS (data/projects.json)
    Quote.astro  Process.astro  Faq.astro                (data/faq.json)
    Palette.astro           # specimen do sistema de cor
    TypeSpecimen.astro      # playground tipográfico interativo (ilha vanilla)
    Closing.astro  Footer.astro
    Preloader.astro  Cursor.astro  Folio.astro  Grain.astro
    Toc.astro               # sumário "line sidebar" (navegação de seções à direita)
  pages/
    index.astro             # a página — compõe todos os componentes
    obrigado.astro          # página de sucesso do formulário (opcional)
  scripts/
    effects-base.ts         # efeitos SEM GSAP (rodam sempre): preloader failsafe,
                            #   nav, empilhamento 3D, cursor, fólio, FAQ
    effects-gsap.ts         # ilha de movimento (GSAP): preloader, hero, reveals,
                            #   parallax, botões magnéticos — importada só se houver movimento
    aurora.ts               # fundo Aurora do herói (ilha WebGL2, casada c/ paleta)
  styles/global.css         # tokens + TODO o CSS (global de propósito — ver nota)
  data/
    studio.json  services.json  projects.json  faq.json
  assets/
    logo.png  logo-s.png    # wordmark + "S" extraídos do base64 do HTML original
    mark.png                # ÍCONE/MARCA (frasco) como máscara — gerado de mark-source.png
    mark-source.png         # o ícone original enviado (PNG hi-res), fonte do mark.png
public/
  trabalho/                 # demos autocontidas do portfólio (HTML estático)
    brasa/  volt/  marfim/
  favicon.svg  favicon.png  apple-touch-icon.png
  og-image.png  logo-serifa.png   # gerados a partir do logo
  robots.txt
scripts/
  extract-logos.mjs  generate-assets.mjs   # geradores (Node, uso pontual)
serifa-lab_12.html          # HTML original (referência / fonte dos geradores)
brasa.html  volt.html       # demos originais (fonte de public/trabalho/)
```

### Por que todo o CSS está em um único `global.css`?

A ilha GSAP seleciona elementos pelos nomes de classe (`.reveal`, `.panel`,
`.pcard`, `.faq-item`…). Os blocos `<style>` do Astro são **escopados** — eles
renomeiam as classes e quebrariam todas as interações. Por isso o sistema
inteiro vive em `global.css` como CSS global. Os **tokens** (paleta, fontes,
espaçamentos) estão no topo desse arquivo.

### Sobre a "ilha" de efeitos (client:load / client:visible)

Os componentes são `.astro` puros (sem React/Vue), então não há diretivas
`client:load`/`client:visible` literais — elas só existem para componentes de
framework. O mesmo comportamento foi reproduzido em JS vanilla:

- **`effects-base.ts`** roda imediatamente (equivalente a `client:load`), sem
  GSAP. Contém tudo que precisa funcionar sempre — inclusive com movimento
  reduzido ou se o GSAP falhar.
- **`effects-gsap.ts`** é importado dinamicamente **só quando o movimento é
  permitido** (equivalente a `client:visible`/deferido). Quem usa
  `prefers-reduced-motion` baixa **zero** de GSAP.

Todos os guards do original foram mantidos: `prefers-reduced-motion` desliga
preloader/cursor/magnetismo/animações; cursor e magnetismo só em `pointer:fine`;
o preloader **sempre** se remove (a página nunca fica presa).

### Playground tipográfico (`TypeSpecimen.astro`)

A seção **Tipografia** (`#tipografia`, depois da Paleta) é um specimen interativo
da **Fraunces variável**: sliders de peso (`wght`), tamanho óptico (`opsz`) e
tamanho, toggle de itálico e um campo para digitar sua própria palavra. O script
dirige `font-variation-settings` ao vivo (os eixos existem porque a fonte
self-hosted usa o corte `opsz` do @fontsource).

É uma **ilha vanilla** (um `<script>` de componente, ~1KB, sem runtime de
framework) — escolha deliberada de performance para um widget baseado em
`<input type="range">`. Sem JS, o specimen renderiza nos valores padrão do
markup; funciona também com `prefers-reduced-motion` (é dirigido pelo usuário,
não é auto-animação).

> Quer em **React**? Dá para converter para uma ilha React (`@astrojs/react` +
> `client:visible`) sem tocar no resto do site — peça e eu troco. Para este
> efeito específico, o vanilla entrega a mesma UX com zero runtime.

### Aurora — fundo animado do herói (`aurora.ts`)

Um fundo **aurora** em WebGL2 atrás do herói (porte vanilla do "Aurora" do
React Bits, que usa a lib `ogl` + um shader de simplex-noise). Sem React e **sem
a dependência `ogl`** — só um triângulo full-screen e um fragment shader. Os
*color stops* foram trocados pela **paleta da Serifa** (barley → akaroa →
barley-l). O canvas vive dentro do `.hero`, então:

- **Escopo:** aparece **só na primeira tela** — recortado pelo `overflow:hidden`
  do herói. A simulação **pausa** quando o herói sai da viewport
  (IntersectionObserver) e quando a aba fica oculta (`document.hidden`).
- **Gate:** desligado em `prefers-reduced-motion` (o módulo WebGL, ~2&thinsp;KB
  gzip, **nem é baixado**); DPR limitado a 2.
- **Fallback:** sem WebGL2, o herói mostra o fundo `--shaft` normal (sem erro).
- **Camadas:** `z-index:0` dentro do herói — atrás do conteúdo (`z-1`) e da
  lombada `.amp`. O cursor customizado e o resto do site seguem intactos.

**Ajustes rápidos** (`src/scripts/aurora.ts`):
- **Cores:** `config.colorStops` (3 hex da paleta).
- **Intensidade / mistura / velocidade:** `config.amplitude`, `config.blend`, `config.speed`.
- **Orientação:** o shader concentra a aurora no topo (padrão do React Bits).
  Para levá-la para baixo, troque `uv.y` por `1.0 - uv.y` no `main()` do FRAG.
- **Remover:** apague o `<canvas class="aurora">` e o `<script>` de
  `src/components/Hero.astro`.

> Nota: por ser WebGL rodando na GPU, é um efeito com custo — mas contido ao
> herói e pausado fora dele. Se o Lighthouse de performance cair abaixo da meta
> em máquinas modestas, é o primeiro candidato a revisar.

### Selo giratório — "circular text" (`Seal.astro`)

Substituiu a antiga marca d'água vertical "SERIFA" do herói. É um **selo
giratório** (porte vanilla do React Bits *Circular Text*): o texto
`SERIFA LAB · DESIGN & CÓDIGO ·` orbita o **"S"** do logo (parado no centro),
em bronze, no lado direito do herói.

- **Sem React:** cada caractere é uma `<span>` rotacionada para a sua posição; a
  rotação contínua é um `@keyframes` de CSS (`.circular-text`), que **para em
  `prefers-reduced-motion`** (vira um selo estático).
- **Parallax:** herdou o drift leve de scroll + mouse da lombada antiga — agora
  no `.seal` (retargeteado em `effects-gsap.ts`); some sob movimento reduzido.
- **Decorativo:** `aria-hidden`, `pointer-events:none`, atrás do conteúdo (z-0).
- **Editar:** o texto está em `src/components/Seal.astro` (`const text`); os
  ângulos são recalculados sozinhos. Cor/tamanho/velocidade em `.seal*` /
  `@keyframes seal-spin` (`global.css`). Para tirar o "S" central, remova
  `.seal-mark`.

### Sumário — "line sidebar" (`Toc.astro`)

Navegação de seções fixa à **direita** (porte vanilla do React Bits *Line
Sidebar* — só CSS + estado ativo, **sem React**). Cada item é uma linha que
cresce e revela o rótulo no hover/foco; a linha da seção atual fica em bronze.

- **Sincronizado com o fólio:** o mesmo `IntersectionObserver` em
  `effects-base.ts` controla os dois — o sumário aparece fora do herói (classe
  `.on`) e marca `.active` no item cujo `data-n` bate com a numeração editorial
  (01 Manifesto → 07 Contato). **Sem JS extra** além desse observer.
- **Links reais:** cada item é um `<a href="#secao">`, então **funciona sem JS**
  (scroll suave nativo). O JS só adiciona o destaque da seção atual.
- **Responsivo/a11y:** escondido `<1024px` e no herói (`visibility:hidden`, fora
  da ordem de tabulação); rótulos legíveis por leitor de tela e no foco de teclado.
- **Editar itens:** a lista está em `src/components/Toc.astro` (mantenha os
  `data-n` em sincronia com o mapa do fólio em `effects-base.ts`). Para mudar de
  lado, troque `right` por `left` em `.toc` (em `global.css`).

### Botões especulares (`.specular`)

Porte vanilla do React Bits *Specular Button*: um **brilho especular que segue o
cursor** sobre o botão, com um leve realce no topo (glossy). Reflexo na paleta
(White Rock), `mix-blend-mode: screen`.

- **Onde:** aplicado via classe `.specular` nos botões `.btn-primary` (herói),
  `.pill` (nav) e `.chip-toggle` (specimen tipográfico). Para dar o efeito a um
  novo botão, é só adicionar a classe `specular`.
- **Como:** o highlight é um `::before` com `radial-gradient` em `--mx/--my`,
  atualizados no `mousemove` por `effects-base.ts` (só `pointer:fine`). **Sem JS
  ou em touch**, o CSS `:hover`/`:focus-visible` mostra o brilho **centralizado**
  — o botão nunca fica quebrado. Sem chunk JS novo.
- **Não aplicado a:** links de texto (`.btn-ghost`, `.mail`) e às linhas do FAQ
  (`.faq-q`), que não são botões preenchidos — o efeito ficaria estranho neles.
  Se quiser incluí-los, é só acrescentar `specular` a eles.
- **Ajustar:** cor/tamanho do reflexo no `.specular::before` (`global.css`).

---

## Editar o conteúdo

Quase todo o texto vive em `src/data/*.json`. Edite e o site se atualiza no
próximo build. Use exatamente os textos que quiser publicar.

### `studio.json` — dados do estúdio
```jsonc
{
  "email": "contato@serifalabs.com",
  "founded": "2025",
  "address": { "city": "São Paulo", "region": "SP", "country": "Brasil", "countryCode": "BR" },
  "social": [                             // ⚠ confirmar URLs (hoje são "#")
    { "label": "Instagram", "url": "#" },
    { "label": "Behance",   "url": "#" },
    { "label": "LinkedIn",  "url": "#" }
  ],
  "stats": [                              // ⚠ confirmar os 4 números da seção Stats
    { "n": "3", "l": "Projetos entregues em 2025" },
    { "n": "100", "em": "%", "l": "Sob medida — nenhum template" }  // "em" = sufixo em bronze
  ]
}
```
Isso alimenta a seção **Stats**, o **rodapé**, o CTA de e-mail e o **JSON-LD**.

### `services.json` — os 4 painéis empilhados
Cada item: `face` (`f-rock` | `f-akaroa` | `f-barley` | `f-shaft`), `num`,
`title` e 3 `cells` com `lab`+`text`. Obs.: a pedido, o fundo do painel `f-rock`
foi trocado de White Rock para **Mine Shaft** (o nome da classe permanece, mas
agora ele é escuro com texto claro); o arco dos painéis ficou
shaft → akaroa → barley → shaft.

### `projects.json` — os cards do portfólio
Cada item: `name` (título do card), `display` (texto grande da mini-arte), `tags`,
`year`, `route` (destino do link) e `art` (`brasa` | `volt` | `marfim` — a chave
da arte CSS; **as mini-artes são CSS puro**, definidas em `global.css`).

### `faq.json` — perguntas e respostas
Lista de `{ "q": "...", "a": "..." }`. O accordion e o `aria-expanded` são
automáticos.

> Textos que **não** estão em JSON (por serem estáticos): Manifesto, Quote,
> Process e o specimen de Palette ficam inline nos respectivos componentes
> em `src/components/`.

---

## ✅ Checklist de placeholders (antes de publicar)

- [ ] **Depoimento (Quote) — FABRICADO.** "Camila Duarte · Brasa" é inventado.
      **Recomendação: REMOVER a seção** até existir um depoimento real e
      atribuível. Para remover, apague `<Quote />` de `src/pages/index.astro`
      (o componente `Quote.astro` pode ficar guardado). Nunca publique
      depoimento inventado.
- [x] **E-mail** `contato@serifalabs.com` (`studio.json`).
- [x] **Redes sociais** — só o Instagram (`studio.json` → `social`), já com a
      URL real. Para acrescentar outra rede, basta um novo item na lista; URLs
      `#` são ignoradas no `sameAs` do JSON-LD.
- [ ] **Números da Stats** — confirmar os 4 valores (`studio.json` → `stats`).
- [ ] **Marfim** — veja abaixo.
- [x] **Domínio** — `https://serifalabs.com`, definido em `astro.config.mjs`
      (`site`) e no `Sitemap:` do `public/robots.txt`. Os dois precisam bater.

---

## Portfólio / trabalho

Os cards linkam para demos **autocontidas** servidas em `/trabalho/`:

- `/trabalho/brasa/`  → cópia de `brasa.html`
- `/trabalho/volt/`   → cópia de `volt.html`
- `/trabalho/marfim/` → **placeholder** (veja nota)

São demos estáticas — **não** foram convertidas para Astro. No futuro, cada uma
pode virar uma página de case própria, ou o `route` em `projects.json` pode
apontar para o site real do cliente.

> ⚠ **Marfim:** o arquivo `marfim-odontologia.html` **não existia** na pasta
> original (só havia `brasa.html` e `volt.html`). Foi criada uma página
> "case em breve" on-brand em `public/trabalho/marfim/index.html` para o card
> não apontar para um 404. Substitua-a pelo HTML real do case, aponte o card
> para o site do cliente (edite `route` em `projects.json`), ou remova o item
> Marfim do JSON.

---

## Logo

### Ícone/marca — o frasco (`--mark`)

O ícone do estúdio (frasco de laboratório com as bolhas) é a **marca oficial**,
usada ao lado do nome. O arquivo original enviado está em
`src/assets/mark-source.png`; dele é gerado `src/assets/mark.png` — uma **máscara
CSS** (a forma do frasco vive no canal alpha, fundo transparente), então ele
assume as cores da paleta como o wordmark.

Aparece via o token **`--mark`** em: nav e rodapé (ícone + nome), preloader, selo
giratório do herói, bloco final (Closing), **favicon**,
**og-image** e o **logo do JSON-LD**. (Substituiu o antigo "S" — o `logo-s.png`
ficou sem uso.)

**Trocar o ícone / regenerar:**
1. substitua `src/assets/mark-source.png` pelo novo arquivo (PNG preto sobre
   branco, ou transparente);
2. `npm run process:mark` → regenera `src/assets/mark.png` (converte para máscara
   e recorta justo);
3. `npm run gen:assets` → regenera favicon / apple-touch / og-image / logo-serifa.

> Dica: se você tiver o **SVG vetorial** do frasco, ele fica ainda mais nítido em
> qualquer tamanho. Dá para apontar `--mark` direto para o `.svg` (como máscara)
> e ajustar o `generate-assets.mjs` para usá-lo. O `mark.png` atual (máscara
> rasterizada ~600px) já atende bem os usos do site.

### Wordmark `SERIFA` (o nome)

O wordmark e o "S" foram **extraídos** do base64 do HTML original para
`src/assets/logo.png` (e `logo-s.png`). O wordmark (`--logo`) continua sendo a
grafia do nome, usado como **máscara CSS** — assume as cores da paleta.

> 🔁 **Recomendação:** quando você tiver o arquivo vetorial original do logo,
> troque esses PNGs por **SVG**. Um SVG como máscara fica nítido em qualquer
> tamanho/densidade de tela e reduz peso. Ao trocar, basta atualizar
> `--logo` / `--logo-s` em `global.css` (e, se quiser regenerar favicon/og,
> ajuste `scripts/generate-assets.mjs`).

**favicon** e **og-image** são gerados a partir do logo por
`scripts/generate-assets.mjs` (o "S" em bronze sobre `--shaft` para o favicon;
o wordmark em rock sobre `--shaft` para a og-image, 1200×630).

---

## Contato

O **mailto** (`contato@serifalabs.com`) é o CTA principal — sem JavaScript.

Como alternativa, há um **formulário Netlify Forms** já escrito e **comentado**
em `src/components/Closing.astro` (campos nome/e-mail/mensagem + honeypot
`bot-field`, `action="/obrigado"`). Para ativar:

1. descomente o `<form>` em `Closing.astro`;
2. a página `src/pages/obrigado.astro` já existe;
3. o Netlify detecta o form no HTML estático automaticamente;
4. (opcional) ajuste headers/redirects em `netlify.toml`.

---

## Acessibilidade & performance

- HTML semântico com landmark `<main>`; foco de teclado visível
  (`:focus-visible`) — **o cursor customizado não remove o outline**.
- Accordion com `aria-expanded` / `aria-controls` / `aria-labelledby`.
- Logos (imagens-máscara) têm `aria-label`; decorativos têm `aria-hidden`.
- Fontes **self-hosted** (via `@fontsource`), com `font-display: swap` e subset
  por `unicode-range` — sem requisição bloqueante a terceiros.
- Responsivo idêntico ao original: lombada menor/mais clara no mobile, fólio
  oculto `<760px`, cursor/magnetismo ausentes em touch.
- Alvo Lighthouse: 95+ em performance/acessibilidade/SEO.

---

## Deploy (Netlify)

O projeto já vem com `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
[build.environment]
  NODE_VERSION = "22"
```

**Passo a passo:**

1. Suba o repositório para o GitHub/GitLab (ou use `netlify deploy`).
2. No Netlify: **Add new site → Import an existing project** e selecione o repo.
   O `netlify.toml` já define build (`npm run build`) e publish (`dist`).
3. Antes de publicar em produção, faça o **checklist de placeholders** acima e
   troque o `site` em `astro.config.mjs` pelo domínio real (afeta canonical,
   Open Graph, JSON-LD e o sitemap).
4. `npm run build` deve terminar **sem erros** e `npm run preview` servir o site
   corretamente (ambos já verificados).

Deploy alternativo pela CLI:

```bash
npm i -g netlify-cli
netlify deploy --build          # preview
netlify deploy --build --prod   # produção
```
