# Entrada no espaço pessoal — 1.5.0

Entrega local em 23/10/2026. Preserva a identidade aprovada: musgo `#214e45`, marca clara, Manrope/DM Sans e um broto SVG. Sem canvas, biblioteca de animação ou alterações no banco.

## Fluxo

1. Envio: bloqueio contra submissão duplicada, anel fino no botão, campos com opacidade e blur discreto.
2. Autenticação confirmada: o estado do painel começa a carregar enquanto duas superfícies verdes se expandem a partir das metades do login. No celular, a fusão é vertical.
3. Marca traçada por `stroke-dashoffset`, broto e boas-vindas com fade/subida de 8px. A frase usa a hora local do dispositivo: antes de 12h, manhã; antes de 18h, tarde; depois, noite.
4. Dados prontos: instala o estado e a autenticação juntos, abre `#hoje` e dissolve a superfície sobre o painel. Não passa pela tela genérica de carregamento. Menu e seções entram em intervalos de 60ms.
5. Ao retirar `inert`, foca `#main-content`. A primeira criação de conta mantém o onboarding existente, aberto somente após a transição.

## Durações e edição

- `src/entry-sequence.ts`: tempos, limites e frases por horário. `entryHold` calcula apenas a espera artificial ainda necessária.
- `src/EntryTransition.tsx`: SVG e texto principal “Bom ter você de volta.”; hook coordena dados e sequência.
- `src/entry-transition.css`: desenho, fusão, broto, dissolve e stagger. Ajustar `--entry-dissolve`/`--entry-stagger` junto com os valores TS.
- Estado recebido em menos de 650ms: sequência encurtada para 1300ms + 400ms de dissolve. No preview com autenticação simulada de 200ms, total medido de 1,9s.
- Demais respostas: mínimo de 1800ms + 400ms; preview normal medido em 2,4s incluindo autenticação.
- Resposta acima de 1800ms: traço continua suavemente em loop; não há espera adicional após os dados, apenas o dissolve de 400ms. Latência de rede não é espera artificial. Preview com 3,8s de dados terminou em 4,4s incluindo autenticação e dissolve.
- `prefers-reduced-motion`: sem fusão, deslocamento, desenho, broto ou espera artificial. Mantém anúncio acessível e aplica somente fade de 200ms ao painel pronto.

## Falhas e segurança

Senha incorreta não abre a transição: erro inline e tremor horizontal de 300ms, desativado com movimento reduzido. Falha ao carregar o painel desfaz a superfície e libera nova tentativa, preservando os campos. O login real continua no servidor com as mesmas regras de conta única e sessão.

Se a criação da conta for confirmada, mas o painel falhar, o formulário passa a entrada de conta existente. A próxima tentativa usa login, sem repetir o cadastro já reservado. Esse ramo foi verificado com respostas de setup/estado simuladas e uma tentativa posterior de login real no banco de QA.

O preview injeta funções simuladas somente na sua entrada separada. Não autentica uma sessão real, não lê dados pessoais e não grava hábitos. A interface simulada não é um segundo dashboard funcional. O tema usa a mesma preferência local do app, portanto alterná-lo no preview também altera a preferência deste navegador.

## Preview

Executar o servidor normalmente e abrir `/transition-preview.html`. O HTML é uma segunda entrada do Vite e funciona também no build de produção. Não abrir via `file://`.

Controles: repetir, horário, tema e cenários rápido/normal/lento/erro de login/erro do painel. Para movimento reduzido, usar a configuração do sistema ou emulação do navegador.

## Verificação realizada

- `npm run build`: aprovado (TypeScript + Vite, incluindo as duas entradas).
- `npm test`: 53 testes aprovados, incluindo limites de horário e cálculo de espera sem atraso extra em respostas lentas.
- Playwright/Chromium contra instância isolada, banco fictício e porta 3002: criação de conta, onboarding, saída, senha incorreta, login correto e foco final.
- Resposta real de `/api/state` atrasada artificialmente por 3,4s: loop durante a espera, painel interativo e foco ao concluir.
- Resposta 503 simulada em `/api/state`: erro inline, nenhuma superfície presa; nova tentativa com sucesso.
- Preview: repetições, todas as três frases, cenários de latência e falhas; nenhum novo fluxo de autenticação real.
- Inspeção visual em 1440×900 e 390×844; temas claro/escuro; sem overflow horizontal nos estados verificados. Capturas somente de dados fictícios, fora do Git.
- Movimento reduzido: fade computado de 0,2s e nenhuma animação nos filhos do painel; foco confirmado.

Limites: testes realizados em Chromium, não em Safari/Firefox ou aparelho físico. O anúncio `aria-live` foi verificado no DOM, não com leitor de tela real. O arquivo do Figma não foi atualizado neste lote. Sem commit/push nesta entrega.
