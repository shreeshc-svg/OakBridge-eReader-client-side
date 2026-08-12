import React from 'react';
import './TOC_Panel.scss';

interface TocItemData {
     label: string;
     href: string;
     subitems?: TocItemData[];
}

interface TOCPanelProps {
     isOpen: boolean;
     onClose: () => void;
     toc: TocItemData[];
     onNavigate: (href: string) => void;
}

export const TOC_Panel: React.FC<TOCPanelProps> = ({
     isOpen,
     onClose,
     toc,
     onNavigate,
 }) => {
     const renderTocItems = (items: TocItemData[], depth = 0) => {
          return items.map((item, index) => (
               <div key={`${item.href}-${index}`} className="toc_panel__item_wrapper" style={{ paddingLeft: `${depth * 14}px` }}>
                    <button
                         className="toc_panel__item_btn"
                         onClick={() => onNavigate(item.href)}
                         title={item.label}
                    >
                         {item.label}
                    </button>
                    {item.subitems && item.subitems.length > 0 && renderTocItems(item.subitems, depth + 1)}
               </div>
          ));
     };

     return (
          <>
               {/* Backdrop */}
               {isOpen && <div className="toc_panel__backdrop" onClick={onClose} />}

               <aside className={`toc_panel ${isOpen ? 'toc_panel--open' : ''}`}>
                    <div className="toc_panel__header">
                         <h2 className="toc_panel__title">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                              </svg>
                              Table of Contents
                         </h2>
                         <button className="toc_panel__close_btn" onClick={onClose}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                    </div>

                    <div className="toc_panel__list">
                         {toc.length === 0 ? (
                              <div className="toc_panel__empty">
                                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v16.25" />
                                   </svg>
                                   <p>No chapters loaded</p>
                                   <span>Please wait or reopen the document</span>
                              </div>
                         ) : (
                              renderTocItems(toc)
                         )}
                    </div>
               </aside>
          </>
     );
};
