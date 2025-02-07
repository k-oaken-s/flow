import React, { useCallback, useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Tag } from 'src/types/store';
import TagManagerModal from './TagManagerModal';
import { formatDuration, formatFileSize } from '../utils/format';
import { Statistics } from 'src/types/global';
import { FilterState } from 'src/types/filter';
import { ChevronDown, Search, Star } from 'lucide-react';
import { debounce } from 'lodash';
import Title from './Title';

const Sidebar: React.FC = () => {
    // フィルター状態
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [isFavoriteOnly, setIsFavoriteOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'filename' | 'added' | 'playCount'>('added');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // その他の状態
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

    const handleSearch = debounce((query: string) => {
        setSearchQuery(query);
        notifyFilterChange({
            searchQuery: query,
            selectedTagIds,
            isFavoriteOnly,
            sortBy,
            sortOrder
        });
    }, 300) as (query: string) => void;

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

    return (
        <div className="w-64 h-screen bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* タイトル */}
            <Title />

            {/* メニュー */}
            <div className="p-4 flex-grow overflow-auto">
                {/* 検索バー */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="動画を検索..."
                            className="w-full pl-10 pr-3 py-2 bg-transparent border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                {/* フィルターリセットボタン */}
                <button
                    onClick={handleResetFilters}
                    className="w-full mb-4 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                    フィルターをリセット
                </button>

                {/* お気に入りフィルター */}
                <div className="mb-6">
                    <button
                        onClick={() => {
                            setIsFavoriteOnly(!isFavoriteOnly);
                            notifyFilterChange({
                                searchQuery,
                                selectedTagIds,
                                isFavoriteOnly: !isFavoriteOnly,
                                sortBy,
                                sortOrder
                            });
                        }}
                        className={`flex items-center space-x-2 px-3 py-2 rounded w-full ${isFavoriteOnly
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <Star className={`h-4 w-4 ${isFavoriteOnly ? 'fill-current' : ''}`} />
                        <span>お気に入りのみ表示</span>
                    </button>
                </div>

                {/* タグフィルター */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">タグ</h3>
                    <div className="space-y-1">
                        {tags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => handleTagToggle(tag.id)}
                                className={`flex items-center w-full px-2 py-1 rounded ${selectedTagIds.includes(tag.id)
                                    ? 'text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                style={{
                                    backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined
                                }}
                            >
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-sm">{tag.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 並び替え */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">並び替え</h3>
                    <select
                        className="w-full px-2 py-1 text-sm bg-transparent border rounded dark:border-gray-600"
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [by, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                            setSortBy(by);
                            setSortOrder(order);
                            notifyFilterChange({
                                searchQuery,
                                selectedTagIds,
                                isFavoriteOnly,
                                sortBy: by,
                                sortOrder: order
                            });
                        }}
                    >
                        <option value="added-desc">追加日時（新しい順）</option>
                        <option value="added-asc">追加日時（古い順）</option>
                        <option value="filename-asc">ファイル名（A-Z）</option>
                        <option value="filename-desc">ファイル名（Z-A）</option>
                        <option value="playCount-desc">再生回数（多い順）</option>
                        <option value="playCount-asc">再生回数（少ない順）</option>
                    </select>
                </div>
            </div>

            {/* 統計情報セクション */}
            {stats && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">統計情報</h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex justify-between">
                            <span>総動画数:</span>
                            <span>{stats.totalVideos}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>総再生時間:</span>
                            <span>{formatDuration(stats.totalDuration)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>使用容量:</span>
                            <span>{formatFileSize(stats.totalSize)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 設定セクション */}
            <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                    <span>設定</span>
                    <ChevronDown
                        className={`w-4 h-4 transform transition-transform ${isSettingsOpen ? 'rotate-180' : ''
                            }`}
                    />
                </button>
                {isSettingsOpen && (
                    <div className="p-4 space-y-2">
                        <button
                            onClick={() => window.electronAPI.selectFiles()}
                            className="w-full px-2 py-1 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            ファイルを追加
                        </button>
                        <button
                            onClick={() => window.electronAPI.selectFolder()}
                            className="w-full px-2 py-1 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            フォルダを追加
                        </button>
                        <button
                            onClick={() => setIsTagManagerOpen(true)}
                            className="w-full px-2 py-1 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            タグ管理
                        </button>
                        <div className="flex items-center justify-between px-2 py-1">
                            <span className="text-sm">ダークモード</span>
                            <ThemeToggle />
                        </div>

                        {/* 区切り線 */}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        {/* データリセット */}
                        <button
                            onClick={handleResetStore}
                            className="w-full px-2 py-1 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                            データをリセット
                        </button>

                        {/* バージョン情報 */}
                        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                            バージョン: {appVersion}
                        </div>
                    </div>
                )}
            </div>

            {/* タグ管理モーダル */}
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

export default Sidebar;