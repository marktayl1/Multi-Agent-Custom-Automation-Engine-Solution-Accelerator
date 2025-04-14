import React from 'react';
import { LoadingSpinnerProps } from '../types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div id="spinnerLoader">
      <i className="fa-solid fa-circle-notch fa-spin fa-3x"></i>
      <span className="mt-3">{message}</span>
    </div>
  );
};

export default LoadingSpinner;