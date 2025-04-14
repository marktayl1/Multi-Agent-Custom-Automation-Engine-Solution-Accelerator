import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { Notyf } from 'notyf';
import LoadingSpinner from '../components/LoadingSpinner';

// Markdown converter
import showdown from 'showdown';

function TaskPage({ onOpenAgentsModal, onOpenWorkflowModal, onOpenHistoryModal }) {
  const { currentTask, tasks, addMessageToTask, fetchTasks } = useTask();
  const { authHeaders } = useAuth();
  const [taskData, setTaskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskStatus, setTaskStatus] = useState('in-progress');
  const [taskProgress, setTaskProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [agentsInfo, setAgentsInfo] = useState({ total: 0, human: 0 });
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const notyf = useRef(null);
  const navigate = useNavigate();
  
  // Get API endpoint from sessionStorage
  const apiEndpoint = sessionStorage.getItem('apiEndpoint') || window.BACKEND_API_URL;
  
  // Initialize converter for markdown
  const converter = new showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true
  });

  useEffect(() => {
    // Initialize Notyf
    notyf.current = new Notyf({
      position: { x: "right", y: "top" },
      ripple: false,
      duration: 3000,
    });

    // Redirect to home if no task is selected
    if (!currentTask) {
      navigate('/');
      return;
    }

    // Initial load of task data
    loadTaskData();
    
    // Set up interval to refresh task data
    const intervalId = setInterval(() => {
      loadTaskData();
    }, parseInt(sessionStorage.getItem('apiRefreshRate')) || 5000);
    
    return () => clearInterval(intervalId);
  }, [currentTask, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages update
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadTaskData = async () => {
    if (!currentTask || !currentTask.id || !authHeaders) return;

    try {
      // First get task details from the task list
      const taskInfo = tasks.find(task => task.session_id === currentTask.id);
      
      if (taskInfo) {
        setTaskData(taskInfo);
        
        // Calculate progress
        const progressPercent = Math.round((taskInfo.completed / taskInfo.total_steps) * 100);
        setTaskProgress(progressPercent);
        
        // Determine status
        setTaskStatus(taskInfo.overall_status);
        
        // Count agents
        const humanAgents = taskInfo.agents ? taskInfo.agents.filter(agent => agent.type === 'human').length : 0;
        const totalAgents = taskInfo.agents ? taskInfo.agents.length : 0;
        
        setAgentsInfo({
          total: totalAgents,
          human: humanAgents
        });

        // Fetch task messages
        await fetchTaskMessages(currentTask.id);
        
        // Fetch task stages
        await fetchTaskStages(currentTask.id);
      }
    } catch (error) {
      console.error('Error loading task data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaskMessages = async (sessionId) => {
    try {
      const response = await fetch(`${apiEndpoint}/messages/${sessionId}`, {
        method: 'GET',
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch task messages');
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Process messages
        const formattedMessages = data.map(msg => {
          // Convert markdown to HTML if needed
          let content = msg.content;
          if (typeof content === 'string' && (content.includes('*') || content.includes('#') || content.includes('```'))) {
            content = converter.makeHtml(content);
          }
          
          return {
            ...msg,
            content,
            timestamp: new Date(msg.timestamp)
          };
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching task messages:', error);
    }
  };

  const fetchTaskStages = async (sessionId) => {
    try {
      const response = await fetch(`${apiEndpoint}/stages/${sessionId}`, {
        method: 'GET',
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch task stages');
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Get active stage
        const activeStage = data.find(stage => stage.status === 'in-progress');
        if (activeStage) {
          setActiveStage(activeStage);
        } else if (data.length > 0) {
          // If no active stage, set the last completed or first pending
          const lastCompleted = data.filter(stage => stage.status === 'completed').pop();
          const firstPending = data.find(stage => stage.status === 'pending');
          setActiveStage(lastCompleted || firstPending || data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching task stages:', error);
    }
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    setCharCount(value.length);
    
    // Dynamically adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await addMessageToTask(newMessage);
      setNewMessage('');
      setCharCount(0);
      // Adjust textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Force refresh task data
      await fetchTasks();
      await loadTaskData();
      
      notyf.current.success("Message added to task");
    } catch (error) {
      console.error('Error adding message:', error);
      notyf.current.error("Failed to add message");
    }
  };

  const handleKeyDown = (e) => {
    // If Enter is pressed without Shift, submit the form
    if (e.key === "Enter" && !e.shiftKey) {
      if (newMessage.trim() !== "") {
        e.preventDefault(); // Prevent default behavior
        handleSubmitMessage(e);
      } else {
        e.preventDefault(); // Disable Enter when textarea is empty
      }
    }
  };

  const handlePauseTask = () => {
    // Implement pause/resume functionality
    notyf.current.info("Task pause/resume functionality will be implemented");
  };

  const handleCancelTask = () => {
    // Implement cancel task functionality
    notyf.current.info("Task cancellation functionality will be implemented");
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading task data..." />;
  }

  if (!currentTask) {
    navigate('/');
    return null;
  }

  return (
    <div className="is-flex is-flex is-flex-direction-column is-flex-grow-1">
      <div className="columns is-gapless" style={{ height: '100%' }}>
        <div className="column asside task-asside border-right is-one-quarter">
          {/* Task menu start */}
          <aside className="menu task-menu">
            <h2 className="title mt-6">Task plan</h2>
            <p className="menu-label">Stages</p>
            <ul className="menu-list">
              <li>
                <ul id="taskStagesMenu" className="menu-stages">
                  {taskData && taskData.steps && taskData.steps.map((stage, index) => (
                    <li key={index} className={`stage-item ${activeStage && activeStage.id === stage.id ? 'is-active' : ''}`}>
                      {stage.status === 'completed' ? (
                        <i className="fa-solid fa-check-circle has-text-success mr-2"></i>
                      ) : stage.status === 'in-progress' ? (
                        <i className="fa-solid fa-spinner fa-spin has-text-info mr-2"></i>
                      ) : (
                        <i className="fa-regular fa-circle mr-2"></i>
                      )}
                      <span>{stage.name || `Stage ${index + 1}`}</span>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </aside>
          {/* Task menu end */}
        </div>
        <div className="column colChatSec">
          <section className="task-details section is-flex is-flex-direction-column">
            {/* Task nav start */}
            <div className="columns">
              <div className="column">
                <h1 id="taskName" className="title">{currentTask.name}</h1>
              </div>
              <div className="column">
                <div className="buttons has-addons is-pulled-right">
                  <button
                    className="button"
                    id="taskPauseButton"
                    title="Start/Pause"
                    onClick={handlePauseTask}
                  >
                    <span className="icon is-small">
                      <i className="fa-regular fa-circle-pause"></i>
                    </span>
                  </button>
                  <button 
                    id="taskCancelButton" 
                    className="button" 
                    title="Cancel"
                    onClick={handleCancelTask}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            {/* Task nav end */}

            {/* Task status start */}
            <div className="columns">
              <div className="column is-two-fifths border-right">
                <p className="mb-3">
                  <strong>Status:</strong>
                  <span 
                    id="taskStatusTag" 
                    className={`tag ml-2 ${
                      taskStatus === 'completed' ? 'is-success' : 
                      taskStatus === 'in-progress' ? 'is-info' : 
                      taskStatus === 'planned' ? 'is-warning' : 
                      'is-light'
                    }`}
                  >
                    {taskStatus === 'completed' ? 'Completed' : 
                     taskStatus === 'in-progress' ? 'In Progress' : 
                     taskStatus === 'planned' ? 'Planned' : 
                     taskStatus}
                  </span>
                </p>
                <div id="taskStatusDetails">
                  {activeStage && (
                    <p>Current stage: {activeStage.name || 'Processing task'}</p>
                  )}
                </div>
              </div>
              <div className="column has-text-right">
                <div
                  id="taskDetailsAgents"
                  className="is-flex is-justify-content-end task-stats"
                >
                  <span>{agentsInfo.total}</span>
                </div>
                <strong id="taskAgentsHumans">
                  {agentsInfo.total} {agentsInfo.total === 1 ? 'agent' : 'agents'} ({agentsInfo.human} human)
                </strong>
              </div>
              <div className="column has-text-right">
                <div className="is-size-1 task-stats has-text-info" id="taskProgressPercentage">
                  {taskProgress}%
                </div>
                <strong id="taskProgress">
                  {taskData ? `${taskData.completed}/${taskData.total_steps} steps` : '0/0 steps'}
                </strong>
              </div>
            </div>
            <progress
              id="taskProgressBar"
              className="progress is-link mb-3"
              value={taskProgress}
              max="100"
            ></progress>
            {/* Task status end */}

            {/* Task messages start */}
            <div id="taskMessages" className="task-progress px-3 py-3">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${
                    message.role === 'user' ? 'is-user' : 
                    message.role === 'system' ? 'is-system' : 
                    'is-ai'
                  }`}
                >
                  <p>
                    <strong>
                      {message.role === 'user' ? 'You' : 
                       message.role === 'system' ? 'System' : 
                       message.role === 'assistant' ? 'Assistant' : 
                       message.role}
                    </strong>
                    <small className="is-pulled-right">
                      {message.timestamp?.toLocaleTimeString()}
                    </small>
                  </p>
                  {typeof message.content === 'string' && message.content.startsWith('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: message.content }}></div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Task message input */}
            <div className="text-input-container">
              <textarea
                ref={textareaRef}
                id="taskMessageTextarea"
                value={newMessage}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                placeholder="Add more info to this task..."
              ></textarea>
              <div className="middle-bar">
                <span className="char-count">
                  <span id="charCount">{charCount}</span>/1000
                </span>
              </div>
              <div className="bottom-bar">
                <span className="icons">
                  <img src="/assets/images/stars.svg" alt="stars" />
                </span>
                <button 
                  className="send-button" 
                  id="taskMessageAddButton"
                  onClick={handleSubmitMessage}
                  disabled={!newMessage.trim()}
                >
                  <img 
                    src={newMessage.trim() ? "/assets/Send.svg" : "/assets/images/air-button.svg"} 
                    id="startTaskButton"
                    alt="Send"
                    style={newMessage.trim() ? {width: '16px', height: '16px'} : {}}
                  />
                </button>
              </div>
            </div>
            {/* Task messages end */}
          </section>
        </div>
      </div>
    </div>
  );
}

export default TaskPage;