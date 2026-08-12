import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { UserNowReading } from '../../types/dashboard.types';
import type { Book } from '../../../books/types/books.api.types';
import type { User } from '../../../auth/types/auth.types';
import './Welcome_Back_Modal.scss';

interface WelcomeBackModalProps {
     isOpen: boolean;
     onClose: () => void;
     user: User | null;
     nowReadingBook: UserNowReading | null;
     dbBooks?: Book[];
}

const Welcome_Back_Modal: React.FC<WelcomeBackModalProps> = ({
     isOpen,
     onClose,
     user,
     nowReadingBook,
     dbBooks = [],
}) => {
     const navigate = useNavigate();

     // Lock background scrolling when modal is open
     useEffect(() => {
          if (isOpen && nowReadingBook) {
               document.body.style.overflow = 'hidden';
          } else {
               document.body.style.overflow = 'unset';
          }
          return () => {
               document.body.style.overflow = 'unset';
          };
     }, [isOpen, nowReadingBook]);

     if (!isOpen || !nowReadingBook) return null;

     const cleanTitle = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ');
     const matched = dbBooks.find(b => cleanTitle(b.title) === cleanTitle(nowReadingBook.title));
     const bookId = nowReadingBook.id || matched?.id;

     const handleResume = () => {
          if (bookId) {
               navigate(`/reader/${bookId}`);
               onClose();
          }
     };

     const handleStartBeginning = () => {
          if (bookId) {
               navigate(`/reader/${bookId}?startFromBeginning=true`);
               onClose();
          }
     };

     const username = user?.username || 'Reader';
     const coverSrc = matched?.cover_image_url || nowReadingBook.cover_url;

     return createPortal(
          <>
               <div className="wb_modal__overlay" onClick={onClose} />
               <div className="wb_modal" onClick={(e) => e.stopPropagation()}>
                    <div className="wb_modal__content">
                         <h2 className="wb_modal__title">Welcome back, {username}.</h2>
                         <p className="wb_modal__subtitle">Pick up where you left off — or start fresh.</p>

                         <div className="wb_modal__book_card">
                              <div className="wb_modal__cover_col">
                                   {coverSrc ? (
                                        <img src={coverSrc} alt={nowReadingBook.title} className="wb_modal__cover" />
                                   ) : (
                                        <div
                                             className="wb_modal__cover wb_modal__cover--placeholder"
                                             style={{
                                                  background: `linear-gradient(135deg, ${nowReadingBook.gradient_from || '#1e3a8a'}, ${nowReadingBook.gradient_to || '#3b82f6'})`
                                             }}
                                        >
                                             <span>{nowReadingBook.title.slice(0, 2).toUpperCase()}</span>
                                        </div>
                                   )}
                              </div>
                              <div className="wb_modal__info_col">
                                   <h3 className="wb_modal__book_title" title={nowReadingBook.title}>{nowReadingBook.title}</h3>
                                   <p className="wb_modal__book_author" title={nowReadingBook.author}>{nowReadingBook.author}</p>
                                   <div className="wb_modal__progress_row">
                                        <span className="wb_modal__chapter">{nowReadingBook.chapter || 'Chapter 1'}</span>
                                        <div className="wb_modal__progress_track">
                                             <div
                                                  className="wb_modal__progress_fill"
                                                  style={{ width: `${nowReadingBook.progress}%` }}
                                             />
                                        </div>
                                        <span className="wb_modal__progress_pct">{nowReadingBook.progress}%</span>
                                    </div>
                              </div>
                         </div>

                         <div className="wb_modal__footer">
                              <button
                                   type="button"
                                   className="wb_modal__btn wb_modal__btn--outline"
                                   onClick={handleStartBeginning}
                                   disabled={!bookId}
                              >
                                   Start from beginning
                              </button>
                              <button
                                   type="button"
                                   className="wb_modal__btn wb_modal__btn--primary"
                                   onClick={handleResume}
                                   disabled={!bookId}
                              >
                                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: 6 }}>
                                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                                   </svg>
                                   Resume reading
                              </button>
                         </div>
                    </div>
               </div>
          </>,
          document.body
     );
};

export default Welcome_Back_Modal;
