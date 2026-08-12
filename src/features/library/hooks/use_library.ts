import { useState, useCallback } from 'react';
import { library_api } from '../api/library.api';
import { useAuthStore } from '../../../store/auth.store';

export const useLibrary = () => {
     const [libraryBookIds, setLibraryBookIds] = useState<Set<string>>(new Set());
     const [libraryItems, setLibraryItems] = useState<any[]>([]);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const accessToken = useAuthStore((state) => state.accessToken);

     const fetchLibrary = useCallback(async () => {
          if (!accessToken) return;
          setIsLoading(true);
          setError(null);
          try {
               const response = await library_api.get_my_library(accessToken);
               setLibraryItems(response.data);
               const ids = new Set<string>(response.data.map((item: any) => item.book_id));
               setLibraryBookIds(ids);
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               setError(
                    errorObj.response?.data?.message || 'Failed to fetch library'
               );
          } finally {
               setIsLoading(false);
          }
     }, [accessToken]);

     const addToLibrary = async (book_id: string) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               await library_api.add_to_library(book_id, accessToken);
               setLibraryBookIds((prev) => {
                    const next = new Set(prev);
                    next.add(book_id);
                    return next;
               });
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message || 'Failed to add to library';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     const removeFromLibrary = async (book_id: string) => {
          if (!accessToken) throw new Error('Not authenticated');
          setIsLoading(true);
          setError(null);
          try {
               await library_api.remove_from_library(book_id, accessToken);
               setLibraryBookIds((prev) => {
                    const next = new Set(prev);
                    next.delete(book_id);
                    return next;
               });
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errMsg =
                    errorObj.response?.data?.message || 'Failed to remove from library';
               setError(errMsg);
               throw new Error(errMsg, { cause: err });
          } finally {
               setIsLoading(false);
          }
     };

     return {
          libraryBookIds,
          libraryItems,
          isLoading,
          error,
          fetchLibrary,
          addToLibrary,
          removeFromLibrary,
     };
};
