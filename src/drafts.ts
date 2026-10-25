import { useEffect } from "react";

export function usePageDraft(dirty: boolean) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("journal-dirty", { detail: dirty }));
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.dispatchEvent(new CustomEvent("journal-dirty", { detail: false }));
    };
  }, [dirty]);
}
