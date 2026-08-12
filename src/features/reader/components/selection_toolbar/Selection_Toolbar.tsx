import React, { useState, useRef, useEffect } from 'react';
import './Selection_Toolbar.scss';

export interface SelectionState {
     cfiRange: string;
     text: string;
     rect: { top: number; left: number; width: number; height: number };
}

interface SelectionToolbarProps {
     selection: SelectionState;
     onHighlight: (cfiRange: string, text: string, color: string, note?: string) => void;
     onClearSelection: () => void;
     onLookup: (text: string) => void;
}

export const Selection_Toolbar: React.FC<SelectionToolbarProps> = ({
     selection,
     onHighlight,
     onClearSelection,
     onLookup,
}) => {
     const [showNoteInput, setShowNoteInput] = useState(false);
     const [noteText, setNoteText] = useState('');
     const toolbarRef = useRef<HTMLDivElement>(null);
     const [toolbarWidth, setToolbarWidth] = useState(0);

     useEffect(() => {
          if (toolbarRef.current) {
               setToolbarWidth(toolbarRef.current.offsetWidth);
          }
     }, [showNoteInput, selection]);

     const handleSaveNote = () => {
          const trimmed = noteText.trim();
          if (!trimmed) return;
          onHighlight(selection.cfiRange, selection.text, 'yellow', trimmed);
     };

     const isBottom = selection.rect.top < 60;

     const container = toolbarRef.current?.parentElement;
     const containerWidth = container ? container.offsetWidth : window.innerWidth;

     const halfWidth = toolbarWidth > 0 ? toolbarWidth / 2 : 150;
     const leftBase = selection.rect.left + selection.rect.width / 2;
     // Clamp the left position to prevent overflowing the container edges
     const clampedLeft = Math.max(
          halfWidth + 10,
          Math.min(containerWidth - halfWidth - 10, leftBase)
     );

     // Position the toolbar slightly above the selection, or below if there isn't enough space
     const style: React.CSSProperties = {
          position: 'absolute',
          top: isBottom ? `${selection.rect.top + selection.rect.height + 10}px` : `${selection.rect.top - 60}px`,
          left: `${clampedLeft}px`,
          transform: 'translateX(-50%)',
          zIndex: 1000,
     };

     const containerClass = `selection_toolbar ${isBottom ? 'selection_toolbar--bottom' : ''}`;

     if (showNoteInput) {
          return (
               <div 
                    ref={toolbarRef}
                    className={containerClass} 
                    style={style}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
               >
                    <input
                         autoFocus
                         className="selection_toolbar__note_input"
                         type="text"
                         placeholder="Add a note..."
                         value={noteText}
                         onChange={(e) => setNoteText(e.target.value)}
                         onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveNote();
                              if (e.key === 'Escape') onClearSelection();
                         }}
                    />
                    <button className="selection_toolbar__save_btn" onClick={handleSaveNote}>
                         Save
                    </button>
               </div>
          );
     }

     return (
          <div 
               ref={toolbarRef}
               className={containerClass} 
               style={style}
               onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
               onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
               onClick={(e) => e.stopPropagation()}
               onTouchStart={(e) => e.stopPropagation()}
               onTouchEnd={(e) => e.stopPropagation()}
          >
               <button className="selection_toolbar__action_btn" onClick={() => setShowNoteInput(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Note
               </button>
               
               <div className="selection_toolbar__divider" />
               
               <button className="selection_toolbar__action_btn" onClick={() => onLookup(selection.text)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Define
               </button>
          </div>
     );
};
