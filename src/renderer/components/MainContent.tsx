import React, { useEffect, useState } from 'react';
import Header from './Header';
import { VideoFile } from '../../types/store';

const MainContent: React.FC = () => {
    const [videos, setVideos] = useState<VideoFile[]>([]);

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        const videoList = await window.electronAPI.getVideos();
        setVideos(videoList);
    };

    const formatFileSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    return (
        <div className="flex flex-col flex-1 h-screen bg-gray-50 dark:bg-gray-900">
            <Header onVideosUpdated={loadVideos} />
            <div className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-4 gap-4">
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-800 dark:text-white truncate">
                                    {video.filename}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {formatFileSize(video.fileSize)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MainContent;