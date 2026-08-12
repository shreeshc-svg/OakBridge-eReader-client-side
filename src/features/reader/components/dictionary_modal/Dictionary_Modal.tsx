import React, { useEffect, useState, useRef } from 'react';
import './Dictionary_Modal.scss';

interface DictionaryModalProps {
     word: string;
     theme: 'light' | 'dark' | 'sepia';
     onClose: () => void;
}

export const Dictionary_Modal: React.FC<DictionaryModalProps> = ({
     word,
     theme,
     onClose,
}) => {
     const [definition, setDefinition] = useState<any>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const audioRef = useRef<HTMLAudioElement | null>(null);

     const cleanWord = word
          .trim()
          .toLowerCase()
          .replace(/[\u2018\u2019\u201C\u201D]/g, '')
          .replace(/['’]s$/i, '')
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .split(/\s+/)[0]
          .trim();

     useEffect(() => {
          const fetchDefinition = async () => {
               try {
                    setLoading(true);
                    setError('');

                    if (!cleanWord) {
                         throw new Error('No valid word selected.');
                    }

                    // Primary API attempt: exact clean word
                    let res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);

                    // Root word fallback for plurals / inflections (e.g. technologies -> technology, books -> book)
                    if (!res.ok && cleanWord.length > 3) {
                         let root = cleanWord;
                         if (cleanWord.endsWith('ies')) root = cleanWord.slice(0, -3) + 'y';
                         else if (cleanWord.endsWith('es')) root = cleanWord.slice(0, -2);
                         else if (cleanWord.endsWith('s')) root = cleanWord.slice(0, -1);
                         else if (cleanWord.endsWith('ed')) root = cleanWord.slice(0, -2);
                         else if (cleanWord.endsWith('ing')) root = cleanWord.slice(0, -3);

                         if (root !== cleanWord && root.length >= 3) {
                              res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(root)}`);
                         }
                    }

                    if (res.ok) {
                         const data = await res.json();
                         if (data && data.length > 0) {
                              setDefinition(data[0]);
                              setLoading(false);
                              return;
                         }
                    }

                    // Fallback API attempt: Datamuse API
                    const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=d&max=1`);
                    if (dmRes.ok) {
                         const dmData = await dmRes.json();
                         if (dmData && dmData.length > 0 && dmData[0].defs && dmData[0].defs.length > 0) {
                              const posMap: Record<string, string> = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' };
                              const defs = dmData[0].defs.map((d: string) => {
                                   const parts = d.split('\t');
                                   return {
                                        pos: posMap[parts[0]] || parts[0] || 'definition',
                                        text: parts[1] || d
                                   };
                              });

                              const groupedMeanings = defs.reduce((acc: any[], item: any) => {
                                   let existing = acc.find((m: any) => m.partOfSpeech === item.pos);
                                   if (!existing) {
                                        existing = { partOfSpeech: item.pos, definitions: [] };
                                        acc.push(existing);
                                   }
                                   existing.definitions.push({ definition: item.text });
                                   return acc;
                              }, []);

                              setDefinition({
                                   word: dmData[0].word || cleanWord,
                                   phonetic: '',
                                   meanings: groupedMeanings
                              });
                              setLoading(false);
                              return;
                         }
                    }

                    throw new Error(`Definition not found for "${cleanWord}".`);
               } catch (err: any) {
                    setError(err.message || 'Failed to retrieve definition.');
               } finally {
                    setLoading(false);
               }
          };

          fetchDefinition();
     }, [cleanWord]);

     // Find pronunciation audio if available
     const getAudioUrl = () => {
          if (!definition || !definition.phonetics) return null;
          const phoneticWithAudio = definition.phonetics.find((p: any) => p.audio && p.audio.trim().length > 0);
          return phoneticWithAudio ? phoneticWithAudio.audio : null;
     };

     const audioUrl = getAudioUrl();

     const playPronunciation = () => {
          if (audioUrl) {
               if (audioRef.current) {
                    audioRef.current.play().catch((err) => {
                         console.warn('Audio play failed:', err);
                    });
               }
          }
     };

     return (
          <div className="dict_modal_overlay" onClick={onClose}>
               <div
                    className="dict_modal"
                    onClick={(e) => e.stopPropagation()}
                    data-theme={theme}
               >
                    <div className="dict_modal__header">
                         <div className="dict_modal__title_group">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="dict_modal__book_icon">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <h2>Dictionary Lookup</h2>
                         </div>
                         <button className="dict_modal__close_btn" onClick={onClose} aria-label="Close">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <line x1="18" y1="6" x2="6" y2="18" />
                                   <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                         </button>
                    </div>

                    <div className="dict_modal__body">
                         {loading ? (
                              <div className="dict_modal__loading">
                                   <div className="dict_modal__spinner" />
                                   <p>Searching for definition of <strong>"{cleanWord}"</strong>...</p>
                              </div>
                         ) : error ? (
                              <div className="dict_modal__error">
                                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dict_modal__error_icon">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                   </svg>
                                   <p>{error}</p>
                                   <span className="dict_modal__error_sub">Double check the spelling or select a different word.</span>
                              </div>
                         ) : (
                              <div className="dict_modal__definition">
                                   <div className="dict_modal__word_header">
                                        <div>
                                             <h1 className="dict_modal__word">{definition.word}</h1>
                                             {definition.phonetic && (
                                                  <span className="dict_modal__phonetic">{definition.phonetic}</span>
                                             )}
                                        </div>

                                        {audioUrl && (
                                             <button
                                                  className="dict_modal__audio_btn"
                                                  onClick={playPronunciation}
                                                  title="Listen to pronunciation"
                                             >
                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                       <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                                       <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                                  </svg>
                                                  <audio ref={audioRef} src={audioUrl} />
                                             </button>
                                        )}
                                   </div>

                                   <div className="dict_modal__divider" />

                                   <div className="dict_modal__meanings_list">
                                        {definition.meanings?.map((meaning: any, index: number) => (
                                             <div key={index} className="dict_modal__meaning">
                                                  <span className="dict_modal__part_of_speech">
                                                       {meaning.partOfSpeech}
                                                  </span>

                                                  <ul className="dict_modal__definitions">
                                                       {meaning.definitions?.map((def: any, idx: number) => (
                                                            <li key={idx} className="dict_modal__def_item">
                                                                 <p className="dict_modal__def_text">
                                                                      {def.definition}
                                                                 </p>
                                                                 {def.example && (
                                                                      <p className="dict_modal__example">
                                                                           "{def.example}"
                                                                      </p>
                                                                 )}
                                                            </li>
                                                       ))}
                                                  </ul>

                                                  {meaning.synonyms && meaning.synonyms.length > 0 && (
                                                       <div className="dict_modal__related">
                                                            <strong>Synonyms: </strong>
                                                            <span>{meaning.synonyms.slice(0, 5).join(', ')}</span>
                                                       </div>
                                                  )}

                                                  {meaning.antonyms && meaning.antonyms.length > 0 && (
                                                       <div className="dict_modal__related">
                                                            <strong>Antonyms: </strong>
                                                            <span>{meaning.antonyms.slice(0, 5).join(', ')}</span>
                                                       </div>
                                                  )}
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};
