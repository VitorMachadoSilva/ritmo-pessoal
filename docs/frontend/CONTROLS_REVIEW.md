# Revisão de selects e rolagem — 24/10/2026

## Escopo observado

Os controles nativos aparecem em:

- Criação/edição de hábito: área, tipo de acompanhamento e esforço (`src/forms.tsx`).
- Ajustes: fuso horário (`src/forms.tsx`).
- Preparação do foco: hábito vinculado (`src/Focus.tsx`).
- Minha rotina: tamanho da página 5/10/20/50/100 (`src/pages.tsx`).
- Evolução: registro de peso por digitação ou botões de ajuste de 0,1 kg (`src/pages.tsx`).
- Previews de entrada e saída: cenário e horário (`src/transition-preview.tsx`, `src/logout-preview.tsx`).

Não existe combobox customizado na interface examinada. Os campos são `<select>` nativos. Em navegadores com suporte a `appearance: base-select`, a lista aberta também recebe superfície, estados selecionado/hover e check do Ritmo, mantendo o elemento e sua navegação nativa por teclado. Navegadores sem suporte continuam com popup do sistema.

Áreas com rolagem própria: documento, menu lateral quando a altura é baixa, agenda do dia, mapa de contribuições (horizontal/vertical), diálogos altos e histórico do diário.

## Mudanças

- Novo `src/controls.css`, importado pelo app e pelos dois previews, centraliza seta, superfície, borda, estados de hover/foco/desabilitado, cores de opção e altura dos selects. A API `base-select` aprimora progressivamente o menu aberto em navegadores compatíveis.
- 42px de altura mínima no desktop; 44px e fonte 16px até 650px (evita zoom automático do iOS). Seletor da paginação ganhou 82px para exibir `100` com a seta.
- Scrollbars finas, visíveis, com trilho transparente e thumb verde acinzentado, adaptadas a Claro/Escuro. `overscroll-behavior` e rolagem tátil são aplicados apenas às regiões internas.
- Regras anteriores do popup de preview foram simplificadas para não sobrescrever o tema do controle. O tema escuro passou a usar `background-color` para não apagar a seta via shorthand `background`.
- Registro de peso: substituído o spinner cinza de plataforma por botões empilhados com chevrons do Ritmo. O campo continua `type=number`, aceita digitação, mantém min/max/step, e os botões respeitam limites, estado ocupado, teclado e foco visível.

## Verificação e limites

- `npm run build`: aprovado em 24/10/2026.
- Inspeção visual do preview de saída no Chromium: modo escuro, desktop e viewport 390×844. Select com altura 44px, texto 16px, seta customizada; documento sem overflow horizontal. Scrollbar da página reportou largura fina e thumb escuro (`rgb(67, 86, 74)`).
- O preview verifica o seletor auxiliar e a rolagem do documento. Chromium desktop abriu o menu com superfícies e seleção tematizadas em claro/escuro. A API `base-select` é progressiva; fallback dos outros navegadores e controles das telas autenticadas ainda precisam de conferência manual nos casos `DSC-01` e `DSC-02`.
- Build após o stepper de peso: aprovado. Preview de markup equivalente no Chromium escuro: +1 e −1 alteraram 96 para 96,1 e de volta para 96, com `step=0.1`, `min=30` e `max=350`; inspeção visual confirmou o controle temático. Envio/persistência na tela autenticada permanece manual.
- Nenhuma suíte automatizada foi adicionada ou executada para esta tarefa. Não houve alteração de regras de persistência.
