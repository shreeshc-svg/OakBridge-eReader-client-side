import React from 'react';
import type { Bookmark } from '../../api/reader.api';
import './Bookmarks_Panel.scss';

interface BookmarksPanelProps {
     isOpen: boolean;
     onClose: () => void;
     bookmarks: Bookmark[];
     onNavigate: (cfi: string) => void;
     onDelete: (id: string) => void;
}

export const Bookmarks_Panel: React.FC<BookmarksPanelProps> = ({
     isOpen,
     onClose,
     bookmarks,
     onNavigate,
     onDelete,
}) => {
     const formatDate = (dateStr: string) => {
          try {
               const d = new Date(dateStr);
               return d.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
               });
          } catch {
               return dateStr;
          }
     };

     return (
          <>
               {/* Backdrop */}
               {isOpen && <div className="bookmarks_panel__backdrop" onClick={onClose} />}

               <aside className={`bookmarks_panel ${isOpen ? 'bookmarks_panel--open' : ''}`}>
                    <div className="bookmarks_panel__header">
                         <h2 className="bookmarks_panel__title">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                              Bookmarks
                         </h2>
                         <button className="bookmarks_panel__close_btn" onClick={onClose}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                    </div>

                    <div className="bookmarks_panel__content">
                         {bookmarks.length === 0 ? (
                              <div className="bookmarks_panel__empty">
                                   <div className="bookmarks_panel__empty_icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                   </div>
                                   <p>No bookmarks yet.</p>
                                   <span>Click the bookmark icon in the toolbar to save a page.</span>
                              </div>
                         ) : (
                              <div className="bookmarks_panel__list">
                                   {bookmarks.map((bookmark) => (
                                        <div key={bookmark.id} className="bookmarks_panel__card">
                                             <div className="bookmarks_panel__card_content" onClick={() => { onNavigate(bookmark.cfi); onClose(); }}>
                                                  <div className="bookmarks_panel__card_header">
                                                       <span className="bookmarks_panel__card_date">{formatDate(bookmark.created_at)}</span>
                                                  </div>
                                                  <p className="bookmarks_panel__card_text">
                                                       {bookmark.label || 'Saved Location'}
                                                  </p>
                                             </div>
                                             <button 
                                                  className="bookmarks_panel__card_delete"
                                                  onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
                                                  title="Delete Bookmark"
                                             >
                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                             </button>
                                        </div>
                                   ))}
                              </div>
                         )}
                    </div>
               </aside>
          </>
     );
};
