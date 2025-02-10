import React from 'react';
import { Play, Minus, Square, X } from 'lucide-react';

const Title: React.FC = () => {
    const handleMinimize = () => {
        window.electronAPI.windowControl('minimize');
    };

    const handleMaximize = () => {
        window.electronAPI.windowControl('maximize');
    };

    const handleClose = () => {
        window.electronAPI.windowControl('close');
    };

    return (
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between h-full px-4 -webkit-app-region-drag">
                {/* ロゴとタイトル */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Flow
                        </h1>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            Video Manager
                        </span>
                    </div>
                </div>

                {/* ウィンドウコントロール */}
                <div className="flex items-center -webkit-app-region-no-drag">
                    <button
                        onClick={handleMinimize}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <Minus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={handleMaximize}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <Square className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-red-500 rounded-lg group"
                    >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Title;