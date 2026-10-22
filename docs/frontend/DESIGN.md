# Ritmo

Projeto novo. Painel pessoal de saúde e rotina, com uma única pessoa como usuária. Objetos: hábito recorrente, registro diário, treino, exercício, meta, refeição e anotação. A jornada começa criando a conta; a primeira decisão diária é escolher a próxima atividade. Sucesso é registrar uma ação e ver a confirmação e sua contribuição ao dia. Recuperação: desfazer conclusão, editar registro, arquivar/restaurar hábito e exportar cópia. A principal ação no celular é concluir hábito ou registrar água.

## Direção escolhida

Entre um painel esportivo escuro, um planner editorial e um companheiro diário claro, escolhemos o terceiro: precisão de instrumento, calor de uma rotina pessoal. A navegação discreta toma como referência o Linear; o calendário usa a linguagem de contribuições do GitHub; Radix fornece foco, teclado e diálogos acessíveis.

Paleta: nuvem #f5f6f8, papel #ffffff, floresta #214e45, broto #dceaaf, lavanda #eeebf7, água #e7f1fa. Texto #24332f, secundário #65726d. Manrope para títulos e números; DM Sans para leitura, ambas distribuídas localmente. Nada depende de fontes externas.

Layout desktop: navegação lateral fixa de 220px; cabeçalho discreto; resumo do dia de largura ampla com anéis segmentados à direita; linha de estatísticas; coluna principal de agenda e coluna de registros rápidos; calendário anual abaixo. Celular prioriza agenda, água e navegação inferior. Alinhamento à esquerda, escala de 4px, leitura curta. Não aplicar o mesmo tratamento de cartão a tudo: resumo verde, agenda branca contínua, utilitários tintados e calendário branco.

O ponto memorável são os anéis segmentados de progresso diário. Outras visualizações são discretas. Cores expressam categoria/estado. Movimento aparece ao concluir uma atividade e respeita reduced-motion. Nenhuma foto corporal será copiada para o projeto. Dados anteriores não são inventados.

## Verificação

Build TypeScript, testes de integração de autenticação e persistência, uso real no navegador, estados vazios, exclusão com confirmação, teclado e telas 1440px e 390px. Contraste, ausência de scroll horizontal, alvos de toque e foco são obrigatórios.
