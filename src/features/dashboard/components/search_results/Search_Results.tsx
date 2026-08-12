import { useState } from 'react';
import type { Book } from '../../../books/types/books.api.types';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../../../../components/common/skeleton/Skeleton';
import './Search_Results.scss';

interface SearchResultsProps {
     books: Book[];
     query: string;
     isLoading: boolean;
     onClearSearch?: () => void;
}

const Search_Results = ({ books, query, isLoading, onClearSearch }: SearchResultsProps) => {
     const navigate = useNavigate();
     const [activeFilter, setActiveFilter] = useState<'all' | 'title' | 'author' | 'isbn'>('all');

     const filteredBooks = books.filter((book) => {
          const q = query.toLowerCase();
          if (activeFilter === 'title') return book.title?.toLowerCase().includes(q);
          if (activeFilter === 'author') return (book.author || book.publisher || '').toLowerCase().includes(q);
          if (activeFilter === 'isbn') return book.isbn?.toLowerCase().includes(q);
          return true;
     });

     if (isLoading) {
          return (
               <div className="search_results">
                    <Skeleton width="300px" height="32px" style={{ marginBottom: 24 }} />
                    <div className="search_results__grid">
                         {[...Array(6)].map((_, i) => (
                              <div key={i} className="search_results__card">
                                   <Skeleton className="search_results__cover" />
                                   <div className="search_results__info">
                                        <Skeleton width="80%" height="18px" />
                                        <Skeleton width="40%" height="14px" />
                                   </div>
                              </div>
                         ))}
                    </div>
               </div>
          );
     }

     return (
          <div className="search_results">
               <div className="search_results__header">
                    <div>
                         <h2 className="search_results__title">
                              Manuscript & Book Search Results for <span className="search_results__query">"{query}"</span>
                         </h2>
                         <p className="search_results__count">
                              Found {filteredBooks.length} {filteredBooks.length === 1 ? 'manuscript / book' : 'manuscripts / books'}
                         </p>
                    </div>

                    {onClearSearch && (
                         <button
                              type="button"
                              className="search_results__clear_btn"
                              onClick={onClearSearch}
                         >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                   <line x1="18" y1="6" x2="6" y2="18" />
                                   <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              Clear Search
                         </button>
                    )}
               </div>

               <div className="search_results__filters">
                    {(['all', 'title', 'author', 'isbn'] as const).map((filter) => (
                         <button
                              key={filter}
                              type="button"
                              className={`search_results__filter_btn ${activeFilter === filter ? 'search_results__filter_btn--active' : ''}`}
                              onClick={() => setActiveFilter(filter)}
                         >
                              {filter === 'all' ? 'All Results' : `By ${filter.toUpperCase()}`}
                         </button>
                    ))}
               </div>

               {filteredBooks.length === 0 ? (
                    <div className="search_results__empty">
                         <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#94a3b8', marginBottom: 12 }}>
                              <circle cx="11" cy="11" r="8" />
                              <path d="m21 21-4.35-4.35" />
                              <path d="M8 11h6" />
                         </svg>
                         <h3>No manuscripts or books found</h3>
                         <p>No results matching "{query}". Try searching by title, author name, or ISBN number.</p>
                    </div>
               ) : (
                    <div className="search_results__grid">
                         {filteredBooks.map((book) => (
                              <div key={book.id} className="search_results__card">
                                   <div
                                        className="search_results__cover"
                                        onClick={() => navigate(`/book/${book.id}`)}
                                   >
                                        {book.cover_image_url ? (
                                             <img
                                                  src={book.cover_image_url}
                                                  alt={book.title}
                                                  onError={(e) => {
                                                       (e.target as HTMLElement).style.display = 'none';
                                                  }}
                                             />
                                        ) : (
                                             <div className="search_results__cover_fallback">
                                                  <span>{book.title?.slice(0, 2).toUpperCase()}</span>
                                             </div>
                                        )}
                                        <div className="search_results__badge">
                                             {!book.price || book.price <= 0 ? 'FREE' : `₹${(book.price / 100).toLocaleString('en-IN')}`}
                                        </div>
                                   </div>
                                   <div className="search_results__info">
                                        <h3
                                             className="search_results__book_title"
                                             onClick={() => navigate(`/book/${book.id}`)}
                                             title={book.title}
                                        >
                                             {book.title}
                                        </h3>
                                        <p className="search_results__book_author">
                                             by {book.author || book.publisher || 'Unknown Author'}
                                        </p>
                                        <div className="search_results__meta">
                                             <span>{book.language || 'English'}</span>
                                             {book.total_pages && <span> &bull; {book.total_pages} pages</span>}
                                             {book.isbn && <span> &bull; ISBN: {book.isbn}</span>}
                                        </div>
                                        <div className="search_results__actions">
                                             <button
                                                  type="button"
                                                  className="search_results__action_btn search_results__action_btn--primary"
                                                  onClick={() => navigate(`/reader/${book.id}`)}
                                             >
                                                  Read
                                             </button>
                                             <button
                                                  type="button"
                                                  className="search_results__action_btn search_results__action_btn--secondary"
                                                  onClick={() => navigate(`/book/${book.id}`)}
                                             >
                                                  Details
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
          </div>
     );
};

export default Search_Results;
