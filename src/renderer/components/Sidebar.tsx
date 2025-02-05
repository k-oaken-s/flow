import React from 'react';
import ThemeToggle from './ThemeToggle';

const Sidebar: React.FC = () => {
    return (
        <div className="w-64 h-screen bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700">
            <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-xl font-bold">Flow</div>
                    <ThemeToggle />
                </div>
                <nav>
                    <ul className="space-y-2">
                        <li className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            すべての動画
                        </li>
                        <li className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            最近追加
                        </li>
                        <li className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            お気に入り
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;