# Assistente Folhinha

## Comportamento

O Folhinha aparece como botão fixo somente após a autenticação, em todas as páginas internas. O guia existente “Como funciona” permanece separado. A busca e as respostas usam apenas a base revisada em `src/help/knowledge.ts` e `src/help/search.ts`; não há chamada de IA ou serviço externo, nem armazenamento de mensagens.

Cada página interna oferece três perguntas mapeadas. Perguntas com resposta local confiável recebem uma resposta direta; consultas ambíguas mostram até três opções; consultas não reconhecidas admitem o limite e mantêm as sugestões disponíveis. Detecção de frases de risco emocional tem precedência e oferece contatos brasileiros como links acionáveis. Contatos verificados: SAMU 192 ([Ministério da Saúde](https://www.gov.br/saude/pt-br/composicao/saes/samu-192)) e CVV 188, gratuito e 24 horas ([CVV](https://cvv.org.br/o-cvv/)). O Folhinha não diagnostica nem substitui profissionais ou apoio humano.

Clicar fora ou usar o botão de minimizar recolhe o painel sem descartar a conversa. O prazo continua correndo minimizado. Dois minutos depois da última resposta do bot, sem nova pergunta do usuário, a conversa volta à saudação e às sugestões da página atual. Enquanto a resposta local está sendo preparada, o prazo fica suspenso. A conversa vive somente no estado React e se perde ao sair da sessão ou recarregar.

## Interface e acessibilidade

O widget tem layout próprio e usa tokens do tema para claro/escuro. Em telas pequenas fica acima da navegação inferior, respeita a área segura do dispositivo, não alarga a página e limita a altura do painel. Clique fora é detectado por `pointerdown`; a árvore do widget impede o fechamento em interações internas. Escape recolhe o painel e devolve o foco ao gatilho. O mascote reutiliza as animações do protótipo: piscada, balanço das folhas, sorriso, aceno, salto e faíscas ao passar o ponteiro; o estado de pensamento anima os pontos. O movimento respeita `prefers-reduced-motion`.

## Verificação

- `npm run check` e `npm run build`: aprovados.
- `npm test`: 87/87 testes aprovados, incluindo 5 cenários da busca local.
- Playwright no Edge: 13/13 casos aprovados em banco SQLite temporário. Inclui presença após login, sugestões e conversa, timeout minimizado de 2 minutos, teclado, hover com quatro faíscas e salto, tema escuro, movimento reduzido e 390/820/1440 px.
- Não foi feita validação com leitor de tela ou aparelho físico.


### Estados do mascote e lembrete de conversa

- Chat aberto: mascote inclinado, olhar atento e mão junto ao corpo, substituindo a interrogação.
- Conversa minimizada após uma pergunta respondida: aceno e balão “Sua conversa está aqui 🌱” por 2,8 segundos, imediatamente e a cada 10 segundos.
- Reabrir ou expirar a sessão de dois minutos cancela os lembretes; estes não renovam a sessão. Sem pergunta enviada, não há lembrete.
- Movimento reduzido preserva a pose e o texto sem animação. O balão não gera anúncios repetidos para leitores de tela.
- Automação: relógio controlado cobre repetição, intervalo sem balão, cancelamento ao abrir, histórico preservado e término após expiração.


### Continuidade e encerramento explícito

Após cada resposta, Folhinha pergunta “Precisa de mais alguma coisa?”. “Sim” mantém o histórico e foca o campo de texto; “Não, finalizar” reinicia a conversa, minimiza o painel e cancela o lembrete. O lembrete “Sua conversa está aqui 🌱” recebeu maior contraste, peso e sombra para se destacar sem cobrir ações da página. Verificar que a pergunta aparece apenas após uma resposta, que uma nova pergunta a reapresenta e que reabrir após finalizar mostra somente a saudação.


### Digitação, sugestões e palavras-chave

- O lembrete “Sua conversa está aqui 🌱” foi compactado, preservando o contraste.
- Ao enviar uma pergunta, três pontos animados indicam digitação por cerca de 0,8 s; a resposta entra suavemente. Movimento reduzido remove os efeitos.
- “Sim” em “Precisa de mais alguma coisa?” exibe três sugestões contextuais da página e mantém o campo de texto disponível.
- A busca local responde diretamente quando uma palavra-chave identifica uma única resposta confiável (por exemplo, “carga” em Treinos e “backup” em Ajustes). Termos ambíguos como “treino” ou “meta” oferecem opções; texto desconhecido mantém a resposta de limite. Resultados ambíguos priorizam a página atual.
- Cobertura: testes da busca para termos curtos e automação do indicador de digitação e das três sugestões após “Sim”.


### Despedida ao finalizar

Ao escolher “Não, finalizar”, o painel fecha, o Folhinha acena e mostra “Tchau, até logo! 👋” no mesmo balão compacto do lembrete. Após três segundos, o balão desaparece e o mascote retorna suavemente ao estado padrão. Reabrir durante a despedida a cancela. O teste de navegador cobre o aceno, o texto, o retorno ao estado padrão e a ausência de lembrete recorrente.
