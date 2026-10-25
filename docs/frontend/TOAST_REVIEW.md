# Revisão de feedback por toast — 24/10/2026

## Problema observado

`mutate()` mostrava a mesma mensagem de sucesso para toda requisição, mesmo em ações rápidas de interface. Trocar entre **Rotina completa** e **Dia essencial** persistia corretamente, mas não precisava interromper o fluxo com um toast. Erros, por sua vez, exibiam só o texto bruto, sem explicar qual ação falhou nem como recuperar.

## Comportamento atualizado

- `src/toast-feedback.ts` centraliza a decisão por endpoint e ação. O sucesso só é anunciado após a API confirmar a gravação.
- Alternar modo do dia e energia fica silencioso quando salvo; se falhar, há alerta contextual e o estado anterior permanece.
- Água, peso, diário, hábitos, refeições, fichas, treinos do dia, foco, revisões, ajustes, senha e backup têm confirmação própria. XP aparece como conquista separada; remoções e ajustes sem XP usam tom informativo.
- Erros têm título orientado à ação, detalhe retornado pela API e recuperação compatível com o fluxo (por exemplo, formulário permanece aberto, estado anterior continua selecionado ou sessão não muda).
- Tom de sucesso usa `role=status`; erro usa `role=alert`. Erros ficam 9s, conquistas 5s e avisos/sucessos 3,6s, todos podem ser fechados.
- O formulário de hábito diferencia edição e restauração usando o estado anterior, para não chamar uma edição normal de restauração.

## Verificação

- `node --experimental-strip-types --test tests/toast-feedback.test.mjs`: **5/5 casos aprovados** (modo silencioso, energia silenciosa, água, XP, ações específicas, erro contextual e preservação/recovery).
- `npm run build`: aprovado após corrigir incompatibilidade de tipo no classificador de ação.
- Playwright em sessão autenticada: alternar para Rotina completa não exibiu toast e a seleção anterior foi restaurada ao Dia essencial; falha 500 simulada exibiu `role=alert`, título “Não foi possível mudar o ritmo do dia” e explicou que o modo anterior foi mantido. Nenhuma alteração de estado foi gravada durante a simulação de erro.
- Playwright: sucesso de água com resposta da API simulada exibiu `role=status` e “Água registrada · 250 ml adicionados”; nenhum registro foi escrito no servidor.

## Limites

Não foram forçadas falhas de cada endpoint individualmente. A classificação cobre os endpoints de mutação existentes; mensagens de validação específicas retornadas pelo servidor permanecem visíveis no detalhe do toast. A persistência de ações de rotina continua sob responsabilidade dos testes/fluxos existentes, sem mudança de regra neste lote.
