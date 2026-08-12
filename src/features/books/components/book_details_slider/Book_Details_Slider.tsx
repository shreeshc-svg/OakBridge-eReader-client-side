import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/auth.store';
import { useLibrary } from '../../../library/hooks/use_library';
import { usePayments } from '../../../payments/hooks/use_payments';
import type { Book } from '../../types/books.api.types';
import Confirm_Modal from '../../../../components/common/confirm_modal/Confirm_Modal';
import Checkout_Address_Modal from '../../../payments/components/Checkout_Address_Modal';
import { useReviews } from '../../hooks/use_reviews';
import toast from 'react-hot-toast';
import { env } from '../../../../config/env';
import { reader_api, type ReadingProgress } from '../../../reader/api/reader.api';
import { useCategories } from '../../../categories/hooks/use_categories';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import './Book_Details_Slider.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BookDetailsSliderProps {
     book: Book | null;
     isOpen: boolean;
     onClose: () => void;
}

const Book_Details_Slider = ({
     book,
     isOpen,
     onClose,
}: BookDetailsSliderProps) => {
     const navigate = useNavigate();
     const user = useAuthStore((state) => state.user);
     const { libraryBookIds, addToLibrary, removeFromLibrary, isLoading, fetchLibrary } = useLibrary();
     const { initiatePayment, isProcessing } = usePayments();
     const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
     const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
     const [isPreviewOpen, setIsPreviewOpen] = useState(false);
     const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
     const [numPages, setNumPages] = useState<number | null>(null);

     const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
          setNumPages(numPages);
     };

     const isPdfPreview = useMemo(() => {
          if (!book?.preview_pages?.[0]) return false;
          const firstPage = book.preview_pages[0].toLowerCase();
          return firstPage.endsWith('.pdf') || firstPage.includes('.pdf');
     }, [book?.preview_pages]);

     const totalPagesCount = isPdfPreview ? (numPages || 1) : (book?.preview_pages?.length || 0);

     // Check if user has active institution subscription
     const hasActiveInstitutionSubscription = useMemo(() => {
          if (!user) return false;
          if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'INSTITUTION_MEMBER') return false;
          if (!user.institution) return false;
          
          const inst = user.institution;
          const isTierValid = inst.tier === 'GOLD' || inst.tier === 'PLATINUM';
          const isNotExpired = !inst.subscription_expires_at || new Date(inst.subscription_expires_at) > new Date();
          
          return isTierValid && isNotExpired;
     }, [user]);

     const isBookFreeForUser = useMemo(() => {
          if (!book) return false;
          if (user?.is_free_candidate) return true;
          return !book.price || book.price <= 0 || hasActiveInstitutionSubscription;
     }, [book, user, hasActiveInstitutionSubscription]);

     // Reviews Feature Integration
     const { reviews, averageRating: _averageRating, totalCount: _totalCount, fetchBookReviews, submitReview, isLoading: reviewsLoading } = useReviews();
     const [formRating, setFormRating] = useState(5);
     const [formText, setFormText] = useState('');
     const [submitLoading, setSubmitLoading] = useState(false);
     const [progressPercentage, setProgressPercentage] = useState<number>(0);
     const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);

     const { categories, fetchCategories } = useCategories();

     useEffect(() => {
          if (isOpen) {
               fetchCategories();
          }
     }, [isOpen, fetchCategories]);

     useEffect(() => {
          if (isOpen && user && book) {
               fetchLibrary();
               reader_api.get_progress(book.id)
                    .then((progress) => {
                         setReadingProgress(progress);
                         setProgressPercentage(progress ? progress.progress_percentage : 0);
                    })
                    .catch(() => {
                         setReadingProgress(null);
                         setProgressPercentage(0);
                    });
          }
     }, [isOpen, user, book, fetchLibrary]);

     useEffect(() => {
          if (isOpen && book) {
               fetchBookReviews(book.id);
          }
     }, [isOpen, book, fetchBookReviews]);

     const handleReviewSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!book || !formText.trim()) return;

          setSubmitLoading(true);
          try {
               await submitReview(book.id, formRating, formText);
               toast.success('Review submitted successfully. It will be visible once approved by admin.');
               setFormText('');
               setFormRating(5);
               fetchBookReviews(book.id);
          } catch (err: any) {
               toast.error(err.message || 'Failed to submit review');
          } finally {
               setSubmitLoading(false);
          }
     };


     const categoryNames = useMemo(() => {
          if (!book || !book.category_ids || book.category_ids.length === 0) return 'General';
          const names = book.category_ids
               .map((id) => categories.find((c) => c.id === id)?.category_name)
               .filter(Boolean);
          return names.length > 0 ? names.join(', ') : 'General';
     }, [book, categories]);

     const publishYear = useMemo(() => {
          if (!book) return '2026';
          return new Date(book.createdAt).getFullYear().toString();
     }, [book]);

     const handleStartOver = async () => {
          if (!book) return;
          try {
               await reader_api.update_progress(book.id, 0, '', '');
               navigate(`/reader/${book.id}`);
          } catch (error) {
               console.error('Failed to reset progress:', error);
               navigate(`/reader/${book.id}`);
          }
     };

     const handleAddressSubmit = async (shippingAddress: string, billingAddress: string) => {
          setIsAddressModalOpen(false);
          if (!book) return;
          await initiatePayment(book.id, shippingAddress, billingAddress, () => {
               fetchLibrary();
          });
     };

     const handleLibraryAction = async () => {
          if (!book) return;
          if (!user) {
               navigate('/login?redirect=/');
               return;
          }
          if (libraryBookIds.has(book.id)) {
               setIsConfirmModalOpen(true);
          } else {
               if (!isBookFreeForUser) {
                    setIsAddressModalOpen(true);
               } else {
                    await addToLibrary(book.id);
               }
          }
     };

     const handleConfirmRemove = async () => {
          if (!book) return;
          await removeFromLibrary(book.id);
          setIsConfirmModalOpen(false);
     };

     // Optional: handle escape key to close
     useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
               if (e.key === 'Escape' && isOpen) {
                    onClose();
               }
          };
          document.addEventListener('keydown', handleKeyDown);
          return () => document.removeEventListener('keydown', handleKeyDown);
     }, [isOpen, onClose]);

     return (
          <>
               {/* Backdrop overlay */}
               <div
                    className={`book_slider_overlay ${isOpen ? 'open' : ''}`}
                    onClick={onClose}
                    aria-hidden="true"
               />

               {/* Left side slider */}
               <aside className={`book_slider ${isOpen ? 'open' : ''}`}>
                    <div className="book_slider__top_nav">
                         <button className="book_slider__back_btn" onClick={onClose} aria-label="Back to library">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                   <polyline points="15 18 9 12 15 6"></polyline>
                              </svg>
                              Back to library
                         </button>
                    </div>

                    {book && (
                         <div className="book_slider__content">
                              <div className="book_slider__cover_column">
                                   {book.cover_image_url ? (
                                        <div className="book_slider__cover_wrapper">
                                             <img
                                                  src={book.cover_image_url}
                                                  alt={`Cover of ${book.title}`}
                                                  className="book_slider__cover"
                                             />
                                        </div>
                                   ) : (
                                        <div className="book_slider__cover_placeholder">
                                             No Cover Available
                                        </div>
                                   )}
                              </div>

                              <div className="book_slider__info">
                                   <div className="book_slider__category_header">
                                        {categoryNames} &middot; {publishYear}
                                   </div>

                                   <h1 className="book_slider__title">
                                        {book.title}
                                   </h1>
                                   
                                   <p className="book_slider__authors">
                                        {book.author || 'Unknown Author'}
                                   </p>

                                   <p className="book_slider__description">
                                        {book.description || 'No description provided.'}
                                   </p>

                                   <div className="book_slider__metadata_row">
                                        <div className="book_slider__metadata_item">
                                             <span className="value">{book.total_pages}</span>
                                             <span className="label">Pages</span>
                                        </div>
                                        <div className="book_slider__metadata_item">
                                             <span className="value">{book.total_chapters}</span>
                                             <span className="label">Chapters</span>
                                        </div>
                                        <div className="book_slider__metadata_item">
                                             <span className="value">{book.isbn || 'N/A'}</span>
                                             <span className="label">ISBN</span>
                                        </div>
                                   </div>

                                   {user && libraryBookIds.has(book.id) && (
                                        <div className="book_slider__progress_card">
                                             <div className="book_slider__progress_label">YOUR PROGRESS</div>
                                             <div className="book_slider__progress_row">
                                                  <span className="book_slider__progress_text">
                                                       {readingProgress?.current_chapter || 'Chapter 1'} &middot; {progressPercentage}%
                                                  </span>
                                                  <div className="book_slider__progress_bar_container">
                                                       <div className="book_slider__progress_bar_track">
                                                            <div 
                                                                 className="book_slider__progress_bar_fill" 
                                                                 style={{ width: `${progressPercentage}%` }}
                                                            />
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   )}

                                   <div className="book_slider__actions_container">
                                        {book.file_url && libraryBookIds.has(book.id) ? (
                                             <>
                                                  <Link
                                                       to={`/reader/${book.id}`}
                                                       className="book_slider__primary_btn"
                                                  >
                                                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                       </svg>
                                                       {progressPercentage > 0 ? `Resume from ${readingProgress?.current_chapter || 'Chapter 1'}` : 'Start reading'}
                                                  </Link>
                                                  
                                                  <button
                                                       type="button"
                                                       className="book_slider__outline_btn"
                                                       onClick={handleStartOver}
                                                  >
                                                       Start over
                                                  </button>

                                                  <button
                                                       type="button"
                                                       className="book_slider__remove_btn"
                                                       onClick={handleLibraryAction}
                                                       disabled={isLoading || isProcessing}
                                                  >
                                                       Remove from library
                                                  </button>
                                             </>
                                        ) : (
                                             <>
                                                  <button
                                                       className="book_slider__primary_btn"
                                                       onClick={handleLibraryAction}
                                                       disabled={isLoading || isProcessing}
                                                  >
                                                       {isLoading || isProcessing ? '...' : (isBookFreeForUser ? 'Add to Library' : `Buy for ₹${book.price / 100}`)}
                                                  </button>

                                                  {book.preview_pages && book.preview_pages.length > 0 && (
                                                       <button
                                                            type="button"
                                                            className="book_slider__outline_btn"
                                                            onClick={() => {
                                                                 setIsPreviewOpen(true);
                                                                 setCurrentPreviewIndex(0);
                                                            }}
                                                       >
                                                            Preview ({book.preview_pages.length} pages)
                                                       </button>
                                                  )}
                                             </>
                                        )}
                                   </div>

                                   {/* Reviews & Ratings Section */}
                                   <div className="book_slider__reviews_section">
                                        <h3>Reviews & Ratings</h3>
                                        
                                        {/* Write Review Form */}
                                        {user && libraryBookIds.has(book.id) && !reviews.some(r => r.username === user.username) && (
                                             <form onSubmit={handleReviewSubmit} className="book_slider__review_form">
                                                  <h4>Share your review</h4>
                                                  
                                                  {/* Star Selector */}
                                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                       {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                 type="button"
                                                                 key={star}
                                                                 onClick={() => setFormRating(star)}
                                                                 style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                            >
                                                                 <span style={{ fontSize: '24px', color: star <= formRating ? '#f59e0b' : 'rgba(0,0,0,0.15)' }}>
                                                                      ★
                                                                 </span>
                                                            </button>
                                                       ))}
                                                  </div>

                                                  <textarea
                                                       value={formText}
                                                       onChange={(e) => setFormText(e.target.value)}
                                                       placeholder="Write your review here..."
                                                       rows={3}
                                                       required
                                                       className="book_slider__review_textarea"
                                                  />

                                                  <button
                                                       type="submit"
                                                       disabled={submitLoading || !formText.trim()}
                                                       className="book_slider__primary_btn"
                                                       style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '13px', minWidth: 'auto', marginTop: '0' }}
                                                  >
                                                       {submitLoading ? 'Submitting...' : 'Submit Review'}
                                                  </button>
                                             </form>
                                        )}

                                        {/* Reviews List */}
                                        {reviewsLoading ? (
                                             <p className="book_slider__reviews_status_msg">Loading reviews...</p>
                                        ) : reviews.length === 0 ? (
                                             <p className="book_slider__reviews_status_msg" style={{ fontStyle: 'italic' }}>No reviews yet. Be the first to review!</p>
                                        ) : (
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                  {reviews.map((rev) => (
                                                       <div key={rev.id} className="book_slider__review_item">
                                                            <div className="book_slider__review_header">
                                                                 <span className="book_slider__review_author">
                                                                      {rev.username || 'Anonymous'}
                                                                 </span>
                                                                 <span style={{ color: '#f59e0b', fontSize: '12px' }}>
                                                                      {"★".repeat(rev.rating) + "☆".repeat(5 - rev.rating)}
                                                                 </span>
                                                            </div>
                                                            <p className="book_slider__review_text">
                                                                 {rev.review_text}
                                                            </p>
                                                            <span className="book_slider__review_date">
                                                                 {new Date(rev.createdAt).toLocaleDateString()}
                                                            </span>
                                                       </div>
                                                  ))}
                                             </div>
                                        )}
                                   </div>
                              </div>
                         </div>
                    )}
               </aside>

               <Confirm_Modal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmRemove}
                    title="Remove from Library"
                    message={`Are you sure you want to remove "${book?.title}" from your library?`}
                    confirmText="Remove"
                    isProcessing={isLoading}
               />

               {/* Shipping & Billing Address Modal */}
               <Checkout_Address_Modal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onSubmit={handleAddressSubmit}
                    title={`Purchase details for "${book?.title}"`}
               />

               {/* Preview Lightbox */}
               {isPreviewOpen && book?.preview_pages && (
                    <div style={{
                         position: 'fixed',
                         top: 0,
                         left: 0,
                         width: '100vw',
                         height: '100vh',
                         backgroundColor: 'rgba(0,0,0,0.9)',
                         zIndex: 9999,
                         display: 'flex',
                         flexDirection: 'column',
                         justifyContent: 'center',
                         alignItems: 'center'
                    }}>
                         <button 
                              onClick={() => setIsPreviewOpen(false)}
                              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}
                         >
                              &times;
                         </button>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <button 
                                   onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                                   disabled={currentPreviewIndex === 0}
                                   style={{ background: 'none', border: 'none', color: 'white', fontSize: '48px', cursor: currentPreviewIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentPreviewIndex === 0 ? 0.3 : 1 }}
                              >
                                   &#8249;
                              </button>
                              {isPdfPreview ? (
                                   <div className="bd_preview_pdf_wrapper" style={{
                                        maxHeight: '80vh',
                                        maxWidth: '80vw',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: 'white',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                   }}>
                                        <Document
                                             file={`${env.API_URL}/books/preview-proxy?url=${encodeURIComponent(book.preview_pages[0])}`}
                                             onLoadSuccess={onDocumentLoadSuccess}
                                             loading={<div style={{ color: '#0f172a', padding: '20px' }}>Loading preview...</div>}
                                        >
                                             <Page
                                                  pageNumber={currentPreviewIndex + 1}
                                                  width={500}
                                                  renderTextLayer={false}
                                                  renderAnnotationLayer={false}
                                             />
                                        </Document>
                                   </div>
                              ) : (
                                   <img 
                                        src={book.preview_pages[currentPreviewIndex]} 
                                        alt={`Preview page ${currentPreviewIndex + 1}`} 
                                        style={{ maxHeight: '80vh', maxWidth: '80vw', objectFit: 'contain' }}
                                   />
                              )}
                              <button 
                                   onClick={() => setCurrentPreviewIndex(Math.min(totalPagesCount - 1, currentPreviewIndex + 1))}
                                   disabled={currentPreviewIndex === totalPagesCount - 1}
                                   style={{ background: 'none', border: 'none', color: 'white', fontSize: '48px', cursor: currentPreviewIndex === totalPagesCount - 1 ? 'not-allowed' : 'pointer', opacity: currentPreviewIndex === totalPagesCount - 1 ? 0.3 : 1 }}
                              >
                                   &#8250;
                              </button>
                         </div>
                         <div style={{ color: 'white', marginTop: '20px', fontSize: '16px' }}>
                              {currentPreviewIndex + 1} / {totalPagesCount}
                         </div>
                    </div>
               )}
          </>
     );
};

export default Book_Details_Slider;
