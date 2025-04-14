import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

// Create context
export const TaskContext = createContext();

export const useTask = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const { authHeaders } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    inProgress: 0
  });

  // Get API endpoint from sessionStorage
  const apiEndpoint = sessionStorage.getItem('apiEndpoint') || window.BACKEND_API_URL;

  useEffect(() => {
    // Set default values in sessionStorage if they don't exist
    if (!sessionStorage.getItem('apiEndpoint')) sessionStorage.setItem('apiEndpoint', apiEndpoint);
    if (!sessionStorage.getItem('context')) sessionStorage.setItem('context', 'employee');
    if (!sessionStorage.getItem('apiRefreshRate')) sessionStorage.setItem('apiRefreshRate', 5000);
    if (!sessionStorage.getItem('actionStagesRun')) sessionStorage.setItem('actionStagesRun', JSON.stringify([]));

    // Load current task from sessionStorage if it exists
    const storedTask = sessionStorage.getItem('task');
    if (storedTask) {
      setCurrentTask(JSON.parse(storedTask));
    }

    // Set up task polling
    const intervalId = setInterval(() => {
      fetchTasks();
    }, parseInt(sessionStorage.getItem('apiRefreshRate')) || 5000);

    // Initial fetch
    fetchTasks();

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [apiEndpoint]);

  // Fetch tasks from the API
  const fetchTasks = async () => {
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
        setTasks(data);

        // Calculate stats
        let completedCount = 0;
        let inProgressCount = 0;

        data.forEach(task => {
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
          const updatedTaskData = data.find(task => task.session_id === currentTask.id);
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
  const createTask = async (description) => {
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
      const newTask = {
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
  const selectTask = (sessionId, taskName) => {
    const task = {
      id: sessionId,
      name: taskName
    };
    
    sessionStorage.setItem('task', JSON.stringify(task));
    setCurrentTask(task);
  };

  // Clear current task
  const clearCurrentTask = () => {
    sessionStorage.removeItem('task');
    setCurrentTask(null);
  };

  // Add message to task
  const addMessageToTask = async (message) => {
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

  const contextValue = {
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