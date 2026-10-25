# Despedida do espaço pessoal — 1.6.0

Implementada e validada em 24/10/2026. Reutiliza `TransitionBrand`, a tipografia e os tokens da entrada. Sem biblioteca adicional ou alteração do banco.

## Comportamento

- Cards saem em ordem inversa, com intervalo de 60ms. O app recua para escala 0,98 e esmaece.
- Círculo verde nasce no centro; marca se apaga, folhas se recolhem e brilho diminui. “Até logo.” e a promessa de privacidade aparecem em fade.
- A coreografia termina por volta de 1,8s e há aproximadamente 1,2s de pausa. A janela real de cancelamento é de **3s**, portanto o fluxo completo não cabe em 2s: depois dela há requisição de logout e dissolve de 400ms (200ms em movimento reduzido).
- Voltar/Escape durante a janela cancela sem chamar a API. Conteúdo e rascunhos permanecem montados, bloqueados temporariamente com `inert`; o retorno restaura o foco.
- Rascunhos de página usam a proteção existente e perguntam “Você tem alterações não salvas. Sair mesmo assim?”. Confirmar ainda permite voltar durante a despedida. Gravação em andamento impede iniciar logout.
- Só após a janela o servidor recebe `POST /api/logout`. Estado privado é limpo após confirmação. Resposta perdida consulta `/api/auth`; sem confirmação, a interface permanece coberta com nova tentativa, sem falsa mensagem de sessão encerrada.
- Login reaparece sem conteúdo privado. Foco retorna a Login após retirar `inert`. A despedida usa `aria-live="polite"`.
- Movimento reduzido remove círculo, escala, traçado e folhas, mantendo fades de 200ms e os 3s para cancelar.

## Arquivos configuráveis

- `src/exit-sequence.ts`: janela de cancelamento, tempos reaproveitados da entrada e confirmação de revogação (POST com limite de 10s; consulta posterior com limite de 5s).
- `src/ExitTransition.tsx`: fases, foco, SVG compartilhado e textos comentados.
- `src/exit-transition.css`: movimento e estados finais. A área do status mantém altura reservada para evitar deslocamento ao receber a resposta.
- `src/App.tsx` e `src/Auth.tsx`: integração com sessão, rascunhos e foco.
- `logout-preview.html` / `src/logout-preview.tsx`: demonstração isolada incluída no build. Usa dados fictícios; a preferência de tema pertence ao mesmo navegador.

## Verificação

- Build TypeScript/Vite aprovado; 56 testes automatizados aprovados, incluindo limite de cancelamento, revogação, sessão já expirada, resposta perdida e falha de rede.
- Playwright/Chromium em banco de QA separado: voltar enviou zero requisições de logout; sessão confirmada ativa durante a despedida; POST observado após aproximadamente 3,1s; sessão encerrada e `.app-shell` removido ao final.
- Diário real de QA: confirmação, retorno com rascunho intacto e nova tentativa de saída.
- Falha 503 simulada: mensagem de erro, app inerte/coberto; nova tentativa encerrou a sessão e focou Login.
- Preview: confirmação/cancelamento, rascunho preservado, foco restaurado, despedida até Login; inspeção visual móvel em 390×844 no tema escuro sem overflow horizontal.
- Movimento reduzido em tema claro: fade computado de 0,2s, nenhuma animação de círculo ou traço, foco em Login.

Limites: validação em Chromium, não em Safari/Firefox, leitor de tela real ou aparelho físico. As capturas contêm apenas dados fictícios e ficam fora do Git. Nenhum commit/push nem atualização do Figma neste lote.
