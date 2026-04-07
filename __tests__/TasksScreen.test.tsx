import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TasksScreen from '@/app/(tabs)/index';
import { useTaskStore } from '@/stores/taskStore';

// Mock the store
jest.mock('@/stores/taskStore');

describe('TasksScreen', () => {
  const mockTasks = [
    { id: '1', title: 'Task 1', description: 'Description 1', completed: false },
    { id: '2', title: 'Task 2', description: 'Description 2', completed: true },
    { id: '3', title: 'Task 3', description: 'Description 3', completed: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading message when isLoading is true', () => {
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: [],
      isLoading: true,
      error: null,
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: jest.fn(),
    });

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Loading tasks...')).toBeTruthy();
  });

  it('displays error message when an error occurs', () => {
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: [],
      isLoading: false,
      error: 'Something went wrong!',
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: jest.fn(),
    });

    const { getByText } = render(<TasksScreen />);

    expect(getByText('Something went wrong!')).toBeTruthy();
  });

  it('displays tasks correctly', () => {
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: null,
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: jest.fn(),
    });

    const { getByText } = render(<TasksScreen />);

    // Verify that task titles are displayed
    expect(getByText('Task 1')).toBeTruthy();
    expect(getByText('Task 2')).toBeTruthy();
  });

  it('calls updateTask function when user presses a task', () => {
    const mockUpdateTask = jest.fn();
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: null,
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: mockUpdateTask,
    });

    const { getByText } = render(<TasksScreen />);

    // Simulate pressing the first task
    fireEvent.press(getByText('Task 1'));

    // Verify that updateTask function was called
    expect(mockUpdateTask).toHaveBeenCalledWith('1', { completed: true });
  });

  it('calls deleteTask function when user presses the delete icon', () => {
    const mockDeleteTask = jest.fn();
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: null,
      fetchTasks: jest.fn(),
      deleteTask: mockDeleteTask,
      updateTask: jest.fn(),
    });

    const { getByTestId } = render(<TasksScreen />);

    // Simulate pressing delete icon for the first task
    fireEvent.press(getByTestId('delete-button-1'));

    // Verify that deleteTask function was called
    expect(mockDeleteTask).toHaveBeenCalledWith('1');
  });

  it('displays the floating add button', () => {
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: null,
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: jest.fn(),
      createTask: jest.fn(),
    });

    const { getByTestId } = render(<TasksScreen />);

    // Verify that the floating button is present
    expect(getByTestId('add-button')).toBeTruthy();
  });

  it('calls createTask function when user presses the add button', () => {
    const mockCreateTask = jest.fn();
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: null,
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: jest.fn(),
      createTask: mockCreateTask,
    });

    const { getByTestId } = render(<TasksScreen />);

    // Simulate pressing the add button
    fireEvent.press(getByTestId('add-button'));

    // Verify that createTask function was called
    expect(mockCreateTask).toHaveBeenCalled();
    expect(mockCreateTask).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'Task description',
      completed: false,
    });
  });

  it('adds a new task to the list when user creates a task', () => {
    const newTask = { id: '4', title: 'New Task', description: 'Task description', completed: false };
    const mockCreateTask = jest.fn(async (task) => {
      // Simulate the store behavior that adds the new task
      const allTasks = [...mockTasks, newTask];
      (useTaskStore as unknown as jest.Mock).mockReturnValue({
        tasks: allTasks,
        isLoading: false,
        error: null,
        fetchTasks: jest.fn(),
        deleteTask: jest.fn(),
        updateTask: jest.fn(),
        createTask: mockCreateTask,
      });
    });

    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: null,
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: jest.fn(),
      createTask: mockCreateTask,
    });

    const { getByTestId } = render(<TasksScreen />);

    // Press the add button
    fireEvent.press(getByTestId('add-button'));

    // Verify that createTask was called
    expect(mockCreateTask).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'Task description',
      completed: false,
    });
  });

  it('displays error message when task creation fails', () => {
    const mockCreateTask = jest.fn();
    (useTaskStore as unknown as jest.Mock).mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: 'Failed to create task',
      fetchTasks: jest.fn(),
      deleteTask: jest.fn(),
      updateTask: jest.fn(),
      createTask: mockCreateTask,
    });

    const { getByText } = render(<TasksScreen />);

    // Verify that the error message is displayed
    expect(getByText('Failed to create task')).toBeTruthy();
  });
});
