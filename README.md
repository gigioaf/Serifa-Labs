# Serifa Lab

Site de marketing do **Serifa Lab** — estúdio de design & código. Site estático
em [Astro](https://astro.build) com **zero JavaScript por padrão**; as animações
(GSAP + ScrollTrigger) são uma "ilha" carregada só quando o visitante permite
movimento.

- **Produção:** <https://serifalabs.com>
- **Stack:** Astro 5 · CSS puro · GSAP (opcional) · fontes self-hosted
- **Deploy:** push na `main` → GitHub Actions faz o build e envia para a Hostinger

---

## Índice

1. [Início rápido](#início-rápido)
2. [Estrutura do projeto](#estrutura-do-projeto)
3. [Configuração](#configuração)
4. [Editar o conteúdo](#editar-o-conteúdo)
5. [Recursos de conversão](#recursos-de-conversão)
6. [Checklist antes de publicar](#-checklist-antes-de-publicar)
7. [Deploy](#deploy)
8. [Componentes & efeitos](#componentes--efeitos)
9. [Portfólio](#portfólio)
10. [Logo](#logo)
11. [Acessibilidade & performance](#acessibilidade--performance)

---

## Início rápido

Requer **Node 22** (veja `.nvmrc`).

```bash
npm install        # instala dependências
npm run dev        # desenvolvimento → http://localhost:4321
npm run build      # gera o site estático em dist/
npm run preview    # serve o build de dist/ localmente
```

> **Testar Analytics/banner de cookies:** eles só entram em **build de
> produção** (para não sujar os relatórios no `dev`). Use
> `npm run build && npm run preview`.

<details>
<summary>Scripts utilitários (uso pontual, já executados)</summary>

```bash
npm run extract:logos   # re-extrai os PNGs do logo de serifa-lab_12.html
npm run process:mark    # regenera src/assets/mark.png a partir de mark-source.png
npm run gen:assets      # regenera favicon + og-image + logo-serifa
```
</details>

---

## Estrutura do projeto

```
src/
  layouts/
    Base.astro            # <head>, SEO, Open Graph, JSON-LD, fontes, tokens
                          #   + inclui WhatsappFab e ConsentBanner (globais)
  components/
    Nav · Hero · Seal · Manifesto · Stats · Services · Work · Quote · Process
    Faq · Palette · TypeSpecimen · Closing · Footer         # blocos da página
    Preloader · Cursor · Folio · Grain · Toc                # overlays fixos
    WhatsappFab.astro     # botão flutuante de WhatsApp (conversão)
    ConsentBanner.astro   # banner de cookies (LGPD) + carregamento do GA
  pages/
    index.astro           # a home — compõe todos os blocos
    trabalho/[slug].astro # 1 página de case por item de data/cases.json
    privacidade.astro     # política de privacidade e cookies
    obrigado.astro        # sucesso do formulário (opcional, noindex)
    404.astro
  scripts/
    effects-base.ts       # efeitos SEM GSAP (sempre): nav, cursor, fólio, FAQ…
    effects-gsap.ts       # ilha de movimento (GSAP) — só se houver movimento
    aurora.ts             # fundo Aurora do herói (WebGL2)
  styles/global.css       # tokens + TODO o CSS (global de propósito)
  data/
    studio.json           # dados do estúdio, redes, analytics
    services.json · projects.json · cases.json · faq.json
  assets/
    logo.png · logo-s.png # wordmark + "S" (máscaras CSS)
    mark.png              # ícone/marca (frasco) — máscara, de mark-source.png
    mark-source.png       # ícone original enviado (fonte do mark.png)
public/
  cases/<slug>/           # imagens dos cases (.webp) + og.jpg
  favicon.* · apple-touch-icon.png · og-image.png · logo-serifa.png
  robots.txt · .htaccess  # .htaccess = cache/404/redirects na Hostinger
.github/workflows/
  deploy.yml              # build + deploy FTP para a Hostinger
astro.config.mjs          # site (domínio), sitemap
serifa-lab_12.html        # HTML original (referência / fonte dos geradores)
```

---

## Configuração

Tudo que você precisa ajustar antes de publicar está em poucos lugares:

| O que | Onde | Observação |
|---|---|---|
| **Domínio** | `astro.config.mjs` (`site`) + `public/robots.txt` | Os dois precisam bater. Alimenta canonical, Open Graph, JSON-LD e sitemap. |
| **E-mail** | `studio.json` → `email` | Alimenta rodapé, CTA de contato e JSON-LD. |
| **Instagram / WhatsApp** | `studio.json` → `social` | O WhatsApp também vira o botão flutuante. |
| **Google Analytics** | `studio.json` → `analytics.ga4` | ID `G-XXXXXXX`. Vazio = desligado. Carrega só com consentimento. |

---

## Editar o conteúdo

Quase todo o texto vive em `src/data/*.json`. Edite e o site se atualiza no
próximo build.

### `studio.json` — dados do estúdio

```jsonc
{
  "name": "Serifa Lab",
  "email": "contato@serifalabs.com",
  "founded": "2025",                      // ano de fundação (JSON-LD, "desde 2025")
  "address": { "city": "São Paulo", "region": "SP", "country": "Brasil", "countryCode": "BR" },
  "social": [
    { "label": "Instagram", "url": "https://www.instagram.com/serifalabs/" },
    { "label": "WhatsApp",  "url": "https://wa.me/5513991059755" }
  ],
  "analytics": { "ga4": "G-XXXXXXX" },    // vazio = Analytics desligado
  "stats": [                              // os 4 números da seção Stats
    { "n": "3",   "l": "Projetos entregues em 2025" },
    { "n": "100", "em": "%", "l": "Sob medida — nenhum template" }  // "em" = sufixo em destaque
  ]
}
```

Alimenta a seção **Stats**, o **rodapé**, o CTA de e-mail e o **JSON-LD**. URLs
`#` em `social` são ignoradas no `sameAs` do JSON-LD.

### Outros arquivos de dados

- **`services.json`** — os 4 painéis empilhados. Cada item: `face`
  (`f-rock` | `f-akaroa` | `f-barley` | `f-shaft`), `num`, `title` e 3 `cells`
  com `lab`+`text`.
- **`projects.json`** — os cards do portfólio na home. Cada item: `name`,
  `display` (texto grande da mini-arte), `tags`, `year`, `route` e `art`
  (`brasa` | `volt` | `marfim` — a arte CSS).
- **`cases.json`** — o conteúdo de cada **página de case** (`/trabalho/<slug>/`):
  headline, lede, overview, meta, galeria, etc.
- **`faq.json`** — lista de `{ "q", "a" }`. Accordion e `aria-expanded`
  automáticos.

> Textos **estáticos** (não em JSON): Manifesto, Quote, Process e o specimen de
> Palette ficam inline nos respectivos componentes.

---

## Recursos de conversão

### Botão flutuante de WhatsApp (`WhatsappFab.astro`)
Fixo no canto inferior direito, em todas as páginas. O número vem de
`studio.json` → `social` (mesma fonte do rodapé) e o link já leva mensagem
pré-preenchida. Some se o item "WhatsApp" for removido.

### Analytics + consentimento (LGPD)
O **Google Analytics 4** só carrega — e só cria cookies — **depois do "Aceitar"**
no banner (`ConsentBanner.astro`). "Recusar" não dispara nada e ainda remove
cookies de análise existentes. A escolha fica em `localStorage`
(`serifa-consent`), então o banner só aparece na primeira visita.

- **Reabrir / trocar a escolha:** link **"Cookies"** no rodapé.
- **Política:** página `/privacidade/` (`privacidade.astro`), linkada no banner
  ("Saiba mais") e no rodapé.

> A página identifica o **Serifa Lab + e-mail** como responsável — proporcional
> para um operador de pequeno porte, **sem exigir CNPJ ou DPO**. Ao formalizar
> como empresa, dá para acrescentar razão social / CNPJ.

### Linha clara no herói
A proposta de valor abaixo do título (`Hero.astro` → `.sub`) tem realce de
legibilidade para ser lida de imediato — é a "linha que converte".

---

## ✅ Checklist antes de publicar

- [ ] **Depoimento (Quote) — FABRICADO.** "Camila Duarte · Brasa" é inventado.
      **Recomendação: REMOVER** até ter um depoimento real e atribuível — apague
      `<Quote />` de `src/pages/index.astro`. Nunca publique depoimento inventado.
- [ ] **Números da Stats** — confirmar os 4 valores (`studio.json` → `stats`).
- [ ] **Marfim** — página de case placeholder (veja [Portfólio](#portfólio)).
- [x] **Privacidade** — página `/privacidade/` identifica o estúdio + e-mail
      (suficiente sem CNPJ). Só acrescente razão social / CNPJ se formalizar.
- [x] **E-mail** — `contato@serifalabs.com` (`studio.json`).
- [x] **Redes sociais** — Instagram + WhatsApp com URLs reais (`studio.json`).
- [x] **Google Analytics 4** — configurado, com opt-in via banner de cookies.
- [x] **Domínio** — `https://serifalabs.com` (`astro.config.mjs` + `robots.txt`).

---

## Deploy

O site é publicado na **Hostinger** automaticamente a cada push na `main`, via
**GitHub Actions**.

### Como funciona

```
push na main → GitHub Actions (.github/workflows/deploy.yml)
             → npm ci → npm run build → envia dist/ por FTP → public_html
```

O Git nativo da Hostinger **não roda build** (só faz pull), e o que vai para o ar
é o `dist/` gerado — por isso o build acontece no GitHub e só o resultado sobe.

### Configuração (uma vez)

No GitHub, em **Settings → Secrets and variables → Actions**, crie 3 secrets
(pegue os valores em hPanel → Arquivos → Contas FTP):

| Secret | Valor |
|---|---|
| `FTP_SERVER` | host FTP (ex.: `ftp.serifalabs.com`) ou o IP |
| `FTP_USERNAME` | usuário FTP |
| `FTP_PASSWORD` | senha FTP |

O destino (`server-dir`) está fixado no workflow como
`/domains/serifalabs.com/public_html/` — o docroot real da conta.

### Publicar

```bash
git add -A && git commit -m "..."
git push origin main
```

Acompanhe em **Actions** no GitHub. O primeiro deploy demora mais; os seguintes
enviam só o que mudou.

### Notas

- **`.htaccess`** (`public/.htaccess`) faz cache dos assets, a 404 do site e os
  redirects `http→https` / `www→raiz` na Hostinger (equivalente ao
  `netlify.toml`, que a Hostinger ignora). Sobe junto no build.
- **SSL / `www`:** o redirect de `www` só funciona depois do certificado cobrir
  `www.serifalabs.com` (emitir no hPanel).

<details>
<summary>Deploy alternativo (Netlify)</summary>

O projeto ainda traz um `netlify.toml` (`build = npm run build`, `publish =
dist`, Node 22). Para usar a Netlify: **Add new site → Import an existing
project** e selecione o repo — o `netlify.toml` cuida do resto. Os dois hosts
convivem; cada um lê o seu arquivo de config.
</details>

---

## Componentes & efeitos

<details>
<summary><b>Por que todo o CSS está em um único <code>global.css</code>?</b></summary>

A ilha GSAP seleciona elementos pelos nomes de classe (`.reveal`, `.panel`,
`.pcard`, `.faq-item`…). Os blocos `<style>` do Astro são **escopados** — eles
renomeiam as classes e quebrariam todas as interações. Por isso o sistema
inteiro vive em `global.css`. Os **tokens** (paleta, fontes, espaçamentos) estão
no topo do arquivo.

Exceção: componentes que o GSAP não toca (ex.: `obrigado.astro`,
`privacidade.astro`) usam `<style>` escopado sem problema.
</details>

<details>
<summary><b>A "ilha" de efeitos (base vs. GSAP)</b></summary>

Os componentes são `.astro` puros (sem React/Vue), então não há diretivas
`client:load`/`client:visible` — o mesmo comportamento foi reproduzido em JS
vanilla:

- **`effects-base.ts`** roda imediatamente (≈ `client:load`), sem GSAP. Contém
  tudo que precisa funcionar sempre — inclusive com movimento reduzido ou se o
  GSAP falhar.
- **`effects-gsap.ts`** é importado **só quando o movimento é permitido** (≈
  `client:visible`). Quem usa `prefers-reduced-motion` baixa **zero** de GSAP.

Guards mantidos: `prefers-reduced-motion` desliga preloader/cursor/animações;
cursor e magnetismo só em `pointer:fine`; o preloader **sempre** se remove.
</details>

<details>
<summary><b>Aurora — fundo WebGL2 do herói (<code>aurora.ts</code>)</b></summary>

Fundo aurora em WebGL2 atrás do herói (porte vanilla do "Aurora" do React Bits,
**sem a dependência `ogl`** — só um triângulo full-screen + fragment shader).
Color stops trocados pela paleta da Serifa.

- **Escopo:** só na primeira tela (recortado pelo `overflow:hidden` do herói);
  **pausa** fora da viewport e com a aba oculta.
- **Gate:** desligado em `prefers-reduced-motion` (o módulo nem é baixado); DPR
  limitado a 2.
- **Fallback:** sem WebGL2, o herói mostra o fundo `--shaft` normal.
- **Ajustes** (`src/scripts/aurora.ts`): `config.colorStops`, `config.amplitude`,
  `config.blend`, `config.speed`. **Remover:** apague o `<canvas class="aurora">`
  e o `<script>` de `Hero.astro`.
</details>

<details>
<summary><b>Selo giratório, Sumário lateral, Botões especulares, Specimen tipográfico</b></summary>

- **Selo (`Seal.astro`):** texto circular `SERIFA LAB · DESIGN & CÓDIGO ·`
  orbitando o "S". Cada caractere é uma `<span>` rotacionada; a rotação é
  `@keyframes` CSS que **para** em `prefers-reduced-motion`. Decorativo
  (`aria-hidden`). Texto em `const text`.
- **Sumário (`Toc.astro`):** navegação de seções fixa à direita (CSS + estado
  ativo, sem React). O mesmo `IntersectionObserver` de `effects-base.ts` controla
  sumário e fólio (numeração **01 Manifesto → 06 Contato**). Links reais
  (`<a href="#secao">`) funcionam sem JS. Escondido `<1024px`. Mantenha os
  `data-n` em sincronia com o mapa do fólio em `effects-base.ts`.
- **Botões especulares (`.specular`):** brilho que segue o cursor. Aplicado em
  `.btn-primary`, `.pill` e `.chip-toggle`. Sem JS/em touch, o `:hover` mostra o
  brilho centralizado. Para dar a um novo botão, adicione a classe `specular`.
- **Specimen (`TypeSpecimen.astro`):** playground da Fraunces variável (sliders
  `wght`/`opsz`/tamanho, itálico, campo de texto) dirigindo
  `font-variation-settings` ao vivo. Ilha vanilla ~1KB. Sem JS, renderiza nos
  valores padrão.
</details>

---

## Portfólio

Os cards da home (`projects.json`) linkam para **páginas de case** geradas por
`src/pages/trabalho/[slug].astro` a partir de `data/cases.json` — uma página por
item, dentro do site (mesma nav, rodapé, tipografia):

- `/trabalho/brasa/` · `/trabalho/volt/` · `/trabalho/marfim/`

As imagens ficam em `public/cases/<slug>/`.

> ⚠ **Marfim** é um case **placeholder** ("em breve"). Complete o conteúdo em
> `data/cases.json` e as imagens em `public/cases/marfim/`, aponte o `route` em
> `projects.json` para outro destino, ou remova o item.

---

## Logo

O ícone do estúdio (frasco de laboratório) é a **marca oficial**, usada como
**máscara CSS** — assume as cores da paleta. Aparece via o token `--mark` em: nav
e rodapé, preloader, selo do herói, bloco final, **favicon**, **og-image** e o
logo do JSON-LD. O wordmark `SERIFA` (`--logo`) e o "S" (`--logo-s`) também são
máscaras, extraídas do HTML original.

**Trocar o ícone / regenerar:**
1. substitua `src/assets/mark-source.png` pelo novo arquivo (PNG preto sobre
   branco, ou transparente);
2. `npm run process:mark` → regenera `src/assets/mark.png`;
3. `npm run gen:assets` → regenera favicon / apple-touch / og-image / logo-serifa.

> 🔁 **Recomendação:** quando tiver os **SVGs vetoriais** do ícone e do wordmark,
> troque os PNGs — um SVG como máscara fica nítido em qualquer tela. Basta
> atualizar `--mark` / `--logo` em `global.css`.

---

## Acessibilidade & performance

- HTML semântico com landmark `<main>`; foco de teclado visível
  (`:focus-visible`) — o cursor customizado **não** remove o outline.
- Accordion com `aria-expanded` / `aria-controls` / `aria-labelledby`.
- Logos (imagens-máscara) têm `aria-label`; decorativos têm `aria-hidden`.
- Fontes **self-hosted** (`@fontsource`), `font-display: swap`, subset por
  `unicode-range` — sem requisição bloqueante a terceiros.
- Cursor/magnetismo ausentes em touch; fólio oculto `<760px`.
- Alvo Lighthouse: 95+ em performance / acessibilidade / SEO.

---

## Contato

O **mailto** (`contato@serifalabs.com`) é o CTA principal — sem JavaScript.

Como alternativa, há um **formulário Netlify Forms** já escrito e **comentado**
em `src/components/Closing.astro` (campos nome/e-mail/mensagem + honeypot
`bot-field`, `action="/obrigado"`). Para ativar: descomente o `<form>`; a página
`src/pages/obrigado.astro` já existe; o Netlify detecta o form no HTML estático
automaticamente.
