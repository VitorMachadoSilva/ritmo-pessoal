# Mensagem do dia

O espaço central do cabeçalho da Visão geral exibe uma mensagem original curta, entre aspas, sem caixa ou cartão. A coleção está em `src/daily-words.ts` e contém 200 textos em português brasileiro. Não são citações de autores nem recomendações médicas.

A escolha usa a data real no fuso configurado em Ajustes, sem depender do dia histórico selecionado no calendário. Ela permanece igual ao recarregar e muda depois da meia-noite local (o relógio da interface atualiza a cada 30 segundos). A permutação usa todas as 200 mensagens antes de repetir; não envia dados a um serviço externo.

O tom foi orientado por recomendações públicas de começar com passos pequenos e sustentáveis e de considerar atividade física, alimentação, sono e manejo do estresse como partes do cuidado. As mensagens foram escritas para o Ritmo, sem copiar trechos dessas fontes:

- [OMS — atividade física](https://www.who.int/initiatives/behealthy/physical-activity/)
- [CDC — encaixar um novo hábito na vida](https://www.cdc.gov/diabetes/prevention-type-2/new-healthy-habits.html)
- [CDC — cuidar do corpo](https://www.cdc.gov/howrightnow/taking-care/index.html)

Verificação específica: `node --experimental-strip-types --test tests/daily-words.test.mjs` cobre contagem, unicidade, virada de dia, fuso e ciclo de 200 dias.
