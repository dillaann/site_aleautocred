# Site Ale Auto Cred

Site estático de correspondente bancário (refinanciamento e financiamento de veículo). HTML/CSS/JS puro, sem build, sem dependência. Contexto completo e fases de trabalho em `HANDOFF.md`.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Home dos dois produtos — o painel escuro, com hero de tela cheia |
| `refinanciamento.html` | Guia do produto + simulador (valor + prazo) |
| `financiamento.html` | Guia do produto + simulador (busca FIPE + entrada + prazo) |
| `politica-de-privacidade.html` | LGPD |

**As páginas de produto são montadas com os componentes da home, não com componentes novos.** Hero com foto, `.produto` com imagem, `.simular`, `.passos` com o carrinho, `.docs`, `.fim-sec`, rodapé — as mesmas peças, com conteúdo e ordem próprios. O `.docs` tem variante própria de página de produto (ícone em cima e texto centralizado, `estilo.css:978`) e é o que monta a seção "Entenda". `.faq-grid` hoje só a home usa. A única adição é `.produto.largo` (variante horizontal do card, para o produto aparecer sozinho e grande) dentro de `.produtos.solo`.

**Já tentamos o contrário e deu errado.** Uma versão anterior inventou uma linguagem só para essas páginas — faixas alternadas, barras de comparação, fichas de dados, cartões, sumário — e ficou genérica e feia. Se a página parecer pobre, o caminho é **usar melhor as peças existentes e o conteúdo**, não desenhar peça nova.

Ordem das duas: `o-que-e > simular > como-funciona > entender > [o outro produto] > cta`. O bloco do outro produto no fim é o que liga refinanciamento e financiamento nos dois sentidos.

**A página de produto é o lugar da explicação, e não pode repetir a home.** Em 22/09/2026 ela estava repetindo: "Documentos" do refinanciamento era cópia byte a byte da home, o FAQ da home já servia as perguntas de refinanciamento (a home não tem `data-produto`), e "Como funciona" tinha o mesmo rótulo, o mesmo título e os mesmos passos nas três páginas. O que ficou:

- **Documentos e Perguntas saíram** das páginas de produto. O lugar delas é `index.html`; não recriar.
- **"Como funciona" tem rótulo, título e passos próprios por página** — "Do primeiro contato ao dinheiro na conta" no refinanciamento, "Da escolha do carro à transferência" no financiamento. Se for mexer, mexa nas três separadamente; não unificar de novo.
- **A seção "Entenda"** (`#entender`, componente `.docs`) é onde mora a explicação de mecânica do produto. O conteúdo dela saiu das respostas já revisadas em `PERGUNTAS_REFINANCIAMENTO` e `PERGUNTAS_FINANCIAMENTO`, no `app.js` — é de lá que deve sair qualquer item novo, para não inventar afirmação sobre crédito.
- **O CTA final tem título próprio por página.** O do refinanciamento não pode voltar a ser o da home.

`PERGUNTAS_FINANCIAMENTO` virou código morto quando o FAQ saiu das páginas de produto: nenhuma página tem `#faq` com `data-produto="financiamento"`. O array continua no `app.js` de propósito, como fonte do conteúdo da seção "Entenda".

Quem decide o comportamento por página é o `<body data-produto="refinanciamento|financiamento">`: dele saem a faixa do slider, a mensagem do WhatsApp e o conjunto de perguntas do FAQ. Sem esse atributo, o padrão é refinanciamento. Toda função do `app.js` sai cedo se o elemento não existir na página — é o que permite montar página nova só com as seções que interessam.

O menu fica no `<header class="topo">` e marca a página atual com `aria-current="page"`, que é o que o CSS usa para acender o item. Página nova precisa entrar no menu das outras.

## Busca FIPE (só em `financiamento.html`)

Única chamada externa do site. API pública e não oficial; `CONFIG.fipe.ativo` desliga tudo. Se a API falhar, atrasar ou o visitante estiver offline, o bloco de busca se esconde e o slider `#valorManual` volta — o simulador nunca depende dela. A política de privacidade descreve essa consulta; se ela mudar, atualize a política junto.

**O `#veiculoDica` parece texto redundante e não é.** Ele nasce vazio de propósito — no primeiro passo o placeholder do campo já diz "Comece pela marca" — e o `app.js` o usa como indicador de etapa da busca: "Agora o modelo.", "Qual o ano?", e vazio de novo quando o veículo é encontrado. A partir do segundo passo o campo já tem texto, o placeholder some e essa linha é o único guia que resta. Não apagar o elemento.

