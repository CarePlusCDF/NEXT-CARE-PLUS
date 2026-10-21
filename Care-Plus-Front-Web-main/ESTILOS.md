# Guia de Estilos — Care Plus Front-Web

## Abordagem de Estilização

- **Tailwind CSS v4** (CSS-first, sem `tailwind.config.js`)
- Variáveis CSS customizadas globais em `:root` no arquivo `src/index.css`
- Classes utilitárias customizadas complementares (gradientes, ranking, benefícios)
- Estilos dinâmicos via `style={}` inline para cores vindas de API

---

## Cores

### Paleta Principal

| Token               | Hex       | Uso                                            |
| ------------------- | --------- | ---------------------------------------------- |
| `--color-primary`   | `#1c9770` | Verde principal (botões, links, destaques)     |
| `--color-primary-dark` | `#167a5a` | Primary escuro (CTAs, cards)                 |
| `--color-primary-light` | `#23b386` | Primary claro (declarado, uso esporádico)   |
| `--color-secondary` | `#93CB52` | Verde secundário (badges "Novo", sucesso)      |
| `--color-accent-1`  | `#7AD180` | Verde destaque (icone Mind)                    |
| `--color-accent-2`  | `#7AD1C3` | Verde-água destaque (icone Connect)            |

### Escala de Cinza

| Token                | Hex       | Uso                                        |
| -------------------- | --------- | ------------------------------------------ |
| `--color-gray-100`   | `#F0F2F5` | Fundos claros, backgrounds de ícones       |
| `--color-gray-200`   | `#E4E7EB` | Bordas, divisores, inputs                  |
| `--color-gray-300`   | `#CDD3DA` | Scrollbar, estados desabilitados           |
| `--color-gray-400`   | `#9BA3AE` | Placeholder, ícones inativos               |
| `--color-gray-500`   | `#6B7685` | Texto secundário / muted                   |
| `--color-gray-600`   | `#4A5568` | Texto de corpo / descrições                |
| `--color-gray-700`   | `#2D3748` | Texto padrão do body                       |
| `--color-gray-800`   | `#1A202C` | Texto mais escuro, headings                |

### Fundos de Página

| Token             | Hex       | Uso                     |
| ----------------- | --------- | ----------------------- |
| `--color-bg`      | `#F4F6F8` | Fundo da página         |
| `--color-bg-card` | `#FFFFFF` | Fundo de cards          |

### Semântica

| Token              | Hex       | Uso                           |
| ------------------ | --------- | ----------------------------- |
| `--color-success`  | `#93CB52` | Sucesso                       |
| `--color-warning`  | `#F6AD55` | Warning / banners             |
| `--color-danger`   | `#FC8181` | Erro / perigo                 |
| `--color-info`     | `#7AD1C3` | Informativo                   |

### Medalhas (Ranking)

| Item             | Hex       |
| ---------------- | --------- |
| Ouro             | `#F6C90E` |
| Prata            | `#A0AEC0` |
| Bronze           | `#C07A3A` |

### Opacidades do Primary Usadas em Inline

`rgba(28,151,112, ...)` — `0.05`, `0.07`, `0.08`, `0.1`, `0.12`, `0.14`, `0.15`, `0.18`, `0.2`, `0.22`, `0.25`, `0.3`, `0.35`, `0.40`, `0.42`

### Overlay de Cards de Benefício

`rgba(9,37,31, ...)` — `0.22`, `0.72`, `0.9`

---

## Tipografia

### Fonte

- **Família:** `'Roboto', sans-serif`
- **Import:** Google Fonts (`wght@300;400;500;700`)

### Pesos

| Token             | Peso | Uso principal              |
| ----------------- | ---- | -------------------------- |
| `--font-light`    | 300  | (declarado, sem uso ativo) |
| `--font-regular`  | 400  | Corpo de texto             |
| `--font-medium`   | 500  | Ênfase média (pouco uso)   |
| `--font-bold`     | 700  | **Títulos, botões, labels** |

### Tamanhos (Variáveis CSS)

| Token               | Valor  |
| ------------------- | ------ |
| `--font-size-xs`    | `12px` |
| `--font-size-sm`    | `14px` |
| `--font-size-base`  | `16px` |
| `--font-size-lg`    | `20px` |
| `--font-size-xl`    | `24px` |
| `--font-size-2xl`   | `32px` |

### Tamanhos Usados nos Componentes

