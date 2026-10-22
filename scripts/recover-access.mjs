import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Local machine access is required; no unauthenticated recovery route is exposed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = process.env.RITMO_DB || path.join(root, "data", "ritmo.sqlite");
if (!existsSync(dbPath)) {
  console.error(
    "Nenhuma conta local foi criada ainda. Abra o aplicativo para criar seu acesso.",
  );
  process.exit(1);
}
const db = new DatabaseSync(dbPath);
const owner = db.prepare("SELECT username FROM owner WHERE id=1").get();
if (!owner) {
  console.error("Nenhuma conta foi criada.");
  db.close();
  process.exit(1);
}
const rl = createInterface({ input: stdin, output: stdout });
console.log(`Recuperação local da conta: ${owner.username}`);
const answer = await rl.question(
  "Redefinir a senha e encerrar todas as sessões? Digite REDEFINIR: ",
);
rl.close();
if (answer !== "REDEFINIR") {
  console.log("Nenhuma alteração realizada.");
  db.close();
  process.exit(0);
}
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(32).toString("hex");
db.prepare("UPDATE owner SET salt=?,hash=? WHERE id=1").run(
  salt,
  scryptSync(password, salt, 64).toString("hex"),
);
db.exec("DELETE FROM sessions");
db.close();
console.log(
  `Login: ${owner.username}\nSenha temporária: ${password}\nEntre e altere a senha em Ajustes. Guarde-a antes de fechar este terminal.`,
);
