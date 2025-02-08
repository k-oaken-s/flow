import React from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';
import ProcessingStatus from './components/ProcessingStatus';

const App = () => {
    return (
        <ThemeProvider>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 overflow-auto pb-16">
                        <MainContent />
                    </div>
                    <ProcessingStatus />
                </div>
            </div>
        </ThemeProvider>
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

export default App;