import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CurrentTask, Task, TaskContextType, TaskStats } from '../types';

// Create context with default value
export const TaskContext = createContext<TaskContextType>({
  tasks: [],
  currentTask: null,
  isLoading: false,
  taskStats: { completed: 0, inProgress: 0 },
  createTask: async () => null,
  selectTask: () => {},
  clearCurrentTask: () => {},
  addMessageToTask: async () => null,
  fetchTasks: async () => {}
});

export const useTask = () => useContext(TaskContext);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const { authHeaders } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<CurrentTask | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    completed: 0,
    inProgress: 0
  });

  // Get API endpoint from sessionStorage
  const apiEndpoint = sessionStorage.getItem('apiEndpoint') || window.BACKEND_API_URL;

  useEffect(() => {
    // Set default values in sessionStorage if they don't exist
    if (!sessionStorage.getItem('apiEndpoint')) sessionStorage.setItem('apiEndpoint', apiEndpoint);
    if (!sessionStorage.getItem('context')) sessionStorage.setItem('context', 'employee');
    if (!sessionStorage.getItem('apiRefreshRate')) sessionStorage.setItem('apiRefreshRate', '5000');
    if (!sessionStorage.getItem('actionStagesRun')) sessionStorage.setItem('actionStagesRun', JSON.stringify([]));

    // Load current task from sessionStorage if it exists
    const storedTask = sessionStorage.getItem('task');
    if (storedTask) {
      setCurrentTask(JSON.parse(storedTask));
    }

    // Set up task polling
    const intervalId = setInterval(() => {
      fetchTasks();
    }, parseInt(sessionStorage.getItem('apiRefreshRate') || '5000'));

    // Initial fetch
    fetchTasks();

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [apiEndpoint]);

  // Fetch tasks from the API
  const fetchTasks = async (): Promise<void> => {
    if (!authHeaders) return;

    try {
      const response = await fetch(`${apiEndpoint}/plans`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        setTasks(data as Task[]);

        // Calculate stats
        let completedCount = 0;
        let inProgressCount = 0;

        data.forEach((task: Task) => {
          if (task.overall_status === 'completed') {
            completedCount++;
          } else {
            inProgressCount++;
          }
        });

        setTaskStats({
          completed: completedCount,
          inProgress: inProgressCount
        });

        // Update current task data if we have it loaded
        if (currentTask) {
          const updatedTaskData = data.find((task: Task) => task.session_id === currentTask.id);
          if (updatedTaskData) {
            const updatedTask = {
              ...currentTask,
              data: updatedTaskData
            };
            setCurrentTask(updatedTask);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Create a new task
  const createTask = async (description: string): Promise<CurrentTask | null> => {
    if (!authHeaders) return null;
    
    setIsLoading(true);
    const sessionId = 'sid_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);

    try {
      const response = await fetch(`${apiEndpoint}/input_task`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          session_id: sessionId,
          description: description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const data = await response.json();

      if (data.status === "Plan not created" || !data.plan_id) {
        throw new Error('Unable to create plan for this task');
      }

      // Create new task in state
      const newTask: CurrentTask = {
        id: data.session_id,
        name: description,
        planId: data.plan_id
      };

      // Store in sessionStorage
      sessionStorage.setItem('task', JSON.stringify(newTask));
      setCurrentTask(newTask);
      
      // Refresh task list
      await fetchTasks();
      
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Select a task
  const selectTask = (sessionId: string, taskName: string): void => {
    const task: CurrentTask = {
      id: sessionId,
      name: taskName
    };
    
    sessionStorage.setItem('task', JSON.stringify(task));
    setCurrentTask(task);
  };

  // Clear current task
  const clearCurrentTask = (): void => {
    sessionStorage.removeItem('task');
    setCurrentTask(null);
  };

  // Add message to task
  const addMessageToTask = async (message: string): Promise<any> => {
    if (!authHeaders || !currentTask) return false;

    try {
      const response = await fetch(`${apiEndpoint}/add_message`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          session_id: currentTask.id,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add message to task');
      }

      const data = await response.json();
      await fetchTasks(); // Refresh task data
      return data;
    } catch (error) {
      console.error('Error adding message to task:', error);
      return false;
    }
  };

  const contextValue: TaskContextType = {
    tasks,
    currentTask,
    isLoading,
    taskStats,
    createTask,
    selectTask,
    clearCurrentTask,
    addMessageToTask,
    fetchTasks
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};