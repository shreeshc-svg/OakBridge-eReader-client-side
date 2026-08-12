import type {
     DashboardOverviewCard,
     DashboardOverviewData,
     DashboardOverviewMetric,
     UserNowReading,
     UserShelf,
} from '../../types/dashboard.types';
import type { SuperadminOverviewResponse } from '../../api/dashboard_api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../../../books/hooks/use_books';
import { useRecommendations } from '../../../books/hooks/use_recommendations';
import type { Book } from '../../../books/types/books.api.types';
import Book_Upload_Modal from '../../../books/components/book_upload_modal/Book_Upload_Modal';
import Bulk_Upload_Modal from '../../../books/components/bulk_upload_modal/Bulk_Upload_Modal';
import Welcome_Back_Modal from '../welcome_back_modal/Welcome_Back_Modal';
import Readers_Modal from '../readers_modal/Readers_Modal';
import { useAuthStore } from '../../../../store/auth.store';
import { apiClient } from '../../../../config/axios.config';
import { useDebounce } from '../../../../hooks/use_debounce';
import { reader_api } from '../../../reader/api/reader.api';
import './Dashboard_Overview.scss';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardOverviewProps {
     data: DashboardOverviewData;
     role?: 'superadmin' | 'user';
     superadminStats?: SuperadminOverviewResponse['data'];
     userRole?: string;
     onRefresh?: () => void;
}

