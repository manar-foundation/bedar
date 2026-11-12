import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { initUtmTracking } from '@utils/utm.js';
import './styles/index.css';

// Capture UTM parameters from the landing URL and forward them to Zoho
// Forms links site-wide. See utils/utm.js.
initUtmTracking();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
