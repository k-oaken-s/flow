import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const Sidebar: React.FC = () => {
    const [storeInfo, setStoreInfo] = useState<any>(null);

    const handleDebugStore = async () => {
        const result = await window.electronAPI.debugStore();
        setStoreInfo(result?.content || null);
    };

    return (
        <div className="w-64 h-screen bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 flex-grow">
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

            {/* デバッグセクション */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleDebugStore}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors mb-2"
                >
                    Store情報を表示
                </button>
                {storeInfo && (
                    <div className="mt-2">
                        <div className="text-sm font-medium mb-1">Store内容:</div>
                        <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-40">
                            <pre>{JSON.stringify(storeInfo, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;