| Tamanho  | Contexto                                                    |
| -------- | ----------------------------------------------------------- |
| `10px`   | Labels de luminária, tracking uppercase                     |
| `11px`   | Bottom nav, badges "Novo", badges parabéns, badges %        |
| `12px`   | Descrições pequenas, subtítulos, tags, avatares xs/sm       |
| `13px`   | Botões, links "Ver todos", textos auxiliares                |
| `14px`   | Labels de input, corpo, botões, títulos de card             |
| `15px`   | Subtítulos de seção, parágrafos                             |
| `16px`   | Headings de seção (h2), títulos de card, input labels       |
| `18px`   | Títulos de modal, feature headings                          |
| `20px`   | Títulos de página (h1), títulos principais de card          |
| `22px`   | Títulos de página (Login, LGPD)                             |
| `24px`   | Headings de destaque (Flux, recompensas)                    |
| `28px`   | Títulos de slides (Onboarding), step count, hero greeting   |
| `32px`   | Hero text (desktop)                                         |
| `42px`   | Streak day count (mobile)                                   |
| `48px`   | Streak day count (desktop)                                  |
| `52px`   | Decoração (emoji coração)                                   |
| `76px`   | Streak count (breakpoint lg)                                |
| `88px`   | Streak count (breakpoint xl)                                |

---

## Sombras

| Token / Classe                | Valor                                               |
| ----------------------------- | --------------------------------------------------- |
| `--shadow-sm`                 | `0 1px 3px rgba(0,0,0,0.08)`                       |
| `--shadow-md`                 | `0 4px 12px rgba(0,0,0,0.1)`                       |
| `--shadow-lg`                 | `0 8px 24px rgba(0,0,0,0.12)`                      |
| `.shadow-primary`             | `0 4px 16px rgba(28,151,112,0.25)`                 |
| `.shadow-card`                | `0 1px 3px rgba(0,0,0,0.05)`                       |
| `.shadow-brand-primary`       | `0 4px 16px rgba(28,151,112,0.25)`                 |
| `.shadow-brand-card`          | `0 1px 3px rgba(0,0,0,0.06)`                       |
| `.shadow-brand-banner`        | `0 8px 24px rgba(28,151,112,0.3)`                  |
| `.shadow-brand-tile`          | `0 4px 12px rgba(0,0,0,0.15)`                      |

---

## Raios de Borda

| Token             | Valor    |
| ----------------- | -------- |
| `--radius-sm`     | `8px`    |
| `--radius-md`     | `12px`   |
| `--radius-lg`     | `16px`   |
| `--radius-xl`     | `24px`   |
| `--radius-full`   | `9999px` |

---

## Transições

| Token                | Valor        |
| -------------------- | ------------ |
| `--transition-fast`  | `150ms ease` |
| `--transition-base`  | `250ms ease` |
| `--transition-slow`  | `400ms ease` |

---

## Gradientes

| Classe                     | Gradiente                                                    |
| -------------------------- | ------------------------------------------------------------ |
| `.bg-gradient-primary`     | `linear-gradient(135deg, #1c9770 0%, #167a5a 100%)`         |
| `.bg-gradient-accent1`     | `linear-gradient(135deg, #7AD180 0%, #1c9770 100%)`         |
| `.bg-gradient-accent2`     | `linear-gradient(135deg, #7AD1C3 0%, #1c9770 100%)`         |
| `.ranking-cta`             | Gradiente multi-layer com overlay verde e bolhas SVG         |
| `.beneficio-card::after`   | Gradiente duplo sobre imagem de fundo                        |

---

## Tamanhos de Componentes

### Avatares / Icon Boxes

| Classe        | Tamanho  |
| ------------- | -------- |
| `.avatar-xl`  | 180×180  |
| `.avatar-lg`  | 64×64    |
| `.avatar-md`  | 48×48    |
| `.avatar-sm`  | 40×40    |
| `.avatar-xs`  | 32×32    |
| `.icon-box-xs` | 36×36   |
| `.icon-box-sm` | 40×40   |
| `.icon-box-md` | 48×48   |

### Progress Bars

| Classe          | Altura |
| --------------- | ------ |
| `.bar-active`   | 40px   |
| `.bar-inactive` | 20px   |

---

## Classes Utilitárias de Marca

### Texto
- `.text-brand-primary` — `#1c9770`
- `.text-brand-secondary` — `#93CB52`
- `.text-brand-dark` — `#1A202C`
- `.text-brand-muted` — `#6B7685`
- `.text-brand-gray` — `#9BA3AE`
- `.text-brand-accent2` — `#7AD1C3`

### Fundo
- `.bg-brand-primary` — `#1c9770`
- `.bg-brand-secondary` — `#93CB52`
- `.bg-brand-dark` — `#1A202C`
- `.bg-brand-gray-100` — `#F0F2F5`
- `.bg-brand-gray-200` — `#E4E7EB`
- `.bg-brand-page` — `#F4F6F8`
- `.bg-brand-primary-subtle` — `rgba(28,151,112,0.1)`

### Borda
- `.border-brand-primary` — `#1c9770`
- `.border-brand-gray` — `#E4E7EB`

---

## Estrutura de Diretórios (Front-web)

```
Front-web/
├── src/
│   ├── index.css          # Único arquivo CSS (Tailwind + variáveis + utilitários)
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Router (18 rotas)
│   ├── assets/            # Imagens estáticas
│   ├── components/        # TopBar, Bottomnav, ModalConfirmacao
│   ├── routes/            # 15 páginas (Home a Perfil)
│   └── services/          # sessao.js, fiware.js
├── package.json
├── vite.config.js
└── index.html
```
