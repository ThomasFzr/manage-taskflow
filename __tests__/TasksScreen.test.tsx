import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import TasksScreen from '@/app/(tabs)/index';
import { useTaskStore } from '@/stores/taskStore';


jest.mock('@/stores/taskStore');

const mockedUseTaskStore = useTaskStore as unknown as jest.Mock;
let mockNavigationOptions: { headerRight?: () => React.ReactElement } | null = null;
const mockSetOptions = jest.fn((options: { headerRight?: () => React.ReactElement }) => {
  mockNavigationOptions = options;
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual<typeof import('@react-navigation/native')>('@react-navigation/native');
  return {
    ...(actual as object),
    useNavigation: () => ({
      setOptions: mockSetOptions,
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

  const renderHeaderRight = () => {
    expect(mockNavigationOptions?.headerRight).toBeDefined();
    return render(mockNavigationOptions!.headerRight!());
  };

  beforeEach(() => {
    mockSetOptions.mockClear();
    mockNavigationOptions = null;
  });

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

  it('affiche l’état vide quand il n’y a aucune tâche', () => {
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      tasks: [],
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Aucune tâche pour le moment.')).toBeTruthy();
  });

  it('affiche les tâches correctement', () => {
    mockedUseTaskStore.mockReturnValue(defaultStore);

    const { getByText, getAllByText } = render(<TasksScreen />);

    expect(getByText('Task 1')).toBeTruthy();
    expect(getByText('Task 2')).toBeTruthy();
    expect(getByText(/Échéance :/)).toBeTruthy();
    expect(getAllByText('Pas de date limite').length).toBeGreaterThan(0);
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

  it('affiche le bouton de réessai et relance le chargement', () => {
    const mockFetchTasks = jest.fn();
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      tasks: [],
      error: 'Something went wrong!',
      fetchTasks: mockFetchTasks,
    });

    const { getByTestId } = render(<TasksScreen />);

    fireEvent.press(getByTestId('retry-fetch'));

    expect(mockFetchTasks).toHaveBeenCalledTimes(2);
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

  it('active le mode de sélection', () => {
    mockedUseTaskStore.mockReturnValue(defaultStore);

    const screen = render(<TasksScreen />);
    const header = renderHeaderRight();

    fireEvent.press(header.getByTestId('selection-mode-toggle'));

    expect(screen.getByTestId('select-1')).toBeTruthy();
    expect(screen.getByTestId('select-2')).toBeTruthy();

    fireEvent.press(screen.getByTestId('select-1'));
    fireEvent.press(screen.getByTestId('select-2'));

    fireEvent.press(renderHeaderRight().getByTestId('selection-mode-toggle'));

    expect(renderHeaderRight().getByText('Sélectionner')).toBeTruthy();
  });

  it('bascule l’état de complétion depuis le bouton dédié', () => {
    const mockUpdateTask = jest.fn();
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      updateTask: mockUpdateTask,
    });

    const { getByTestId } = render(<TasksScreen />);

    fireEvent.press(getByTestId('complete-button-1'));

    expect(mockUpdateTask).toHaveBeenCalledWith('1', { completed: true });
  });

  it('ouvre le formulaire d’ajout et crée une tâche', async () => {
    const mockCreateTask = jest.fn(async () => undefined);
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      createTask: mockCreateTask,
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <TasksScreen />
    );

    fireEvent.press(getByTestId('add-button'));
    fireEvent.changeText(getByPlaceholderText('Titre de la tâche'), 'Nouvelle tâche');
    fireEvent.press(getByText('Créer'));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Nouvelle tâche',
        dueDate: null,
        color: null,
      });
    });
  });

  it('ferme le formulaire d’ajout sans créer de tâche', () => {
    mockedUseTaskStore.mockReturnValue(defaultStore);

    const { getByTestId, getByText, queryByText } = render(<TasksScreen />);

    fireEvent.press(getByTestId('add-button'));
    expect(getByText('Nouvelle tâche')).toBeTruthy();

    fireEvent.press(getByText('Annuler'));

    expect(queryByText('Nouvelle tâche')).toBeNull();
  });

  it('ouvre le formulaire de modification et enregistre les changements', async () => {
    const mockUpdateTask = jest.fn(async () => undefined);
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      updateTask: mockUpdateTask,
    });

    const { getByDisplayValue, getByTestId, getByText } = render(
      <TasksScreen />
    );

    fireEvent.press(getByTestId('edit-button-1'));
    fireEvent.changeText(getByDisplayValue('Task 1'), 'Task 1 updated');
    fireEvent.press(getByText('Enregistrer'));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          title: 'Task 1 updated',
          color: '#3b82f6',
        })
      );
    });
  });

  it('ferme le formulaire de modification sans enregistrer', () => {
    mockedUseTaskStore.mockReturnValue(defaultStore);

    const { getByTestId, getByText, queryByText } = render(<TasksScreen />);

    fireEvent.press(getByTestId('edit-button-1'));
    expect(getByText('Modifier la tâche')).toBeTruthy();

    fireEvent.press(getByText('Annuler'));

    expect(queryByText('Modifier la tâche')).toBeNull();
  });

  it('ouvre le sélecteur de date et ajoute une échéance', async () => {
    const mockCreateTask = jest.fn(async () => undefined);
    mockedUseTaskStore.mockReturnValue({
      ...defaultStore,
      tasks: [],
      createTask: mockCreateTask,
    });

    const { getByPlaceholderText, getByTestId, getByText } = render(
      <TasksScreen />
    );

    fireEvent.press(getByTestId('add-button'));
    fireEvent.press(getByText('Aucune date limite'));
    fireEvent(getByTestId('mock-datetime-picker'), 'onChange',
      { type: 'set' },
      new Date('2026-06-15T00:00:00.000Z')
    );
    fireEvent.changeText(getByPlaceholderText('Titre de la tâche'), 'Task with due date');
    fireEvent.press(getByText('Créer'));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task with due date',
          color: null,
          dueDate: expect.any(String),
        })
      );
    });
  });

  it('affiche le bouton d\'ajout flottant', () => {
    mockedUseTaskStore.mockReturnValue(defaultStore);

    const { getByTestId } = render(<TasksScreen />);

    expect(getByTestId('add-button')).toBeTruthy();
  });
});
