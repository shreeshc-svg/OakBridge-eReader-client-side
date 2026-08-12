import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import './PDF_Reader.scss';

// Set up pdf.worker from CDN matching react-pdf's bundled pdfjs-dist version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { type Highlight } from '../../api/reader.api';

export interface PDFSelection {
     text: string;
     rect: { top: number; left: number; width: number; height: number };
     pageNumber: number;
}

interface PDFReaderProps {
     fileUrl: string | ArrayBuffer;
     currentPage: number;
     highlights?: Highlight[];
     onPageChange: (page: number, totalPages: number) => void;
     onTextSelected: (selection: PDFSelection) => void;
     onClearSelection?: () => void;
     onOutlineLoaded?: (outline: any[]) => void;
     theme?: 'light' | 'sepia' | 'dark';
     watermarkText?: string;
     scale: number;
     fitMode: 'page' | 'width';
}

export const PDF_Reader: React.FC<PDFReaderProps> = ({
     fileUrl,
     currentPage,
     highlights = [],
     onPageChange,
     onTextSelected,
     onClearSelection,
     onOutlineLoaded,
     theme = 'light',
     watermarkText,
     scale,
     fitMode,
}) => {
     const [numPages, setNumPages] = useState<number>(0);
     const [containerWidth, setContainerWidth] = useState<number>(800);
     const [containerHeight, setContainerHeight] = useState<number>(700);
     const containerRef = useRef<HTMLDivElement>(null);

     // Format file source for pdfjs (supports ArrayBuffer DRM decrypted data)
     const fileSource = useMemo(() => {
          if (!fileUrl) return null;
          if (fileUrl instanceof ArrayBuffer) {
               return { data: new Uint8Array(fileUrl) };
          }
          return fileUrl;
     }, [fileUrl]);

     // Responsive page width & height adjustment to fit screen flush with borders
     useEffect(() => {
          const updateDimensions = () => {
               // Avoid resizing when virtual keyboard opens (focusing an input/textarea)
               const activeEl = document.activeElement;
               if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                    return;
               }

               if (containerRef.current) {
                    const width = containerRef.current.clientWidth;
                    const height = containerRef.current.clientHeight;
                    setContainerWidth(Math.max(300, width));
                    setContainerHeight(Math.max(300, height));
               }
          };

          updateDimensions();
          window.addEventListener('resize', updateDimensions);
          return () => window.removeEventListener('resize', updateDimensions);
     }, []);

     
     const onDocumentLoadSuccess = useCallback(
          async (pdf: any) => {
               setNumPages(pdf.numPages);
               onPageChange(currentPage || 1, pdf.numPages);

               // Extract table of contents / outline if available
               if (onOutlineLoaded) {
                    try {
                         const outline = await pdf.getOutline();
                         if (outline && outline.length > 0) {
                              const formattedToc = await Promise.all(
                                   outline.map(async (item: any) => {
                                        let pageNum = 1;
                                        try {
                                             if (item.dest) {
                                                  let dest = item.dest;
                                                  if (typeof dest === 'string') {
                                                       dest = await pdf.getDestination(dest);
                                                  }
                                                  if (Array.isArray(dest) && dest.length > 0) {
                                                       const pageRef = dest[0];
                                                       const pageIdx = await pdf.getPageIndex(pageRef);
                                                       pageNum = pageIdx + 1;
                                                  }
                                             }
                                        } catch (_) {
                                             /* fallback to page 1 */
                                        }
                                        return {
                                             label: item.title || 'Untitled Section',
                                             href: String(pageNum),
                                             pageNumber: pageNum,
                                        };
                                   })
                              );
                              onOutlineLoaded(formattedToc);
                         }
                    } catch (err) {
                         console.warn('Failed to load PDF outline:', err);
                    }
               }
          },
          [currentPage, onPageChange, onOutlineLoaded]
     );

     // Shared logic: read the current browser selection and fire the callback
     const processSelection = useCallback(() => {
          // If the user is interacting with the selection toolbar (e.g. tapping Note,
          // typing in the note input), do NOT clear the selection state. On mobile,
          // tapping a button inside the toolbar collapses the browser selection, which
          // would otherwise trigger onClearSelection and unmount the toolbar.
          const activeEl = document.activeElement;
          if (activeEl && activeEl.closest('.selection_toolbar')) {
               return;
          }

          const selection = window.getSelection();
          if (!selection || selection.isCollapsed || !selection.toString().trim()) {
               if (onClearSelection) {
                    onClearSelection();
               }
               return;
          }

          const selectedText = selection.toString().trim();
          if (selectedText.length === 0) return;

          try {
               const range = selection.getRangeAt(0);
               const rect = range.getBoundingClientRect();

               if (rect.width === 0 && rect.height === 0) return;

               // Get offset relative to the PDF container
               const container = containerRef.current;
               let adjustedTop = rect.top;
               let adjustedLeft = rect.left;

               if (container) {
                    const containerRect = container.getBoundingClientRect();
                    adjustedTop = rect.top - containerRect.top + container.scrollTop;
                    adjustedLeft = rect.left - containerRect.left + container.scrollLeft;
               }

               onTextSelected({
                    text: selectedText,
                    rect: {
                         top: adjustedTop,
                         left: adjustedLeft,
                         width: rect.width,
                         height: rect.height,
                    },
                    pageNumber: currentPage,
               });
          } catch (err) {
               console.warn('Error calculating selection bounds in PDF:', err);
          }
     }, [currentPage, onTextSelected, onClearSelection]);

     // Desktop: capture text selection via mouseup
     const handleMouseUp = useCallback(() => {
          setTimeout(processSelection, 10);
     }, [processSelection]);

     // Touch: capture text selection via touchend (longer delay for mobile selection handles)
     const handleTouchEnd = useCallback(() => {
          setTimeout(processSelection, 300);
     }, [processSelection]);

     // Touch: listen to 'selectionchange' for reliable mobile selection detection
     // Mobile browsers fire selectionchange as the user drags selection handles
     const selectionChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
     useEffect(() => {
          const handleSelectionChange = () => {
               if (selectionChangeTimer.current) {
                    clearTimeout(selectionChangeTimer.current);
               }
               selectionChangeTimer.current = setTimeout(processSelection, 400);
          };

          document.addEventListener('selectionchange', handleSelectionChange);
          return () => {
               document.removeEventListener('selectionchange', handleSelectionChange);
               if (selectionChangeTimer.current) {
                    clearTimeout(selectionChangeTimer.current);
               }
          };
     }, [processSelection]);

     const [pdfError, setPdfError] = useState<string | null>(null);

     // Render saved highlights and notes onto the text layer DOM spans
     useEffect(() => {
          if (!highlights || highlights.length === 0 || !containerRef.current) return;

          const currentPageCfi = `page-${currentPage}`;
          const pageHighlights = highlights.filter((h) => h.cfi_range === currentPageCfi);

          const applyHighlights = () => {
               const textLayer = containerRef.current?.querySelector('.react-pdf__Page__textLayer');
               if (!textLayer) return;

               const spans = textLayer.querySelectorAll('span');
               spans.forEach((span) => {
                    const spanText = span.textContent?.trim();
                    if (!spanText || spanText.length === 0) return;

                    for (const hl of pageHighlights) {
                         if (hl.text.includes(spanText) || spanText.includes(hl.text)) {
                              let bg = 'rgba(253, 224, 71, 0.45)';
                              switch (hl.color) {
                                   case 'green': bg = 'rgba(187, 247, 208, 0.55)'; break;
                                   case 'pink': bg = 'rgba(251, 207, 232, 0.55)'; break;
                                   case 'blue': bg = 'rgba(191, 219, 254, 0.55)'; break;
                                   default: bg = 'rgba(253, 224, 71, 0.55)'; break;
                              }
                              span.style.backgroundColor = bg;
                              span.style.borderRadius = '2px';

                              if (hl.note) {
                                   span.style.borderBottom = '2px solid #f97316';
                                   span.title = `Note: ${hl.note}`;
                              }
                         }
                    }
               });
          };

          const timer = setTimeout(applyHighlights, 120);
          return () => clearTimeout(timer);
     }, [highlights, currentPage, scale]);

     // Attach mouseup + touchend handlers to container element
     useEffect(() => {
          const el = containerRef.current;
          if (!el) return;

          el.addEventListener('mouseup', handleMouseUp);
          el.addEventListener('touchend', handleTouchEnd);
          return () => {
               el.removeEventListener('mouseup', handleMouseUp);
               el.removeEventListener('touchend', handleTouchEnd);
          };
     }, [handleMouseUp, handleTouchEnd]);

     return (
          <div
               className={`pdf_reader pdf_reader--${theme}`}
               ref={containerRef}
               onMouseUp={handleMouseUp}
               onTouchEnd={handleTouchEnd}
               onContextMenu={(e) => e.preventDefault()}
           >

               {/* Floating Side Navigation Arrows (Fixed at screen vertical middle) */}
               <button
                    type="button"
                    className="pdf_reader__nav_arrow pdf_reader__nav_arrow--prev"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1), numPages)}
                    disabled={currentPage <= 1}
                    title="Previous Page"
               >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
               </button>

               <button
                    type="button"
                    className="pdf_reader__nav_arrow pdf_reader__nav_arrow--next"
                    onClick={() => onPageChange(Math.min(numPages, currentPage + 1), numPages)}
                    disabled={currentPage >= numPages}
                    title="Next Page"
               >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
               </button>

               {/* PDF Canvas Viewport */}
               <div className="pdf_reader__viewport">
                    {watermarkText && (
                         <div className="pdf_reader__watermark">
                              {Array.from({ length: 12 }).map((_, i) => (
                                   <span key={i}>{watermarkText}</span>
                              ))}
                         </div>
                    )}
                    <Document
                         file={fileSource}
                         onLoadSuccess={onDocumentLoadSuccess}
                         onLoadError={(error: any) => {
                              console.error('[PDF_Reader] Load error:', error);
                              setPdfError(error?.message || String(error));
                         }}
                         loading={
                              <div className="pdf_reader__loading">
                                   <div className="spinner" />
                                   <span>Loading PDF document...</span>
                              </div>
                         }
                         error={
                              <div className="pdf_reader__error">
                                   <span>Failed to load PDF file.</span>
                                   {pdfError && (
                                        <span style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px', maxWidth: '500px', textAlign: 'center' }}>
                                             {pdfError}
                                        </span>
                                   )}
                              </div>
                         }
                    >
                         <Page
                              pageNumber={currentPage || 1}
                              height={fitMode === 'page' ? Math.max(200, containerHeight - 64) * scale : undefined}
                              width={fitMode === 'width' ? Math.max(300, containerWidth - 32) * scale : undefined}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              className="pdf_reader__page"
                         />
                    </Document>
               </div>
          </div>
     );
};
