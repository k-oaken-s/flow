// components/TagEditModal.tsx
import React, { useState, useEffect } from 'react';
import { Tag } from '../../types/store';
import { X } from 'lucide-react';

interface TagEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTagIds: string[];
    allTags: Tag[];
    onTagsUpdate: (tagIds: string[]) => void;
}

const TagEditModal: React.FC<TagEditModalProps> = ({
    isOpen,
    onClose,
    selectedTagIds,
    allTags,
    onTagsUpdate,
}) => {
    // 一時的な選択状態を保持
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

    // モーダルが開かれた時に現在の選択状態を設定
    useEffect(() => {
        if (isOpen) {
            setTempSelectedIds([...selectedTagIds]);
        }
    }, [isOpen, selectedTagIds]);

    if (!isOpen) return null;

    const selectedTags = allTags.filter(tag => tempSelectedIds.includes(tag.id));
    const availableTags = allTags.filter(tag => !tempSelectedIds.includes(tag.id));

    const handleRemoveTag = (tagId: string) => {
        setTempSelectedIds(current => current.filter(id => id !== tagId));
    };

    const handleAddTag = (tagId: string) => {
        setTempSelectedIds(current => [...current, tagId]);
    };

    const handleSave = () => {
        onTagsUpdate(tempSelectedIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">タグを編集</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 設定済みタグ */}
                {selectedTags.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2">設定済みタグ</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map(tag => (
                                <div
                                    key={tag.id}
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-white"
                                    style={{ backgroundColor: tag.color }}
                                >
                                    <span>{tag.name}</span>
                                    <button
                                        onClick={() => handleRemoveTag(tag.id)}
                                        className="p-0.5 hover:bg-white/20 rounded-full"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 追加可能なタグ */}
                <div className="mb-6">
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2">追加可能なタグ</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => handleAddTag(tag.id)}
                                className="px-2 py-1 rounded-full border text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                style={{ borderColor: tag.color, color: tag.color }}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* アクションボタン */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TagEditModal;