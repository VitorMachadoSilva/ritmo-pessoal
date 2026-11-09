import { useEffect } from "react";
import { Logo } from "./ui";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Página não encontrada · Ritmo";
    return () => { document.title = "Ritmo — seu dia, em movimento"; };
  }, []);

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-content">
        <Logo small />
        <div className="not-found-mark" aria-hidden="true">
          <span>4</span>
          <span className="not-found-orbit"><span className="not-found-satellite" /></span>
          <span>4</span>
        </div>
        <h1 id="not-found-title">Esta página não foi encontrada.</h1>
        <p>O endereço pode estar incorreto ou a página não está disponível.</p>
        <a className="button primary" href="/">Voltar para Hoje</a>
      </div>
    </main>
  );
}
