import { useEffect, useState } from "react";
import { paginateRoutine, routinePageSizes, visibleRoutinePages } from "../routine-pagination";
import { ArchiveRestore, Clock3, Edit3, Heart, Leaf, Plus, Search, Sprout, Trash2 } from "lucide-react";
import { categories, isEssential, habitXp, weekdays } from "../lib";
import { CategoryIcon, Empty, Tag } from "../ui";
import { TutorialTrigger } from "../GuidedTutorial";
import type { PageProps } from "./types";
import { apiOperations } from "../api-operations";

export function RoutinePage(p: PageProps) {
  const [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
    [pageSize, setPageSize] = useState(10),
    [page, setPage] = useState(1);
  const habits = p.state.habits
    .filter(
      (h) =>
        h.archived === archived &&
        (category === "all" || h.category === category) &&
        h.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const pagination = paginateRoutine(habits, page, pageSize);
  useEffect(() => {
    setPage((current) => Math.min(current, pagination.totalPages));
  }, [pagination.totalPages]);
  return (
    <>
      <div className="page-intro" data-tutorial-target="routine-intro">
        <div>
          <h2>Uma rotina com a sua cara.</h2>
          <p>Comece com o que faz sentido. Ajuste conforme a vida acontece.</p>
        </div>
        <div className="tutorial-actions" data-tutorial-target="routine-create"><TutorialTrigger id="feature-routine" completed={p.completedTutorials.includes("feature-routine")} onStart={p.startTutorial} /><button className="button primary" onClick={p.addHabit}>
          <Plus size={17} /> Novo hábito
        </button></div>
      </div>
      <div className="routine-summary">
        <span className="routine-sprout">
          <Sprout size={32} strokeWidth={1.4} />
        </span>
        <div>
          <strong>
            {p.state.habits.filter((h) => !h.archived).length} hábitos para
            cultivar
          </strong>
          <p>Corpo, mente e bem-estar caminhando juntos.</p>
        </div>
        <div className="category-dots">
          {Object.keys(categories).map((c) => (
            <span
              key={c}
              className={categories[c as keyof typeof categories].color}
            >
              <CategoryIcon category={c as keyof typeof categories} />
            </span>
          ))}
        </div>
      </div>
      <div className="routine-tools" data-tutorial-target="routine-tools">
        <div className="filter-chips" aria-label="Filtrar área">
          <button
            className={category === "all" ? "selected" : ""}
            onClick={() => { setCategory("all"); setPage(1); }}
          >
            Todas as áreas
          </button>
          {Object.entries(categories).map(([id, c]) => (
            <button
              key={id}
              className={category === id ? "selected" : ""}
              onClick={() => { setCategory(id); setPage(1); }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Buscar hábito"
            placeholder="Buscar hábito"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </label>
      </div>
      <section className="panel routine-list" data-tutorial-target="routine-list">
        <div className="section-heading">
          <h3>{archived ? "Hábitos removidos" : "Seus compromissos"}</h3>
          <button
            className="text-button"
            onClick={() => { setArchived(!archived); setPage(1); }}
          >
            <ArchiveRestore size={15} />
            {archived ? "Ver hábitos ativos" : "Ver removidos"}
          </button>
        </div>
        <div className="routine-page-toolbar">
          <span role="status">
            {pagination.total ? `Exibindo ${pagination.first}–${pagination.last} de ${pagination.total} hábitos` : "Nenhum hábito nesta seleção"}
          </span>
          <label htmlFor="routine-page-size">
            Itens por página
            <select
              id="routine-page-size"
              value={pageSize}
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
            >
              {routinePageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>
        {habits.length ? (
          pagination.items.map((h) => (
            <div className="routine-row" key={h.id}>
              <span className={`category-tile ${categories[h.category].color}`}>
                <CategoryIcon category={h.category} />
              </span>
              <div className="routine-habit-text">
                <strong>
                  {h.title}{" "}
                  {isEssential(h) && (
                    <span className="essential-badge">Essencial</span>
                  )}
                </strong>
                <p>{h.description}</p>
                <div className="routine-schedule">
                  <Clock3 size={12} />
                  {h.time}
                  <span>·</span>
                  {h.days.length === 7
                    ? "Todos os dias"
                    : h.days.map((d) => weekdays[d]).join(", ")}
                  <span>·</span>
                  {habitXp(h)} XP
                </div>
              </div>
              <Tag category={h.category} />
              <div className="row-actions">
                {archived ? (
                  <button
                    className="button secondary compact"
                    onClick={() =>
                      p.mutate(
                        apiOperations.habit.update(h.id),
                        { ...h, archived: false },
                        "PUT",
                      )
                    }
                  >
                    <ArchiveRestore size={14} />
                    Restaurar
                  </button>
                ) : (
                  <>
                    <button
                      className="icon-button"
                      aria-label={`Editar ${h.title}`}
                      onClick={() => p.editHabit(h)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger-text"
                      aria-label={`Remover ${h.title}`}
                      onClick={() =>
                        p.confirm(
                          "Remover da rotina?",
                          `“${h.title}” deixará de aparecer a partir de hoje. Registros anteriores serão preservados. Você pode restaurá-lo em Ver removidos.`,
                          () =>
                            p.mutate(
                              apiOperations.habit.update(h.id),
                              { ...h, archived: true },
                              "PUT",
                            ),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <Empty
            icon={<Leaf size={28} />}
            title={
              archived ? "Nada removido por aqui." : "Nenhum hábito encontrado."
            }
          >
            {archived
              ? "Se você remover um hábito, poderá recuperá-lo aqui."
              : "Tente outra busca ou adicione um novo hábito."}
          </Empty>
        )}
        {pagination.totalPages > 1 && (
          <nav className="routine-pagination" aria-label="Páginas dos hábitos">
            <button type="button" className="routine-page-edge" disabled={pagination.page === 1} onClick={() => setPage(pagination.page - 1)}>Anterior</button>
            <div className="routine-page-numbers">
              {visibleRoutinePages(pagination.page, pagination.totalPages).map((number) => (
                <button
                  type="button"
                  key={number}
                  aria-label={`Página ${number}`}
                  aria-current={number === pagination.page ? "page" : undefined}
                  onClick={() => setPage(number)}
                >{number}</button>
              ))}
            </div>
            <span className="routine-page-position">Página {pagination.page} de {pagination.totalPages}</span>
            <button type="button" className="routine-page-edge" disabled={pagination.page === pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>Próxima</button>
          </nav>
        )}
      </section>
      <div className="soft-note">
        <Heart size={17} />
        <span>
          A rotina é uma ferramenta para cuidar de você. Edite sem culpa quando
          precisar.
        </span>
      </div>
    </>
  );
}

