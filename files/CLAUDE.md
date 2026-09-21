# Site Ale Auto Cred

Site estático de correspondente bancário (refinanciamento e financiamento de veículo). HTML/CSS/JS puro, sem build, sem dependência. Contexto completo e fases de trabalho em `HANDOFF.md`.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Home dos dois produtos — o painel escuro, com hero de tela cheia |
| `refinanciamento.html` | Guia do produto + simulador (valor + prazo) |
| `financiamento.html` | Guia do produto + simulador (busca FIPE + entrada + prazo) |
| `politica-de-privacidade.html` | LGPD |

**As páginas de produto são montadas com os componentes da home, não com componentes novos.** Hero com foto, `.produto` com imagem, `.simular`, `.passos` com o carrinho, `.docs`, `.faq-grid`, `.fim-sec`, rodapé — as mesmas peças, com conteúdo e ordem próprios. A única adição é `.produto.largo` (variante horizontal do card, para o produto aparecer sozinho e grande) dentro de `.produtos.solo`.

**Já tentamos o contrário e deu errado.** Uma versão anterior inventou uma linguagem só para essas páginas — faixas alternadas, barras de comparação, fichas de dados, cartões, sumário — e ficou genérica e feia. Se a página parecer pobre, o caminho é **usar melhor as peças existentes e o conteúdo**, não desenhar peça nova.

Ordem das duas: `o-que-e > simular > como-funciona > documentos > perguntas > [o outro produto] > cta`. O bloco do outro produto no fim é o que liga refinanciamento e financiamento nos dois sentidos.

Quem decide o comportamento por página é o `<body data-produto="refinanciamento|financiamento">`: dele saem a faixa do slider, a mensagem do WhatsApp e o conjunto de perguntas do FAQ. Sem esse atributo, o padrão é refinanciamento. Toda função do `app.js` sai cedo se o elemento não existir na página — é o que permite montar página nova só com as seções que interessam.

O menu fica no `<header class="topo">` e marca a página atual com `aria-current="page"`, que é o que o CSS usa para acender o item. Página nova precisa entrar no menu das outras.

## Busca FIPE (só em `financiamento.html`)

Única chamada externa do site. API pública e não oficial; `CONFIG.fipe.ativo` desliga tudo. Se a API falhar, atrasar ou o visitante estiver offline, o bloco de busca se esconde e o slider `#valorManual` volta — o simulador nunca depende dela. A política de privacidade descreve essa consulta; se ela mudar, atualize a política junto.

A silhueta do veículo sai de `categoriaVeiculo()`, por palavra-chave no nome do modelo. Os cinco desenhos ficam num `<defs>` na própria página e entram por `<use>` — por isso o CSS deles usa `[id^="sil-"]`, que pega os originais: seletor descendente não atravessa o shadow tree do `<use>`.

## Restrições inegociáveis

- Nunca escrever "aprovação garantida", "crédito na hora" ou "sem consulta ao SPC". Toda taxa, prazo ou valor vem acompanhado de "sujeito a análise".
- O aviso de correspondente bancário (Resolução CMN 4.935/2021) e o "não cobramos taxa antecipada" não saem do site.
- Não inventar nome ou logo de banco parceiro. Só "instituições financeiras parceiras".
- Todo dado variável mora no objeto `CONFIG` do `app.js`. Nada solto em componente.
- Paleta e tipografia estão fechadas: azul é luz e ação, papel é o segundo material, azul sobre fundo claro usa `--acento-tinta`. Não trocar.
- Motion ambiente só onde já existe: ignição do ponteiro, pista do hero e o trilho do "Como funciona" com o carrinho (avança sozinho enquanto visível, pausa com foco/clique — o mouse em cima não interrompe). Nada anima sozinho ao rolar — sem fade-up de seção, sem parallax. Animação em resposta a ação do usuário (hover, clique, teclado) é permitida. Tudo respeita `prefers-reduced-motion`.

## Como trabalhar aqui

- Ajuste pedido é ajuste feito. Não refatorar, não reescrever, não "aproveitar pra melhorar" o que não foi pedido.
- Antes de qualquer mudança de escopo, ler `HANDOFF.md` e seguir a fase correspondente.
