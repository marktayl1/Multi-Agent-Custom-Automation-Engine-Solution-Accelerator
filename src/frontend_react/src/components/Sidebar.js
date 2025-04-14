import React from 'react';

function Sidebar({ onGoHome, onNewTask, onTaskSelect, tasks, stats, activePath }) {
  return (
    <>
      {/* App menu start */}
      <aside className="menu mx-3 mt-5">
        <strong onClick={onGoHome} className="menu-logo is-flex is-align-items-center" style={{ cursor: 'pointer' }}>
          <img className="mr-3" src="/assets/app-logo.svg" alt="App Logo" />
          <span>Multi-Agent-Custom-Automation-Engine</span>
        </strong>
        <button id="newTaskButton" className="button is-fullwidth my-6" onClick={onNewTask}>
          New task
        </button>
        <p className="menu-label">My tasks</p>
        <ul id="myTasksMenu" className="menu-list">
          {tasks && tasks.length > 0 ? (
            tasks.map((task, index) => (
              <li key={task.session_id}>
                <a 
                  href="#" 
                  className={`menu-task ${task.session_id === (activePath === '/task' ? JSON.parse(sessionStorage.getItem('task'))?.id : '') ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onTaskSelect(task.session_id, task.initial_goal);
                  }}
                  title={`Status: ${task.overall_status}, Session id: ${task.session_id}`}
                >
                  {task.overall_status === 'completed' ? (
                    <i className="fa-solid fa-check-to-slot has-text-success mr-3"></i>
                  ) : (
                    <i className="fa-solid fa-arrows-rotate fa-spin mr-3"></i>
                  )}
                  <span>{index + 1}. {task.initial_goal}</span>
                  <div className="tag is-dark ml-3">{task.completed}/{task.total_steps}</div>
                </a>
              </li>
            ))
          ) : (
            <li>
              <div className="notification">
                <i className="fa-solid fa-circle-notch fa-spin mr-3"></i> Loading tasks...
              </div>
            </li>
          )}
        </ul>
      </aside>
      {/* App menu end */}

      {/* Status section */}
      <aside className="menu mx-3">
        <p className="menu-label">Status</p>
        <ul id="tasksStats" className="menu-list">
          <li>
            <a>
              <strong>{stats.completed}</strong> {stats.completed === 1 ? 'task' : 'tasks'} completed
            </a>
          </li>
          <li>
            <a>
              <strong>{stats.inProgress}</strong> {stats.inProgress === 1 ? 'task' : 'tasks'} in progress
            </a>
          </li>
        </ul>
        <p className="menu-label"></p>
      </aside>
    </>
  );
}

export default Sidebar;