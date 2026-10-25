# Aparência e usabilidade — versão 1.2.0

Revisão de 22/10/2026. Continuidade da identidade aprovada, sem troca de arquitetura ou bibliotecas de interface.

## Decisões

- Manter estrutura, Manrope/DM Sans, anéis do dia e categorias. Escuro não é inversão por filtro: superfícies verde-profundo, lavanda e azul adaptadas, com texto e gráficos próprios.
- Tema Claro/Escuro/Sistema em Ajustes → Aparência; atalho no cabeçalho e login, inclusive no celular. Padrão Sistema; escolher pelo atalho torna a preferência explícita.
- Preferência `ritmo.appearance` no localStorage deste navegador, não no SQLite nem no backup da rotina. Segue mudanças do sistema quando configurada como Sistema e sincroniza entre abas da mesma origem. Se armazenamento estiver bloqueado, funciona durante a página sem prometer persistência.
- `public/theme.js` externo e síncrono antes da entrada React aplica o tema inicial sob a CSP existente, sem liberar scripts inline. `src/Theme.tsx` observa mudanças; `src/theme.css` concentra tokens e adaptações.
- Movimento funcional: confirmação de check/série, água, barras de progresso, abertura de diálogos e estado de tema. Sem animação decorativa em loop, sem criar pontuação nem antecipar persistência. Reduced-motion remove animações e transições.
- Proteção de rascunho na preparação do foco; durante sessão ativa, navegar continua permitido. Menu móvel fecha antes do aviso: cancelar volta à edição. Mensagem de descarte agora fala em alterações, não apenas anotações.
- Diálogos sem descrição específica não exibem um texto genérico de personalização em erros. Ajustado singular de hábito na revisão semanal.

## Evidências

- Build TypeScript/Vite e 48 testes aprovados (41 anteriores + 7 de tema). Sem nova dependência.
- Playwright MCP, porta 3002 e banco exclusivamente sintético `output/qa-theme-20261022.sqlite`; base pessoal não usada.
- 9 telas × 3 larguras (390/820/1440) × 2 temas = 54 verificações de layout, sem overflow horizontal ou erros de execução na matriz. Cabeçalho também verificado com sessão de foco ativa no celular.
- Tema: recarga, troca do sistema operacional emulado, seleção explícita, propagação entre abas e preservação de formulário em edição. Testes unitários incluem armazenamento indisponível, valor inválido e remoção da preferência.
- Registro/reversão de água e hábito; modo essencial preservado após recarga; menu móvel, criação/edição/remoção/restauração de hábito e cancelamento de remoção.
- Diário: Voltar/cancelar, troca de tema com rascunho, HTTP 500 intencional, nova tentativa e recarga com texto persistido. Revisão semanal: cancelar saída, salvar e recarregar.
- Treino: carga/repetições/série, salvar parcial, retomar, concluir, editar sem perder conclusão e reabrir explicitamente. Janela móvel sem overflow horizontal.
- Foco: rascunho protegido, cancelar saída, iniciar, pausar, trocar tema/recarregar, navegar com sessão ativa e cancelar/confirmar descarte. A conclusão real por duração foi validada na revisão anterior, não repetida neste lote.
- Backup: JSON inválido com orientação e cancelamento da restauração mantendo o estado idêntico.
- Evolução: registro sintético de peso e tooltip conferidos no escuro, com superfície, texto, pontos e eixos adaptados; gráfico com dado real de teste, não apenas estado vazio.
- Confirmação de descarte mantém Tab dentro do diálogo. Reduced-motion verificado no navegador. Varredura auxiliar de contraste de texto nas nove telas escuras não apontou pares abaixo de 4,5:1 nos elementos elegíveis, sem considerar ícones, transparências, estados desabilitados ou conteúdo oculto; não é auditoria WCAG completa.
- Capturas de desktop claro/escuro, dashboard móvel e treino móvel inspecionadas. Em `.playwright-mcp` no ambiente de trabalho da conversa; sintéticas, não são registros pessoais. Erros de rede 500 nos testes de recuperação foram intencionais.

## Limites e continuidade

- A restauração continua limitada a 5 MB; este lote não altera backup/autenticação nem dados pessoais. Planejar recuperação para bases grandes permanece prioritário.
- A referência Figma existente continua retratando a visão clara da 1.1.1; o tema escuro e os novos estados não foram espelhados neste lote. Não há sincronização automática.
- Sem publicação, commit ou push neste lote. Testes de layout não substituem uso em dispositivos físicos, leitores de tela e auditoria externa.
- Próximas validações sugeridas: matriz persistente de E2E, leitor de tela, contraste de ícones e conteúdo longo, e variante noturna do Figma. São planejamento, não recursos entregues.
