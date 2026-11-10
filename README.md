# Ritmo pessoal

Aplicação web pessoal para organizar hábitos, alimentação, exercícios e bem-estar. Conta única, com dados persistidos localmente em SQLite.

## Funcionalidades

- Rotina editável, com horários, recorrência e registros diários.
- Lista de hábitos paginada, com 5, 10, 20, 50 ou 100 itens por página após busca e filtros.
- Hidratação, sono, passos, peso, energia e diário de humor.
- Treinos com exercícios, séries, repetições e cargas.
- Planejamento de refeições e metas ajustáveis.
- XP, níveis, conquistas, sequências e calendário de consistência.
- XP por esforço editável (10/20/30) e bônus progressivo para dias consecutivos com 100% da rotina.
- Uma frase curta por dia no cabeçalho, escolhida entre 200 mensagens originais pelo calendário real no fuso configurado.
- Login exclusivo, backup e restauração.
- Restauração de backups de até 100 MB, com limite compartilhado entre interface e API.
- Interface responsiva em português, com fontes locais.
- Dia essencial configurável, sem perder registros ou reduzir metas.
- Cronômetro de foco persistente, com pausa, histórico e hábito vinculado opcional.
- Revisão semanal com médias, comparação por área e reflexões editáveis.
- Jogos da mente com memória de pares, sequência numérica, Stroop e busca visual; memória usa 8/10/12 pares, sequência 6/7/8 algarismos, Stroop 12/18/24 rodadas e Schulte grades 5×5/6×6/7×7. Cada jogo tem uma rodada independente, com nova configuração 24 horas após conclusão ou cancelamento confirmado; o intervalo vale para qualquer dificuldade do mesmo jogo.
- Tutoriais manuais por página e fluxo, com destaque contextual, navegação não bloqueante e conclusão salva somente neste navegador.
- Assistente Folhinha com respostas locais sobre o Ritmo, sugestões por página e conversa temporária no navegador.
- Preview das cinco cenas do Folhinha em `/folhinha-preview.html`, com ativação individual, repetição, tema e comparação entre tamanho real e ampliado; não usa a conta.
- Jornada de hábitos em ordem horária, com navegação anterior/próximo; registros abaixo da meta ficam salvos e sinalizados sem XP.

## Executar

Requer **Node.js 22.13+**. Validado com Node.js 24.15.

```sh
npm ci
npm run build
npm start
```

Abra **http://localhost:3000**. No primeiro acesso, crie seu login e senha. Depois, novos cadastros ficam bloqueados. No Windows, também é possível usar `Iniciar-Ritmo.cmd`.

```sh
npm run dev   # desenvolvimento
npm test      # testes de cálculo, API, persistência e segurança
npm run check # TypeScript
```

## Configuração e dados

Copie `.env.example` para `.env` para personalizar a porta, o endereço de escuta ou o caminho do banco. A feature flag `RITMO_LAN_ACCESS=true` (padrão da instalação local) faz o servidor escutar em todas as interfaces do computador, permitindo abrir o Ritmo em outro celular ou computador da mesma rede pelo endereço IPv4 local do computador, por exemplo `http://192.168.0.10:3000`. O login continua obrigatório e isso não configura publicação na internet. Para restringir ao próprio computador, use `RITMO_LAN_ACCESS=false`.

O diretório `data/` guarda os dados pessoais e não é versionado. Arquivos de ambiente, backups, capturas de teste e dependências também ficam fora do repositório. Para transferir seus registros, exporte um backup em **Ajustes**. O backup não contém a conta ou a senha.

Para recuperar o acesso com permissão local no computador, execute `npm run recover`.

## Hospedagem

A aplicação precisa de um servidor Node.js, HTTPS e disco persistente para SQLite. Na instalação local, `RITMO_LAN_ACCESS=true` habilita somente o acesso pela rede local; para hospedagem pública, desative a flag e configure uma infraestrutura própria de autenticação, HTTPS e firewall. Crie a conta antes de expor o serviço à internet. O projeto não é um site estático.

Consulte [LEIA-ME.md](./LEIA-ME.md) para instruções completas, backup, recuperação de senha, funcionamento da pontuação e configuração da hospedagem.

Para a preparação de proteção de borda e limites de requisição, veja [docs/security/WAF.md](./docs/security/WAF.md). A configuração do Cloudflare só poderá ser ativada depois de escolher domínio e hospedagem e fechar o acesso direto à origem.

