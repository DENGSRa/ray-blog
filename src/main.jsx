import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './styles/interactions.css';
import './styles/custom.css';

createRoot(document.getElementById('root')).render(<App />);
