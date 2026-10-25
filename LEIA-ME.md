# Ritmo pessoal

Aplicação local de rotina e saúde, em português, criada para uma única conta. Desenvolvida com React, TypeScript, Vite, Express, SQLite e componentes acessíveis Radix. As fontes são locais. Nenhuma foto corporal é copiada para o projeto e os registros pessoais começam vazios.

## Abrir agora

Acesse **http://localhost:3000**. No primeiro acesso, escolha seu nome, login e uma senha de pelo menos 12 caracteres. Depois disso, o cadastro fica fechado. Não existe senha padrão.

Para iniciar novamente no Windows, dê dois cliques em **Iniciar-Ritmo.cmd** e mantenha a janela aberta. Também é possível usar um terminal nesta pasta:

```powershell
npm install
npm run build
npm start
```

Requer Node.js 22.13 ou superior; foi validado com Node 24.15. Para desenvolver com atualização automática: `npm run dev`. Após alterações no código, execute `npm run build` antes de `npm start`.

Se a porta 3000 já estiver ocupada, copie `.env.example` para `.env` e escolha outra porta. O endereço mostrado pelo servidor informa a porta em uso. O lançador usa 3000 como referência visual, mas o servidor respeita `.env`.

## O que você pode fazer

- **Visão geral:** acompanhar o dia por horário, concluir/desmarcar hábitos, registrar água, sono, passos e energia, e explorar o mapa de consistência.
- **Minha rotina:** criar, editar e remover hábitos, alterar dias/horários, escolher área da vida e usar contadores. Hábitos removidos podem ser restaurados. A lista mostra 10 itens por padrão, com escolha de 5, 10, 20, 50 ou 100 por página. Busca, área e alternância entre ativos/removidos reiniciam a página; a página atual se ajusta se o total diminuir.
- **Evolução:** registrar/remover peso, mudar períodos, acompanhar tendência e conquistas.
- **Treinos:** editar ou criar fichas, incluir/remover exercícios, registrar carga/repetições e séries, salvar sessões parciais ou concluídas.
- Sessões parciais e concluídas ficam no histórico paginado, mesmo se a ficha original for removida. Editar cargas de um treino concluído mantém a conclusão; use **Reabrir treino → Reabrir e salvar** para voltar ao estado em andamento e desmarcar o hábito associado, se existir.
- **Alimentação:** editar refeições, horários e estimativas de calorias/proteína. Os totais representam o planejamento, não consumo medido.
- **Meu diário:** registrar humor, pensamentos, uma vitória e um próximo passo. Salve antes de sair; o aplicativo avisa se houver alterações pendentes.
- **Ajustes:** editar metas, nome e fuso, trocar senha, exportar ou restaurar backup.
- **Tempo de foco:** reservar de 1 a 120 minutos para uma tarefa, pausar, retomar e registrar. O cronômetro persiste ao mudar de tela ou recarregar. Ele para de acumular ao atingir a duração escolhida e precisa ser registrado para entrar no histórico. Sessões parciais exigem pelo menos um minuto; descartar não registra tempo.
- **Jogos da mente:** memória de pares (8/10/12 pares), sequência numérica (6/7/8 algarismos), Stroop (12/18/24 rodadas, com mais conflitos de cor nos níveis maiores) e busca visual Schulte (grades 5×5/6×6/7×7). A pausa de 24 horas é única para cada jogo e vale entre níveis; os desafios usados não se repetem. Cada jogo tem uma rodada independente; depois de concluir ou cancelar, a mesma experiência libera uma nova configuração em 24 horas reais, controladas pelo servidor e compartilhadas entre dispositivos. Cancelar exige confirmação, conta uma tentativa e não altera o recorde. Voltar à lista mantém a rodada disponível, mas reinicia o progresso exibido na tela. Resultados não geram XP e não são avaliação clínica.
- **Revisão semanal:** comparar os sete dias, ver médias e distribuição por área, e salvar três reflexões. Anotações pendentes têm proteção ao navegar. As revisões podem ser editadas ou apagadas limpando os campos e salvando.

Os horários iniciais são editáveis. A programação inclui movimento, alimentação, foco, hidratação, sono, bem-estar, passos, revisão semanal e preparo de refeições. Os treinos A/B e as refeições são pontos de partida da conversa, não prescrição clínica. Metas de peso, água, sono, alimentação e constância podem ser ajustadas.

## Aparência e movimento

