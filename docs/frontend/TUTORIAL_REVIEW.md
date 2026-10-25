# Tutoriais guiados contextuais

## Escopo implementado

`src/tutorials.ts` guarda 18 guias curtos: um por cada uma das nove páginas e outro para o fluxo principal de cada página. Os IDs são estáveis e os passos apontam a atributos `data-tutorial-target`, sem selecionar classes de layout. `src/GuidedTutorial.tsx` fornece gatilho, destaque não modal, balão e navegação. `src/tutorials.css` segue os tokens existentes e reduz movimento quando `prefers-reduced-motion` está ativo.

Os guias nunca iniciam sozinhos, não exigem interação com o alvo e não chamam API, mutação nem formulário. Voltar/Próximo apenas percorrem a explicação. Pular, Escape, fechar, trocar página ou perder um alvo encerram sem marcar conclusão. Concluir grava apenas IDs conhecidos em `ritmo:guided-tutorials:v1` no navegador. O estado em memória continua utilizável se localStorage estiver indisponível. Concluídos permanecem reabríveis.

O acesso geral **Guia da página** fica no cabeçalho da página; guias de hidratação, rotina, peso, treino, alimentação, diário, foco, revisão e backup também têm acesso junto ao respectivo fluxo. “Como funciona” e o boas-vindas após criação da conta não foram substituídos.

## Verificação

- `npm run check`: aprovado.
- `npm run build`: aprovado.
- `node --experimental-strip-types --test tests/tutorials.test.mjs`: 5/5 aprovados (IDs/páginas, alvos existentes, persistência/reabertura, armazenamento bloqueado e ausência de mutações no componente).
- Playwright na instância aberta em `localhost:3000`: ela ainda entrega um bundle anterior ao build atual (não contém `.tutorial-trigger`). A tentativa em instância sintética alternativa na porta 3102 atingiu timeout no navegador integrado, embora o servidor Node tenha iniciado localmente. Não foram alterados dados de usuário. Reexecutar verificação visual ao reiniciar a instância padrão com o build atual: início, voltar/próximo, pular, concluir/reabrir, navegação, tema claro/escuro, 390px, teclado e movimento reduzido.

## Estado e limites

O catálogo cobre as nove páginas e os fluxos diários planejados. O tutorial não faz onboarding automático. A conclusão é local ao navegador e não entra no backup, banco ou API. Um alvo que não renderiza é encerrado com segurança; em páginas lazy, abra o guia após a página terminar de carregar.