A silhueta do veículo sai de `categoriaVeiculo()`, por palavra-chave no nome do modelo. Os cinco desenhos ficam num `<defs>` na própria página e entram por `<use>` — por isso o CSS deles usa `[id^="sil-"]`, que pega os originais: seletor descendente não atravessa o shadow tree do `<use>`.

## Restrições inegociáveis

- Nunca escrever "aprovação garantida", "crédito na hora" ou "sem consulta ao SPC". Toda taxa, prazo ou valor vem acompanhado de "sujeito a análise".
- O aviso de correspondente bancário (Resolução CMN 4.935/2021) e o "não cobramos taxa antecipada" não saem do site.
- Não inventar nome ou logo de banco parceiro. Só "instituições financeiras parceiras".
- Todo dado variável mora no objeto `CONFIG` do `app.js`. Nada solto em componente.
- Paleta e tipografia estão fechadas: azul é luz e ação, papel é o segundo material, azul sobre fundo claro usa `--acento-tinta`. Não trocar.
- **Botão cheio é `--acento-tinta` (#006AA8) com texto BRANCO** — mudou em 23/09/2026 a pedido; antes era o azul de luz `--acento` com texto escuro. Vale para `.btn-acento`, para o `.btn-linha` sobre fundo claro, para o WhatsApp flutuante e para o "Pular para o conteúdo". **O texto branco não é enfeite:** sobre #006AA8 o texto escuro dá 3,1:1 e reprova, o branco dá 5,79:1. Quem mexer no fundo do botão mexe na cor do texto junto. O hover é `--acento-tinta-luz` (#0A75B8), clareado só até onde o branco ainda passa (4,94:1) — não clarear mais.
- **O secundário sobre escuro (`.btn-linha`) tem preenchimento branco a 7% além da borda.** Só a borda não bastava: contra a foto do hero o filete cinza sumia e, ao lado de um principal sólido, o botão lia como retângulo vazio (24/09/2026). A borda a 30% de branco dá 3,19:1 contra o fundo, que é o mínimo para limite de controle. O hover tem de ficar **mais forte** que o repouso — em .08 de ciano ele ficava mais fraco que os .07 de branco do repouso e o botão parecia apagar ao passar o mouse; hoje é .16.
- **O botão do cabeçalho (`.topo-link`) é o único botão BRANCO do site**, com texto `--tinta` (24/09/2026, escolha do cliente depois de ver seis estilos renderizados). O branco não é capricho: o cabeçalho fica sobre foto, que muda de página para página e de trecho para trecho da mesma foto, e é a única cor que se segura em qualquer fundo — mede 9,02 a 11,28:1 contra o fundo nas três páginas, contra 2,57:1 do contorno cinza que havia antes. Texto a 18,05:1. Branco não clareia no hover, então quem acende é um halo (`box-shadow`), não a cor. Ele some em ≤900px, então só vale de tablet grande para cima.
- **A exceção é `.local-acoes`**, o único bloco claro onde um `.btn-acento` e um `.btn-linha` dividem a linha ("Traçar rota no Google Maps" + "Combinar uma visita"). Lá o secundário segue contornado: cheios no mesmo azul ficariam idênticos e o visitante perderia qual é a ação principal. Se algum dia outro bloco claro passar a ter os dois lado a lado, ele precisa da mesma exceção.
- O `--acento` (#00BFFF) continua sendo luz, não botão: filete do selo, pontos da linha de confiança, sublinhado do menu, trilho e botão do slider, pílula de prazo selecionada, seta do FAQ, ponteiro e anel de foco. Nada disso virou tinta.
- **A centralização das páginas de produto não vale para tudo.** Ficam de fora, de propósito, o `.cluster`, a tabela de prazos e — desde 23/09/2026 — o `.simular-pontos`. O critério é o mesmo nos três: é conteúdo para varrer com o olho, não título de display. Centralizado, o `.simular-pontos` virava três pilhas (ícone em cima, título, descrição) soltas no meio de uma coluna de 644px. Em linha, o ícone ancora cada item e a lista acompanha o alinhamento da tabela logo acima. Não "uniformizar" isso de volta.
- **Numa lista de itens, o respiro entre itens tem de ser maior que o respiro dentro do item.** O `.simular-pontos` estava com 12px entre e 10px dentro, quase iguais, e por isso os três se misturavam: o ícone de um item parecia pertencer ao texto do anterior. Hoje é 20px contra 14px. Vale como regra geral aqui, não só para esse componente.
- Motion ambiente: ignição do ponteiro, o trilho do "Como funciona" com o carrinho (avança sozinho enquanto visível, pausa com foco/clique — o mouse em cima não interrompe) e as entradas ao rolar. **Entrada ao rolar é permitida e desejada** (pedido do cliente em 21/09/2026, substitui a regra anterior de não animar ao rolar): cada bloco sobe 18px e aparece uma vez só, em escadinha de 70ms, marcado por `entradas()` no app.js. Nada de parallax, nada que se repita a cada rolagem, nada que empurre layout — só opacidade e `translate`. Use `translate`, não `transform`, senão a entrada anula o hover dos cartões. Animação em resposta a ação do usuário (hover, clique, teclado) é permitida. Tudo respeita `prefers-reduced-motion`: sem JS ou com movimento reduzido, nada é marcado e a página aparece inteira.
- O hero é foto parada: o canvas de faróis azuis (`pista()`) não é mais criado, o brilho azul (`.luz`) está desligado e o véu é cinza neutro — o fundo do hero fica na cor da própria foto, nas três páginas. O texto entra em escadinha (`.hero-txt > *`, atalhos de 70ms, marcado por `acenderHero()`), na mesma linguagem das entradas ao rolar.
- **Quem escurece o hero é o véu, não a foto.** `.hero-foto` fica em `brightness(.74)` só para assentar o branco do céu; o contraste do texto sai das três camadas do `.veu` (topo para o menu, base para fechar no papel, horizontal para a coluna de texto). Escurecer nos dois lugares empasta a imagem — foi o que aconteceu com `brightness(.55)` + véu chapado até 22/09/2026. Se mexer no véu, remeça o contraste real: no escuro o alvo é 4,5:1 para o corpo e 3:1 para o h1, medido sobre o pixel mais claro atrás das linhas de texto, não sobre a caixa do elemento.
- O recorte da foto no estreito é por página: só a home desloca (`body:not([data-produto]) .hero-foto img{object-position:58% center}`), porque cada foto tem composição própria. A faixa 601–900px tem véu e altura próprios — lá o texto ocupa a largura toda e o hero precisava voltar a ter altura de hero.
- **A foto do hero é `<picture>` no HTML de cada página, não background de CSS** (mudou em 22/09/2026). Background não deixa pedir tamanho por tela e só é descoberto depois da folha de estilo. O `--hero-img` e as regras `body[data-produto]` que o trocavam não existem mais; o CSS só cuida de enquadramento (`object-position`) e tratamento. Os arquivos saem de `node ferramentas/imagens.mjs`, que lê os originais de `img/fonte/` — **não editar a lista do `srcset` à mão nem gerar tamanho com outra ferramenta**, senão o nome e a largura deixam de bater.
- **Se alguém reclamar que "a hero está feia", cheque a resolução da foto ANTES de mexer em véu, cor ou composição.** Foi o diagnóstico de 22/09/2026: as três fotos eram pequenas demais e o CSS não tinha como salvar — ajustar cor só piorou, porque expôs a papa que o escuro escondia. A home e o financiamento foram resolvidos em 23/09/2026 com fotos de 3200px (ampliação hoje ≤1,3x em toda tela testada). **Falta o refinanciamento**, ainda em 1024px, que amplia 3,3x no celular; é CC0 e não depende do cliente. Medições e passo a passo em `img/CREDITOS.txt`.
- Ao escolher foto de hero: **horizontal, ≥2800px, assunto à direita, e sem emblema de marca, placa ou fachada de terceiro legível.** A última busca descartou dezenas de candidatas por esse motivo — pátio de concessionária em acervo livre é quase todo foto de entusiasta, cheia de logo. O critério não é estética, é que exibir marca alheia no site de um correspondente bancário cria problema de licença e de leitura.
- O `sharp` é ferramenta de bancada, instalada na hora de gerar imagem. **O site continua sem build e sem dependência** — nada em `ferramentas/` vai para o servidor.
- **O CTA final é `--noite` e o rodapé é `--painel`** — a separação entre os dois é uma troca de superfície, não um filete nem um brilho (23/09/2026). O `footer` não tem `border-top`. **Não reintroduzir brilho azul ali sem pedido**, e não voltar o rodapé para `--noite`: as quatro tentativas anteriores foram recusadas, nesta ordem.
  1. Brilho no `.fim-sec` ancorado em `50% 100%` → o rodapé cortava a seco e o filete de 1px fazia três faixas visíveis.
  2. Brilho metade em cada um, elipse contínua sobre a emenda → mancha azul frouxa no meio, sem pertencer a bloco nenhum.
  3. Brilho só no rodapé → tão parecido com a 2 que a resposta foi "tirou nada".
  4. Tudo chapado em `--noite`, sem brilho e sem filete → aí a emenda sumiu **demais**: com 166px de vazio e a mesma cor dos dois lados, o fim da página virou um retângulo preto de ~880px com dois blocos de texto boiando, sem estrutura.

  As duas lições: naquela área o brilho não tem o que iluminar (o azul do site é o botão, e fundo azulado atrás dele só o enfraquece), e separar dois blocos escuros pede **troca de superfície**, não linha.
- O respiro entre os dois é assimétrico de propósito: `.fim` fecha com 72px embaixo e o `footer` abre com 64px. Somar dois respiros cheios dava os 166px de vazio. Se mexer, meça o vão entre a última linha do CTA e a primeira do rodapé — a referência é ~136px no desktop.

## Telas: celular, tablet e desktop

São três faixas, não duas. **O ≤900px não é tudo celular: de 601 a 900 é tablet.** A diferença não é cosmética — até 24/09/2026 tudo colapsava para uma coluna abaixo de 900px, então um iPad de 820px recebia o layout de telefone e a home ficava com 8100px de altura. Hoje são 6411px.

Na faixa de tablet voltam: o cabeçalho inteiro numa linha (marca + menu + botão — medido, sobram de 88px no iPad mini a 244px em 900px), `.produtos` e `.docs` em duas colunas, `.local` em duas com o mapa acompanhando a altura da coluna, e o rodapé em três.

**O que fica em uma coluna no tablet, de propósito:**

- **O simulador** (`.simular`) — o instrumento pede 360px de largura mínima e a coluna de texto também; lado a lado não cabem sem espremer os dois.
- **O "Como funciona"** — a linha do tempo em pé tem geometria própria de trilho e carrinho (`.passo::before/after`, `.carro`), remontada no `@media (max-width:900px)`. Voltar para duas colunas exige refazer essa geometria e traz mais risco que ganho.
- **O FAQ** (`.faq-grid`) — layout de três áreas nomeadas.

### Alvo de toque

**O mínimo é 44px.** Quatro elementos estavam abaixo e foram corrigidos em 24/09/2026:

| Elemento | Antes | Causa |
|---|---|---|
| Links do rodapé | 22px | tinham `padding:0;min-height:0` escritos à mão |
| Marca do cabeçalho | 42px | altura do símbolo |
| `.passo-bt` no celular | 40px | sem padding |
| `.passo-bt` no iPad deitado | 24px | sem padding, título de uma linha |

O `.passo-bt` foi resolvido com **padding mais margem negativa do mesmo tamanho**: a caixa clicável cresce 20px e a caixa de margem — que é o que o `h3` enxerga — não muda, então o layout fica idêntico.

**NÃO pôr `position:relative` no `.passo-bt`.** Tentei primeiro com um `::after` posicionado, e isso quebrou a seção: o número do passo (`.passo .n`) é `position:absolute; left:0` e se posiciona pelo primeiro ancestral posicionado. Com o botão posicionado, ele passou a contar a partir do botão, que já está depois dos 58px de recuo do passo no celular — e o círculo caiu **em cima do título**, deixando "Você simula" legível como "e simula" nos quatro passos.

O alvo final mede 60px no celular e no tablet, 44px no desktop, e aparece corretamente em `getBoundingClientRect` — não precisa de verificação especial.

### Texto pequeno no celular

Abaixo de 600px, o cabeçalho da tabela de prazos e os limites do slider sobem de 12 para 13px: são os únicos textos miúdos que a pessoa **precisa ler para operar o simulador**. Os demais (avisos, condições, notas de campo) ficam em 13px de propósito — são miudinhos de ressalva, não de operação. A segunda linha da marca fica em 11px: é logotipo, não texto corrido.


## Como trabalhar aqui

- Ajuste pedido é ajuste feito. Não refatorar, não reescrever, não "aproveitar pra melhorar" o que não foi pedido.
- Antes de qualquer mudança de escopo, ler `HANDOFF.md` e seguir a fase correspondente.
