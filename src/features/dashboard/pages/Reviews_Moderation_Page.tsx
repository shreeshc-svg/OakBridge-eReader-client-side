import { useEffect, useState, useCallback } from 'react';
import { useReviews } from '../../books/hooks/use_reviews';
import toast from 'react-hot-toast';
import { dashboard_api } from '../api/dashboard_api';
import Skeleton from '../../../components/common/skeleton/Skeleton';
import './Reviews_Moderation_Page.scss';

const CheckIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <polyline points="20 6 9 17 4 12" />
     </svg>
);

const XIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
     </svg>
);

const Reviews_Moderation_Page = () => {
     const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
     const [timeframe, setTimeframe] = useState<string>('all');
     const { adminReviews, isLoading, fetchAdminReviews, moderateReview } = useReviews();

     const [summary, setSummary] = useState<any>(null);
     const [loadingSummary, setLoadingSummary] = useState(true);

     const fetchSummary = useCallback(async () => {
          try {
               setLoadingSummary(true);
               const res = await dashboard_api.get_revenue_analytics();
               setSummary(res.data.reviews);
          } catch (err: any) {
               console.error('Failed to fetch reviews summary:', err);
          } finally {
               setLoadingSummary(false);
          }
     }, []);

     useEffect(() => {
          fetchAdminReviews(activeTab, timeframe);
     }, [fetchAdminReviews, activeTab, timeframe]);

     useEffect(() => {
          fetchSummary();
     }, [fetchSummary]);

     const handleApprove = async (id: string) => {
          try {
               await moderateReview(id, 'approved');
               toast.success('Review approved successfully!');
               fetchAdminReviews(activeTab, timeframe);
               fetchSummary();
          } catch (err: any) {
               toast.error(err.message || 'Failed to approve review');
          }
     };

     const handleReject = async (id: string) => {
          const confirmMsg = activeTab === 'approved' 
               ? 'Are you sure you want to reject this approved review?'
               : 'Are you sure you want to reject this review?';
          if (window.confirm(confirmMsg)) {
               try {
                    await moderateReview(id, 'rejected');
                    toast.success('Review rejected successfully.');
                    fetchAdminReviews(activeTab, timeframe);
                    fetchSummary();
               } catch (err: any) {
                    toast.error(err.message || 'Failed to reject review');
               }
          }
     };

     return (
          <div className="reviews_moderation_page">
               <div className="reviews_moderation_page__header">
                    <div className="reviews_moderation_page__title_group">
                         <h1>Reader Reviews</h1>
                         <p>Moderate new user reviews and manage approved or rejected reviews.</p>
                    </div>
                    <div className="timeframe-filters">
                         {[
                              { value: 'all', label: 'All Time' },
                              { value: 'day', label: 'Today' },
                              { value: 'week', label: 'This Week' },
                              { value: 'month', label: 'This Month' },
                         ].map((t) => (
                              <button
                                   key={t.value}
                                   type="button"
                                   className={`timeframe-btn ${timeframe === t.value ? 'timeframe-btn--active' : ''}`}
                                   onClick={() => setTimeframe(t.value)}
                              >
                                   {t.label}
                              </button>
                         ))}
                    </div>
               </div>

               {/* Reviews Summary Section */}
               <div className="reviews_moderation_page__stats-section">
                    {loadingSummary ? (
                         <div className="reviews-grid-skeleton" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                              {[...Array(4)].map((_, i) => (
                                   <Skeleton key={i} height="80px" borderRadius="12px" />
                              ))}
                         </div>
                    ) : (
                         <div className="reviews-stats-grid">
                              <div className="review-stat-card review-stat-card--total">
                                   <div className="review-stat-card__label">Total Reviews</div>
                                   <strong className="review-stat-card__value">{summary?.total ?? 0}</strong>
                                   <span className="review-stat-card__sub">All submitted reviews</span>
                              </div>
                              <div className="review-stat-card review-stat-card--approved">
                                   <div className="review-stat-card__label">Approved</div>
                                   <strong className="review-stat-card__value text-success">{summary?.approved ?? 0}</strong>
                                   <span className="review-stat-card__sub">Visible on book pages</span>
                              </div>
                              <div className="review-stat-card review-stat-card--pending">
                                   <div className="review-stat-card__label">Pending Moderation</div>
                                   <strong className="review-stat-card__value text-warning">{summary?.pending ?? 0}</strong>
                                   <span className="review-stat-card__sub">Awaiting admin review</span>
                              </div>
                              <div className="review-stat-card review-stat-card--rejected">
                                   <div className="review-stat-card__label">Rejected</div>
                                   <strong className="review-stat-card__value text-danger">{summary?.rejected ?? 0}</strong>
                                   <span className="review-stat-card__sub">Flagged/inappropriate</span>
                              </div>
                         </div>
                    )}
               </div>

               {/* Tabs navigation */}
               <div className="reviews_moderation_page__tabs">
                    <button 
                         className={`reviews_moderation_page__tab ${activeTab === 'pending' ? 'reviews_moderation_page__tab--active' : ''}`}
                         onClick={() => setActiveTab('pending')}
                    >
                         Pending Moderation
                    </button>
                    <button 
                         className={`reviews_moderation_page__tab ${activeTab === 'approved' ? 'reviews_moderation_page__tab--active' : ''}`}
                         onClick={() => setActiveTab('approved')}
                    >
                         Approved Reviews
                    </button>
                    <button 
                         className={`reviews_moderation_page__tab ${activeTab === 'rejected' ? 'reviews_moderation_page__tab--active' : ''}`}
                         onClick={() => setActiveTab('rejected')}
                    >
                         Rejected Reviews
                    </button>
               </div>

               <div className="reviews_moderation_page__list">
                    {isLoading ? (
                         <div className="reviews_moderation_page__loading">
                              <p style={{ color: 'var(--text-2)' }}>Loading reviews...</p>
                         </div>
                    ) : adminReviews.length === 0 ? (
                         <div className="reviews_moderation_page__empty_state">
                              <div className="reviews_moderation_page__empty_icon">
                                   <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                   </svg>
                              </div>
                              <h3>No Reviews Found</h3>
                              <p>There are no reviews in this category.</p>
                         </div>
                    ) : (
                         <div className="reviews_moderation_page__grid">
                              {adminReviews.map((rev) => (
                                   <div key={rev.id} className="reviews_moderation_page__card">
                                        <div className="reviews_moderation_page__card_header">
                                             <div>
                                                  <h4>{rev.bookTitle}</h4>
                                                  <span className="user_email">by {rev.userEmail}</span>
                                             </div>
                                             <div className="stars_rating">
                                                  {"★".repeat(rev.rating) + "☆".repeat(5 - rev.rating)}
                                             </div>
                                        </div>
                                        <div className="reviews_moderation_page__card_body">
                                             <p>{rev.review_text}</p>
                                        </div>
                                        <div className="reviews_moderation_page__card_footer">
                                             <div className="reviews_moderation_page__card_meta">
                                                  <span className="timestamp">
                                                       {new Date(rev.createdAt).toLocaleString()}
                                                  </span>
                                                  {activeTab !== 'pending' && (
                                                       <span className={`status_badge status_badge--${rev.status}`}>
                                                            {rev.status}
                                                       </span>
                                                  )}
                                             </div>
                                             <div className="action_buttons">
                                                  {(activeTab === 'pending' || activeTab === 'rejected') && (
                                                       <button
                                                            className="approve_btn"
                                                            onClick={() => handleApprove(rev.id)}
                                                            title="Approve Review"
                                                       >
                                                            <CheckIcon />
                                                            Approve
                                                       </button>
                                                  )}
                                                  {(activeTab === 'pending' || activeTab === 'approved') && (
                                                       <button
                                                            className="reject_btn"
                                                            onClick={() => handleReject(rev.id)}
                                                            title="Reject Review"
                                                       >
                                                            <XIcon />
                                                            Reject
                                                       </button>
                                                  )}
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    )}
               </div>
          </div>
     );
};

export default Reviews_Moderation_Page;