Em **Ajustes → Aparência**, escolha Claro, Escuro ou Sistema. O padrão acompanha o dispositivo; o botão de sol/lua no cabeçalho e no login alterna para uma escolha explícita. A seleção vale neste navegador e sincroniza entre suas abas, mas não é enviada no backup nem transferida para outro navegador. Com armazenamento bloqueado, ela pode não sobreviver à recarga.

Confirmações, hidratação e barras de progresso têm transições curtas. Ativar a preferência de movimento reduzido no sistema desativa animações e transições. A preparação de uma sessão de foco também avisa antes de sair com alterações; o cronômetro já iniciado continua permitindo navegar.

## Como o progresso funciona

**Jornada diária:** **Continuar meu dia** escolhe por horário um hábito pendente sem registro; se todos os pendentes já têm valores parciais, abre o primeiro deles para revisão. Na janela, as setas Anterior/Próximo percorrem os hábitos sem marcá-los. Valores digitados ainda não salvos exigem confirmação antes de navegar ou fechar. Após salvar, a janela avança ao próximo pendente. Um valor positivo abaixo da meta de água, sono ou contador é válido e fica marcado **Meta não atingida · 0 XP**. Valor zero remove o registro; valores vazios, negativos, acima do limite ou com formato inválido não são salvos. O progresso percentual do dia continua proporcional aos valores parciais, enquanto XP exige a meta completa. O anel anima até a porcentagem calculada; com movimento reduzido, atualiza sem animação.

Cada hábito concluído rende XP conforme o esforço escolhido em **Minha rotina → Editar hábito**. Hábitos iniciais já têm uma classificação; novos hábitos começam em Moderado. A cada **500 XP**, você sobe um nível. Desmarcar um hábito retira os pontos correspondentes; repetir cliques não acumula experiência. Água, sono e contadores contribuem proporcionalmente para o progresso do dia, até 100%, e rendem XP apenas ao atingir a meta.

| Esforço | XP por hábito concluído |
| --- | ---: |
| Leve | 10 |
| Moderado | 20 |
| Desafiador | 30 |

Concluir **100% de todos os hábitos previstos no dia** dá um bônus adicional. Ele exige também os hábitos fora da seleção quando o dia está no modo essencial. Dias completos consecutivos aumentam o bônus diário: **1–2 dias: +10 XP; 3–6: +20; 7–13: +30; 14–29: +40; 30 ou mais: +50**. Um dia incompleto reinicia apenas essa sequência de bônus, sem tirar XP já ganho por hábitos concluídos. O cálculo vem dos registros e pode mudar ao corrigir um dia anterior. A sequência de constância de 70% continua separada.

A constância considera dias que atingem a porcentagem definida em Ajustes (70% inicialmente). Hoje em andamento não interrompe a sequência de ontem. Os dias anteriores podem ser corrigidos. O mapa cobre os últimos 12 meses e abre os dias já iniciados; dias futuros não aceitam registros.

**Dia essencial:** na visão geral, escolha entre a rotina completa e somente os hábitos essenciais. A seleção é editada na janela de cada hábito, em Minha rotina. As metas de água, sono e quantidades permanecem iguais. A escolha vale apenas para hoje, fica indicada no histórico e não muda os registros anteriores. Hábitos concluídos fora da seleção continuam valendo XP; trocar o modo não gera pontos.

Não é possível editar, arquivar ou desagendar o último hábito essencial de hoje enquanto esse modo estiver ativo. Escolha outro essencial primeiro ou volte à rotina completa. A tentativa rejeitada não altera o estado.

**Foco e XP:** uma sessão completa pode marcar um hábito de foco opcional, agendado para o dia em que ela começou. Repetir sessões não dá pontos extras por esse mesmo hábito. Sessões parciais registram apenas o tempo. Excluir uma sessão remove seus minutos, mas não desmarca o hábito; desmarque-o na visão geral se necessário. O cronômetro registra tempo, não mede atenção nem certifica produtividade.

**Médias semanais:** consideram somente o período entre o início da rotina e hoje. Dias sem registro contam como zero de progresso e água. A média de sono usa apenas dias com sono informado e mostra o número de registros. Dias sem hábitos previstos não entram na média percentual; dias futuros ficam de fora. O modo essencial usa a seleção daquele dia, e o tempo de foco vem de sessões efetivamente registradas.

