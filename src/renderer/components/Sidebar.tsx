import React, { useCallback, useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Tag, WatchFolder } from 'src/types/store';
import TagManagerModal from './TagManagerModal';
import { formatDuration, formatFileSize } from '../utils/format';
import { Statistics } from 'src/types/global';
import { FilterState } from 'src/types/filter';
import { Search, Star, X, FolderOpen, Clock, Hash, SortAsc, ChevronDown, LayoutGrid } from 'lucide-react';
import { debounce } from 'lodash';
import Title from './Title';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar: React.FC = () => {
    // フィルター状態
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [isFavoriteOnly, setIsFavoriteOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'filename' | 'added' | 'playCount'>('added');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // その他の状態
    const [watchFolders, setWatchFolders] = useState<WatchFolder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [stats, setStats] = useState<Statistics | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
    const [appVersion, setAppVersion] = useState<string>('');

    // フィルター変更時にMainContentに通知
    const notifyFilterChange = useCallback((newFilter: FilterState) => {
        window.electronAPI.notifyFilterChanged(newFilter);
    }, []);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const statistics = await window.electronAPI.getStatistics();
                setStats(statistics);
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        };
        loadStats();

        const unsubscribe = window.electronAPI.onVideosUpdated(() => {
            loadStats();
        });

        return () => unsubscribe();
    }, []);

    const loadTags = useCallback(async () => {
        try {
            const loadedTags = await window.electronAPI.getTags();
            setTags(loadedTags);
        } catch (error) {
            console.error('Error loading tags:', error);
            setTags([]);
        }
    }, []);
    useEffect(() => {
        loadTags();
    }, [loadTags]);
    useEffect(() => {
        const unsubscribe = window.electronAPI.onTagsUpdated(() => {
            loadTags();
        });
        return () => unsubscribe();
    }, [loadTags]);

    const handleTagToggle = (tagId: string) => {
        const newSelectedTags = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter(id => id !== tagId)
            : [...selectedTagIds, tagId];

        setSelectedTagIds(newSelectedTags);
        notifyFilterChange({
            searchQuery,
            selectedTagIds: newSelectedTags,
            isFavoriteOnly,
            sortBy,
            sortOrder
        });
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedTagIds([]);
        setIsFavoriteOnly(false);
        setSortBy('added');
        setSortOrder('desc');
        notifyFilterChange({
            searchQuery: '',
            selectedTagIds: [],
            isFavoriteOnly: false,
            sortBy: 'added',
            sortOrder: 'desc'
        });
    };

    const handleSortChange = (by: typeof sortBy, order: typeof sortOrder) => {
        setSortBy(by);
        setSortOrder(order);
        window.electronAPI.notifyFilterChanged({ selectedTagIds: selectedTagIds, isFavoriteOnly, sortBy: by, sortOrder: order, searchQuery });
    };

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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        notifyFilterChange({
            searchQuery: query,
            selectedTagIds,
            isFavoriteOnly,
            sortBy,
            sortOrder
        });
    };

    // 監視フォルダの読み込み
    const loadWatchFolders = useCallback(async () => {
        try {
            const folders = await window.electronAPI.getWatchFolders();
            setWatchFolders(folders);
        } catch (error) {
            console.error('Error loading watch folders:', error);
            setWatchFolders([]);
        }
    }, []);

    // 初期読み込みと更新監視
    useEffect(() => {
        loadWatchFolders();

        const unsubscribe = window.electronAPI.onWatchFoldersUpdated(() => {
            loadWatchFolders();
        });

        return () => unsubscribe();
    }, [loadWatchFolders]);

    // 監視フォルダの削除処理
    const handleRemoveWatchFolder = async (id: string) => {
        if (window.confirm('この監視フォルダを削除してもよろしいですか？')) {
            try {
                await window.electronAPI.removeWatchFolder(id);
                await loadWatchFolders();
            } catch (error) {
                console.error('Error removing watch folder:', error);
            }
        }
    };

    // アプリケーションバージョンの取得
    useEffect(() => {
        const loadAppVersion = async () => {
            try {
                const version = await window.electronAPI.getAppVersion();
                setAppVersion(version);
            } catch (error) {
                console.error('Error loading app version:', error);
            }
        };
        loadAppVersion();
    }, []);

    // ストアリセット処理
    const handleResetStore = async () => {
        if (window.confirm('すべてのデータをリセットしますか？\nこの操作は取り消せません。')) {
            try {
                await window.electronAPI.resetStore();
                // 必要に応じて他の状態もリセット
                handleResetFilters();
                setTags([]);
                setStats(null);

                // リロード
                window.location.reload();
            } catch (error) {
                console.error('Error resetting store:', error);
            }
        }
    };

    // お気に入りフィルターの切り替え
    const handleFavoriteToggle = () => {
        const newIsFavoriteOnly = !isFavoriteOnly;
        setIsFavoriteOnly(newIsFavoriteOnly);

        // フィルター変更をMainContentに通知
        notifyFilterChange({
            searchQuery,
            selectedTagIds,
            isFavoriteOnly: newIsFavoriteOnly,
            sortBy,
            sortOrder
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <Title />

            {/* 検索バー */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="動画を検索..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* フィルターセクション */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6">
                {/* お気に入りフィルター */}
                <div>
                    <button
                        onClick={handleFavoriteToggle}
                        className={`flex items-center w-full px-3 py-2.5 rounded-xl transition-all ${isFavoriteOnly
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        <Star className={`w-4 h-4 ${isFavoriteOnly ? 'fill-current' : ''}`} />
                        <span className="ml-3 text-sm font-medium">お気に入り</span>
                        {isFavoriteOnly && (
                            <span className="ml-auto text-xs font-medium px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                ON
                            </span>
                        )}
                    </button>
                </div>

                {/* 並び替え */}
                <div className="space-y-2">
                    <div className="flex items-center px-3">
                        <LayoutGrid className="w-4 h-4 text-gray-400" />
                        <h3 className="ml-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">表示順</h3>
                        <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
                    </div>
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [by, order] = e.target.value.split('-');
                            handleSortChange(by as typeof sortBy, order as typeof sortOrder);
                        }}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    >
                        <option value="added-desc">追加日時（新しい順）</option>
                        <option value="added-asc">追加日時（古い順）</option>
                        <option value="filename-asc">ファイル名（A-Z）</option>
                        <option value="filename-desc">ファイル名（Z-A）</option>
                        <option value="playCount-desc">再生回数（多い順）</option>
                        <option value="playCount-asc">再生回数（少ない順）</option>
                    </select>
                </div>

                {/* タグフィルター */}
                <div className="space-y-2">
                    <div className="flex items-center px-3">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <h3 className="ml-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">タグ</h3>
                    </div>
                    <div className="space-y-1">
                        {tags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => handleTagToggle(tag.id)}
                                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all ${selectedTagIds.includes(tag.id)
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <span className="text-sm">{tag.name}</span>
                                {selectedTagIds.includes(tag.id) && (
                                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/40">
                                        選択中
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 監視フォルダ */}
                <div className="space-y-2">
                    <div className="flex items-center px-3">
                        <FolderOpen className="w-4 h-4 text-gray-400" />
                        <h3 className="ml-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">監視フォルダ</h3>
                    </div>
                    {watchFolders.length === 0 ? (
                        <p className="px-3 text-sm text-gray-400 dark:text-gray-500 italic">
                            監視フォルダが設定されていません
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {watchFolders.map(folder => (
                                <div
                                    key={folder.id}
                                    className="group flex items-center px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                                >
                                    <p className="flex-1 truncate text-sm text-gray-600 dark:text-gray-300" title={folder.path}>
                                        {folder.path}
                                    </p>
                                    <button
                                        onClick={() => handleRemoveWatchFolder(folder.id)}
                                        className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500 rounded-lg transition-all"
                                        title="監視フォルダを削除"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 統計情報 */}
            {stats && (
                <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3">統計情報</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>総動画数</span>
                            <span className="font-medium">{stats.totalVideos}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>総再生時間</span>
                            <span className="font-medium">{formatDuration(stats.totalDuration)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                            <span>使用容量</span>
                            <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;