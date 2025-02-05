import React from 'react';

declare global {
  interface Window {
    electronAPI: {
      selectFiles: () => Promise<string[]>;
      selectFolder: () => Promise<string>;
    }
  }
}

const FileSelector: React.FC = () => {
  const handleFileSelect = async () => {
    try {
      const filePaths = await window.electronAPI.selectFiles();
      if (filePaths.length > 0) {
        console.log('Selected files:', filePaths);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  const handleFolderSelect = async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        console.log('Selected folder:', folderPath);
      }
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