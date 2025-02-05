import React from 'react';
import FileSelector from './FileSelector';

interface HeaderProps {
    onVideosUpdated: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ onVideosUpdated }) => {
    return (
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <div className="flex items-center">
                <input
                    type="text"
                    placeholder="検索..."
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>
            <FileSelector onFilesAdded={onVideosUpdated} />
        </div>
    );
};

export default Header;