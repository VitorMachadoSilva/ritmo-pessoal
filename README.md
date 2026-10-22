# Ritmo pessoal

Aplicação web pessoal para organizar hábitos, alimentação, exercícios e bem-estar. Conta única, com dados persistidos localmente em SQLite.

## Funcionalidades

- Rotina editável, com horários, recorrência e registros diários.
- Hidratação, sono, passos, peso, energia e diário de humor.
- Treinos com exercícios, séries, repetições e cargas.
- Planejamento de refeições e metas ajustáveis.
- XP, níveis, conquistas, sequências e calendário de consistência.
- Login exclusivo, backup e restauração.
- Interface responsiva em português, com fontes locais.

## Executar

Requer **Node.js 22.13+**. Validado com Node.js 24.15.

```sh
npm ci
npm run build
npm start
```

Abra **http://localhost:3000**. No primeiro acesso, crie seu login e senha. Depois, novos cadastros ficam bloqueados. No Windows, também é possível usar `Iniciar-Ritmo.cmd`.

```sh
npm run dev   # desenvolvimento
npm test      # 15 verificações automatizadas
npm run check # TypeScript
```

## Configuração e dados

Copie `.env.example` para `.env` para personalizar a porta, o endereço de escuta ou o caminho do banco.

O diretório `data/` guarda os dados pessoais e não é versionado. Arquivos de ambiente, backups, capturas de teste e dependências também ficam fora do repositório. Para transferir seus registros, exporte um backup em **Ajustes**. O backup não contém a conta ou a senha.

Para recuperar o acesso com permissão local no computador, execute `npm run recover`.

## Hospedagem

A aplicação precisa de um servidor Node.js, HTTPS e disco persistente para SQLite. A versão local escuta apenas em `127.0.0.1`. Crie a conta antes de expor o serviço à internet. O projeto não é um site estático.

Consulte [LEIA-ME.md](./LEIA-ME.md) para instruções completas, backup, recuperação de senha, funcionamento da pontuação e configuração da hospedagem.

## Tecnologias

React · TypeScript · Vite · Express · SQLite · Radix UI · Recharts
