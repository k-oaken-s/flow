import React from 'react';
import Header from './Header';

const MainContent: React.FC = () => {
    return (
        <div className="flex flex-col flex-1 h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-800 dark:text-white">ビデオタイトル {i}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">00:00:00</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MainContent;