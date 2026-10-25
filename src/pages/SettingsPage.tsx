import { useRef } from "react";
import backupLimits from "../../shared/backup-limits.json";
import { AppearanceSettings } from "../Theme";
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, Heart, LockKeyhole, ShieldCheck, Target } from "lucide-react";
import { downloadBackup } from "../lib";
import { PasswordForm, SettingsForm } from "../forms";
import { TutorialTrigger } from "../GuidedTutorial";
import type { PageProps } from "./types";
import { apiOperations } from "../api-operations";

export function SettingsPage(p: PageProps) {
  const file = useRef<HTMLInputElement>(null);
  async function importFile(f: File) {
    if (f.size > backupLimits.maxImportBytes) {
      p.dialog({
        title: "Arquivo muito grande",
        children: (
          <p className="dialog-body">
            Escolha um backup do Ritmo com até {backupLimits.maxImportLabel}.
          </p>
        ),
      });
      return;
    }
    try {
      const data = JSON.parse(await f.text());
      p.confirm(
        "Restaurar este backup?",
        `Seus hábitos, metas e registros atuais serão substituídos pelos dados do arquivo “${f.name}”. Exporte uma cópia antes de continuar. Seu login e sua senha não serão alterados.`,
        () => p.mutate(apiOperations.backup.import, data),
      );
    } catch {
      p.dialog({
        title: "Não foi possível abrir o backup",
        children: (
          <p className="dialog-body">
            Escolha um arquivo JSON exportado pelo Ritmo.
          </p>
        ),
      });
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <h2>Seu espaço, suas escolhas.</h2>
          <p>Ajuste as metas para a vida que você está construindo.</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="panel settings-form" data-tutorial-target="settings-form">
          <div className="section-heading">
            <div>
              <h3>Perfil e metas</h3>
              <p>As alterações valem para hoje e para os próximos dias.</p>
            </div>
            <Target size={20} />
          </div>
          <SettingsForm settings={p.state.settings} mutate={p.mutate} />
        </section>
        <aside className="settings-aside">
          <AppearanceSettings />
          <section className="panel backup-card" data-tutorial-target="settings-backup">
            <TutorialTrigger id="feature-backup" completed={p.completedTutorials.includes("feature-backup")} onStart={p.startTutorial} />
            <span className="category-tile blue">
              <ShieldCheck size={22} />
            </span>
            <h3>Cuide da sua história.</h3>
            <p>
              Exporte uma cópia com hábitos, metas, treinos e registros. O
              arquivo contém informações pessoais de saúde: guarde em um lugar
              seguro.
            </p>
            <button className="button secondary" onClick={downloadBackup}>
              <ArrowDownToLine size={16} />
              Exportar backup
            </button>
            <button
              className="button ghost"
              onClick={() => file.current?.click()}
            >
              <ArrowUpFromLine size={16} />
              Restaurar backup
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Arquivo de backup"
              onChange={(e) => {
                if (e.target.files?.[0]) void importFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </section>
          <section className="panel">
            <span className="category-tile purple">
              <LockKeyhole size={21} />
            </span>
            <h3>Seu acesso pessoal</h3>
            <p className="muted">
              Uma conta exclusiva, com senha protegida e sessões privadas.
            </p>
            <button
              className="button secondary"
              onClick={() =>
                p.dialog({
                  title: "Alterar minha senha",
                  children: (
                    <PasswordForm
                      mutate={p.mutate}
                      onClose={() => p.dialog(null)}
                    />
                  ),
                })
              }
            >
              <LockKeyhole size={15} />
              Alterar senha
            </button>
          </section>
          <section className="health-note">
            <Heart size={21} />
            <h3>Saúde antes da pontuação.</h3>
            <p>
              O plano inicial é um ponto de partida editável. Acompanhe a
              testosterona relatada com um médico; um resultado isolado não
              confirma deficiência.
            </p>
            <p>
              Um hemograma não mede testosterona. Leve o laudo com unidade,
              horário da coleta e sintomas à consulta.
            </p>
            <a
              href="https://www.endocrine.org/clinical-practice-guidelines/testosterone-therapy"
              target="_blank"
              rel="noreferrer"
            >
              Orientação da Endocrine Society
              <ArrowUpRight size={14} />
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}

