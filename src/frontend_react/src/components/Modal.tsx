import React from 'react';
import { ModalProps } from '../types';

const Modal: React.FC<ModalProps> = ({ isActive, title, content, onClose }) => {
  return (
    <div className={`modal ${isActive ? 'is-active' : ''}`}>
      <div className="modal-background"></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button className="button is-white modal-close-button" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>
        <section className="modal-card-body">
          {content}
        </section>
        <footer className="modal-card-foot">
          {/* Footer content can be added here if needed */}
        </footer>
      </div>
    </div>
  );
};

export default Modal;