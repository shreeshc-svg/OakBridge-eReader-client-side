import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { useBooks } from '../../books/hooks/use_books';
import { env } from '../../../config/env';
import { useReader } from '../hooks/use_reader';
import { Selection_Toolbar, type SelectionState } from '../components/selection_toolbar/Selection_Toolbar';
import { Dictionary_Modal } from '../components/dictionary_modal/Dictionary_Modal';
import { Notes_Panel } from '../components/notes_panel/Notes_Panel';
import { TOC_Panel } from '../components/toc_panel/TOC_Panel';
import toast from 'react-hot-toast';
import Confirm_Modal from '../../../components/common/confirm_modal/Confirm_Modal';
import { settings_api } from '../../dashboard/api/settings.api';
import { isBookCached, loadBookOffline, saveBookOffline } from '../../../utils/offline_manager';
import { decryptBookBuffer } from '../../../utils/drm_decrypt';
import { PDF_Reader } from '../components/pdf_reader/PDF_Reader';
import { books_api } from '../../books/api/books.api';
import './Reader_Page.scss';

import { auth_api } from '../../auth/api/auth.api';

/** Build a repeating diagonal watermark data-URL from user info.
 * Rendered at higher opacity so it is clearly visible in any screen recording.
 */
const buildWatermarkDataUrl = (label: string, isDark: boolean): string => {
     const canvas = document.createElement('canvas');
     canvas.width = 500;
     canvas.height = 320;
     const ctx = canvas.getContext('2d')!;
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     ctx.save();
     ctx.translate(canvas.width / 2, canvas.height / 2);
     ctx.rotate(-25 * (Math.PI / 180));
     // Primary label — subtle, barely noticeable to the reading eye
     ctx.font = '500 13px Inter, system-ui, sans-serif';
     ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.09)';
     ctx.textAlign = 'center';
     ctx.fillText(label, 0, -10);
     // Secondary label
     ctx.font = '400 11px Inter, system-ui, sans-serif';
     ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.07)';
     ctx.fillText('Oakbridge — Protected Content', 0, 6);
     ctx.restore();
     return canvas.toDataURL();
};

/** Build the CSS background-image property string for watermark tiling */
const buildWatermarkBgCss = (dataUrl: string) =>
     `url('${dataUrl}') repeat`;

const blockContext = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
const blockKeys = (e: KeyboardEvent) => {
     // DevTools
     if (e.key === 'F12') { e.preventDefault(); return; }
     if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return; }
     if (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) { e.preventDefault(); return; }
     if (e.metaKey && e.altKey && ['i', 'I'].includes(e.key)) { e.preventDefault(); return; }
     // Screenshot shortcuts (best-effort — OS may intercept before browser)
     if (e.key === 'PrintScreen') { e.preventDefault(); return; }
     // Mac: Cmd+Shift+3 (full screenshot), Cmd+Shift+4 (area), Cmd+Shift+5 (toolbar)
     if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) { e.preventDefault(); return; }
     // Block Ctrl+P (print — can be used to "print to PDF")
     if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); return; }
};

