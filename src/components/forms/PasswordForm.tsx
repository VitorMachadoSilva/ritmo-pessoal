import { useState } from "react";
import type { Mutation } from "../../types";
import { FormActions } from "./FormActions";
import { apiOperations } from "../../api-operations";

export function PasswordForm({
  mutate,
  onClose,
}: {
  mutate: Mutation;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="stack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        if (d.get("password") !== d.get("confirm")) {
          setError("As novas senhas precisam ser iguais.");
          return;
        }
        setBusy(true);
        if (
          await mutate(apiOperations.password.update, {
            current: d.get("current"),
            password: d.get("password"),
          })
        )
          onClose();
        setBusy(false);
      }}
    >
      <label>
        Senha atual
        <input
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <label>
        Nova senha
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </label>
      <label>
        Confirmar nova senha
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="field-help">
        As outras sessões serão encerradas. Sua sessão atual continuará ativa.
      </p>
      <FormActions busy={busy} onCancel={onClose} submitLabel="Salvar nova senha" />
    </form>
  );
}

