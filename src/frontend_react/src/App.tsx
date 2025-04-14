import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTask } from './contexts/TaskContext';

// Import components
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import TaskPage from './pages/TaskPage';
import LoadingSpinner from './components/LoadingSpinner';
import Modal from './components/Modal';

const App: React.FC = () => {
  const { isLoading: authLoading } = useAuth();
  const { tasks, taskStats, selectTask } = useTask();
  const [showAgentsModal, setShowAgentsModal] = useState<boolean>(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Listen for messages from child components
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.button) {
        if (event.data.button === 'taskAgentsButton') setShowAgentsModal(true);
        if (event.data.button === 'taskWokFlowButton') setShowWorkflowModal(true);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleGoHome = (): void => {
    navigate('/');
  };

  const handleNewTask = (): void => {
    navigate('/');
  };

  const handleTaskSelect = (taskId: string, taskName: string): void => {
    selectTask(taskId, taskName);
    navigate('/task');
  };

  if (authLoading) {
    return <LoadingSpinner message="Loading application..." />;
  }

  return (
    <div className="columns is-gapless mb-0" style={{ height: '100vh' }}>
      <div className="column asside border-right is-one-fifth is-flex is-flex-direction-column is-justify-content-space-between">
        <Sidebar 
          onGoHome={handleGoHome}
          onNewTask={handleNewTask}
          onTaskSelect={handleTaskSelect}
          tasks={tasks.slice(-5)} // Only show last 5 tasks
          stats={taskStats}
          activePath={location.pathname}
        />
      </div>
      <div className="column is-flex" style={{ flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task" element={<TaskPage 
            onOpenAgentsModal={() => setShowAgentsModal(true)}
            onOpenWorkflowModal={() => setShowWorkflowModal(true)}
            onOpenHistoryModal={() => setShowHistoryModal(true)}
          />} />
        </Routes>
      </div>

      {/* Modals */}
      <Modal 
        isActive={showAgentsModal}
        title="Agents"
        onClose={() => setShowAgentsModal(false)}
        content={
          <div>
            {/* Agents modal content will go here */}
            <p>This modal will show details about the agents involved in the task.</p>
          </div>
        }
      />

      <Modal 
        isActive={showWorkflowModal}
        title="Workflow"
        onClose={() => setShowWorkflowModal(false)}
        content={
          <div>
            {/* Workflow modal content will go here */}
            <p>This modal will show the workflow details of the task.</p>
          </div>
        }
      />

      <Modal 
        isActive={showHistoryModal}
        title="History"
        onClose={() => setShowHistoryModal(false)}
        content={
          <div>
            {/* History modal content will go here */}
            <p>This modal will show the history of the task.</p>
          </div>
        }
      />
    </div>
  );
};

export default App;