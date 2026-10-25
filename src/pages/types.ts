import type { ReactNode } from "react";
import type { Habit, Mutation, PageId, State } from "../types";

export type DialogOptions = {
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
};

export type PageProps = {
  state: State;
  date: string;
  today: string;
  mutate: Mutation;
  busy: boolean;
  nav: (page: PageId) => void;
  openHabit: (habit: Habit) => void;
  editHabit: (habit: Habit) => void;
  addHabit: () => void;
  setDate: (date: string) => void;
  dialog: (dialog: DialogOptions | null) => void;
  confirm: (title: string, body: string, action: () => Promise<boolean>) => void;
  startTutorial: (id: string, trigger: HTMLElement) => void;
  completedTutorials: string[];
};