O histórico guarda a configuração dos hábitos daquele dia. Mudar uma meta ou remover um hábito atualiza hoje e os próximos dias, preservando os anteriores. Um novo hábito começa no dia em que foi criado. Sem registros, não há pontos nem conquistas inventados.

## Seus dados

O banco fica em `data/ritmo.sqlite` (com arquivos auxiliares SQLite quando o aplicativo está aberto). Não apague a pasta `data`. O banco persiste após fechar navegador ou reiniciar o servidor.

Use **Ajustes → Exportar backup** regularmente. O arquivo inclui hábitos, treinos, refeições, metas, registros, tempo de foco e revisões semanais, e pode ser restaurado na mesma tela com confirmação. Ele não inclui login, senha ou sessões de acesso. A restauração substitui os dados atuais: exporte antes. O arquivo contém informações pessoais de saúde; guarde-o com cuidado.

Para copiar o banco completo para outro computador, encerre o servidor antes de copiar a pasta `data`, depois transfira o projeto e essa pasta. O diretório `node_modules` pode ser recriado com `npm install`.

Se esquecer o login ou senha, com acesso físico ao computador execute `npm run recover`. O comando mostra o login, pede confirmação, gera uma senha temporária e encerra as sessões existentes. Ele não apaga seu histórico. Depois altere a senha em Ajustes.

Na tela de entrada, **Esqueci minha senha** mostra esse procedimento. Execute o comando na pasta do projeto (ou no servidor, se o Ritmo estiver hospedado). Depois use **Ajustes → Alterar senha**. O botão não redefine a senha pelo navegador. **Manter conectado por 7 dias** vem desmarcado: ao marcá-lo, o navegador guarda um cookie de sete dias. Sem marcar, o cookie é de sessão e o servidor impõe limite de 12 horas; recursos de restauração de sessão do navegador podem reabrir cookies de sessão até esse limite. Sair da conta revoga a sessão. A senha não é guardada no navegador pelo Ritmo.

## Limite de restauração

A interface e a API aceitam arquivos de backup de até **100 MB**. O mesmo limite é definido em `shared/backup-limits.json` para evitar divergência entre navegador e servidor. A API aplica esse teto ampliado somente à rota de importação e somente depois da autenticação; outras requisições JSON continuam limitadas a 5 MB. Backups ainda maiores precisam ser divididos ou tratados copiando a pasta `data` com o servidor encerrado. Preserve uma cópia antes de restaurar: um backup válido substitui os dados atuais.

## Hospedar posteriormente

O projeto está separado entre cliente e servidor e inclui build de produção. A hospedagem precisa executar **Node.js**, usar **disco persistente** para SQLite e oferecer **HTTPS**. Não funciona hospedando apenas a pasta `dist` como site estático.

1. Instale as dependências e execute `npm run build`.
2. Crie sua única conta antes de tornar o serviço público; o primeiro acesso ao cadastro é o dono da conta.
3. Configure `RITMO_DB` para um caminho persistente com backup.
4. Atrás de um proxy HTTPS, defina `RITMO_HTTPS=1`; se o serviço exigir, configure `HOST=0.0.0.0` e `PORT` pela plataforma.
5. Execute `npm start` com um supervisor de processos.

O acesso padrão é limitado ao próprio computador (`127.0.0.1`). Senhas usam scrypt com salt, cookies HttpOnly/SameSite, sessões revogáveis de até 12 horas ou sete dias conforme a escolha na entrada, limitação de tentativas, validação de origem e dados no servidor. A aplicação não foi publicada nesta entrega.

## Verificação e estrutura

```powershell
npm run check
npm test
npm run build
```

Os testes de integração usam um banco temporário separado. A revisão visual usa outra base, fora do projeto; capturas em `output/playwright` podem conter dados fictícios de teste e não representam sua evolução real.

- `src/`: interface, cálculos e componentes.
- `server/`: autenticação, rotas, validação, padrões da rotina e SQLite.
- `shared/`: seleção inicial de hábitos essenciais, compartilhada entre interface e servidor.
- `tests/`: verificações de autorização, persistência, alterações e backup.
- `docs/frontend/`: decisões de design e contrato de interface.
- `scripts/recover-access.mjs`: recuperação local de acesso.
- `dist/`: versão compilada.

As referências de saúde estão em **Como funciona**. A testosterona relatada precisa ser avaliada com o laudo e os sintomas por um profissional; um resultado isolado não define o diagnóstico.