const Reader_Page = () => {
     const { bookId } = useParams<{ bookId: string }>();
     const navigate = useNavigate();
     const { books, fetchBooks } = useBooks();
     const accessToken = useAuthStore((state) => state.accessToken);
     const currentUser = useAuthStore((state) => state.user);
     const [singleBook, setSingleBook] = useState<any>(null);
     const [isSingleBookLoading, setIsSingleBookLoading] = useState<boolean>(false);
     const book = books.find((b) => b.id === bookId) || singleBook;
     const [, setLocation] = useState<string | number>(0);
     const [error, setError] = useState<string | null>(null);
     const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
     const [detectedFormat, setDetectedFormat] = useState<'pdf' | null>(null);

     useEffect(() => {
          if (!book && bookId && accessToken) {
               setIsSingleBookLoading(true);
               books_api
                    .get_book(bookId, accessToken)
                    .then((res) => {
                         setSingleBook(res.book);
                    })
                    .catch((err) => {
                         console.error('Failed to fetch single book:', err);
                    })
                    .finally(() => {
                         setIsSingleBookLoading(false);
                    });
          }
     }, [book, bookId, accessToken]);

     const shieldVideoRef = useRef<HTMLVideoElement>(null);
     const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
     const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
     const [isBookmarkMenuOpen, setIsBookmarkMenuOpen] = useState<boolean>(false);
     const [, setProgress] = useState<number>(0);
     const [totalPages, setTotalPages] = useState<number>(0);
     const [currentPage, setCurrentPage] = useState<number>(0);
     const [activeSelection, setActiveSelection] = useState<SelectionState | null>(null);
     const [lookupWord, setLookupWord] = useState<string | null>(null);
     const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
     const [highlightToDelete, setHighlightToDelete] = useState<{ id: string; cfi_range: string } | null>(null);
     const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
     const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
     const [toc, setToc] = useState<any[]>([]);
     const [disableRightClick, setDisableRightClick] = useState<boolean>(true);
     const saveProgressTimeout = useRef<any>(null);
      
     const [scale, setScale] = useState<number>(() => {
          return window.innerWidth < 680 ? 1.0 : 0.85;
     });
     const [fitMode, setFitMode] = useState<'page' | 'width'>(() => {
          return window.innerWidth < 680 ? 'page' : 'width';
     });
     const [pageInputValue, setPageInputValue] = useState<string>('1');
     const [showMobileZoomTooltip, setShowMobileZoomTooltip] = useState(false);

     useEffect(() => {
          setPageInputValue(String(currentPage || 1));
     }, [currentPage]);

     useEffect(() => {
          if (window.innerWidth < 680 && pdfData) {
               const delayShow = setTimeout(() => {
                    setShowMobileZoomTooltip(true);
               }, 800);

               const delayHide = setTimeout(() => {
                    setShowMobileZoomTooltip(false);
               }, 5800);

               return () => {
                    clearTimeout(delayShow);
                    clearTimeout(delayHide);
               };
          }
     }, [pdfData]);

     const zoomIn = () => setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
     const zoomOut = () => setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.6));
     const resetZoom = () => setScale(window.innerWidth < 680 ? 1.0 : 0.85);

     useEffect(() => {
          const fetchRightClickSetting = async () => {
               try {
                    let isUserAllowed = false;

                    // 1. Check if user role is Admin/Superadmin/Manager (always allowed)
                    if (
                         currentUser?.role === 'SUPERADMIN' ||
                         currentUser?.role === 'ADMIN' ||
                         currentUser?.role === 'MANAGER'
                    ) {
                         isUserAllowed = true;
                    }

                    // 2. Fetch latest user details from server to get fresh permission flag
                    if (accessToken && !isUserAllowed) {
                         try {
                              const meRes = await auth_api.get_me(accessToken);
                              // Update local store with latest user details
                              useAuthStore.setState({ user: meRes.user });
                              if (meRes.user?.right_click_allowed) {
                                   isUserAllowed = true;
                              }
                         } catch (err) {
                              console.error('Failed to sync user permission:', err);
                              // fallback to existing store value
                              if (currentUser?.right_click_allowed) {
                                   isUserAllowed = true;
                              }
                         }
                    }

                    if (isUserAllowed) {
                         setDisableRightClick(false);
                         return;
                    }

                    const res = await settings_api.get_setting('disable_right_click');
                    setDisableRightClick(res.value === 'true');
               } catch (err) {
                    setDisableRightClick(true);
               }
          };
          fetchRightClickSetting();
     }, [accessToken, currentUser?.role, currentUser?.right_click_allowed]);

     const { highlights, fetchHighlights, addHighlight, removeHighlight, fetchProgress, saveProgress, bookmarks, fetchBookmarks, addBookmark, removeBookmark } = useReader(bookId);

     const currentBookmarkCfi = useMemo(() => {
          if (currentPage > 0) return `page-${currentPage}`;
          return 'page-1';
     }, [currentPage]);

     const isCurrentPageBookmarked = useMemo(() => {
          return bookmarks.some(
               (b) => b.cfi === currentBookmarkCfi || b.cfi === `page-${currentPage}`
          );
     }, [bookmarks, currentBookmarkCfi, currentPage]);

     useEffect(() => {
          if (bookId) {
               fetchHighlights();
               fetchBookmarks();
               fetchProgress().then(progress => {
                    const params = new URLSearchParams(window.location.search);
                    const startFromBeginning = params.get('startFromBeginning') === 'true';
                    if (startFromBeginning) {
                         setLocation(0);
                         setProgress(0);
                         navigate(`/reader/${bookId}`, { replace: true });
                    } else if (progress && progress.current_cfi) {
                         setLocation(progress.current_cfi);
                         setProgress(progress.progress_percentage);
                         if (typeof progress.current_cfi === 'string' && progress.current_cfi.startsWith('page-')) {
                              const pageNum = parseInt(progress.current_cfi.replace('page-', ''), 10);
                              if (!isNaN(pageNum)) {
                                   setCurrentPage(pageNum);
                              }
                         }
                    }
               });
          }
     }, [bookId, fetchHighlights, fetchProgress, navigate]);

     const handleConfirmDeleteHighlight = () => {
          if (highlightToDelete) {
               removeHighlight(highlightToDelete.id);
          }
          setIsConfirmModalOpen(false);
          setHighlightToDelete(null);
     };

     // Build a watermark image URL from the current user's info (memoised)
     const watermarkUrl = useMemo(() => {
          const label = currentUser
               ? `${currentUser.username}  ·  ${currentUser.email}`
               : 'Oakbridge Reader';
          return buildWatermarkDataUrl(label, theme === 'dark');
     }, [currentUser, theme]);

     // Pre-build the full CSS value used in the overlay
     const watermarkBgCss = useMemo(() => buildWatermarkBgCss(watermarkUrl), [watermarkUrl]);

     useEffect(() => {
          if (!accessToken) {
               navigate('/login');
               return;
          }
          if (books.length === 0) {
               fetchBooks();
          }
     }, [books.length, fetchBooks, accessToken, navigate]);

     // ── Security layer ──────────────────────────────────────────────────────
     // Block context menu + devtools keys on the OUTER page
     useEffect(() => {
          if (!disableRightClick) return;

          document.addEventListener('contextmenu', blockContext, { capture: true });
          document.addEventListener('keydown', blockKeys, { capture: true });
          document.body.classList.add('reader__no_select');

          return () => {
               document.removeEventListener('contextmenu', blockContext, { capture: true });
               document.removeEventListener('keydown', blockKeys, { capture: true });
               document.body.classList.remove('reader__no_select');
          };
     }, [disableRightClick]);

     // ── Screen-capture shield (Netflix-style GPU layer trick) ────────────────
     useEffect(() => {
          const video = shieldVideoRef.current;
          if (!video) return;
          try {
               const canvas = document.createElement('canvas');
               canvas.width = 1;
               canvas.height = 1;
               const ctx = canvas.getContext('2d');
               if (ctx) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, 1, 1);
               }
               const stream = canvas.captureStream(0);
               video.srcObject = stream;
               video.play().catch(() => {});
          } catch {
               // ignore
          }
          return () => {
               if (video.srcObject) {
                    const tracks = (video.srcObject as MediaStream).getTracks();
                    tracks.forEach((t) => t.stop());
                    video.srcObject = null;
               }
          };
     }, []);

     const detectAndSetFormat = (buffer: ArrayBuffer) => {
          const header = new DataView(buffer.slice(0, 4));
          const magic = header.getUint32(0, false);
          if (magic === 0x25504446) {
               console.log('[Reader] Detected format: PDF');
               setDetectedFormat('pdf');
          } else {
               console.warn('[Reader] Magic bytes did not match PDF: 0x' + magic.toString(16));
               // Fallback to pdf as we are PDF only
               setDetectedFormat('pdf');
          }
     };

     useEffect(() => {
          const loadBook = async () => {
               if (!bookId || !book) return;

               const userId = currentUser?.id;
               if (!userId) {
                    setError('User session not found.');
                    return;
               }

               try {
                    // 1. Try to load from offline cache first
                    const cached = await isBookCached(bookId);
                    if (cached) {
                         const decrypted = await loadBookOffline(bookId, userId);
                         if (decrypted) {
                              console.log('[Reader] Loaded book from offline cache');
                              detectAndSetFormat(decrypted);
                              setPdfData(decrypted);
                              return;
                         }
                    }

                    console.log('[Reader] Fetching DRM key for book:', book.id);
                    const keyRes = await fetch(
                         `${env.API_URL}/books/drm-key?id=${book.id}`,
                         {
                              headers: {
                                   Authorization: `Bearer ${accessToken}`,
                              },
                         }
                    );

                    if (!keyRes.ok) {
                         const errJson = await keyRes.json().catch(() => ({}));
                         throw new Error(errJson.message || 'Failed to fetch book decryption key');
                    }

                    const keyData = await keyRes.json();
                    const { key, iv } = keyData;

                    console.log('[Reader] Downloading book file...');
                    const res = await fetch(
                         `${env.API_URL}/books/download-book?id=${book.id}`,
                         {
                              headers: {
                                   Authorization: `Bearer ${accessToken}`,
                              },
                         }
                    );

                    if (!res.ok) {
                         const errJson = await res.json().catch(() => ({}));
                         throw new Error(errJson.message || 'Failed to load book file');
                    }

                    const encryptedBuffer = await res.arrayBuffer();
                    const decryptedBuffer = await decryptBookBuffer(encryptedBuffer, key, iv);
                    detectAndSetFormat(decryptedBuffer);
                    setPdfData(decryptedBuffer);

                    // Save to offline cache in the background
                    saveBookOffline(book.id, userId, decryptedBuffer).catch((err) => {
                         console.error('Failed to auto-save book offline:', err);
                    });
               } catch (err: any) {
                    console.error('[Reader] loadBook error:', err);
                    setError(err.message || 'Failed to load or decrypt the file.');
               }
          };

          if (bookId && book) {
               loadBook();
          }
     }, [bookId, accessToken, book, currentUser]);

     const isBooksLoading = !book && (books.length === 0 || isSingleBookLoading);
     const isDecrypting = book && !detectedFormat && !pdfData && !error;
     const isLoading = isBooksLoading || isDecrypting;
     const notFoundError = !isBooksLoading && !book ? 'Book not found.' : null;
     const displayError = error || notFoundError;

     if (isLoading) {
          return (
               <div className="reader_page">
                    <div className="reader_page__loading">
                         <div className="spinner" />
                         <span>Loading Manuscript...</span>
                    </div>
               </div>
          );
     }

     if (displayError || !book) {
          return (
               <div className="reader_page">
                    <div className="reader_page__header">
                         <button
                              className="reader_page__back_btn"
                              onClick={() => navigate(-1)}
                         >
                              &larr; Back
                         </button>
                    </div>
                    <div className="reader_page__content">
                         <p style={{ color: '#ef4444', fontWeight: 800 }}>
                              {displayError || 'An error occurred'}
                         </p>
                    </div>
               </div>
          );
     }

     return (
          <div className="reader_page" data-theme={theme}>
               {/* ── Screen-capture shield video (GPU compositor trick) ── */}
               <video
                    ref={shieldVideoRef}
                    className="reader__capture_shield"
                    muted
                    playsInline
                    aria-hidden="true"
               />

               {/* ── Persistent user watermark ── */}
               <div
                    className="reader__watermark"
                    aria-hidden="true"
                    style={{ background: watermarkBgCss, backgroundSize: '500px 320px' }}
               />

                <header className="reader_page__header">
                     <div className="reader_page__header_left">
                          <button
                               className="reader_page__back_btn"
                               onClick={() => navigate(-1)}
                               title="Back"
                          >
                               &larr; <span className="reader_page__btn_label">Back</span>
                          </button>
                          <h1 className="reader_page__title">{book.title}</h1>
                     </div>

                     <div className="reader_page__header_center">
                          <button
                               type="button"
                               onClick={() => {
                                    const prevPage = Math.max(1, currentPage - 1);
                                    setCurrentPage(prevPage);
                                    setLocation(`page-${prevPage}`);
                               }}
                               disabled={currentPage <= 1}
                               className="reader_page__nav_btn"
                               title="Previous Page"
                          >
                               ‹
                          </button>
                          <span className="reader_page__page_info">
                               Page{' '}
                               <input
                                    type="number"
                                    className="reader_page__page_input"
                                    value={pageInputValue}
                                    min={1}
                                    max={totalPages || 1}
                                    onChange={(e) => setPageInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                         if (e.key === 'Enter') {
                                              const page = parseInt(pageInputValue, 10);
                                              if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                                   setCurrentPage(page);
                                                   setLocation(`page-${page}`);
                                              }
                                         }
                                    }}
                                    onBlur={() => {
                                         const page = parseInt(pageInputValue, 10);
                                         if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                              setCurrentPage(page);
                                              setLocation(`page-${page}`);
                                         } else {
                                              setPageInputValue(String(currentPage || 1));
                                         }
                                    }}
                               />
                               {' '}of {totalPages || '--'}
                          </span>
                          <button
                               type="button"
                               onClick={() => {
                                    const nextPage = Math.min(totalPages, currentPage + 1);
                                    setCurrentPage(nextPage);
                                    setLocation(`page-${nextPage}`);
                               }}
                               disabled={currentPage >= totalPages}
                               className="reader_page__nav_btn"
                               title="Next Page"
                          >
                               ›
                          </button>

                          <div className="reader_page__zoom_desktop">
                               <div className="reader_page__header_divider" />
                               <button type="button" onClick={zoomOut} className="reader_page__nav_btn" title="Zoom Out">−</button>
                               <span className="reader_page__zoom_label">{Math.round(scale * 100)}%</span>
                               <button type="button" onClick={zoomIn} className="reader_page__nav_btn" title="Zoom In">+</button>
                               <button
                                    type="button"
                                    onClick={() => setFitMode((m) => (m === 'page' ? 'width' : 'page'))}
                                    className="reader_page__nav_btn reader_page__nav_btn--fit"
                                    title={fitMode === 'page' ? 'Fit to Width' : 'Fit to Page Height'}
                               >
                                    {fitMode === 'page' ? 'Fit Screen' : 'Fit Width'}
                               </button>
                               <button type="button" onClick={resetZoom} className="reader_page__nav_btn" title="Reset Zoom">Reset</button>
                          </div>
                     </div>

                     <div className="reader_page__header_right">
                         {/* Table of Contents Button */}
                         <button
                              className={`reader_page__toolbar_btn ${isTocOpen ? 'reader_page__toolbar_btn--active' : ''}`}
                              onClick={() => setIsTocOpen(prev => !prev)}
                              title="Table of Contents"
                         >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                              </svg>
                              <span className="reader_page__btn_label">Contents</span>
                         </button>

                         {/* Combined Bookmarks Dropdown Tab */}
                         <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                   className={`reader_page__toolbar_btn ${isBookmarkMenuOpen ? 'reader_page__toolbar_btn--active' : ''}`}
                                   onClick={() => setIsBookmarkMenuOpen(prev => !prev)}
                                   title="Bookmarks"
                              >
                                   <svg viewBox="0 0 24 24" fill={isCurrentPageBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" style={{ color: isCurrentPageBookmarked ? '#f59e0b' : 'inherit' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                   </svg>
                                   <span className="reader_page__btn_label">Bookmarks ({bookmarks.length})</span>
                              </button>

                              {isBookmarkMenuOpen && (
                                   <>
                                        <div className="reader_page__dropdown_backdrop" onClick={() => setIsBookmarkMenuOpen(false)} />
                                        <div className="reader_page__dropdown reader_page__dropdown--bookmark">
                                             <div className="reader_page__dropdown_section">
                                                  <div className="reader_page__dropdown_title">Current Page</div>
                                                  <button
                                                       className="reader_page__action_btn"
                                                       onClick={() => {
                                                            const existing = bookmarks.find(b => b.cfi === `page-${currentPage}`);
                                                            if (existing) {
                                                                 removeBookmark(existing.id)
                                                                      .then(() => toast.success('Bookmark removed'))
                                                                      .catch(() => toast.error('Failed to remove bookmark'));
                                                            } else {
                                                                 const label = `Page ${currentPage || 1} of ${totalPages || 1}`;
                                                                 addBookmark(`page-${currentPage}`, label)
                                                                      .then(() => toast.success('Bookmark saved!'))
                                                                      .catch(() => toast.error('Failed to save bookmark'));
                                                            }
                                                       }}
                                                  >
                                                       {isCurrentPageBookmarked ? (
                                                            <>
                                                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: 6 }}>
                                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                 </svg>
                                                                 Remove Bookmark
                                                            </>
                                                       ) : (
                                                            <>
                                                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: 6 }}>
                                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                 </svg>
                                                                 Add Bookmark
                                                            </>
                                                       )}
                                                  </button>
                                             </div>

                                             <div className="reader_page__dropdown_divider" />

                                             <div className="reader_page__dropdown_section">
                                                  <div className="reader_page__dropdown_title">Saved Bookmarks ({bookmarks.length})</div>
                                                  <div className="reader_page__bookmarks_list">
                                                       {bookmarks.length === 0 ? (
                                                            <div className="reader_page__no_bookmarks">No bookmarks saved yet.</div>
                                                       ) : (
                                                            bookmarks.map((b) => (
                                                                 <div key={b.id} className="reader_page__bookmark_item">
                                                                      <button
                                                                           className="reader_page__bookmark_navigate"
                                                                           onClick={() => {
                                                                                if (b.cfi.startsWith('page-')) {
                                                                                     const pageNum = parseInt(b.cfi.replace('page-', ''), 10);
                                                                                     if (!isNaN(pageNum)) {
                                                                                          setCurrentPage(pageNum);
                                                                                          setLocation(b.cfi);
                                                                                     }
                                                                                }
                                                                                setIsBookmarkMenuOpen(false);
                                                                           }}
                                                                      >
                                                                           {b.label || 'Saved Page'}
                                                                      </button>
                                                                      <button
                                                                           className="reader_page__bookmark_delete"
                                                                           onClick={() => {
                                                                                removeBookmark(b.id)
                                                                                     .then(() => toast.success('Bookmark removed'))
                                                                                     .catch(() => toast.error('Failed to remove bookmark'));
                                                                           }}
                                                                           title="Delete Bookmark"
                                                                      >
                                                                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                           </svg>
                                                                      </button>
                                                                 </div>
                                                            ))
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   </>
                              )}
                         </div>
                         <button className="reader_page__toolbar_btn" onClick={() => setIsNotesPanelOpen(true)} title="Notes">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="reader_page__btn_label">Notes</span>
                         </button>
                         {/* Theme Settings Dropdown Tab */}
                         <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                   className={`reader_page__toolbar_btn ${isSettingsOpen ? 'reader_page__toolbar_btn--active' : ''}`}
                                   onClick={() => {
                                        setIsSettingsOpen(prev => !prev);
                                        setShowMobileZoomTooltip(false);
                                   }}
                                   title="Theme Settings"
                              >
                                   Aa
                              </button>

                              {showMobileZoomTooltip && (
                                   <div className="reader_page__zoom_tooltip">
                                        <span>Zoom and Page View options are located here!</span>
                                        <div className="reader_page__zoom_tooltip_arrow" />
                                   </div>
                              )}

                              {isSettingsOpen && (
                                   <>
                                        <div className="reader_page__dropdown_backdrop" onClick={() => setIsSettingsOpen(false)} />
                                        <div className="reader_page__dropdown">
                                             <div className="reader_page__dropdown_section">
                                                  <div className="reader_page__dropdown_title">Theme</div>
                                                  <div className="reader_page__theme_controls">
                                                       <button
                                                            className={`reader_page__theme_btn reader_page__theme_btn--light ${theme === 'light' ? 'active' : ''}`}
                                                            onClick={() => setTheme('light')}
                                                       >
                                                            Light
                                                       </button>
                                                       <button
                                                            className={`reader_page__theme_btn reader_page__theme_btn--sepia ${theme === 'sepia' ? 'active' : ''}`}
                                                            onClick={() => setTheme('sepia')}
                                                       >
                                                            Sepia
                                                       </button>
                                                       <button
                                                            className={`reader_page__theme_btn reader_page__theme_btn--dark ${theme === 'dark' ? 'active' : ''}`}
                                                            onClick={() => setTheme('dark')}
                                                       >
                                                            Dark
                                                       </button>
                                                  </div>
                                             </div>

                                             <div className="reader_page__zoom_mobile">
                                                  <div className="reader_page__dropdown_divider" />
                                                  <div className="reader_page__dropdown_section">
                                                       <div className="reader_page__dropdown_title">Zoom & Page Fit</div>
                                                       <div className="reader_page__theme_controls">
                                                            <button
                                                                 type="button"
                                                                 className="reader_page__theme_btn"
                                                                 onClick={zoomOut}
                                                                 title="Zoom Out"
                                                            >
                                                                 −
                                                            </button>
                                                            <span className="reader_page__theme_btn" style={{ cursor: 'default', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                                                 {Math.round(scale * 100)}%
                                                            </span>
                                                            <button
                                                                 type="button"
                                                                 className="reader_page__theme_btn"
                                                                 onClick={zoomIn}
                                                                 title="Zoom In"
                                                            >
                                                                 +
                                                            </button>
                                                       </div>
                                                       <div className="reader_page__theme_controls" style={{ marginTop: '8px' }}>
                                                            <button
                                                                 type="button"
                                                                 className={`reader_page__theme_btn ${fitMode === 'width' ? 'active' : ''}`}
                                                                 onClick={() => setFitMode((m) => (m === 'page' ? 'width' : 'page'))}
                                                                 style={{ flex: 1 }}
                                                            >
                                                                 {fitMode === 'page' ? 'Fit Screen' : 'Fit Width'}
                                                            </button>
                                                            <button
                                                                 type="button"
                                                                 className="reader_page__theme_btn"
                                                                 onClick={resetZoom}
                                                                 style={{ flex: 1 }}
                                                            >
                                                                 Reset
                                                            </button>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   </>
                              )}
                         </div>
                    </div>
               </header>

               <main className="reader_page__content">
                    <div
                         className="reader_page__pdf_container"
                         style={{ width: '100%', height: '100%', position: 'relative' }}
                         onClick={(e) => {
                              // Don't clear selection if clicking inside the toolbar itself
                              if ((e.target as HTMLElement).closest?.('.selection_toolbar')) return;
                              if (activeSelection) {
                                   const sel = window.getSelection();
                                   if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                                        setActiveSelection(null);
                                   }
                              }
                         }}
                    >
                         {activeSelection && (
                              <Selection_Toolbar
                                   selection={activeSelection}
                                   onHighlight={(cfi, text, color, note) => {
                                        addHighlight(cfi, text, color, note).then((h) => {
                                             if (h) {
                                                  toast.success(note ? 'Note saved!' : 'Highlight saved!');
                                                  setActiveSelection(null);
                                             }
                                        }).catch(() => toast.error('Failed to save highlight.'));
                                   }}
                                   onClearSelection={() => {
                                        setActiveSelection(null);
                                   }}
                                   onLookup={(text) => {
                                        setLookupWord(text);
                                        setActiveSelection(null);
                                   }}
                              />
                         )}
                         {pdfData ? (
                              <PDF_Reader
                                   fileUrl={pdfData}
                                   currentPage={currentPage || 1}
                                   highlights={highlights}
                                   theme={theme}
                                   watermarkText={currentUser ? `${currentUser.username} (${currentUser.email})` : 'PROTECTED MANUSCRIPT'}
                                   onOutlineLoaded={(tocItems) => setToc(tocItems)}
                                   onClearSelection={() => setActiveSelection(null)}
                                   scale={scale}
                                   fitMode={fitMode}
                                   onPageChange={(page, total) => {
                                        setCurrentPage(page);
                                        setTotalPages(total);
                                        setLocation(`page-${page}`);
                                        const newProgress = Math.round((page / total) * 100);
                                        setProgress(newProgress);

                                        // Debounce saving progress to backend
                                        if (saveProgressTimeout.current) {
                                             clearTimeout(saveProgressTimeout.current);
                                        }
                                        saveProgressTimeout.current = setTimeout(() => {
                                             saveProgress(newProgress, `page-${page}`, `Page ${page}`);
                                        }, 1000);
                                   }}
                                   onTextSelected={(selection) => {
                                        setActiveSelection({
                                             cfiRange: `page-${selection.pageNumber}`,
                                             text: selection.text,
                                             rect: selection.rect,
                                        });
                                   }}
                              />
                         ) : (
                              <div className="reader_page__loading">
                                   <div className="spinner" />
                                   <span>Decrypting PDF Document...</span>
                              </div>
                         )}
                    </div>
               </main>

               <Confirm_Modal
                    isOpen={isConfirmModalOpen}
                    onClose={() => {
                         setIsConfirmModalOpen(false);
                         setHighlightToDelete(null);
                    }}
                    onConfirm={handleConfirmDeleteHighlight}
                    title="Delete Highlight"
                    message="Are you sure you want to delete this highlight?"
                    confirmText="Delete"
               />

               <Notes_Panel
                    isOpen={isNotesPanelOpen}
                    onClose={() => setIsNotesPanelOpen(false)}
                    highlights={highlights}
                    onNavigate={(cfi) => {
                         if (cfi.startsWith('page-')) {
                              const pageNum = parseInt(cfi.replace('page-', ''), 10);
                              if (!isNaN(pageNum)) {
                                   setCurrentPage(pageNum);
                              }
                         }
                         setIsNotesPanelOpen(false);
                    }}
                    onDeleteNote={(id) => {
                         removeHighlight(id);
                         toast.success('Note deleted');
                    }}
               />

               <TOC_Panel
                    isOpen={isTocOpen}
                    onClose={() => setIsTocOpen(false)}
                    toc={toc}
                    onNavigate={(href) => {
                         const pageNum = parseInt(href, 10);
                         if (!isNaN(pageNum)) {
                              setCurrentPage(pageNum);
                         }
                         setIsTocOpen(false);
                    }}
               />

               {lookupWord && (
                    <Dictionary_Modal
                         word={lookupWord}
                         theme={theme}
                         onClose={() => setLookupWord(null)}
                    />
               )}
          </div>
     );
};

export default Reader_Page;
