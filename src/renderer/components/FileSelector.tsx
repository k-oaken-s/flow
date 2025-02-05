import React from 'react';

interface FileSelectorProps {
    onFilesAdded: () => Promise<void>;
}

const FileSelector: React.FC<FileSelectorProps> = ({ onFilesAdded }) => {
    const handleFileSelect = async () => {
        try {
            await window.electronAPI.selectFiles();
            await onFilesAdded();
        } catch (error) {
            console.error('Error selecting files:', error);
        }
    };

    const handleFolderSelect = async () => {
        try {
            await window.electronAPI.selectFolder();
            await onFilesAdded();
        } catch (error) {
            console.error('Error selecting folder:', error);
        }
    };

    return (
        <div className="flex gap-4">
            <button
                onClick={handleFileSelect}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
                動画ファイルを選択
            </button>
            <button
                onClick={handleFolderSelect}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors"
            >
                フォルダを選択
            </button>
        </div>
    );
};

export default FileSelector;