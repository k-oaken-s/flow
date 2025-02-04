import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Flow</h1>
            <p className="text-gray-600">Video Management Application</p>
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