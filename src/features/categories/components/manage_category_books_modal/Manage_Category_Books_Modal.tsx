import { useState, useEffect, useMemo } from 'react';
import { useBooks } from '../../../books/hooks/use_books';
import type { Category } from '../../types/categories.api.types';
import './Manage_Category_Books_Modal.scss';

interface ManageCategoryBooksModalProps {
     isOpen: boolean;
     onClose: () => void;
     category: Category;
     onAssign: (bookIds: string[]) => Promise<void>;
}

const Manage_Category_Books_Modal = ({
     isOpen,
     onClose,
     category,
     onAssign,
}: ManageCategoryBooksModalProps) => {
     const { books, fetchBooks } = useBooks();
     const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
     const [searchQuery, setSearchQuery] = useState('');
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (isOpen) {
               fetchBooks();
               setSearchQuery('');
               setError(null);
          }
     }, [isOpen, fetchBooks]);

     // Initialize selected book IDs when books list and category are ready
     useEffect(() => {
          if (isOpen && books) {
               const initialSelected = books
                    .filter((book) => book.category_ids?.includes(category.id))
                    .map((book) => book.id);
               setSelectedBookIds(initialSelected);
          }
     }, [isOpen, books, category.id]);

     const filteredBooks = useMemo(() => {
          if (!searchQuery.trim()) return books;
          const q = searchQuery.toLowerCase().trim();
          return books.filter(
               (b) =>
                    b.title.toLowerCase().includes(q) ||
                    b.author?.toLowerCase().includes(q)
          );
     }, [books, searchQuery]);

     const handleToggleBook = (bookId: string) => {
          setSelectedBookIds((prev) =>
               prev.includes(bookId)
                    ? prev.filter((id) => id !== bookId)
                    : [...prev, bookId]
          );
     };

     const handleSelectAllFiltered = () => {
          const filteredIds = filteredBooks.map((b) => b.id);
          setSelectedBookIds((prev) => {
               const union = new Set([...prev, ...filteredIds]);
               return Array.from(union);
          });
     };

     const handleClearAllFiltered = () => {
          const filteredIds = filteredBooks.map((b) => b.id);
          setSelectedBookIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitting(true);
          setError(null);
          try {
               await onAssign(selectedBookIds);
               onClose();
          } catch (err: any) {
               setError(err.message || 'Failed to save book assignments.');
          } finally {
               setIsSubmitting(false);
          }
     };

     if (!isOpen) return null;

     return (
          <div className="manage_books_modal__overlay" onClick={onClose}>
               <div
                    className="manage_books_modal__content"
                    onClick={(e) => e.stopPropagation()}
               >
                    <div className="manage_books_modal__header">
                         <div>
                              <h2>Manage Books in &ldquo;{category.category_name}&rdquo;</h2>
                              <p>Select books to include in this category.</p>
                         </div>
                         <button
                              type="button"
                              className="manage_books_modal__close"
                              onClick={onClose}
                              aria-label="Close modal"
                         >
                              <svg
                                   viewBox="0 0 24 24"
                                   fill="none"
                                   stroke="currentColor"
                                   strokeWidth="2"
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                              >
                                   <line x1="18" y1="6" x2="6" y2="18" />
                                   <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                         </button>
                    </div>

                    <form onSubmit={handleSubmit} className="manage_books_modal__form">
                         {error && <div className="manage_books_modal__error">{error}</div>}

                         <div className="manage_books_modal__search_wrap">
                              <span className="manage_books_modal__search_icon">
                                   <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                   >
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                   </svg>
                              </span>
                              <input
                                   type="search"
                                   className="manage_books_modal__search"
                                   placeholder="Search books by title or author..."
                                   value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}
                              />
                         </div>

                         <div className="manage_books_modal__bulk_actions">
                              <button
                                   type="button"
                                   className="manage_books_modal__bulk_btn"
                                   onClick={handleSelectAllFiltered}
                              >
                                   Select All Filtered
                              </button>
                              <button
                                   type="button"
                                   className="manage_books_modal__bulk_btn manage_books_modal__bulk_btn--clear"
                                   onClick={handleClearAllFiltered}
                              >
                                   Clear All Filtered
                              </button>
                         </div>

                         <div className="manage_books_modal__list">
                              {filteredBooks.map((book) => (
                                   <label
                                        key={book.id}
                                        className={`manage_books_modal__item ${
                                             selectedBookIds.includes(book.id)
                                                  ? 'manage_books_modal__item--selected'
                                                  : ''
                                        }`}
                                   >
                                        <input
                                             type="checkbox"
                                             checked={selectedBookIds.includes(book.id)}
                                             onChange={() => handleToggleBook(book.id)}
                                        />
                                        {book.cover_image_url && (
                                             <img
                                                  src={book.cover_image_url}
                                                  alt={book.title}
                                                  className="manage_books_modal__item_cover"
                                             />
                                        )}
                                        <div className="manage_books_modal__item_info">
                                             <span className="manage_books_modal__item_title">
                                                  {book.title}
                                             </span>
                                             <span className="manage_books_modal__item_author">
                                                  by {book.author || 'Unknown'}
                                             </span>
                                        </div>
                                   </label>
                              ))}

                              {filteredBooks.length === 0 && (
                                   <div className="manage_books_modal__empty">
                                        No books found matching search criteria.
                                   </div>
                              )}
                         </div>

                         <div className="manage_books_modal__actions">
                              <button
                                   type="button"
                                   className="manage_books_modal__btn--cancel"
                                   onClick={onClose}
                                   disabled={isSubmitting}
                              >
                                   Cancel
                              </button>
                              <button
                                   type="submit"
                                   className="manage_books_modal__btn--submit"
                                   disabled={isSubmitting}
                              >
                                   {isSubmitting ? 'Saving...' : 'Save Assignments'}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
};

export default Manage_Category_Books_Modal;
