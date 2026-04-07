import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  color: string | null;
  createdAt: string;
}

export type CreateTaskPayload = {
  title: string;
  dueDate?: string | null;
  color?: string | null;
};

export type UpdateTaskPayload = Partial<
  Pick<Task, 'title' | 'completed' | 'dueDate' | 'color'>
>;

export const TasksAPI = {
  getTasks: () => api.get<Task[]>('/tasks'),
  createTask: (task: CreateTaskPayload) => api.post<Task>('/tasks', task),
  updateTask: (id: string, task: UpdateTaskPayload) =>
    api.patch<Task>(`/tasks/${id}`, task),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  bulkDeleteTasks: (ids: string[]) =>
    api.post<{ deleted: number; ids: string[] }>('/tasks/bulk-delete', {
      ids,
    }),
};

export default api;
