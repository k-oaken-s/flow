import React from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import './styles/global.css';

const App = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <MainContent />
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}