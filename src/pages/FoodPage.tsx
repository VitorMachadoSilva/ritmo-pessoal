import { ArrowUpRight, Check, Edit3, Leaf, Plus, Trash2, Utensils } from "lucide-react";
import type { Meal } from "../types";
import { number } from "../lib";
import { Empty } from "../ui";
import { MealForm } from "../forms";
import { TutorialTrigger } from "../GuidedTutorial";
import type { PageProps } from "./types";
import { apiOperations } from "../api-operations";

export function FoodPage(p: PageProps) {
  const meals = [...p.state.meals].sort((a, b) => a.time.localeCompare(b.time));
  const calories = meals.reduce((n, m) => n + m.calories, 0),
    protein = meals.reduce((n, m) => n + m.protein, 0);
  function edit(meal?: Meal) {
    p.dialog({
      title: meal ? "Editar refeição" : "Nova refeição",
      children: (
        <MealForm
          meal={meal}
          mutate={p.mutate}
          onClose={() => p.dialog(null)}
        />
      ),
    });
  }
  return (
    <>
      <div className="page-intro" data-tutorial-target="food-overview">
        <div>
          <h2>Comer bem cabe na vida real.</h2>
          <p>
            Um plano simples, com comida de verdade e espaço para suas
            preferências.
          </p>
        </div>
        <div className="tutorial-actions" data-tutorial-target="food-create"><TutorialTrigger id="feature-meal" completed={p.completedTutorials.includes("feature-meal")} onStart={p.startTutorial} /><button className="button primary" onClick={() => edit()}><Plus size={16} /> Nova refeição</button></div>
      </div>
      <div className="nutrition-overview">
        <div className="nutrition-intro">
          <span className="category-tile orange">
            <Utensils size={25} />
          </span>
          <h3>Nutrir também é cuidar.</h3>
          <p>Refeições planejadas, escolhas mais leves no dia a dia.</p>
        </div>
        <div className="nutrition-total">
          <span>Energia planejada</span>
          <strong>
            {number(calories)}
            <small>kcal</small>
          </strong>
          <div className="nutrition-track">
            <span
              style={{
                width: `${Math.min(100, (calories / p.state.settings.calorieGoal) * 100)}%`,
              }}
            />
          </div>
          <p>Referência pessoal: {number(p.state.settings.calorieGoal)} kcal</p>
        </div>
        <div className="nutrition-total protein">
          <span>Proteína planejada</span>
          <strong>
            {number(protein)}
            <small>g</small>
          </strong>
          <div className="nutrition-track">
            <span
              style={{
                width: `${Math.min(100, (protein / p.state.settings.proteinGoal) * 100)}%`,
              }}
            />
          </div>
          <p>Referência pessoal: {p.state.settings.proteinGoal} g</p>
        </div>
      </div>
      <div className="food-layout">
        <div className="meal-list" data-tutorial-target="food-list">
          {meals.map((m, i) => (
            <section className="panel meal-card" key={m.id}>
              <div className="meal-time">
                <span>{m.time}</span>
                <i />
              </div>
              <div className="meal-main">
                <div className="section-heading small">
                  <h3>{m.name}</h3>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${m.name}`}
                      onClick={() => edit(m)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger-text"
                      aria-label={`Remover ${m.name}`}
                      onClick={() =>
                        p.confirm(
                          "Remover refeição?",
                          `“${m.name}” será removida do planejamento.`,
                          () => p.mutate(apiOperations.meal.remove(m.id), {}, "DELETE"),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p>{m.description}</p>
                <div className="meal-footer">
                  <span className={`meal-symbol meal-${i % 4}`}>
                    <Utensils size={15} />
                  </span>
                  <span>{number(m.calories)} kcal estimadas</span>
                  <i />
                  <span>{m.protein} g de proteína</span>
                </div>
              </div>
            </section>
          ))}
          {!meals.length && (
            <Empty
              icon={<Utensils size={27} />}
              title="Um plano que começa no seu prato."
              action={
                <button className="button primary" onClick={() => edit()}>
                  Adicionar refeição
                </button>
              }
            >
              Crie sua primeira refeição com alimentos que você goste.
            </Empty>
          )}
        </div>
        <aside className="food-aside">
          <section className="food-principles">
            <Leaf size={28} strokeWidth={1.4} />
            <h3>O básico bem feito.</h3>
            {[
              "Proteína nas refeições principais.",
              "Frutas, verduras e legumes todos os dias.",
              "Arroz e feijão são seus aliados.",
              "Coma com atenção, sem pressa.",
              "Prepare o ambiente para boas escolhas.",
            ].map((text) => (
              <p key={text}>
                <Check size={14} />
                {text}
              </p>
            ))}
            <button className="text-button" onClick={() => p.nav("rotina")}>
              Ver hábitos de alimentação
              <ArrowUpRight size={15} />
            </button>
          </section>
          <section className="panel food-note">
            <h3>Planejamento ≠ consumo</h3>
            <p>
              Os valores são estimativas do cardápio. Marcar uma refeição na
              rotina registra o hábito, sem calcular automaticamente o que você
              comeu.
            </p>
            <p>
              As metas iniciais são referências editáveis. Um nutricionista pode
              ajustar porções, preferências e necessidades.
            </p>
            <button className="text-button" onClick={() => p.nav("ajustes")}>
              Ajustar minhas metas
              <ArrowUpRight size={14} />
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}

