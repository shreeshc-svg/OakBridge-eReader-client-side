import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBooks } from '../../../books/hooks/use_books';
import type { Book } from '../../../books/types/books.api.types';
import Skeleton from '../../../../components/common/skeleton/Skeleton';
import './Search_Modal.scss';

interface SearchModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSelectBook: (book: Book) => void;
}

const SearchIcon = () => (
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
     </svg>
);

const CloseIcon = () => (
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
     </svg>
);

const Search_Modal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectBook }) => {
     const [query, setQuery] = useState('');
     const [debouncedQuery, setDebouncedQuery] = useState('');
     const [filterType, setFilterType] = useState<'title' | 'category' | 'author'>('title');
     const { books, isLoading, fetchBooks } = useBooks();
     const inputRef = useRef<HTMLInputElement>(null);

     // Handle Escape key
     useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
               if (e.key === 'Escape') onClose();
          };
          if (isOpen) {
               window.addEventListener('keydown', handleKeyDown);
               // Focus input when modal opens
               setTimeout(() => inputRef.current?.focus(), 100);
          }
          return () => window.removeEventListener('keydown', handleKeyDown);
     }, [isOpen, onClose]);

     // Prevent body scroll when open
     useEffect(() => {
          if (isOpen) {
               document.body.style.overflow = 'hidden';
          } else {
               document.body.style.overflow = 'unset';
          }
          return () => {
               document.body.style.overflow = 'unset';
          };
     }, [isOpen]);

     // Debounce logic
     useEffect(() => {
          const handler = setTimeout(() => {
               setDebouncedQuery(query);
          }, 300);
          return () => clearTimeout(handler);
     }, [query]);

     // Fetch results
     useEffect(() => {
          if (debouncedQuery.trim()) {
               const filterKey = filterType === 'title' ? 'search' : filterType;
               fetchBooks({ [filterKey]: debouncedQuery.trim() });
          }
     }, [debouncedQuery, filterType, fetchBooks]);

     if (!isOpen) return null;

     return createPortal(
          <div className="search_modal_overlay" onClick={onClose}>
               <div className="search_modal" onClick={(e) => e.stopPropagation()}>
                    <div className="search_modal__header">
                         <select
                              className="search_modal__filter"
                              value={filterType}
                              onChange={(e) => setFilterType(e.target.value as any)}
                              aria-label="Filter search"
                         >
                              <option value="title">Title</option>
                              <option value="category">Category</option>
                              <option value="author">Author</option>
                         </select>
                         <div className="search_modal__input_wrapper">
                              <SearchIcon />
                              <input
                                   ref={inputRef}
                                   type="text"
                                   className="search_modal__input"
                                   placeholder={`Search books by ${filterType}...`}
                                   value={query}
                                   onChange={(e) => setQuery(e.target.value)}
                              />
                         </div>
                         <button className="search_modal__close" onClick={onClose}>
                              <CloseIcon />
                         </button>
                    </div>

                    <div className="search_modal__content">
                         {!debouncedQuery.trim() ? (
                              <div className="search_modal__empty">
                                   <div className="search_modal__empty_icon">
                                        <SearchIcon />
                                   </div>
                                   <p>Type to start searching your next great read.</p>
                              </div>
                         ) : isLoading ? (
                              <div className="search_modal__results">
                                   {[...Array(4)].map((_, i) => (
                                        <div key={i} className="search_modal__item search_modal__item--skeleton">
                                             <Skeleton width="48px" height="72px" style={{ borderRadius: '6px' }} />
                                             <div className="search_modal__item_info">
                                                  <Skeleton width="60%" height="16px" />
                                                  <Skeleton width="40%" height="12px" style={{ marginTop: 8 }} />
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         ) : books.length > 0 ? (
                              <div className="search_modal__results">
                                   {books.map((book) => (
                                        <div
                                             key={book.id}
                                             className="search_modal__item"
                                             onClick={() => {
                                                  onSelectBook(book);
                                                  onClose();
                                             }}
                                        >
                                             <div className="search_modal__item_cover">
                                                  {book.cover_image_url ? (
                                                       <img src={book.cover_image_url} alt={book.title} />
                                                  ) : (
                                                       <div className="search_modal__item_placeholder">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                 <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                                            </svg>
                                                       </div>
                                                  )}
                                             </div>
                                             <div className="search_modal__item_info">
                                                  <h4>{book.title}</h4>
                                                  <p>{book.author || book.publisher || 'Unknown Author'} &bull; {book.language} &bull; {book.total_pages} Pages</p>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         ) : (
                              <div className="search_modal__empty">
                                   <p>No results found for "{debouncedQuery}"</p>
                              </div>
                         )}
                    </div>
               </div>
          </div>,
          document.body
     );
};

export default Search_Modal;
