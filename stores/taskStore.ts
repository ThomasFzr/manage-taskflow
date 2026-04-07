import { create } from 'zustand';
import {
  type Task,
  TasksAPI,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@/lib/api';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: CreateTaskPayload) => Promise<void>;
  updateTask: (id: string, task: UpdateTaskPayload) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await TasksAPI.getTasks();
      set({ tasks: response.data });
    } catch {
      set({ error: 'Failed to fetch tasks' });
    } finally {
      set({ isLoading: false });
    }
  },
  createTask: async (task) => {
    set({ error: null });
    try {
      const response = await TasksAPI.createTask(task);
      set({ tasks: [response.data, ...get().tasks] });
    } catch {
      set({ error: 'Failed to create task' });
      throw new Error('Failed to create task');
    }
  },
  updateTask: async (id, task) => {
    set({ error: null });
    try {
      const response = await TasksAPI.updateTask(id, task);
      set({
        tasks: get().tasks.map((t) => (t.id === id ? response.data : t)),
      });
    } catch {
      set({ error: 'Failed to update task' });
      throw new Error('Failed to update task');
    }
  },
  deleteTask: async (id) => {
    set({ error: null });
    try {
      await TasksAPI.deleteTask(id);
      set({ tasks: get().tasks.filter((t) => t.id !== id) });
    } catch {
      set({ error: 'Failed to delete task' });
      throw new Error('Failed to delete task');
    }
  },
  bulkDeleteTasks: async (ids) => {
    set({ error: null });
    try {
      await TasksAPI.bulkDeleteTasks(ids);
      const idSet = new Set(ids);
      set({ tasks: get().tasks.filter((t) => !idSet.has(t.id)) });
    } catch {
      set({ error: 'Failed to delete tasks' });
      throw new Error('Failed to delete tasks');
    }
  },
}));
