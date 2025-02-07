export interface FilterState {
    searchQuery: string;
    selectedTagIds: string[];
    isFavoriteOnly: boolean;
    sortBy: 'filename' | 'added' | 'playCount';
    sortOrder: 'asc' | 'desc';
}