## Atualização 1.1

Os registros e backups da versão anterior continuam compatíveis. Os novos campos são preenchidos ao carregar o estado, sem apagar a conta ou o histórico. Atualize o código, execute `npm ci` e `npm run build`, e reinicie o servidor.

## Atualização 1.1.1

Proteção de rascunhos ao usar Voltar/Avançar e fechar janelas, incluindo metas e séries de treino. Histórico de treinos parciais e concluídos paginado e independente das fichas; editar um treino concluído mantém sua conclusão, com reabertura explícita. Sessões de foco verificam sua identidade para impedir ações de abas desatualizadas. Importações validam datas e identificadores; uma edição não pode esvaziar o dia essencial ativo.

Referência visual editável: [Ritmo no Figma](https://www.figma.com/design/3UHNJebERKtLF2W4T33Qzf?node-id=2-55), com uma visão geral desktop e estado de descarte. Não é sincronização automática nem cobertura de todas as telas. Veja `docs/frontend/FLOW_REVIEW.md` para resultados e limites conhecidos.

## Atualização 1.2.0

Modo Claro/Escuro/Sistema em **Ajustes → Aparência**, com atalho no cabeçalho e no login. A preferência pertence a este navegador e não entra no backup. Interações animadas de check, hidratação, progresso e diálogos respeitam movimento reduzido. A preparação do foco passa a proteger rascunhos; cancelar uma saída pelo menu móvel retorna à edição. Veja `docs/frontend/APPEARANCE_REVIEW.md` para evidências, escopo e pendências.

## Atualização 1.3.0

A entrada ganhou uma planta SVG que responde ao preenchimento, órbitas e notas sutis com controle para pausar, e estados de erro, espera, sucesso e Caps Lock. O link **Esqueci minha senha** explica a recuperação local existente; não abre um novo cadastro nem expõe um reset pela internet. **Manter conectado por 7 dias** é opcional e desmarcado por padrão. Sem marcar, o cookie dura a sessão do navegador e o servidor limita o acesso a 12 horas. Veja `docs/frontend/LOGIN_REVIEW.md` para a revisão do fluxo e seus testes.

## Atualização 1.4.0

**Continuar meu dia** abre o primeiro hábito ainda sem registro, seguindo a ordem dos horários. A janela permite percorrer todos os hábitos com as setas, mostra a posição na jornada e protege valores digitados ainda não salvos. Ao salvar, avança para o próximo hábito pendente. Água, sono e contadores aceitam valores positivos abaixo da meta: o registro persiste com o estado **Meta não atingida**, sem XP. A porcentagem do dia continua proporcional nesses casos e agora anima até o valor real; com movimento reduzido, muda imediatamente. Veja `docs/frontend/JOURNEY_REVIEW.md`.

## Atualização 1.5.0

O login agora abre o espaço pessoal com uma transição verde-musgo: união dos painéis, desenho da marca, broto e mensagem por horário. A duração acompanha a chegada dos dados; erros mantêm o formulário, e movimento reduzido usa somente um fade de 200ms. O foco retorna ao conteúdo principal após a revelação.

Preview isolado: [testar a entrada](http://localhost:3000/transition-preview.html), com **Repetir animação**, temas, horários e cenários rápido, normal, lento e erro. Usa dados fictícios e não chama as APIs de login ou registros. O arquivo `transition-preview.html` também é incluído em `npm run build`. Ajustes de tempos, textos e evidências: [ENTRY_TRANSITION.md](./docs/frontend/ENTRY_TRANSITION.md).

## Atualização 1.6.0

Saída com círculo verde, marca se apagando e broto em descanso. **Voltar ao meu espaço** cancela durante os primeiros 3 segundos, preservando a sessão e os rascunhos. Alterações não salvas exigem confirmação. A sessão é revogada depois dessa janela; falhas mantêm a superfície privada coberta e permitem tentar novamente. Movimento reduzido usa fade de 200ms, sem retirar o tempo de cancelamento.

[Preview da saída](http://localhost:3000/logout-preview.html): repetir animação, rascunho fictício, servidor lento e falha/repetição, sem encerrar a sessão real. Veja [EXIT_TRANSITION.md](./docs/frontend/EXIT_TRANSITION.md).

## Tecnologias

React · TypeScript · Vite · Express · SQLite · Radix UI · Recharts
