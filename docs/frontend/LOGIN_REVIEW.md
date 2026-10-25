# Revisão da entrada — 1.3.0

## Decisão

O acesso continua reservado a uma conta. A tela inicial permite criar essa conta uma vez; depois só há entrada, troca de senha autenticada e recuperação por comando local. O link de recuperação explica `npm run recover`, sem endpoint público de redefinição. Não foi acrescentado um link de cadastro depois da configuração.

O formulário mostra foco, erro inline com texto e ícone, espera e sucesso. Caps Lock é detectado no campo de senha. O checkbox de sete dias é opt-in; desmarcado, o cookie é de sessão e o registro no servidor expira em 12 horas. Marcado, o cookie e o registro duram sete dias. Ambos são HttpOnly e SameSite Strict; a proteção Secure depende de HTTPS configurado. Logout revoga o token e a troca de senha revoga todas as sessões anteriores. Navegadores que restauram a sessão podem restaurar cookies de sessão, mas o limite de 12 horas no servidor permanece.

A planta SVG responde à presença de login e senha, enquanto espera e sucesso têm estágios próprios. É uma indicação visual de preenchimento, não avaliação da senha nem conquista de hábitos. Órbitas e cards se movem lentamente, com botão de pausa, pausa ao ocultar a aba e `prefers-reduced-motion`. O mobile reduz o hero e desliga o movimento contínuo. Sem canvas, partículas, carrossel ou dependência nova.

## Verificação

- `npm run build` e `npm test` em base de integração temporária, incluindo atributos do cookie, duração no banco, expiração, logout e tipo inválido de `remember`.
- Playwright MCP com banco fictício isolado: configuração e erro de confirmação, planta nos estágios de login/senha, saída, login incorreto genérico, senha visível/oculta, Caps Lock simulado, modal de recuperação e foco restaurado, espera no botão, sessão persistente de sete dias e sucesso.
- Layout inspecionado em 906px desktop, 390px e 320px mobile, temas claro/escuro e movimento reduzido. Sem rolagem horizontal nos mobiles testados. O navegador bloqueia envio com campo obrigatório vazio e foca o campo.

## Limites

- Caps Lock foi verificado por evento de teclado sintético no navegador automatizado; o estado físico do teclado deve ser observado em uso real.
- O comando de recuperação só foi inspecionado; não foi executado contra a base pessoal. Hospedagem pública, reset remoto e sincronização Figma não fazem parte desta revisão.
- A limitação de backup de 5 MB, registrada em `LEIA-ME.md`, permanece uma pendência independente.
