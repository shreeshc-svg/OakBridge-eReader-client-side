import { apiClient } from '../../../config/axios.config';

export interface Highlight {
    id: string;
    book_id: string;
    cfi_range: string;
    text: string;
    color: string;
    note?: string | null;
    created_at: string;
}

export interface ReadingProgress {
    id: string;
    user_id: string;
    book_id: string;
    current_chapter: string | null;
    current_cfi: string | null;
    progress_percentage: number;
    time_left: string | null;
    last_read_at: string;
}

export interface Bookmark {
    id: string;
    book_id: string;
    cfi: string;
    label?: string | null;
    created_at: string;
}

export const reader_api = {
    get_progress: async (book_id: string): Promise<ReadingProgress | null> => {
        const response = await apiClient.get(`/reader/progress/${book_id}`);
        return response.data.data;
    },
    update_progress: async (book_id: string, progress_percentage: number, current_cfi?: string, current_chapter?: string): Promise<ReadingProgress> => {
        const response = await apiClient.post(`/reader/progress/${book_id}`, { progress_percentage, current_cfi, current_chapter });
        return response.data.data;
    },
    get_highlights: async (book_id: string): Promise<Highlight[]> => {
        const response = await apiClient.get(`/reader/highlights/${book_id}`);
        return response.data.data;
    },
    add_highlight: async (book_id: string, cfi_range: string, text: string, color: string, note?: string): Promise<Highlight> => {
        const response = await apiClient.post('/reader/highlights', { book_id, cfi_range, text, color, note });
        return response.data.data;
    },
    remove_highlight: async (highlight_id: string): Promise<void> => {
        await apiClient.delete(`/reader/highlights/${highlight_id}`);
    },
    get_bookmarks: async (book_id: string): Promise<Bookmark[]> => {
        const response = await apiClient.get(`/reader/bookmarks/${book_id}`);
        return response.data.data;
    },
    add_bookmark: async (book_id: string, cfi: string, label?: string): Promise<Bookmark> => {
        const response = await apiClient.post('/reader/bookmarks', { book_id, cfi, label });
        return response.data.data;
    },
    remove_bookmark: async (bookmark_id: string): Promise<void> => {
        await apiClient.delete(`/reader/bookmarks/${bookmark_id}`);
    }
};
