import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

// IndexedDB-backed storage so data is durable across reloads & browser cleanups
// of localStorage. Falls back to localStorage if IDB unavailable.
const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const v = await idbGet(name);
      if (v != null) return v as string;
    } catch {}
    if (typeof localStorage !== "undefined") return localStorage.getItem(name);
    return null;
  },
  setItem: async (name, value) => {
    try { await idbSet(name, value); } catch {}
    if (typeof localStorage !== "undefined") {
      try { localStorage.setItem(name, value); } catch {}
    }
  },
  removeItem: async (name) => {
    try { await idbDel(name); } catch {}
    if (typeof localStorage !== "undefined") localStorage.removeItem(name);
  },
};

export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: Priority;
  scheduledAt?: string; // ISO datetime for alarm
  alarm?: { enabled: boolean; sound: string };
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  motive?: string;
  time: string; // HH:MM
  daysActive: number;
  history: string[]; // ISO date strings (yyyy-mm-dd) when completed
  alarm?: { enabled: boolean; sound: string };
  createdAt: string;
}

export interface PlannerBlock {
  id: string;
  day: number; // 0-6 (Mon-Sun)
  startHour: number; // 0-23
  duration: number; // hours
  title: string;
  color: string;
}

export interface Milestone { id: string; title: string; done: boolean; }
export interface Goal {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  milestones: Milestone[];
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  date: string; // yyyy-mm-dd
  score: number; // 1-10
  note?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // yyyy-mm-dd
  gratitude: string;
  reflection?: string;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: string; // ISO
}

interface AppState {
  tasks: Task[];
  routines: RoutineTask[];
  plannerBlocks: PlannerBlock[];
  goals: Goal[];
  moods: MoodEntry[];
  journal: JournalEntry[];
  transactions: Transaction[];

  addTask: (t: Omit<Task, "id" | "createdAt" | "completed">) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addRoutine: (r: Omit<RoutineTask, "id" | "createdAt" | "daysActive" | "history">) => void;
  toggleRoutineToday: (id: string) => void;
  deleteRoutine: (id: string) => void;

  addPlannerBlock: (b: Omit<PlannerBlock, "id">) => void;
  deletePlannerBlock: (id: string) => void;

  addGoal: (g: Omit<Goal, "id" | "createdAt" | "milestones"> & { milestones?: Milestone[] }) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addMilestone: (goalId: string, title: string) => void;
  deleteGoal: (id: string) => void;

  logMood: (score: number, note?: string) => void;
  addJournal: (gratitude: string, reflection?: string) => void;

  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      tasks: [],
      routines: [],
      plannerBlocks: [],
      goals: [],
      moods: [],
      journal: [],
      transactions: [],

      addTask: (t) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { ...t, id: uid(), completed: false, createdAt: new Date().toISOString() },
          ],
        })),
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
              : t,
          ),
        })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addRoutine: (r) =>
        set((s) => ({
          routines: [
            ...s.routines,
            { ...r, id: uid(), daysActive: 0, history: [], createdAt: new Date().toISOString() },
          ],
        })),
      toggleRoutineToday: (id) =>
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== id) return r;
            const d = today();
            const has = r.history.includes(d);
            const history = has ? r.history.filter((x) => x !== d) : [...r.history, d];
            return { ...r, history, daysActive: history.length };
          }),
        })),
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      addPlannerBlock: (b) =>
        set((s) => ({ plannerBlocks: [...s.plannerBlocks, { ...b, id: uid() }] })),
      deletePlannerBlock: (id) =>
        set((s) => ({ plannerBlocks: s.plannerBlocks.filter((b) => b.id !== id) })),

      addGoal: (g) =>
        set((s) => ({
          goals: [
            ...s.goals,
            { ...g, id: uid(), milestones: g.milestones ?? [], createdAt: new Date().toISOString() },
          ],
        })),
      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, milestones: g.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m)) }
              : g,
          ),
        })),
      addMilestone: (goalId, title) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, milestones: [...g.milestones, { id: uid(), title, done: false }] } : g,
          ),
        })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      logMood: (score, note) =>
        set((s) => ({ moods: [...s.moods, { id: uid(), date: today(), score, note }] })),
      addJournal: (gratitude, reflection) =>
        set((s) => ({
          journal: [...s.journal, { id: uid(), date: today(), gratitude, reflection }],
        })),

      addTransaction: (t) => set((s) => ({ transactions: [...s.transactions, { ...t, id: uid() }] })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
    }),
    {
      name: "uld-store-v1",
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);