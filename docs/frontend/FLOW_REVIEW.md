# Revisão de fluxos — 22/10/2026

## Gate de produto e interface

Projeto funcional em uso, painel pessoal em português. Usuário único, tarefas centrais: registrar cuidado diário, consultar evolução e ajustar a rotina. Objetos: hábito, dia, treino, sessão de foco e reflexão. Entrada pela visão geral, primeira decisão é a próxima ação possível. Sucesso exige registro persistido e feedback correto; recuperar via desfazer, cancelar, retomar e proteger rascunhos.

Manter React/Radix, componentes e paleta aprovados; referências atuais Linear para navegação e GitHub para contribuições. Sem refazer arquitetura ou criar telas promocionais. No celular, registros e recuperação devem continuar utilizáveis. Evitar mensagens de sucesso antes da persistência, perda silenciosa de dados, navegação que contorna confirmação e gráficos com dados incoerentes. Não exibir informações técnicas ou dados pessoais reais em QA/Figma.

Verificação planejada: revisão independente QA e PO, testes de regressão/API com banco temporário, fluxos reais com Playwright MCP na instância isolada, desktop/mobile, navegação Voltar/Avançar, limites e estados de erro. Atualização do Obsidian após resultados comprovados. Figma depende de identificar o arquivo de destino correto.

## Resultado do lote 1.1.1

- PO priorizou perda de rascunhos, recuperação de treinos e invariante do dia essencial; QA reproduziu conflitos entre abas e importações inválidas com banco sintético.
- Implementados guard de histórico Voltar/Avançar, confirmação em Escape/X/clique externo/Cancelar de formulários, proteção de metas e preservação do formulário em falha.
- Treinos salvos, parciais ou concluídos, aparecem com status e paginação. Registros usam a própria estrutura histórica, mesmo sem a ficha. Edição de treino concluído preserva conclusão; reabertura exige ação e aviso explícitos.
- Foco: ações exigem `sessionId`; IDs antigos retornam 409 sem modificar a sessão atual.
- Importação: datas da jornada e das revisões e IDs únicos de coleções, snapshots e logs são verificados antes de persistir. Backups legados válidos continuam aceitos.
- Editar, arquivar ou desagendar o último essencial ativo é rejeitado sem alterar dados; a mensagem orienta escolher outro ou mudar para rotina completa.

## Evidências

- Build TypeScript/Vite aprovado e **41 testes automatizados aprovados** (27 existentes adaptados ao contrato de foco e 14 regressões independentes).
- Playwright MCP em `localhost:3002`, banco fictício independente: Voltar/cancelar/confirmar e Avançar; diário, semana e metas; fechar por Escape, X, clique externo e Cancelar; foco contido no diálogo e reduced-motion.
- Falha HTTP 500 induzida no salvamento preservou carga e séries; um erro de rede esperado aparece no console desse teste. Não foi erro não tratado de execução.
- Treino parcial retomado após apagar a ficha; edição de carga manteve conclusão; reabertura preservou séries; uma base de 13 sessões validou acesso à segunda página.
- Duas abas reais: ação da aba antiga rejeitada e sessão atual preservada.
- Nove telas em 390/820/1440: 27 combinações sem overflow horizontal e sem erros de execução. Rota inválida não derruba a interface.
- Capturas sintéticas de desktop e celular em `output/qa-review`, ignoradas pelo Git. A confirmação ganhou uma entrada discreta em opacidade, desativada por reduced-motion; sem redesign.

## Referência no Figma

[Ritmo — interface e fluxos](https://www.figma.com/design/3UHNJebERKtLF2W4T33Qzf?node-id=2-55), criado no espaço pessoal escolhido pelo usuário. Visão geral desktop `2:55` e confirmação `2:56`, componentes, variáveis e estilos próprios. Camadas verificadas: 72 textos e 389 instâncias na tela, nenhum raster da UI; Manrope/DM Sans verificadas. É referência de uma tela + estado, não cobertura de nove telas/mobile e não sincronização automática. Conteúdo sintético, sem banco ou registros pessoais.

## Pendência de recuperação

QA reproduziu exportação válida de 7.319.240 bytes que não podia ser reimportada devido ao limite anterior de 5 MB. A implementação atual eleva o teto alinhado da interface e da API para 100 MB em `shared/backup-limits.json` e aplica o parser maior apenas à importação autenticada. O teste de ida e volta acima de 5 MB em base sintética ainda precisa ser executado; backups acima de 100 MB continuam exigindo alternativa operacional. Outras bordas secundárias de importação (calendários extremos) permanecem para revisão posterior.
