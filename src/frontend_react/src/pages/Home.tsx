import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../contexts/TaskContext';
import { Notyf } from 'notyf';

interface QuickTask {
  title: string;
  prompt: string;
  icon: string;
}

const Home: React.FC = () => {
  const { createTask, isLoading } = useTask();
  const navigate = useNavigate();
  const [taskPrompt, setTaskPrompt] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notyf = useRef<Notyf | null>(null);

  useEffect(() => {
    // Initialize Notyf
    notyf.current = new Notyf({
      position: { x: "right", y: "top" },
      ripple: false,
      duration: 3000,
    });

    // Focus on the textarea when the component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleTaskPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTaskPrompt(value);
    setCharCount(value.length);

    // Dynamically adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskPrompt.trim()) return;
    
    setShowOverlay(true);
    const newTask = await createTask(taskPrompt);
    setShowOverlay(false);
    
    if (newTask) {
      notyf.current?.success("Task created successfully. AI agents are on it!");
      setTaskPrompt('');
      setCharCount(0);
      navigate('/task');
    } else {
      notyf.current?.error("Unable to create plan for this task.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If Enter is pressed without Shift, submit the form
    if (e.key === "Enter" && !e.shiftKey) {
      if (taskPrompt.trim() !== "") {
        e.preventDefault(); // Prevent default behavior
        handleSubmit(e);
      } else {
        e.preventDefault(); // Disable Enter when textarea is empty
      }
    }
  };

  const handleQuickTaskClick = (quickTaskPrompt: string) => {
    setTaskPrompt(quickTaskPrompt);
    setCharCount(quickTaskPrompt.length);
    
    // Adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  };

  const quickTasks: QuickTask[] = [
    {
      title: "Mobile plan query",
      prompt: "I'm looking for information about a roaming plan as I'm headed overseas.",
      icon: "fa-list-check"
    },
    {
      title: "Buy add-on pack",
      prompt: "Please enable roaming on my mobile plan, starting next week.",
      icon: "fa-list-check"
    },
    {
      title: "Onboard employee",
      prompt: "Onboard a new employee, Jessica Smith.",
      icon: "fa-list-check"
    },
    {
      title: "Draft a press release",
      prompt: "Get info about our products. Write a press release about our current products.",
      icon: "fa-list-check"
    }
  ];

  return (
    <div className="container is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
      {/* Background animation */}
      <div className="background">
        <div className="orb one"></div>
        <div className="orb two"></div>
        <div className="orb three"></div>
      </div>

      {/* Home prompt box */}
      <section className="section is-flex is-flex-direction-column is-justify-content-center prompt-container">
        <img className="app-logo" src="/assets/app-logo.svg" alt="App Logo" />
        <span className="title mb-0"> Task list <span className="assistants"> Assistants</span> </span>
        <span className="description mt-0">Ask your AI team for help</span>
        <div className="text-input-container">
          <textarea 
            ref={textareaRef}
            id="newTaskPrompt" 
            value={taskPrompt}
            onChange={handleTaskPromptChange}
            onKeyDown={handleKeyDown}
            maxLength={1000} 
            placeholder="Describe what needs to be done..."
          />
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
              onClick={handleSubmit} 
              disabled={!taskPrompt.trim()}
            >
              <img 
                src={taskPrompt.trim() ? "/assets/Send.svg" : "/assets/images/air-button.svg"} 
                alt="Send" 
                style={taskPrompt.trim() ? {width: '16px', height: '16px'} : {}} 
              />
            </button>
          </div>
        </div>
      </section>

      {/* Quick tasks section */}
      <section className="section">
        <h2 className="title has-text-centered">Quick tasks</h2>
        <div className="columns">
          {quickTasks.map((task, index) => (
            <div className="column" key={index}>
              <div 
                className="card is-hoverable quick-task" 
                onClick={() => handleQuickTaskClick(task.prompt)}
              >
                <div className="card-content">
                  <i className={`fa-solid ${task.icon} has-text-info mb-3`}></i><br />
                  <strong>{task.title}</strong>
                  <p className="quick-task-prompt">{task.prompt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Loading overlay */}
      {(showOverlay || isLoading) && (
        <>
          <div id="overlay" style={{ display: 'block' }}></div>
          <div id="spinnerContainer">
            <div id="spinnerLoader">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <span className="mt-3"></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;