const metricIcon = (tone: DashboardOverviewMetric['tone']) => {
     const paths: Record<DashboardOverviewMetric['tone'], string> = {
          violet: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z',
          amber: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
          green: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
          ink: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
     };
     return (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
               <path d={paths[tone]} />
          </svg>
     );
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy metric strip (kept for backwards-compat on user dashboard if needed)
// ─────────────────────────────────────────────────────────────────────────────

export const Dashboard_Metric_Strip = ({
     metrics,
     title,
}: {
     metrics: DashboardOverviewMetric[];
     title: string;
}) => (
     <div className="dashboard_metric_strip">
          <h1 className="dashboard_metric_strip__title">{title}</h1>
          <div className="dashboard_metric_strip__grid">
               {metrics.map((metric) => (
                    <article
                         className={`dashboard_metric_strip__card dashboard_metric_strip__card--${metric.tone}`}
                         key={metric.label}
                    >
                         <div className="dashboard_metric_strip__card_top">
                              <span>{metric.label}</span>
                              <div
                                   className={`dashboard_metric_strip__icon dashboard_metric_strip__icon--${metric.tone}`}
                              >
                                   {metricIcon(metric.tone)}
                              </div>
                         </div>
                         <strong>{metric.value}</strong>
                         <small>{metric.change}</small>
                    </article>
               ))}
          </div>
     </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTHOR OVERVIEW — "The Writing Desk"
// ─────────────────────────────────────────────────────────────────────────────

const toneMap = {
     violet: { bg: '#f3efff', accent: '#7c3aed', text: '#4c1d95' },
     amber: { bg: '#fffbeb', accent: '#d97706', text: '#78350f' },
     green: { bg: '#ecfdf5', accent: '#059669', text: '#064e3b' },
     ink: { bg: '#f1f5f9', accent: '#475569', text: '#1e293b' },
};

// (Removed unused RevenueChart & PipelineBucket)

const ManuscriptCard = ({
     card,
     onClick,
     onEdit,
     onDelete,
     onDownload,
}: {
     card: DashboardOverviewCard;
     onClick?: () => void;
     onEdit?: (e: React.MouseEvent) => void;
     onDelete?: (e: React.MouseEvent) => void;
     onDownload?: (e: React.MouseEvent) => void;
}) => {
     const colors = toneMap[card.tone as keyof typeof toneMap] ?? toneMap.ink;
     return (
          <article className="author_ms_card" style={{ borderLeft: `4px solid ${colors.accent}` }}>
               <div className="author_ms_card__body">
                    <div className="author_ms_card__header">
                         <div className="author_ms_card__header-left">
                              <h3 className="author_ms_card__owner">
                                   {card.owner}
                              </h3>
                              <span className="author_ms_card__ref">
                                   {card.reference}
                              </span>
                         </div>
                         <div className="author_ms_card__header-right">
                              {onEdit && (
                                   <button
                                        type="button"
                                        onClick={onEdit}
                                        className="author_ms_card__icon-btn author_ms_card__icon-btn--edit"
                                        style={{ color: colors.accent }}
                                        title="Edit"
                                   >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                             <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                             <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                   </button>
                              )}
                              {onDelete && (
                                   <button
                                        type="button"
                                        onClick={onDelete}
                                        className="author_ms_card__icon-btn author_ms_card__icon-btn--delete"
                                        title="Delete"
                                   >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                             <polyline points="3 6 5 6 21 6"></polyline>
                                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                             <line x1="10" y1="11" x2="10" y2="17"></line>
                                             <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                   </button>
                              )}
                         </div>
                    </div>
                    <div className="author_ms_card__meta">
                         <span>
                              {card.primary_label}:{' '}
                              <strong>{card.primary_value}</strong>
                         </span>
                         <span>
                              {card.secondary_label}:{' '}
                              <strong>{card.secondary_value}</strong>
                         </span>
                    </div>

                    {card.items.slice(0, 1).map((item) => (
                         <div key={item.title} className="author_ms_card__isbn_block">
                              <span className="author_ms_card__isbn_label">
                                   {item.title}
                              </span>
                              <span className="author_ms_card__isbn_value">{item.meta}</span>
                         </div>
                    ))}

                    {card.extra_items && (
                         <p className="author_ms_card__publisher">
                              {card.extra_items}
                         </p>
                    )}

                    <div className="author_ms_card__note">
                         <span className="author_ms_card__note_label">
                              {card.note_label}
                         </span>
                         <p className="author_ms_card__note_text">{card.note}</p>
                    </div>

                    <div className="author_ms_card__footer">
                         <button
                              type="button"
                              className="author_ms_card__action"
                              style={{ color: colors.accent }}
                              onClick={onClick}
                         >
                              {card.action_label}
                         </button>
                         {onDownload && (
                              <button
                                   type="button"
                                   className="author_ms_card__action"
                                   style={{ color: colors.accent, fontWeight: 'bold' }}
                                   onClick={onDownload}
                              >
                                   Download PDF
                              </button>
                         )}
                    </div>
               </div>
          </article>
     );
};

const Superadmin_Overview = ({
     data,
     superadminStats,
     userRole,
}: {
     data: DashboardOverviewData;
     superadminStats?: SuperadminOverviewResponse['data'];
     userRole?: string;
}) => {
     const navigate = useNavigate();
     const stats = superadminStats?.stats;
     const latestBook = superadminStats?.latest_book;
     const accessToken = useAuthStore((state) => state.accessToken);

     // Book upload integration (for modal + slider only)
     const { books, fetchBooks, createBook, updateBook, deleteBook } = useBooks();

     const [isModalOpen, setIsModalOpen] = useState(false);
     const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
     const [bookToEdit, setBookToEdit] = useState<Book | undefined>(undefined);
     const [isReadersModalOpen, setIsReadersModalOpen] = useState(false);
     const [manuscriptFilter, setManuscriptFilter] = useState('');
     const debouncedManuscriptFilter = useDebounce(manuscriptFilter, 300);

     useEffect(() => {
          fetchBooks();
     }, [fetchBooks]);

     const handleUploadSubmit = async (payload: any) => {
          if (bookToEdit) {
               await updateBook(bookToEdit.id, payload);
          } else {
               await createBook(payload);
          }
          await fetchBooks();
          setBookToEdit(undefined);
     };

     const handleEditClick = (book: Book, e: React.MouseEvent) => {
          e.stopPropagation();
          setBookToEdit(book);
          setIsModalOpen(true);
     };

     const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
          e.stopPropagation();
          if (window.confirm('Are you sure you want to delete this manuscript?')) {
               await deleteBook(id);
               await fetchBooks();
          }
     };

     const handleDownloadClick = async (book: Book, e: React.MouseEvent) => {
          e.stopPropagation();
          try {
               const response = await apiClient.get(`/books/download-book?id=${book.id}`, {
                    headers: {
                         Authorization: `Bearer ${accessToken}`,
                    },
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

     // Filter manuscripts based on search term (debounced)
     const filteredBooks = books.filter((book: Book) => {
          if (!debouncedManuscriptFilter) return true;
          const q = debouncedManuscriptFilter.toLowerCase();
          return (
               book.title?.toLowerCase().includes(q) ||
               (book.author || book.publisher || '').toLowerCase().includes(q) ||
               book.isbn?.toLowerCase().includes(q) ||
               book.language?.toLowerCase().includes(q)
          );
     });

     // Map real books to cards
     const activeManuscripts: DashboardOverviewCard[] = filteredBooks.map(
          (book: Book, idx: number) => {
               const tones = ['violet', 'amber', 'green', 'ink'] as const;
               const tone = tones[idx % tones.length];
               return {
                    reference: book.id.substring(0, 8),
                    owner: book.title,
                    status: 'Draft',
                    tone,
                    primary_label: 'Language',
                    primary_value: book.language,
                    secondary_label: 'Pages',
                    secondary_value: String(book.total_pages),
                    items: [
                         {
                              title: 'ISBN',
                              meta: book.isbn || 'N/A',
                              quantity: '',
                         },
                    ],
                    note_label: 'Description',
                    note: book.description || 'No description provided.',
                    action_label: 'Details',
                    extra_items: (book.author || book.publisher)
                         ? `Author: ${book.author || book.publisher}`
                         : '',
               };
          }
     );

     const displayCards = activeManuscripts;
     const showStats = userRole !== 'ADMIN';

     return (
          <section className="author_overview" aria-label="Author workspace">
               {/* ── Stats Cards Grid ── */}
               {showStats && (
                    <div className="author_stats_grid">
                         <div className="author_stat_card author_stat_card--violet">
                              <div className="author_stat_card__icon">
                                   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" /></svg>
                              </div>
                              <div className="author_stat_card__info">
                                   <strong className="author_stat_card__value">
                                        {stats?.total_books ?? 0}
                                   </strong>
                                   <span className="author_stat_card__label">
                                        Published Books
                                   </span>
                              </div>
                         </div>

                         <div
                              className="author_stat_card author_stat_card--emerald"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setIsReadersModalOpen(true)}
                              title="Click to view readers"
                         >
                              <div className="author_stat_card__icon">
                                   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                              </div>
                              <div className="author_stat_card__info">
                                   <strong className="author_stat_card__value">
                                        {stats?.total_readers ?? 0}
                                   </strong>
                                   <span className="author_stat_card__label">
                                        Total Readers
                                   </span>
                              </div>
                         </div>

                         <div className="author_stat_card author_stat_card--amber">
                              <div className="author_stat_card__icon" style={{ color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.15)' }}>
                                   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2-.9-2-2V8c0-1.1.89-2 2-2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>
                              </div>
                              <div className="author_stat_card__info">
                                   <strong className="author_stat_card__value">
                                        ₹{stats?.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                                   </strong>
                                   <span className="author_stat_card__label">
                                        Total Revenue
                                   </span>
                                   <div className="author_stat_card__trends">
                                        <span className={`author_trend-badge author_trend-badge--${(stats?.weeklyGrowthPercent ?? 0) >= 0 ? 'up' : 'down'}`}>
                                             {(stats?.weeklyGrowthPercent ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(stats?.weeklyGrowthPercent ?? 0)}% (wk)
                                        </span>
                                        <span className={`author_trend-badge author_trend-badge--${(stats?.monthlyGrowthPercent ?? 0) >= 0 ? 'up' : 'down'}`}>
                                             {(stats?.monthlyGrowthPercent ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(stats?.monthlyGrowthPercent ?? 0)}% (mo)
                                        </span>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}

               {/* ── Latest Book Banner ── */}
               {latestBook && (
                    <div className="author_latest_book">
                         <div className="author_latest_book__info">
                              <p className="author_latest_book__eyebrow">
                                   Latest Publication
                              </p>
                              <h2 className="author_latest_book__title">
                                   {latestBook.title}
                              </h2>
                              <p className="author_latest_book__desc">
                                   {latestBook.description}
                              </p>
                              <div className="author_latest_book__meta">
                                   <span>{latestBook.total_pages} pages</span>
                                   <span>·</span>
                                   <span>{latestBook.total_chapters} chapters</span>
                                   <span>·</span>
                                   <span>{latestBook.language}</span>
                                   {latestBook.isbn && (
                                        <>
                                             <span>·</span>
                                             <span>ISBN: {latestBook.isbn}</span>
                                        </>
                                   )}
                              </div>
                              <div className="author_spotlight__actions" style={{ display: 'flex', gap: '12px' }}>
                                   {userRole !== 'MANAGER' && (
                                        <>
                                             <button
                                                  type="button"
                                                  className="author_btn author_btn--primary"
                                                  onClick={() => setIsModalOpen(true)}
                                             >
                                                  {data.primary_action}
                                             </button>
                                             {userRole === 'SUPERADMIN' && (
                                                  <button
                                                       type="button"
                                                       className="author_btn author_btn--ghost"
                                                       onClick={() => setIsBulkModalOpen(true)}
                                                       style={{ borderColor: '#d97706', color: '#d97706' }}
                                                  >
                                                       Bulk Upload
                                                  </button>
                                             )}
                                        </>
                                   )}
                                   <button
                                        type="button"
                                        className="author_btn author_btn--ghost"
                                        onClick={() => navigate(`/book/${latestBook.id}`)}
                                   >
                                        {data.secondary_action}
                                   </button>
                              </div>
                         </div>
                         {latestBook.cover_url && (
                              <div className="author_latest_book__cover">
                                   <img
                                        src={latestBook.cover_url}
                                        alt={latestBook.title}
                                   />
                              </div>
                         )}
                    </div>
               )}

               {!latestBook && (
                    <div className="author_spotlight" style={{ justifyContent: 'center' }}>
                         <div className="author_spotlight__actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                              <p style={{ color: '#78716c', marginBottom: 12 }}>No books published yet.</p>
                              {userRole !== 'MANAGER' && (
                                   <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                             type="button"
                                             className="author_btn author_btn--primary"
                                             onClick={() => setIsModalOpen(true)}
                                        >
                                             {data.primary_action}
                                        </button>
                                        {userRole === 'SUPERADMIN' && (
                                             <button
                                                  type="button"
                                                  className="author_btn author_btn--ghost"
                                                  onClick={() => setIsBulkModalOpen(true)}
                                                  style={{ borderColor: '#d97706', color: '#d97706' }}
                                             >
                                                  Bulk Upload
                                             </button>
                                        )}
                                   </div>
                              )}
                         </div>
                    </div>
               )}

               {/* ── Active Manuscripts ── */}
               <div className="author_body">
                    <div className="author_lane">
                         <div className="author_lane__header">
                              <div className="author_lane__title_wrap">
                                   <h3 className="author_section_title">
                                        Active Manuscripts {manuscriptFilter && `(${filteredBooks.length} found)`}
                                   </h3>
                                   <span className="author_lane__count">{filteredBooks.length} total</span>
                              </div>

                              <div className="author_manuscript_search">
                                   <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                   </svg>
                                   <input
                                        type="text"
                                        placeholder="Search manuscripts by title, author, ISBN..."
                                        value={manuscriptFilter}
                                        onChange={(e) => setManuscriptFilter(e.target.value)}
                                   />
                                   {manuscriptFilter && (
                                        <button
                                             type="button"
                                             className="author_manuscript_search__clear"
                                             onClick={() => setManuscriptFilter('')}
                                             title="Clear search"
                                        >
                                             ✕
                                        </button>
                                   )}
                              </div>
                         </div>

                         <div className="author_lane__scroll">
                              {displayCards.length > 0 ? (
                                   displayCards.map((card, idx) => (
                                        <ManuscriptCard
                                             key={card.reference}
                                             card={card}
                                             onClick={() => {
                                                  navigate(`/book/${filteredBooks[idx].id}`);
                                             }}
                                             onEdit={userRole === 'MANAGER' ? undefined : (e) => handleEditClick(filteredBooks[idx], e)}
                                             onDelete={userRole === 'MANAGER' ? undefined : (e) => handleDeleteClick(filteredBooks[idx].id, e)}
                                             onDownload={userRole === 'SUPERADMIN' ? (e) => handleDownloadClick(filteredBooks[idx], e) : undefined}
                                        />
                                   ))
                              ) : (
                                   <div
                                        style={{
                                             textAlign: 'center',
                                             padding: '40px 20px',
                                             color: '#78716c',
                                        }}
                                   >
                                        <p>No active manuscripts found.</p>
                                   </div>
                              )}
                         </div>
                    </div>
               </div>

               <Book_Upload_Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                         setIsModalOpen(false);
                         setBookToEdit(undefined);
                    }}
                    onSubmit={handleUploadSubmit}
                    bookToEdit={bookToEdit}
               />

               <Bulk_Upload_Modal
                    isOpen={isBulkModalOpen}
                    onClose={() => {
                         setIsBulkModalOpen(false);
                         fetchBooks();
                    }}
               />

               <Readers_Modal
                    isOpen={isReadersModalOpen}
                    onClose={() => setIsReadersModalOpen(false)}
               />
          </section>
     );
};

// ─────────────────────────────────────────────────────────────────────────────
// USER OVERVIEW — "The Reading Lounge" (Premium Dark Mode)
// ─────────────────────────────────────────────────────────────────────────────

const NowReadingExpoCard = ({
     books,
     onBookClick,
     onCompleteClick
}: {
     books: UserNowReading[],
     onBookClick: (id: string) => void,
     onCompleteClick: (id: string) => void
}) => {
     const navigate = useNavigate();

     return (
          <div className="ud_continue_section">
               <div className="ud_continue_section__header">
                    <h3 className="ud_continue_section__label">Continue Reading</h3>
               </div>
               <div className="ud_continue_carousel">
                    {books.map((book) => {
                         const handleResume = (e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (book.id) {
                                   navigate(`/reader/${book.id}`);
                              }
                         };

                         const handleBookDetails = (e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (book.id) {
                                   onBookClick(book.id);
                              }
                         };

                         return (
                              <div
                                   key={book.title}
                                   className="ud_continue_card"
                                   onClick={handleResume}
                              >
                                   <div className="ud_continue_card__cover_col">
                                        {book.cover_url ? (
                                             <div className="ud_continue_card__book_cover">
                                                  <img
                                                       src={book.cover_url}
                                                       alt={book.title}
                                                  />
                                             </div>
                                        ) : (
                                             <div
                                                  className="ud_continue_card__book_placeholder"
                                                  style={{
                                                       background: `linear-gradient(135deg, ${book.gradient_from || '#1e3a8a'}, ${book.gradient_to || '#3b82f6'})`
                                                  }}
                                             >
                                                  <span>{book.title.slice(0, 2).toUpperCase()}</span>
                                             </div>
                                        )}
                                   </div>

                                   <div className="ud_continue_card__info_col">
                                        <h4 className="ud_continue_card__title" title={book.title}>{book.title}</h4>
                                        <p className="ud_continue_card__subtitle">{book.author}</p>

                                        <div className="ud_continue_card__progress_section">
                                             <div className="ud_continue_card__progress_row">
                                                  <div className="ud_continue_card__progress_track">
                                                       <div
                                                            className="ud_continue_card__progress_fill"
                                                            style={{ width: `${book.progress}%` }}
                                                       />
                                                  </div>
                                                  <span className="ud_continue_card__progress_text">
                                                       {book.progress}%
                                                  </span>
                                             </div>
                                        </div>

                                        <div className="ud_continue_card__actions">
                                             <button
                                                  type="button"
                                                  className="ud_continue_card__btn ud_continue_card__btn--primary"
                                                  onClick={handleResume}
                                             >
                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                                                       <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                                                  </svg>
                                                  <span>Resume</span>
                                             </button>

                                             <button
                                                  type="button"
                                                  className="ud_continue_card__btn ud_continue_card__btn--outline"
                                                  onClick={handleBookDetails}
                                             >
                                                  <span>Details</span>
                                             </button>

                                             {book.id && (
                                                  <button
                                                       type="button"
                                                       className="ud_continue_card__btn ud_continue_card__btn--finish"
                                                       onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCompleteClick(book.id!);
                                                       }}
                                                       title="Mark as Completed"
                                                  >
                                                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                       </svg>
                                                       <span>Finish</span>
                                                  </button>
                                             )}
                                        </div>
                                   </div>
                              </div>
                         );
                    })}
               </div>
          </div>
     );
};


const BookShelf = ({
     shelf,
     onBookClick,
}: {
     shelf: UserShelf;
     onBookClick: (bookId: string) => void;
}) => (
     <div className="ud_shelf">
          <div className="ud_shelf__header">
               <h3 className="ud_shelf__label">{shelf.label}</h3>
               <button className="ud_shelf__view_all">View All →</button>
          </div>
          <div className="ud_shelf__carousel">
               {shelf.books.map((book) => (
                    <div
                         key={book.id || book.title}
                         className="ud_shelf__book_card"
                         onClick={() => onBookClick(book.id)}
                    >
                         {book.cover_url ? (
                              <div className="ud_shelf__book_cover">
                                   <img src={book.cover_url} alt={book.title} />
                              </div>
                         ) : (
                              <div
                                   className="ud_shelf__book_placeholder"
                                   style={{ backgroundColor: book.color }}
                              >
                                   <span>{book.title.slice(0, 2)}</span>
                              </div>
                         )}
                         <div className="ud_shelf__book_info">
                              <p className="ud_shelf__book_title">{book.title}</p>
                              <span className="ud_shelf__book_author">{book.author}</span>
                         </div>
                    </div>
               ))}
          </div>
     </div>
);

const User_Overview = ({
     data,
     onRefresh,
}: {
     data: DashboardOverviewData;
     onRefresh?: () => void;
}) => {
     const nowReading = data.now_reading ?? [];
     const shelves = data.shelves ?? [];

     const navigate = useNavigate();
     const user = useAuthStore((state) => state.user);
     const { recommendations, isLoading: recsLoading, fetchRecommendations } = useRecommendations();
     const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

     useEffect(() => {
          fetchRecommendations();
     }, [fetchRecommendations]);

     useEffect(() => {
          if (nowReading.length > 0) {
               const justLoggedIn = sessionStorage.getItem('just_logged_in');
               if (justLoggedIn === 'true') {
                    setIsWelcomeModalOpen(true);
                    sessionStorage.removeItem('just_logged_in');
               }
          }
     }, [nowReading]);

     const handleBookClick = (bookId: string) => {
          navigate(`/book/${bookId}`);
     };

     const handleRecommendationClick = (book: Book) => {
          navigate(`/book/${book.id}`);
     };

     const handleCompleteBook = async (bookId: string) => {
          try {
               await reader_api.update_progress(bookId, 100, undefined, 'Completed');
               if (onRefresh) {
                    onRefresh();
               }
          } catch (error) {
               console.error('Failed to mark book as completed:', error);
          }
     };

     return (
          <section className="ud_root" aria-label="Reading Dashboard">
               <div className="ud_header">
                    <h1 className="ud_header__title">Reading Room</h1>
               </div>

               {nowReading.length > 0 ? (
                    <NowReadingExpoCard
                         books={nowReading}
                         onBookClick={handleBookClick}
                         onCompleteClick={handleCompleteBook}
                    />
               ) : null}

               {/* ── Section Divider ── */}
               {shelves.length > 0 && <hr className="ud_section_divider" />}

               {/* ── Bookshelves ── */}
               <div className="ud_shelves">
                    {shelves.map((shelf) => (
                         <BookShelf
                              key={shelf.label}
                              shelf={shelf}
                              onBookClick={handleBookClick}
                         />
                    ))}
               </div>

               {/* ── Recommended For You ── */}
               {!recsLoading && recommendations.length > 0 && (
                    <div className="ud_shelf">
                         <div className="ud_shelf__header">
                              <h3 className="ud_shelf__label">Recommended For You</h3>
                         </div>
                         <div className="ud_shelf__carousel">
                              {recommendations.map((book) => (
                                   <div
                                        key={book.id}
                                        className="ud_shelf__book_card"
                                        onClick={() => handleRecommendationClick(book)}
                                   >
                                        {book.cover_image_url ? (
                                             <div className="ud_shelf__book_cover">
                                                  <img src={book.cover_image_url} alt={book.title} />
                                             </div>
                                        ) : (
                                             <div
                                                  className="ud_shelf__book_placeholder"
                                                  style={{ backgroundColor: '#7c3aed' }}
                                             >
                                                  <span>{book.title.slice(0, 2)}</span>
                                             </div>
                                        )}
                                        <div className="ud_shelf__book_info">
                                             <p className="ud_shelf__book_title">{book.title}</p>
                                             <span className="ud_shelf__book_author">{book.author || book.publisher || 'Unknown'}</span>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>
               )}

               <Welcome_Back_Modal
                    isOpen={isWelcomeModalOpen}
                    onClose={() => setIsWelcomeModalOpen(false)}
                    user={user}
                    nowReadingBook={nowReading[0] || null}
               />
          </section>
     );
};
// ─────────────────────────────────────────────────────────────────────────────
// Main entry point — routes to correct overview based on role
// ─────────────────────────────────────────────────────────────────────────────

const Dashboard_Overview = ({
     data,
     role = 'superadmin',
     superadminStats,
     userRole,
     onRefresh,
}: DashboardOverviewProps) => {
     if (role === 'user') {
          return <User_Overview data={data} onRefresh={onRefresh} />;
     }

     return <Superadmin_Overview data={data} superadminStats={superadminStats} userRole={userRole} />;
};

export default Dashboard_Overview;
