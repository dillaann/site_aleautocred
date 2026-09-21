# HANDOFF — Site Ale Auto Cred

Salve como `HANDOFF.md` na raiz do projeto. No Claude Code, abra a pasta e mande: `Leia o HANDOFF.md e execute a Fase 0.`

---

## Objetivo

Levar um site que já está bom para o nível em que ele efetivamente vende. O gargalo **não é mais o design** — é que ninguém nunca abriu esse site num navegador, ele não tem uma única foto real e não mede absolutamente nada.

## Estado atual (atualizado em 10/09/2026, após a reconstrução)

Site estático, 4 arquivos, sem build, sem dependência. Repositório git local: `a689a82` é a versão azul anterior, `c39aff5` a reconstrução âmbar.

| Arquivo | O que é |
|---|---|
| `index.html` | Página única, semântica, JSON-LD de `FinancialService`, hero só com texto e foto, simulador em seção própria `#simular` logo abaixo (ignição dispara quando o instrumento entra na tela), seções `#quem-atende` e `#avaliacoes` escondidas até o CONFIG preencher, barra de cookies |
| `estilo.css` | Tokens azul (#00BFFF)/noite/papel — o âmbar original foi trocado em 11/09/2026 a pedido, tokens renomeados para `--acento*`. Conceito: painel de instrumentos × papel de contrato. `--grafite` (escuro) e `--grafite-papel` (claro) são tokens separados; `--filete` é só decorativo, `--filete-ui` é para borda de controle |
| `app.js` | `CONFIG` no topo (simulador, rastreio, atendente, avaliações), Price, ponteiro em mola dirigida por frames, canvas de faróis com pausa fora da tela, rastreamento com dois portões, cookies com carimbo de data |
| `politica-de-privacidade.html` | LGPD, com seção de cookies, GA4, Pixel e transferência internacional (art. 33) |

**Validado em navegador real (Edge, Playwright, 1440×900 e 390×844):** ignição varre até o batente e assenta (~1,9s de animação; ~2,7–3,3s contados do DOMContentLoaded, incluindo a espera pelo primeiro frame), slider por teclado, mouse e toque move ponteiro e recalcula parcela, `aria-valuetext` por extenso, pílulas recalculam e têm alvo ≥ 44px em uma linha a 390px, todo link de WhatsApp leva valor e prazo, FAQ abre/fecha/navega por teclado, flutuante só depois de 400px e sobe acima da barra de cookies, Recusar guarda escolha com data e mantém rastreio desligado, link "Cookies" reabre a barra mesmo depois de aceito, com IDs vazios nenhum script sobe, canvas pausa fora da tela, ordem de headings sem salto, sem rolagem horizontal, zero erro de console. Contraste AA validado em 18 pares (script em `contraste.js` fora do repo).

**Fases 0, 1 e 2 concluídas.** Fase 3 (auditoria `web-design-guidelines`), 4 (conteúdo real) e 5 (performance) seguem pendentes.

**Não existe ainda:** foto real (a `img/hero.jpg` é stock CC0, tratada na cor de destaque por CSS), `img/og.jpg`, IDs de GA4 e Pixel, prova social real (`CONFIG.atendente` e `CONFIG.avaliacoes` vazios).

---

## Skills a instalar (só estas 6)

Você tem 139. A maioria não toca neste projeto — as de React, Next.js e Remotion são inúteis aqui, porque isto é HTML/CSS/JS puro. Estas seis são as que trabalham:

```bash
# 1. Guardrails do Karpathy — impede reescrever o site inteiro quando você pede um ajuste
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills

# 2. Grill Me — te entrevista até o plano parar de pé, antes de escrever código
npx skills add https://github.com/mattpocock/skills --skill grill-me

# 3. Frontend Design — mantém a direção visual nas iterações
npx skills add https://github.com/anthropics/skills --skill frontend-design

# 4. Web Design Guidelines — auditoria de acessibilidade e UX, saída em file:line
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines

# 5. Webapp Testing — Playwright, navegador de verdade. A maior lacuna do projeto.
npx skills add https://github.com/anthropics/skills --skill webapp-testing

# 6. Handoff — saída limpa antes de estourar o contexto
npx skills add mattpocock/skills skill=handoff -y -g
```

A #1 é a mais importante pra este caso específico: o site já está construído, e o padrão de falha que ela corrige é justamente o agente mexer em código que não devia. Sem ela, "arruma o espaçamento do rodapé" vira um refactor de 300 linhas.

**Desinstale o resto.** Cada skill instalada consome cerca de 100 tokens de descrição escaneada na inicialização. 139 delas são uns 14 mil tokens torrados antes de você digitar a primeira letra.

---

## Fases

### Fase 0 — Alinhar o que é "absurdo" (grill-me)

```
Grill me: quero levar este site de bom para excepcional. Antes de escrever
qualquer código, me interrogue sobre: quem é o cliente que converte, o que
ele precisa ver pra confiar, quais provas reais eu consigo produzir esta
semana, e o que eu estou tratando como problema de design quando na verdade
é problema de conteúdo. Leia os arquivos do projeto antes de perguntar.
```

Não pule. O resto das fases muda de acordo com o que sair daqui.

### Fase 1 — Rastreamento (a fase que mais muda o resultado)

Este site vai receber tráfego pago e hoje não mede nada. Sem evento de conversão, o algoritmo do Meta otimiza no escuro e você queima verba aprendendo o que já daria pra saber na primeira semana.

```
Adicione rastreamento ao site:
1. GA4 e Meta Pixel, carregados de forma assíncrona, sem bloquear o LCP.
2. Evento de conversão em TODO clique de WhatsApp (hero, CTA final, header,
   botão flutuante), disparando com o valor e o prazo selecionados no
   simulador como parâmetros.
3. Eventos de engajamento: mexeu no slider, trocou o prazo, abriu pergunta
   do FAQ, rolou 75% da página.
4. IDs do GA4 e do Pixel entram no objeto CONFIG do app.js, não soltos no HTML.
5. Banner de cookies simples, com aceite, e os scripts só sobem depois do
   aceite. Sem biblioteca externa.
```

### Fase 2 — Navegador de verdade (webapp-testing)

```bash
npx serve .
```

```
Teste http://localhost:3000 com webapp-testing, em desktop 1440px e mobile 390px:
- a sequência de ignição do ponteiro roda até o fim sem travar
- arrastar o slider move o ponteiro e recalcula a parcela
- as pílulas de prazo recalculam a parcela na hora
- o link do WhatsApp sai com o valor e o prazo corretos na mensagem
- o FAQ abre e fecha, e navega por teclado
- o botão flutuante aparece só depois de 400px
- nenhum erro de JavaScript no console
- o canvas do fundo pausa quando o hero sai da tela
Me devolva os problemas em formato file:line.
```

### Fase 3 — Auditoria (web-design-guidelines)

```
/web-design-guidelines index.html estilo.css app.js
```

Contraste e foco de teclado já foram corrigidos na mão. O que essa passada tende a pegar: ordem de headings, alvos de toque no mobile, comportamento com zoom em 200%, e estados de foco dentro do SVG.

### Fase 4 — Conteúdo real

Design não resolve mais nada aqui. O que falta é material:

- **Foto do hero.** Fachada da loja ou carro à noite. Coloque em `img/hero.jpg` e troque `--hero-img` no `estilo.css` — já está preparado, entra com zoom lento por cima do canvas.
- **`img/og.jpg`**, 1200×630. Sem ela, o link colado no WhatsApp aparece sem preview. Num site que depende inteiramente de WhatsApp, isso é grave.
- **Avaliações reais do Google.** Seção nova, entre o FAQ e a localização, com nome e nota reais. Nada de depoimento inventado.
- **Foto de quem atende.** Público de refinanciamento tem medo de golpe. Rosto e nome derrubam mais objeção do que qualquer headline.

### Fase 5 — Performance

```
Otimize sem quebrar o visual: auto-hospede as fontes Archivo e Inter Tight
em woff2 com subset latino e preload da fonte do H1, converta as imagens para
WebP com width e height explícitos, e me mostre o LCP e o CLS antes e depois.
Meta: LCP abaixo de 2s no 4G, CLS zero.
```

---

## Restrições inegociáveis

Cole isso no `CLAUDE.md` do projeto:

- Nunca escrever "aprovação garantida", "crédito na hora" ou "sem consulta ao SPC". Toda taxa, prazo ou valor vem acompanhado de "sujeito a análise".
- O aviso de correspondente bancário (Resolução CMN 4.935/2021) e o "não cobramos taxa antecipada" não saem do site.
- Não inventar nome ou logo de banco parceiro. Só "instituições financeiras parceiras".
- Todo dado variável mora no objeto `CONFIG` do `app.js`. Nada solto em componente.
- Paleta e tipografia estão fechadas: azul `#00BFFF` é luz e ação, papel é o segundo material, azul sobre fundo claro usa `--acento-tinta`. Não trocar.
- Motion existe em um lugar só: a ignição do ponteiro. Não adicionar fade-up de seção ao rolar.

---

## Pendências que dependem do cliente

Nada disso pode ir ao ar como está:

1. Número real do WhatsApp — hoje é `5548999999999`
2. Taxa real ao mês — hoje é 1,79%, chute meu
3. Telefone, e-mail e horário de atendimento reais
4. Se atende moto, caminhão e veículo pesado
5. Logo em SVG e nome fantasia, se existir
6. Domínio, para as tags `canonical` e `og:`
7. Coordenadas exatas da loja para o pin do mapa — `CONFIG.coordenadas` está num ponto aproximado da Rua Augusto Westphal (o geocodificador não resolve o número 483)
8. Horários reais em `CONFIG.expediente` (o indicador Aberto/Fechado é calculado a partir deles)

---

## Depois: transformar isso em ativo reutilizável

Você vende site pra empresa local. Metade do trabalho deste projeto foi regra de compliance de correspondente bancário — e isso se repete em toda financeira, correspondente e promotora de crédito que você atender.

```
Use skill-creator para criar uma skill chamada "credito-br-compliance" que
encode as regras de conteúdo para sites de correspondente bancário no Brasil:
linguagem proibida, avisos obrigatórios, exigências de LGPD e o padrão de
disclaimer em simuladores. Descrição no formato de regra de roteamento, para
ativar quando eu estiver escrevendo copy ou página de financeira, correspondente
bancário, consórcio ou empréstimo.
```

Na terceira financeira que você atender, essa skill paga sozinha o tempo de tê-la escrito.
