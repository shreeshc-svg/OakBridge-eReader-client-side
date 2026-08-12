import React from 'react';
import type { Highlight } from '../../api/reader.api';
import './Notes_Panel.scss';

interface NotesPanelProps {
     isOpen: boolean;
     onClose: () => void;
     highlights: Highlight[];
     onNavigate: (cfiRange: string) => void;
     onDeleteNote?: (id: string) => void;
}

export const Notes_Panel: React.FC<NotesPanelProps> = ({
     isOpen,
     onClose,
     highlights,
     onNavigate,
     onDeleteNote,
}) => {
     const notesOnly = highlights.filter(h => h.note);

     const resolveColorLabel = (color: string) => {
          switch (color) {
               case 'yellow': return '#fde047';
               case 'green': return '#bbf7d0';
               case 'pink': return '#fbcfe8';
               case 'blue': return '#bfdbfe';
               default: return color;
          }
     };

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
               {isOpen && <div className="notes_panel__backdrop" onClick={onClose} />}

               <aside className={`notes_panel ${isOpen ? 'notes_panel--open' : ''}`}>
                    <div className="notes_panel__header">
                         <h2 className="notes_panel__title">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              My Notes
                         </h2>
                         <button className="notes_panel__close_btn" onClick={onClose}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                    </div>

                    <div className="notes_panel__count">
                         {notesOnly.length} {notesOnly.length === 1 ? 'note' : 'notes'}
                    </div>

                    <div className="notes_panel__list">
                         {notesOnly.length === 0 ? (
                              <div className="notes_panel__empty">
                                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                   </svg>
                                   <p>No notes yet</p>
                                   <span>Highlight text and click "Note" to add your first note</span>
                              </div>
                         ) : (
                              notesOnly.map((h) => (
                                   <button
                                        key={h.id}
                                        className="notes_panel__card"
                                        onClick={() => onNavigate(h.cfi_range)}
                                   >
                                        <div className="notes_panel__card_highlight">
                                             <span
                                                  className="notes_panel__card_color_dot"
                                                  style={{ backgroundColor: resolveColorLabel(h.color) }}
                                             />
                                             <p className="notes_panel__card_text">"{h.text}"</p>
                                        </div>
                                        <div className="notes_panel__card_note">
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                             </svg>
                                             {h.note}
                                        </div>
                                        <div className="notes_panel__card_meta">
                                             <span>{formatDate(h.created_at)}</span>
                                             <div className="notes_panel__card_actions">
                                                  <span className="notes_panel__card_goto">Go to page →</span>
                                                  {onDeleteNote && (
                                                       <button
                                                            type="button"
                                                            className="notes_panel__delete_btn"
                                                            onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 onDeleteNote(h.id);
                                                            }}
                                                            title="Delete note"
                                                       >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                       </button>
                                                  )}
                                             </div>
                                        </div>
                                   </button>
                              ))
                         )}
                    </div>
               </aside>
          </>
     );
};
