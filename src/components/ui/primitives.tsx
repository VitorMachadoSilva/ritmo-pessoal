import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Droplets, Moon, Dumbbell, Brain, Utensils, Heart } from "lucide-react";
import type { Category } from "../../types";
import { categories } from "../../lib";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand ${small ? "small" : ""}`}>
      <svg width="37" height="37" viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="currentColor" />
        <path
          d="M13 31V19a5 5 0 0 1 10 0v10a5 5 0 0 0 10 0V17"
          fill="none"
          stroke="#e1edbd"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      {!small && (
        <span>
          ritmo<span className="brand-dot">.</span>
        </span>
      )}
    </div>
  );
}
export function CategoryIcon({
  category,
  size = 18,
}: {
  category: Category;
  size?: number;
}) {
  const Icon = {
    agua: Droplets,
    sono: Moon,
    corpo: Dumbbell,
    mente: Brain,
    alimentacao: Utensils,
    emocional: Heart,
  }[category];
  return <Icon size={size} strokeWidth={1.8} />;
}
export function Tag({ category }: { category: Category }) {
  return (
    <span className={`tag ${categories[category].color}`}>
      <i />
      {categories[category].label}
    </span>
  );
}
export function Empty({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
  className = "",
  draftKey,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
  draftKey?: string;
}) {
  const previous = useRef<HTMLElement | null>(
    document.activeElement as HTMLElement,
  );
  const changed = useRef(false);
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    changed.current = false;
    setDiscard(false);
  }, [draftKey]);
  const requestClose = () => (changed.current ? setDiscard(true) : onClose());
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (changed.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  return (
    <>
      <Dialog.Root
        open
        onOpenChange={(v) => {
          if (!v) requestClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className={`modal ${wide ? "wide" : ""} ${className}`.trim()}
            {...(description ? {} : { "aria-describedby": undefined })}
            onChangeCapture={() => {
              changed.current = true;
            }}
            onClickCapture={(event) => {
              const target = (event.target as HTMLElement).closest("button");
              if (
                target &&
                (target.hasAttribute("aria-pressed") ||
                  target.hasAttribute("data-draft-change"))
              )
                changed.current = true;
              // Form cancel buttons use their existing callbacks; guard before they can unmount.
              if (
                target?.hasAttribute("data-close-dialog") &&
                changed.current
              ) {
                event.preventDefault();
                event.stopPropagation();
                setDiscard(true);
              }
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              previous.current?.focus();
            }}
          >
            <div className="modal-heading">
              <div>
                <Dialog.Title>{title}</Dialog.Title>
                {description && <Dialog.Description>{description}</Dialog.Description>}
              </div>
              <Dialog.Close className="icon-button" aria-label="Fechar janela">
                <X size={20} />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {discard && (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open) setDiscard(false);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="modal-overlay discard-overlay" />
            <Dialog.Content className="modal discard-modal">
              <Dialog.Title>Descartar alterações?</Dialog.Title>
              <Dialog.Description>
                Há alterações nesta janela que ainda não foram salvas. Você pode
                continuar editando ou descartá-las.
              </Dialog.Description>
              <div className="modal-actions">
                <button
                  className="button secondary"
                  onClick={() => setDiscard(false)}
                  autoFocus
                >
                  Continuar editando
                </button>
                <button
                  className="button danger"
                  onClick={() => {
                    changed.current = false;
                    onClose();
                  }}
                >
                  Descartar alterações
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}

