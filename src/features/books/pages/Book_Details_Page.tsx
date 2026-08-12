import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { useCartStore } from '../../../store/cart.store';
import { useLibrary } from '../../library/hooks/use_library';
import { usePayments } from '../../payments/hooks/use_payments';
import { useReviews } from '../hooks/use_reviews';
import { useCategories } from '../../categories/hooks/use_categories';
import { books_api } from '../api/books.api';
import type { Book } from '../types/books.api.types';
import { reader_api, type ReadingProgress } from '../../reader/api/reader.api';
import Confirm_Modal from '../../../components/common/confirm_modal/Confirm_Modal';
import Checkout_Address_Modal from '../../payments/components/Checkout_Address_Modal';
import Public_Navbar from '../../public_store/components/public_navbar/Public_Navbar';
import toast from 'react-hot-toast';
import { env } from '../../../config/env';
import './Book_Details_Page.scss';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Book_Details_Page = () => {
     const { bookId } = useParams<{ bookId: string }>();
     const navigate = useNavigate();
     const user = useAuthStore((state) => state.user);
     const accessToken = useAuthStore((state) => state.accessToken);

     const { libraryBookIds, libraryItems, addToLibrary, removeFromLibrary, isLoading: libraryLoading, fetchLibrary } = useLibrary();
     const { initiatePayment, isProcessing: paymentProcessing } = usePayments();
     const { cartBookIds, addToCart: addToCartStore, fetchCart: fetchCartData } = useCartStore();
     const { categories, fetchCategories } = useCategories();
     const { reviews, averageRating: _averageRating, totalCount: _totalCount, fetchBookReviews, submitReview, isLoading: reviewsLoading } = useReviews();

     const [book, setBook] = useState<Book | null>(null);
     const [pageLoading, setPageLoading] = useState(true);
     const [pageError, setPageError] = useState<string | null>(null);

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

     const [formRating, setFormRating] = useState(5);
     const [formText, setFormText] = useState('');
     const [submitLoading, setSubmitLoading] = useState(false);
     
     const [progressPercentage, setProgressPercentage] = useState<number>(0);
     const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);

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

     const libraryItem = useMemo(() => {
          if (!book) return null;
          return libraryItems.find((item) => item.book_id === book.id);
     }, [libraryItems, book]);

     const accessRemainingText = useMemo(() => {
          if (!libraryItem || !libraryItem.access_period_days) return null;
          if (hasActiveInstitutionSubscription) return 'Unlimited Institutional Access';
          const addedAt = new Date(libraryItem.added_at);
          const expirationDate = new Date(addedAt.getTime() + libraryItem.access_period_days * 24 * 60 * 60 * 1000);
          const now = new Date();
          const msLeft = expirationDate.getTime() - now.getTime();
          if (msLeft <= 0) return 'Expired';
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
          return `${daysLeft} day${daysLeft > 1 ? 's' : ''} of access remaining`;
     }, [libraryItem, hasActiveInstitutionSubscription]);

     // Fetch book details
     useEffect(() => {
          if (!bookId) return;
          
          setPageLoading(true);
          setPageError(null);
          
          books_api.get_book(bookId, accessToken)
               .then((res) => {
                    setBook(res.book);
                    setPageLoading(false);
               })
               .catch((err) => {
                    console.error('Failed to fetch book:', err);
                    setPageError(err.response?.data?.message || 'Failed to load book details');
                    setPageLoading(false);
               });
     }, [bookId, accessToken]);

     // Fetch other details
     useEffect(() => {
          fetchCategories();
     }, [fetchCategories]);

     useEffect(() => {
          if (bookId) {
               fetchBookReviews(bookId);
          }
     }, [bookId, fetchBookReviews]);

     useEffect(() => {
          if (user && bookId) {
               fetchLibrary();
               fetchCartData();
               reader_api.get_progress(bookId)
                    .then((progress) => {
                         setReadingProgress(progress);
                         setProgressPercentage(progress ? progress.progress_percentage : 0);
                    })
                    .catch(() => {
                         setReadingProgress(null);
                         setProgressPercentage(0);
                    });
          }
     }, [user, bookId, fetchLibrary]);

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
               navigate(`/login?redirect=/book/${book.id}`);
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

     const handleAddToCart = async () => {
          if (!book) return;
          if (!user) {
               navigate(`/login?redirect=/book/${book.id}`);
               return;
          }
          try {
               await addToCartStore(book.id);
               toast.success('Added to cart!');
          } catch {
               toast.error('Failed to add to cart');
          }
     };

     const isBookInCart = book ? cartBookIds.has(book.id) : false;

     const handleConfirmRemove = async () => {
          if (!book) return;
          await removeFromLibrary(book.id);
          setIsConfirmModalOpen(false);
     };

     const handleBack = () => {
          if (window.history.length > 1) {
               navigate(-1);
          } else {
               navigate('/');
          }
     };

     const isBookInLibrary = book ? libraryBookIds.has(book.id) : false;

     if (pageLoading) {
          return (
               <div className="book_details_page">
                    <Public_Navbar />
                    <div className="bd_container bd_container--loading">
                         <div className="bd_spinner" />
                         <p>Loading book details...</p>
                    </div>
               </div>
          );
     }

     if (pageError || !book) {
          return (
               <div className="book_details_page">
                    <Public_Navbar />
                    <div className="bd_container bd_container--error">
                         <h2>Error</h2>
                         <p>{pageError || 'Book not found'}</p>
                         <button onClick={handleBack} className="bd_btn bd_btn--outline">
                              Go Back
                         </button>
                    </div>
               </div>
          );
     }

     return (
          <div className="book_details_page">
               <Public_Navbar customTitle={book?.title} />
               
               <div className="bd_container">
                    {/* Back Button Row */}
                    <div className="bd_back_row">
                         <button className="bd_back_btn" onClick={handleBack}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                   <polyline points="15 18 9 12 15 6"></polyline>
                              </svg>
                              Back to library
                         </button>
                    </div>

                    {/* Main Layout Split */}
                    <div className="bd_layout">
                         {/* Left Column: Book Cover */}
                         <div className="bd_cover_column">
                              {book.cover_image_url ? (
                                   <div className="bd_cover_wrapper">
                                        <img
                                             src={book.cover_image_url}
                                             alt={book.cover_image_alt || `Cover of ${book.title}`}
                                             className="bd_cover"
                                        />
                                   </div>
                              ) : (
                                   <div className="bd_cover_placeholder">
                                        <span>No Cover Available</span>
                                   </div>
                              )}
                         </div>

                         {/* Right Column: Metadata & Actions */}
                         <div className="bd_info_column">
                              <div className="bd_category_header">
                                   {categoryNames.toUpperCase()} &middot; {publishYear}
                              </div>

                              <h1 className="bd_title">
                                   {book.title}
                              </h1>
                              
                              <p className="bd_authors">
                                   {book.author || 'Unknown Author'}
                              </p>

                              <p className="bd_description">
                                   {book.description || 'No description provided.'}
                              </p>

                              {/* Metadata Grid */}
                              <div className="bd_metadata_row">
                                   <div className="bd_metadata_item">
                                        <span className="value">{book.total_pages}</span>
                                        <span className="label">Pages</span>
                                   </div>
                                   <div className="bd_metadata_item">
                                        <span className="value">{book.total_chapters}</span>
                                        <span className="label">Chapters</span>
                                   </div>
                                   <div className="bd_metadata_item">
                                        <span className="value">{book.isbn || 'N/A'}</span>
                                        <span className="label">ISBN</span>
                                   </div>
                                       <div className="bd_metadata_item">
                                            <span className="value">
                                                 {book.access_period_days ? `${book.access_period_days} Days` : 'Lifetime'}
                                            </span>
                                            <span className="label">Access</span>
                                       </div>
                              </div>

                              {/* Progress Card (Only shown if user has book in library) */}
                              {user && isBookInLibrary && (
                                   <div className="bd_progress_card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                             <div className="bd_progress_label" style={{ margin: 0 }}>YOUR PROGRESS</div>
                                             {accessRemainingText && (
                                                  <div className="bd_progress_time_left">
                                                       {accessRemainingText.toUpperCase()}
                                                  </div>
                                             )}
                                        </div>
                                        <div className="bd_progress_row">
                                             <span className="bd_progress_text">
                                                  {readingProgress?.current_chapter || 'Chapter 1'} &middot; {progressPercentage}%
                                             </span>
                                             <div className="bd_progress_bar_container">
                                                  <div className="bd_progress_bar_track">
                                                       <div 
                                                            className="bd_progress_bar_fill" 
                                                            style={{ width: `${progressPercentage}%` }}
                                                       />
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {/* Actions Container */}
                              <div className="bd_actions_container">
                                   {book.file_url && isBookInLibrary ? (
                                        <>
                                             <Link
                                                  to={`/reader/${book.id}`}
                                                  className="bd_btn bd_btn--primary"
                                             >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                                       <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                  </svg>
                                                  {progressPercentage > 0 ? `Resume from ${readingProgress?.current_chapter || 'Chapter 1'}` : 'Start reading'}
                                             </Link>
                                             
                                             <button
                                                  type="button"
                                                  className="bd_btn bd_btn--outline"
                                                  onClick={handleStartOver}
                                             >
                                                  Start over
                                             </button>

                                             <button
                                                  type="button"
                                                  className="bd_btn bd_btn--outline bd_btn--danger"
                                                  onClick={handleLibraryAction}
                                                  disabled={libraryLoading || paymentProcessing}
                                             >
                                                  Remove from library
                                             </button>
                                        </>
                                   ) : (
                                        <>
                                             <button
                                                  className="bd_btn bd_btn--primary"
                                                  onClick={handleLibraryAction}
                                                  disabled={libraryLoading || paymentProcessing}
                                             >
                                                  {libraryLoading || paymentProcessing ? '...' : (isBookFreeForUser ? 'Add to Library' : `Buy for ₹${book.price / 100}`)}
                                             </button>

                                             {/* Add to Cart button for paid books */}
                                             {!isBookFreeForUser && (
                                                  isBookInCart ? (
                                                       <Link
                                                            to="/cart"
                                                            className="bd_btn bd_btn--outline"
                                                       >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                                                 <circle cx="9" cy="21" r="1" />
                                                                 <circle cx="20" cy="21" r="1" />
                                                                 <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                                            </svg>
                                                            Go to Cart
                                                       </Link>
                                                  ) : (
                                                       <button
                                                            type="button"
                                                            className="bd_btn bd_btn--outline"
                                                            onClick={handleAddToCart}
                                                            disabled={libraryLoading || paymentProcessing}
                                                       >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                                                 <circle cx="9" cy="21" r="1" />
                                                                 <circle cx="20" cy="21" r="1" />
                                                                 <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                                            </svg>
                                                            Add to Cart
                                                       </button>
                                                  )
                                             )}

                                             {book.preview_pages && book.preview_pages.length > 0 && (
                                                  <button
                                                       type="button"
                                                       className="bd_btn bd_btn--outline"
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
                         </div>
                    </div>

                    {/* Divider line before reviews */}
                    <hr className="bd_divider" />

                    {/* Reviews & Ratings Section */}
                    <div className="bd_reviews_section">
                         <h2>Reviews & Ratings</h2>
                         
                         {/* Write Review Form */}
                         {user && isBookInLibrary && !reviews.some(r => r.username === user.username) && (
                              <form onSubmit={handleReviewSubmit} className="bd_review_form">
                                   <h3>Share your review</h3>
                                   
                                   {/* Star Selector */}
                                   <div className="bd_star_selector">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                             <button
                                                  type="button"
                                                  key={star}
                                                  onClick={() => setFormRating(star)}
                                             >
                                                  <span className={`bd_star ${star <= formRating ? 'active' : ''}`}>
                                                       ★
                                                  </span>
                                             </button>
                                        ))}
                                   </div>

                                   <textarea
                                        value={formText}
                                        onChange={(e) => setFormText(e.target.value)}
                                        placeholder="Write your review here..."
                                        rows={4}
                                        required
                                        className="bd_review_textarea"
                                   />

                                   <button
                                        type="submit"
                                        disabled={submitLoading || !formText.trim()}
                                        className="bd_btn bd_btn--primary bd_review_submit"
                                   >
                                        {submitLoading ? 'Submitting...' : 'Submit Review'}
                                   </button>
                              </form>
                         )}

                         {/* Reviews List */}
                         {reviewsLoading ? (
                              <p className="bd_reviews_status_msg">Loading reviews...</p>
                         ) : reviews.length === 0 ? (
                              <p className="bd_reviews_status_msg no_reviews">No reviews yet. Be the first to review!</p>
                         ) : (
                              <div className="bd_reviews_list">
                                   {reviews.map((rev) => (
                                        <div key={rev.id} className="bd_review_item">
                                             <div className="bd_review_header">
                                                  <span className="bd_review_author">
                                                       {rev.username || 'Anonymous'}
                                                  </span>
                                                  <span className="bd_review_rating_stars">
                                                       {"★".repeat(rev.rating) + "☆".repeat(5 - rev.rating)}
                                                  </span>
                                             </div>
                                             <p className="bd_review_text">
                                                  {rev.review_text}
                                             </p>
                                             <span className="bd_review_date">
                                                  {new Date(rev.createdAt).toLocaleDateString()}
                                             </span>
                                        </div>
                                   ))}
                              </div>
                         )}
                    </div>
               </div>

               {/* Confirm Library Removal Modal */}
               <Confirm_Modal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmRemove}
                    title="Remove from Library"
                    message={`Are you sure you want to remove "${book.title}" from your library?`}
                    confirmText="Remove"
                    isProcessing={libraryLoading}
               />

               {/* Shipping & Billing Address Modal */}
               <Checkout_Address_Modal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onSubmit={handleAddressSubmit}
                    title={`Purchase details for "${book.title}"`}
               />

               {/* Preview Lightbox */}
               {isPreviewOpen && book.preview_pages && (
                    <div className="bd_preview_lightbox">
                         <button 
                              onClick={() => setIsPreviewOpen(false)}
                              className="bd_preview_close"
                              aria-label="Close preview"
                         >
                              &times;
                         </button>
                         <div className="bd_preview_content">
                              <button 
                                   onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                                   disabled={currentPreviewIndex === 0}
                                   className="bd_preview_arrow bd_preview_arrow--left"
                              >
                                   &#8249;
                              </button>
                              {isPdfPreview ? (
                                   <div className="bd_preview_pdf_wrapper">
                                        <Document
                                             file={`${env.API_URL}/books/preview-proxy?url=${encodeURIComponent(book.preview_pages[0])}`}
                                             onLoadSuccess={onDocumentLoadSuccess}
                                             loading={<div className="bd_preview_loading" style={{ color: 'white' }}>Loading preview...</div>}
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
                                        alt={(book.preview_pages_alt && book.preview_pages_alt[currentPreviewIndex]) || `Preview page ${currentPreviewIndex + 1}`} 
                                        className="bd_preview_image"
                                   />
                              )}
                              <button 
                                   onClick={() => setCurrentPreviewIndex(Math.min(totalPagesCount - 1, currentPreviewIndex + 1))}
                                   disabled={currentPreviewIndex === totalPagesCount - 1}
                                   className="bd_preview_arrow bd_preview_arrow--right"
                              >
                                   &#8250;
                              </button>
                         </div>
                         <div className="bd_preview_counter">
                              {currentPreviewIndex + 1} / {totalPagesCount}
                         </div>
                    </div>
               )}
          </div>
     );
};

export default Book_Details_Page;
