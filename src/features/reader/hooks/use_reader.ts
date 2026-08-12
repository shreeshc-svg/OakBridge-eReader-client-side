import { useState, useCallback, useEffect } from 'react';
import { reader_api, type Highlight, type ReadingProgress, type Bookmark } from '../api/reader.api';

export const useReader = (book_id: string | undefined) => {
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
    const [progressData, setProgressData] = useState<ReadingProgress | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

    const fetchHighlights = useCallback(async () => {
        if (!book_id) return;
        setIsLoadingHighlights(true);
        try {
            const data = await reader_api.get_highlights(book_id);
            setHighlights(data);
        } catch (error) {
            console.error('Failed to fetch highlights:', error);
        } finally {
            setIsLoadingHighlights(false);
        }
    }, [book_id]);

    const fetchProgress = useCallback(async () => {
        if (!book_id) return;
        setIsLoadingProgress(true);
        try {
            const data = await reader_api.get_progress(book_id);
            setProgressData(data);
            return data;
        } catch (error) {
            console.error('Failed to fetch progress:', error);
            return null;
        } finally {
            setIsLoadingProgress(false);
        }
    }, [book_id]);

    const fetchBookmarks = useCallback(async () => {
        if (!book_id) return;
        setIsLoadingBookmarks(true);
        try {
            const data = await reader_api.get_bookmarks(book_id);
            setBookmarks(data);
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
        } finally {
            setIsLoadingBookmarks(false);
        }
    }, [book_id]);

    useEffect(() => {
        if (book_id) {
            fetchHighlights();
            fetchProgress();
            fetchBookmarks();
        }
    }, [book_id, fetchHighlights, fetchProgress, fetchBookmarks]);

    const saveProgress = useCallback(async (percentage: number, cfi?: string, chapter?: string) => {
        if (!book_id) return;
        try {
            const data = await reader_api.update_progress(book_id, percentage, cfi, chapter);
            setProgressData(data);
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }, [book_id]);

    const addHighlight = useCallback(async (cfi_range: string, text: string, color: string, note?: string) => {
        if (!book_id) return;
        try {
            const newHighlight = await reader_api.add_highlight(book_id, cfi_range, text, color, note);
            setHighlights(prev => [...prev, newHighlight]);
            return newHighlight;
        } catch (error) {
            console.error('Failed to add highlight:', error);
            throw error;
        }
    }, [book_id]);

    const removeHighlight = useCallback(async (highlight_id: string) => {
        try {
            await reader_api.remove_highlight(highlight_id);
            setHighlights(prev => prev.filter(h => h.id !== highlight_id));
        } catch (error) {
            console.error('Failed to remove highlight:', error);
            throw error;
        }
    }, []);



    const addBookmark = useCallback(async (cfi: string, label?: string) => {
        if (!book_id) return;
        try {
            const newBookmark = await reader_api.add_bookmark(book_id, cfi, label);
            setBookmarks(prev => [...prev, newBookmark]);
            return newBookmark;
        } catch (error) {
            console.error('Failed to add bookmark:', error);
            throw error;
        }
    }, [book_id]);

    const removeBookmark = useCallback(async (bookmark_id: string) => {
        try {
            await reader_api.remove_bookmark(bookmark_id);
            setBookmarks(prev => prev.filter(b => b.id !== bookmark_id));
        } catch (error) {
            console.error('Failed to remove bookmark:', error);
            throw error;
        }
    }, []);

    return { 
        highlights, isLoadingHighlights, fetchHighlights, addHighlight, removeHighlight,
        progressData, isLoadingProgress, fetchProgress, saveProgress,
        bookmarks, isLoadingBookmarks, fetchBookmarks, addBookmark, removeBookmark
    };
};
