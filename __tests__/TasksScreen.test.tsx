import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TasksScreen from '@/app/(tabs)/index';
import { useTaskStore } from '@/stores/taskStore';

jest.mock('@/stores/taskStore');

const mockedUseTaskStore = useTaskStore as unknown as jest.Mock;

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      setOptions: jest.fn(),
    }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('TasksScreen', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      completed: false,
      dueDate: '2026-06-15T23:59:59.000Z',
      color: '#3b82f6',
      createdAt: '2026-04-01T10:00:00.000Z',
    },
    {
      id: '2',
      title: 'Task 2',
      completed: true,
      dueDate: null,
      color: null,
      createdAt: '2026-04-02T10:00:00.000Z',
    },
    {
      id: '3',
      title: 'Task 3',
      completed: false,
      dueDate: null,
      color: '#22c55e',
      createdAt: '2026-04-03T10:00:00.000Z',
    },
  ];

  const defaultStore = {
    tasks: mockTasks,
    isLoading: false,
    error: null,
    fetchTasks: jest.fn(),
    createTask: jest.fn(),
    deleteTask: jest.fn(),
    updateTask: jest.fn(),
    bulkDeleteTasks: jest.fn(),
  };

  it('affiche le message de chargement quand isLoading est vrai', () => {
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      tasks: [],
      isLoading: true,
    });

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Chargement des tâches…')).toBeTruthy();
  });

  it('affiche le message d\'erreur quand une erreur se produit', () => {
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      tasks: [],
      isLoading: false,
      error: 'Something went wrong!',
    });

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Something went wrong!')).toBeTruthy();
  });

  it('affiche les tâches correctement', () => {
    mockedUseTaskStore.mockReturnValue(defaultStore);

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Task 1')).toBeTruthy();
    expect(getByText('Task 2')).toBeTruthy();
  });

  it('appelle la fonction updateTask lorsque l\'utilisateur appuie sur une tâche', () => {
    const mockUpdateTask = jest.fn();
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      updateTask: mockUpdateTask,
    });

    const { getByText } = render(<TasksScreen />);

    fireEvent.press(getByText('Task 1'));

    expect(mockUpdateTask).toHaveBeenCalledWith('1', { completed: true });
  });

  it('appelle la fonction deleteTask lorsque l\'utilisateur appuie sur l\'icône de suppression', () => {
    const mockDeleteTask = jest.fn();
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      deleteTask: mockDeleteTask,
    });

    const { getByTestId } = render(<TasksScreen />);

    fireEvent.press(getByTestId('delete-button-1'));

    expect(mockDeleteTask).toHaveBeenCalledWith('1');
  });

  it('affiche le bouton d\'ajout flottant', () => {
    mockedUseTaskStore.mockReturnValue(defaultStore);

    const { getByTestId } = render(<TasksScreen />);

    expect(getByTestId('add-button')).toBeTruthy();
  });
});
