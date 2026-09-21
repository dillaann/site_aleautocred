# Site Ale Auto Cred

Site estático de correspondente bancário (refinanciamento de veículo). HTML/CSS/JS puro, sem build, sem dependência. Contexto completo e fases de trabalho em `HANDOFF.md`.

## Restrições inegociáveis

- Nunca escrever "aprovação garantida", "crédito na hora" ou "sem consulta ao SPC". Toda taxa, prazo ou valor vem acompanhado de "sujeito a análise".
- O aviso de correspondente bancário (Resolução CMN 4.935/2021) e o "não cobramos taxa antecipada" não saem do site.
- Não inventar nome ou logo de banco parceiro. Só "instituições financeiras parceiras".
- Todo dado variável mora no objeto `CONFIG` do `app.js`. Nada solto em componente.
- Paleta e tipografia estão fechadas: azul é luz e ação, papel é o segundo material, azul sobre fundo claro usa `--acento-tinta`. Não trocar.
- Motion ambiente só onde já existe: ignição do ponteiro, pista do hero e o trilho do "Como funciona" (avança sozinho enquanto visível, pausa com mouse/foco/clique). Nada anima sozinho ao rolar — sem fade-up de seção, sem parallax. Animação em resposta a ação do usuário (hover, clique, teclado) é permitida. Tudo respeita `prefers-reduced-motion`.

## Como trabalhar aqui

- Ajuste pedido é ajuste feito. Não refatorar, não reescrever, não "aproveitar pra melhorar" o que não foi pedido.
- Antes de qualquer mudança de escopo, ler `HANDOFF.md` e seguir a fase correspondente.
