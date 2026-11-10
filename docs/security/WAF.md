# Proteção contra abuso de requisições

## Estado da implementação

O servidor tem limitadores locais anteriores à leitura dos corpos JSON: 120 requisições/minuto por endereço de cliente, com rajada de até 30; e 40 operações de escrita/minuto, com rajada de até 10. A restauração de backup permite uma operação por minuto e apenas uma restauração em andamento. O login conta somente respostas de credenciais inválidas: até 10 falhas por endereço em 15 minutos. As respostas 429 incluem `Retry-After` e JSON. Limites ficam em memória e servem como proteção complementar para a instância única com SQLite.

`RITMO_TRUST_PROXY_HOPS` é opcional e não deve ser definido na instalação local. Na hospedagem, configure o número exato de proxies confiáveis somente depois de restringir a origem ao Cloudflare ou usar Cloudflare Tunnel. O Express alerta que confiar na cadeia de proxies sem corresponder à topologia real pode permitir IPs encaminhados incorretamente. [Express: atrás de proxies](https://expressjs.com/en/guide/behind-proxies/)

## Configuração de borda pendente

Não há zona, domínio ou credenciais de Cloudflare neste repositório; não foi aplicada nenhuma regra no painel. Antes de publicar:

1. Ative a proteção DDoS e as regras gerenciadas disponíveis no plano escolhido.
2. Coloque regras personalizadas em observação e confira o tráfego real antes de bloquear.
3. Configure limites para `/api/*` com as mesmas referências iniciais do servidor: até 120 req/min por IP no geral e 40 req/min para métodos `POST`, `PUT`, `PATCH` e `DELETE`. Não some bloqueios baixos independentes que tornem o uso normal mais restritivo.
4. Para login, use o limite da aplicação baseado em falhas; uma regra de borda pode servir como teto contra rajada, mas não deve contar cada login bem-sucedido como falha.
5. Use resposta 429 legível e `Retry-After` se o plano permitir. Não aplique CAPTCHA ao fluxo normal nem regras de bloqueio geográfico.
6. Feche o acesso direto à origem no firewall ou use Tunnel; confirme que apenas o tráfego encaminhado passa. Só então defina `RITMO_TRUST_PROXY_HOPS` para a topologia real.
7. Monitore falsos positivos, 429, 5xx, latência, CPU, memória e contenção do SQLite. Não registre dados do corpo, cookies, tokens ou senhas.

Rate limiting na borda pode levar alguns segundos para ser aplicado, portanto não substitui proteção do provedor contra saturação volumétrica. [Cloudflare: rate limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/). Limites de tamanho, tempo e concorrência também protegem recursos de operações caras. [OWASP: DoS](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

## Testes

- `tests/rate-limit.test.mjs`: buckets geral/escrita, retry header, falha de login, expiração e concorrência/frequência do backup.
- `tests/api-error.test.mjs` e `tests/toast-feedback.test.mjs`: `Retry-After` em segundos e data HTTP, resposta não JSON, toast de cinco segundos e regressão de erros não 429.
- `automation-ritmo/tests/ritmo.spec.ts`: gravação simulada 429 em 1440px e 390px; mensagem, prazo, formulário preservado, fechamento e ausência de retry automático.

Os testes do servidor e navegador usam bancos temporários. A desativação de limites é permitida somente com `NODE_ENV=test`, `RITMO_TEST_RATE_LIMITS=off` e `RITMO_DB` dentro da pasta temporária do sistema.
