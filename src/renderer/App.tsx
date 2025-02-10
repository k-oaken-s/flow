import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './styles/global.css';
import ProcessingStatus from './components/ProcessingStatus';
import TagManagerModal from './components/TagManagerModal';
import { Tag } from '../types/store';

// 内部コンポーネントを作成
const AppContent = () => {
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const { setTheme } = useTheme();

    // テーマの初期化と同期
    useEffect(() => {
        const handleThemeToggle = (isDark: boolean) => {
            setTheme(isDark ? 'dark' : 'light');
        };

        const unsubscribeToggleTheme = window.electronAPI.onMenuToggleTheme(handleThemeToggle);
        return () => unsubscribeToggleTheme();
    }, [setTheme]);

    // タグの読み込み
    useEffect(() => {
        const loadTags = async () => {
            try {
                const loadedTags = await window.electronAPI.getTags();
                setTags(loadedTags);
            } catch (error) {
                console.error('Error loading tags:', error);
            }
        };
        loadTags();

        const unsubscribe = window.electronAPI.onTagsUpdated(() => {
            loadTags();
        });

        return () => unsubscribe();
    }, []);

    // タグ管理のハンドラー
    const handleAddTag = async (name: string, color: string) => {
        try {
            await window.electronAPI.addTag(name, color);
            const updatedTags = await window.electronAPI.getTags();
            setTags(updatedTags);
            window.electronAPI.notifyTagsUpdated();
        } catch (error) {
            console.error('Error adding tag:', error);
        }
    };

    const handleRemoveTag = async (id: string) => {
        try {
            await window.electronAPI.removeTag(id);
            const updatedTags = await window.electronAPI.getTags();
            setTags(updatedTags);
            window.electronAPI.notifyTagsUpdated();
        } catch (error) {
            console.error('Error removing tag:', error);
        }
    };

    useEffect(() => {
        // メニューからのファイル追加イベントを監視
        const unsubscribeFiles = window.electronAPI.onMenuSelectFiles(() => {
            window.electronAPI.selectFiles();
        });

        // メニューからのフォルダ追加イベントを監視
        const unsubscribeFolder = window.electronAPI.onMenuSelectFolder(() => {
            window.electronAPI.selectFolder();
        });

        // タグ管理メニューのイベントリスナーを追加
        const unsubscribeTagManager = window.electronAPI.onMenuOpenTagManager(() => {
            setIsTagManagerOpen(true);
        });

        // データリセットメニューのイベントリスナーを追加
        const unsubscribeResetData = window.electronAPI.onMenuResetData(() => {
            if (window.confirm('すべてのデータをリセットしますか？\nこの操作は取り消せません。')) {
                window.electronAPI.resetStore().then(() => {
                    window.location.reload();
                });
            }
        });

        // データフォルダを開くメニューのイベントリスナー
        const unsubscribeOpenStorePath = window.electronAPI.onMenuOpenStorePath(() => {
            window.electronAPI.openStorePath();
        });

        // バージョン情報表示のイベントリスナー
        const unsubscribeShowVersion = window.electronAPI.onMenuShowVersion(async () => {
            const version = await window.electronAPI.getAppVersion();
            alert(`Flow バージョン: ${version}`);
        });

        return () => {
            unsubscribeFiles();
            unsubscribeFolder();
            unsubscribeTagManager();
            unsubscribeResetData();
            unsubscribeOpenStorePath();
            unsubscribeShowVersion();
        };
    }, []);

    return (
        <div className="flex h-screen">
            <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col relative">
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                    <MainContent />
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-10">
                    <ProcessingStatus />
                </div>
            </div>
            <TagManagerModal
                isOpen={isTagManagerOpen}
                onClose={() => setIsTagManagerOpen(false)}
                tags={tags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
            />
        </div>
    );
};

// メインのAppコンポーネント
const App = () => {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
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

export default App;