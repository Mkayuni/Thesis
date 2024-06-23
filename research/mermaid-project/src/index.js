import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import MermaidComponent from './components/MermaidComponent';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MermaidComponent />
  </React.StrictMode>
);
