import { BookOpen, Brain, CalendarCheck2, ChartNoAxesCombined, Dumbbell, House, ListChecks, Timer, Utensils } from "lucide-react";
import type { PageId } from "./types";

export const navItems = [
  { id: "hoje", title: "Visão geral", mobileTitle: "Hoje", icon: House },
  { id: "rotina", title: "Minha rotina", mobileTitle: "Rotina", icon: ListChecks },
  { id: "evolucao", title: "Evolução", mobileTitle: "Evolução", icon: ChartNoAxesCombined },
  { id: "treinos", title: "Treinos", mobileTitle: "Treinos", icon: Dumbbell },
  { id: "jogos", title: "Jogos da mente", mobileTitle: "Jogos", icon: Brain },
  { id: "alimentacao", title: "Alimentação", mobileTitle: "Alimentação", icon: Utensils },
  { id: "diario", title: "Meu diário", mobileTitle: "Diário", icon: BookOpen },
  { id: "foco", title: "Tempo de foco", mobileTitle: "Foco", icon: Timer },
  { id: "semana", title: "Revisão semanal", mobileTitle: "Semana", icon: CalendarCheck2 },
] as const;

export const pageNames: Record<PageId, string> = {
  hoje: "Visão geral", rotina: "Minha rotina", evolucao: "Evolução", treinos: "Treinos",
  alimentacao: "Alimentação", diario: "Meu diário", ajustes: "Ajustes", foco: "Tempo de foco",
  semana: "Revisão semanal", jogos: "Jogos da mente",
};

export const validPage = (hash: string): PageId => Object.hasOwn(pageNames, hash) ? hash as PageId : "hoje";
