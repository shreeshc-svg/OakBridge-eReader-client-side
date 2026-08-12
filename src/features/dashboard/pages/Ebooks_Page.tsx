import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../../books/hooks/use_books';
import type { Book } from '../../books/types/books.api.types';
import Book_Upload_Modal from '../../books/components/book_upload_modal/Book_Upload_Modal';
import Bulk_Upload_Modal from '../../books/components/bulk_upload_modal/Bulk_Upload_Modal';
import Skeleton from '../../../components/common/skeleton/Skeleton';
import { useDebounce } from '../../../hooks/use_debounce';
import { useAuthStore } from '../../../store/auth.store';
import { apiClient } from '../../../config/axios.config';
import './Ebooks_Page.scss';

interface EbooksPageProps {
     role?: string;
}

const Ebooks_Page = ({ role }: EbooksPageProps) => {
     const navigate = useNavigate();
     const accessToken = useAuthStore((state: any) => state.accessToken);
     const { books, isLoading, fetchBooks, createBook, updateBook, deleteBook } = useBooks();

     // Modals State
     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
     const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
     const [bookToEdit, setBookToEdit] = useState<Book | undefined>(undefined);

     // Search & Filter State
     const [searchQuery, setSearchQuery] = useState('');
     const debouncedSearch = useDebounce(searchQuery, 300);
     const [filterType, setFilterType] = useState<'all' | 'free' | 'paid'>('all');
     const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

     useEffect(() => {
          fetchBooks();
     }, [fetchBooks]);

     const handleCreateOrUpdateBook = async (payload: any) => {
          if (bookToEdit) {
               await updateBook(bookToEdit.id, payload);
          } else {
               await createBook(payload);
          }
          await fetchBooks();
          setBookToEdit(undefined);
          setIsUploadModalOpen(false);
     };

     const handleEditClick = (book: Book, e?: React.MouseEvent) => {
          e?.stopPropagation();
          setBookToEdit(book);
          setIsUploadModalOpen(true);
     };

     const handleDeleteClick = async (id: string, title: string, e?: React.MouseEvent) => {
          e?.stopPropagation();
          if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
               await deleteBook(id);
               await fetchBooks();
          }
     };

     const handleDownloadClick = async (book: Book, e?: React.MouseEvent) => {
          e?.stopPropagation();
          try {
               const response = await apiClient.get(`/books/download-book?id=${book.id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    responseType: 'blob',
               });

               const blob = new Blob([response.data], { type: 'application/pdf' });
               const url = window.URL.createObjectURL(blob);
               const link = document.createElement('a');
               link.href = url;
               const safeFilename = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
               link.setAttribute('download', safeFilename);
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link);
               window.URL.revokeObjectURL(url);
          } catch (error) {
               console.error('Failed to download PDF:', error);
               alert('Failed to download PDF. Please try again.');
          }
     };

     // Filter books
     const filteredBooks = books.filter((book) => {
          // Filter by free/paid
          if (filterType === 'free' && book.price && book.price > 0) return false;
          if (filterType === 'paid' && (!book.price || book.price <= 0)) return false;

          // Filter by search query
          if (!debouncedSearch) return true;
          const q = debouncedSearch.toLowerCase();
          return (
               book.title?.toLowerCase().includes(q) ||
               (book.author || book.publisher || '').toLowerCase().includes(q) ||
               book.isbn?.toLowerCase().includes(q) ||
               book.language?.toLowerCase().includes(q)
          );
     });

     const totalEbooks = books.length;
     const freeEbooks = books.filter((b) => !b.price || b.price <= 0).length;
     const paidEbooks = totalEbooks - freeEbooks;

     return (
          <div className="ebooks_page">
               {/* ── Page Header ── */}
               <div className="ebooks_page__header">
                    <div>
                         <h1 className="ebooks_page__title">E-Book Management</h1>
                         <p className="ebooks_page__subtitle">
                              Inspect, search, upload, and manage all manuscripts and published digital books.
                         </p>
                    </div>

                    <div className="ebooks_page__header_actions">
                         {role !== 'MANAGER' && (
                              <>
                                   <button
                                        type="button"
                                        className="ebooks_btn ebooks_btn--ghost"
                                        onClick={() => setIsBulkModalOpen(true)}
                                   >
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                             <polyline points="17 8 12 3 7 8" />
                                             <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Bulk Upload
                                   </button>
                                   <button
                                        type="button"
                                        className="ebooks_btn ebooks_btn--primary"
                                        onClick={() => {
                                             setBookToEdit(undefined);
                                             setIsUploadModalOpen(true);
                                        }}
                                   >
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                             <line x1="12" y1="5" x2="12" y2="19" />
                                             <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Upload New Ebook
                                   </button>
                              </>
                         )}
                    </div>
               </div>

               {/* ── Metric Cards ── */}
               <div className="ebooks_stats">
                    <div className="ebooks_stat_card ebooks_stat_card--indigo">
                         <div className="ebooks_stat_card__icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                   <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
                              </svg>
                         </div>
                         <div className="ebooks_stat_card__info">
                              <strong className="ebooks_stat_card__val">{totalEbooks}</strong>
                              <span className="ebooks_stat_card__lbl">Total E-Books</span>
                         </div>
                    </div>

                    <div className="ebooks_stat_card ebooks_stat_card--emerald">
                         <div className="ebooks_stat_card__icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <circle cx="12" cy="12" r="10" />
                                   <path d="m9 12 2 2 4-4" />
                              </svg>
                         </div>
                         <div className="ebooks_stat_card__info">
                              <strong className="ebooks_stat_card__val">{freeEbooks}</strong>
                              <span className="ebooks_stat_card__lbl">Free Access Books</span>
                         </div>
                    </div>

                    <div className="ebooks_stat_card ebooks_stat_card--amber">
                         <div className="ebooks_stat_card__icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <rect x="2" y="5" width="20" height="14" rx="2" />
                                   <line x1="2" y1="10" x2="22" y2="10" />
                              </svg>
                         </div>
                         <div className="ebooks_stat_card__info">
                              <strong className="ebooks_stat_card__val">{paidEbooks}</strong>
                              <span className="ebooks_stat_card__lbl">Paid E-Books</span>
                         </div>
                    </div>
               </div>

               {/* ── Toolbar (Search, Filter, View Mode) ── */}
               <div className="ebooks_toolbar">
                    <div className="ebooks_toolbar__search">
                         <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8" />
                              <path d="m21 21-4.35-4.35" />
                         </svg>
                         <input
                              type="text"
                              placeholder="Search by title, author, ISBN, language..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                         />
                         {searchQuery && (
                              <button
                                   type="button"
                                   className="ebooks_toolbar__search_clear"
                                   onClick={() => setSearchQuery('')}
                              >
                                   ✕
                              </button>
                         )}
                    </div>

                    <div className="ebooks_toolbar__filters">
                         {(['all', 'free', 'paid'] as const).map((type) => (
                              <button
                                   key={type}
                                   type="button"
                                   className={`ebooks_filter_btn ${filterType === type ? 'ebooks_filter_btn--active' : ''}`}
                                   onClick={() => setFilterType(type)}
                              >
                                   {type === 'all' ? 'All Books' : type === 'free' ? 'Free Books' : 'Paid Books'}
                              </button>
                         ))}
                    </div>

                    <div className="ebooks_toolbar__view">
                         <button
                              type="button"
                              className={`ebooks_view_btn ${viewMode === 'grid' ? 'ebooks_view_btn--active' : ''}`}
                              onClick={() => setViewMode('grid')}
                              title="Grid View"
                         >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                   <rect x="3" y="3" width="7" height="7" />
                                   <rect x="14" y="3" width="7" height="7" />
                                   <rect x="14" y="14" width="7" height="7" />
                                   <rect x="3" y="14" width="7" height="7" />
                              </svg>
                         </button>
                         <button
                              type="button"
                              className={`ebooks_view_btn ${viewMode === 'table' ? 'ebooks_view_btn--active' : ''}`}
                              onClick={() => setViewMode('table')}
                              title="Table View"
                         >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                   <line x1="8" y1="6" x2="21" y2="6" />
                                   <line x1="8" y1="12" x2="21" y2="12" />
                                   <line x1="8" y1="18" x2="21" y2="18" />
                                   <line x1="3" y1="6" x2="3.01" y2="6" />
                                   <line x1="3" y1="12" x2="3.01" y2="12" />
                                   <line x1="3" y1="18" x2="3.01" y2="18" />
                              </svg>
                         </button>
                    </div>
               </div>

               {/* ── Content View (Grid vs Table) ── */}
               {isLoading ? (
                    <div className="ebooks_grid">
                         {[...Array(6)].map((_, i) => (
                              <div key={i} className="ebooks_card ebooks_card--skeleton">
                                   <Skeleton height="260px" borderRadius="10px" />
                                   <div style={{ padding: 16 }}>
                                        <Skeleton width="80%" height="18px" style={{ marginBottom: 8 }} />
                                        <Skeleton width="50%" height="14px" />
                                   </div>
                              </div>
                         ))}
                    </div>
               ) : filteredBooks.length === 0 ? (
                    <div className="ebooks_empty">
                         <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
                         </svg>
                         <h3>No E-Books Found</h3>
                         <p>
                              {debouncedSearch
                                   ? `No books match "${debouncedSearch}". Try a different keyword.`
                                   : 'No e-books currently uploaded in the system.'}
                         </p>
                    </div>
               ) : viewMode === 'grid' ? (
                    <div className="ebooks_grid">
                         {filteredBooks.map((book) => (
                              <div key={book.id} className="ebooks_card">
                                   <div
                                        className="ebooks_card__cover"
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
                                             <div className="ebooks_card__placeholder">
                                                  <span>{book.title?.slice(0, 2).toUpperCase()}</span>
                                             </div>
                                        )}
                                        <span className="ebooks_card__price_badge">
                                             {!book.price || book.price <= 0 ? 'FREE' : `₹${(book.price / 100).toLocaleString('en-IN')}`}
                                        </span>
                                   </div>

                                   <div className="ebooks_card__info">
                                        <h3
                                             className="ebooks_card__title"
                                             onClick={() => navigate(`/book/${book.id}`)}
                                             title={book.title}
                                        >
                                             {book.title}
                                        </h3>
                                        <p className="ebooks_card__author">
                                             by {book.author || book.publisher || 'Unknown Author'}
                                        </p>

                                        <div className="ebooks_card__meta">
                                             <span>{book.language || 'English'}</span>
                                             {book.total_pages && <span> &bull; {book.total_pages} pages</span>}
                                             {book.isbn && <span> &bull; ISBN: {book.isbn}</span>}
                                        </div>

                                        <div className="ebooks_card__actions">
                                             <button
                                                  type="button"
                                                  className="ebooks_card_btn ebooks_card_btn--read"
                                                  onClick={() => navigate(`/reader/${book.id}`)}
                                                  title="Read E-Book"
                                             >
                                                  Read
                                             </button>
                                             {role !== 'MANAGER' && (
                                                  <button
                                                       type="button"
                                                       className="ebooks_card_btn ebooks_card_btn--edit"
                                                       onClick={(e) => handleEditClick(book, e)}
                                                       title="Edit Book Details"
                                                  >
                                                       Edit
                                                  </button>
                                             )}
                                             {role === 'SUPERADMIN' && (
                                                  <button
                                                       type="button"
                                                       className="ebooks_card_btn ebooks_card_btn--download"
                                                       onClick={(e) => handleDownloadClick(book, e)}
                                                       title="Download PDF File"
                                                  >
                                                       PDF
                                                  </button>
                                             )}
                                             {role !== 'MANAGER' && (
                                                  <button
                                                       type="button"
                                                       className="ebooks_card_btn ebooks_card_btn--delete"
                                                       onClick={(e) => handleDeleteClick(book.id, book.title, e)}
                                                       title="Delete E-Book"
                                                  >
                                                       🗑️
                                                  </button>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               ) : (
                    <div className="ebooks_table_wrapper">
                         <table className="ebooks_table">
                              <thead>
                                   <tr>
                                        <th>Book</th>
                                        <th>Author / Publisher</th>
                                        <th>ISBN</th>
                                        <th>Language</th>
                                        <th>Pages</th>
                                        <th>Price</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                   </tr>
                              </thead>
                              <tbody>
                                   {filteredBooks.map((book) => (
                                        <tr key={book.id}>
                                             <td>
                                                  <div className="ebooks_table__book_cell">
                                                       <div className="ebooks_table__thumb">
                                                            {book.cover_image_url ? (
                                                                 <img src={book.cover_image_url} alt={book.title} />
                                                            ) : (
                                                                 <span>{book.title?.slice(0, 2).toUpperCase()}</span>
                                                            )}
                                                       </div>
                                                       <div>
                                                            <strong
                                                                 className="ebooks_table__book_title"
                                                                 onClick={() => navigate(`/book/${book.id}`)}
                                                            >
                                                                 {book.title}
                                                            </strong>
                                                       </div>
                                                  </div>
                                             </td>
                                             <td>{book.author || book.publisher || 'N/A'}</td>
                                             <td><code>{book.isbn || 'N/A'}</code></td>
                                             <td>{book.language || 'English'}</td>
                                             <td>{book.total_pages || '-'}</td>
                                             <td>
                                                  <span className={`ebooks_table__price ${!book.price || book.price <= 0 ? 'ebooks_table__price--free' : ''}`}>
                                                       {!book.price || book.price <= 0 ? 'FREE' : `₹${(book.price / 100).toLocaleString('en-IN')}`}
                                                  </span>
                                             </td>
                                             <td style={{ textAlign: 'right' }}>
                                                  <div className="ebooks_table__actions">
                                                       <button
                                                            type="button"
                                                            className="ebooks_tbl_btn ebooks_tbl_btn--primary"
                                                            onClick={() => navigate(`/reader/${book.id}`)}
                                                       >
                                                            Read
                                                       </button>
                                                       {role !== 'MANAGER' && (
                                                            <button
                                                                 type="button"
                                                                 className="ebooks_tbl_btn ebooks_tbl_btn--edit"
                                                                 onClick={() => handleEditClick(book)}
                                                            >
                                                                 Edit
                                                            </button>
                                                       )}
                                                       {role === 'SUPERADMIN' && (
                                                            <button
                                                                 type="button"
                                                                 className="ebooks_tbl_btn ebooks_tbl_btn--ghost"
                                                                 onClick={() => handleDownloadClick(book)}
                                                            >
                                                                 PDF
                                                            </button>
                                                       )}
                                                       {role !== 'MANAGER' && (
                                                            <button
                                                                 type="button"
                                                                 className="ebooks_tbl_btn ebooks_tbl_btn--danger"
                                                                 onClick={() => handleDeleteClick(book.id, book.title)}
                                                            >
                                                                 Delete
                                                            </button>
                                                       )}
                                                  </div>
                                             </td>
                                        </tr>
                                   ))}
                              </tbody>
                         </table>
                    </div>
               )}

               {/* ── Book Upload / Edit Modal ── */}
               <Book_Upload_Modal
                    isOpen={isUploadModalOpen}
                    onClose={() => {
                         setIsUploadModalOpen(false);
                         setBookToEdit(undefined);
                    }}
                    onSubmit={handleCreateOrUpdateBook}
                    bookToEdit={bookToEdit}
               />

               {/* ── Bulk Upload Modal ── */}
               <Bulk_Upload_Modal
                    isOpen={isBulkModalOpen}
                    onClose={() => {
                         setIsBulkModalOpen(false);
                         fetchBooks();
                    }}
               />
          </div>
     );
};

export default Ebooks_Page;
