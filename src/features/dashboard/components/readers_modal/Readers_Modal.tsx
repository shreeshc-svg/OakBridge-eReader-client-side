import { useState, useEffect } from 'react';
import { dashboard_api } from '../../api/dashboard_api';
import './Readers_Modal.scss';

interface Reader {
     id: string;
     username: string;
     email: string;
     joined: string;
     right_click_allowed: boolean;
}

interface ReadersModalProps {
     isOpen: boolean;
     onClose: () => void;
}

const Readers_Modal = ({ isOpen, onClose }: ReadersModalProps) => {
     const [readers, setReaders] = useState<Reader[]>([]);
     const [isLoading, setIsLoading] = useState(false);
     const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

     useEffect(() => {
          if (isOpen) {
               setIsLoading(true);
               dashboard_api
                    .get_readers_list()
                    .then((res) => {
                         setReaders(res.data.readers);
                    })
                    .catch((err) => {
                         console.error('Failed to fetch readers:', err);
                    })
                    .finally(() => {
                         setIsLoading(false);
                    });
          }
     }, [isOpen]);

     const handleToggleRightClick = async (readerId: string, currentValue: boolean) => {
          setTogglingIds((prev) => new Set(prev).add(readerId));
          try {
               await dashboard_api.toggle_right_click(readerId, !currentValue);
               setReaders((prev) =>
                    prev.map((r) =>
                         r.id === readerId
                              ? { ...r, right_click_allowed: !currentValue }
                              : r
                    )
               );
          } catch (err) {
               console.error('Failed to toggle right-click:', err);
          } finally {
               setTogglingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(readerId);
                    return next;
               });
          }
     };

     if (!isOpen) return null;

     return (
          <>
               <div className="readers_modal__backdrop" onClick={onClose} />
               <div className="readers_modal">
                    <div className="readers_modal__header">
                         <h2 className="readers_modal__title">
                              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                   <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                              </svg>
                              Total Readers ({readers.length})
                         </h2>
                         <button
                              type="button"
                              className="readers_modal__close"
                              onClick={onClose}
                              aria-label="Close"
                         >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                   <line x1="18" y1="6" x2="6" y2="18" />
                                   <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                         </button>
                    </div>

                    <div className="readers_modal__body">
                         {isLoading ? (
                              <div className="readers_modal__loading">
                                   <div className="readers_modal__spinner" />
                                   <p>Loading readers...</p>
                              </div>
                         ) : readers.length === 0 ? (
                              <div className="readers_modal__empty">
                                   <p>No readers yet.</p>
                              </div>
                         ) : (
                              <div className="readers_modal__list">
                                   {readers.map((reader) => (
                                        <div key={reader.id} className="readers_modal__item">
                                             <div className="readers_modal__avatar">
                                                  {reader.username.charAt(0).toUpperCase()}
                                             </div>
                                             <div className="readers_modal__info">
                                                  <span className="readers_modal__name">
                                                       {reader.username}
                                                  </span>
                                                  <span className="readers_modal__email">
                                                       {reader.email}
                                                  </span>
                                             </div>
                                             <div className="readers_modal__right_section">
                                                  <label
                                                       className={`readers_modal__toggle_switch ${
                                                            togglingIds.has(reader.id) ? 'readers_modal__toggle_switch--loading' : ''
                                                       }`}
                                                       title={reader.right_click_allowed ? 'Right-click enabled' : 'Right-click disabled'}
                                                  >
                                                       <input
                                                            type="checkbox"
                                                            checked={reader.right_click_allowed}
                                                            disabled={togglingIds.has(reader.id)}
                                                            onChange={() =>
                                                                 handleToggleRightClick(reader.id, reader.right_click_allowed)
                                                            }
                                                       />
                                                       <span className="readers_modal__toggle_track">
                                                            <span className="readers_modal__toggle_thumb" />
                                                       </span>
                                                       <span className="readers_modal__toggle_label">
                                                            {reader.right_click_allowed ? 'RC On' : 'RC Off'}
                                                       </span>
                                                  </label>
                                                  <span className="readers_modal__joined">
                                                       Joined {new Date(reader.joined).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                       })}
                                                  </span>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         )}
                    </div>
               </div>
          </>
     );
};

export default Readers_Modal;
