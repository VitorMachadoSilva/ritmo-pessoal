# Ritmo

Projeto novo. Painel pessoal de saúde e rotina, com uma única pessoa como usuária. Objetos: hábito recorrente, registro diário, treino, exercício, meta, refeição e anotação. A jornada começa criando a conta; a primeira decisão diária é escolher a próxima atividade. Sucesso é registrar uma ação e ver a confirmação e sua contribuição ao dia. Recuperação: desfazer conclusão, editar registro, arquivar/restaurar hábito e exportar cópia. A principal ação no celular é concluir hábito ou registrar água.

## Direção escolhida

Entre um painel esportivo escuro, um planner editorial e um companheiro diário claro, escolhemos o terceiro: precisão de instrumento, calor de uma rotina pessoal. A navegação discreta toma como referência o Linear; o calendário usa a linguagem de contribuições do GitHub; Radix fornece foco, teclado e diálogos acessíveis.

Paleta: nuvem #f5f6f8, papel #ffffff, floresta #214e45, broto #dceaaf, lavanda #eeebf7, água #e7f1fa. Texto #24332f, secundário #65726d. Manrope para títulos e números; DM Sans para leitura, ambas distribuídas localmente. Nada depende de fontes externas.

Layout desktop: navegação lateral fixa de 220px; cabeçalho discreto; resumo do dia de largura ampla com anéis segmentados à direita; linha de estatísticas; coluna principal de agenda e coluna de registros rápidos; calendário anual abaixo. Celular prioriza agenda, água e navegação inferior. Alinhamento à esquerda, escala de 4px, leitura curta. Não aplicar o mesmo tratamento de cartão a tudo: resumo verde, agenda branca contínua, utilitários tintados e calendário branco.

O ponto memorável são os anéis segmentados de progresso diário. Outras visualizações são discretas. Cores expressam categoria/estado. Movimento aparece ao concluir uma atividade e respeita reduced-motion. Nenhuma foto corporal será copiada para o projeto. Dados anteriores não são inventados.

Controles de escolha permanecem `<select>` nativos para manter teclado e tecnologia assistiva. O controle fechado usa superfície do tema, seta fina, borda suave e foco visível; a lista aberta usa `appearance: base-select` progressivamente onde houver suporte, com fallback nativo nos demais navegadores. Em telas estreitas, preserva fonte de 16px para evitar zoom automático do iOS. A mesma linguagem cobre formulários de hábito e ajustes, vínculo do foco, paginação e previews. Barras da página, agenda, heatmap, modal, histórico e menu em viewport baixa usam trilho transparente e indicador fino verde acinzentado, com contraste próprio no escuro. O heatmap mantém rolagem horizontal e o indicador visível; não esconder scrollbars nem substituir semântica de select sem necessidade comprovada. Implementação e evidência: `CONTROLS_REVIEW.md`.

O registro de peso conserva um input numérico digitável e ganha controles de +/− integrados ao campo. Eles respeitam passo de 0,1 kg, limites de 30–350 kg, estados no tema e foco acessível; as setas nativas são ocultadas somente nesse campo para evitar a caixa cinza do navegador. Outros campos numéricos não são afetados.

## Verificação

A partir da 1.2.0, Claro/Escuro/Sistema são aparências do mesmo produto. O escuro usa canvas #121c19, superfície #1b2823, texto #e3eae4, acento #b6ce9c, lavanda #302d40 e água #233644. Preservar categorias, hierarquia e estrutura. Tokens e adaptações em `src/theme.css`; gráficos devem usar tokens, nunca branco fixo no tooltip. Movimento responde às ações e deve desaparecer em reduced-motion. Detalhes e evidências em `APPEARANCE_REVIEW.md`.

Na entrada 1.3.0, a planta SVG cresce quando os campos são preenchidos e floresce após autenticação. Órbitas, brilho e notas flutuam lentamente, com pausa explícita e suspensão ao ocultar a aba; no celular o movimento contínuo desaparece. A tela escura usa os mesmos tokens do produto. A identidade do split verde musgo e creme permanece; formulário, recuperação e foco comandam a hierarquia. Veja `LOGIN_REVIEW.md`.

Build TypeScript, testes de integração de autenticação e persistência, uso real no navegador, estados vazios, exclusão com confirmação, teclado e telas 1440px e 390px. Contraste, ausência de scroll horizontal, alvos de toque e foco são obrigatórios.
