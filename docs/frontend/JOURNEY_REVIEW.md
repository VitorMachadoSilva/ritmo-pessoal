# Revisão da jornada diária — 1.4.0

## Decisão de produto

O botão **Continuar meu dia** abre o primeiro hábito pendente sem registro em ordem de horário. Se só restarem registros abaixo da meta, abre o primeiro para revisão. A janela apresenta `Hábito n de N` e setas para percorrer todos os hábitos previstos; as setas não completam atividades. Ao salvar, avança ao próximo incompleto depois do atual, voltando ao início da lista se necessário. Se não existir outro, fecha.

Para água, sono e contadores, `0 < valor < meta` é um registro válido, mas não uma conclusão: exibir **Meta não atingida · 0 XP**. A porcentagem diária continua a contar a fração atingida, regra já existente; XP só é concedido com a meta integral. Zero limpa o registro. A cópia evita tratar a pessoa como uma falha.

## Estados e acessibilidade

- Entrada numérica aceita vírgula ou ponto para sono, até duas casas decimais, de 0 a 24 horas. Água e demais contadores exigem inteiros, nos limites do servidor. Entrada vazia, fora do intervalo ou malformada mostra erro inline e não envia a requisição.
- Rascunho alterado pede confirmação antes de navegar, editar, remover ou fechar. Falha de rede conserva o valor e a posição.
- Anel numérico e segmentos interpolam a mudança real em 650 ms; o nome acessível informa imediatamente o valor final. A preferência de movimento reduzido e aba oculta usam atualização imediata.
- O estado parcial é expresso por texto e não apenas por cor. Os botões de navegação têm nomes acessíveis e ficam desativados nas extremidades.

## Verificação desta entrega

- `npm run build` e `npm test`: 51 testes aprovados.
- Navegador em banco sintético isolado: 19 hábitos em sequência horária; 6,5 horas salvas, exibidas como meta não atingida e avanço ao próximo; rascunho protegido; valor vazio e 26 horas rejeitados; falha de API manteve 6,25 horas digitadas; anel observado em 4 → 9 → 10% e movimento reduzido em 10 → 15% sem interpolação.
- Layout verificado em 320, 390, 768 e 1280 px, inclusive escuro, sem transbordamento horizontal.

Não foram usados registros pessoais no teste. O Figma de referência anterior não foi sincronizado nesta entrega; o código é a referência atual. Não houve commit ou push.

## Correção visual — 23/10/2026

O piscar ao usar Anterior/Próximo vinha da remontagem do diálogo inteiro: painel e camada escura reiniciavam suas animações em cada hábito. Agora o diálogo permanece montado, enquanto apenas o conteúdo do hábito troca; o controle de rascunho é reiniciado pela identidade do novo hábito.

Ao registrar água, a requisição local terminava em cerca de 57 ms, mas o estado global de salvamento desativava e reduzia a opacidade de dezenas de controles nesse intervalo. O indicador global agora só aparece se a gravação ultrapassar 180 ms, mantendo o bloqueio imediato de requisições duplicadas. Nos controles do painel, uma gravação lenta mantém a aparência estável mesmo quando os botões ficam temporariamente desativados.

QA em banco fictício: modal e overlay preservaram a identidade após três avanços; rascunho continuou protegido e descartável; registro rápido de água não alternou o estado visual dos botões; com 520 ms de latência simulada, o botão permaneceu desativado e com opacidade 1 durante a gravação. `npm run build` e 51 testes aprovados.
