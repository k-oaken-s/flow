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
                <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg">
                    <Sidebar />
                </div>
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 overflow-auto pb-16">
                        <MainContent />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0">
                        <ProcessingStatus />
                    </div>
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