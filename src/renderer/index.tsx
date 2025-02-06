import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}