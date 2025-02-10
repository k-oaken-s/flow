import React from 'react';
import { Play } from 'lucide-react';

const Title: React.FC = () => {
    return (
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full px-6">
                <div className="flex items-center gap-2">
                    {/* ロゴマーク */}
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                    {/* アプリ名 */}
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Flow
                        </h1>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            Video Manager
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Title;