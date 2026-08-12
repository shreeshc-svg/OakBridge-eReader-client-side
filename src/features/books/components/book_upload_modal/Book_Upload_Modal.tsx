import { useState, useEffect, useRef } from 'react';
import { useCategories } from '../../../categories/hooks/use_categories';
import type { Book } from '../../types/books.api.types';
import './Book_Upload_Modal.scss';

interface BookUploadModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (payload: any) => Promise<void>;
     bookToEdit?: Book;
     initialCategoryId?: string;
}

const Book_Upload_Modal = ({
     isOpen,
     onClose,
     onSubmit,
     bookToEdit,
     initialCategoryId,
}: BookUploadModalProps) => {
     const { categories, fetchCategories } = useCategories();
     const dropdownRef = useRef<HTMLDivElement>(null);

     const [title, setTitle] = useState('');
     const [description, setDescription] = useState('');
     const [author, setAuthor] = useState('');
     const [language, setLanguage] = useState('English');
     const [isbn, setIsbn] = useState('');
     const [totalPages, setTotalPages] = useState<number | ''>('');
     const [totalChapters, setTotalChapters] = useState<number | ''>('');
     const [price, setPrice] = useState<number | ''>('');
     const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
     const [coverImage, setCoverImage] = useState<File | null>(null);
     const [coverImageAlt, setCoverImageAlt] = useState('');
     const [bookFile, setBookFile] = useState<File | null>(null);
     const [previewPages, setPreviewPages] = useState<File[]>([]);
     const [previewAlts, setPreviewAlts] = useState<string[]>([]);
     const [accessPeriodDays, setAccessPeriodDays] = useState<number | ''>('');
     const [isTrending, setIsTrending] = useState(false);
     const [isNewRelease, setIsNewRelease] = useState(false);
     const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

     useEffect(() => {
          if (!coverImage) {
               setCoverPreviewUrl(null);
               return;
          }
          const objectUrl = URL.createObjectURL(coverImage);
          setCoverPreviewUrl(objectUrl);
          return () => URL.revokeObjectURL(objectUrl);
     }, [coverImage]);

     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (isOpen) {
               fetchCategories();
               if (bookToEdit) {
                    setTitle(bookToEdit.title);
                    setDescription(bookToEdit.description || '');
                    setAuthor(bookToEdit.author || bookToEdit.publisher || '');
                    setLanguage(bookToEdit.language || '');
                    setIsbn(bookToEdit.isbn || '');
                    setTotalPages(bookToEdit.total_pages || '');
                    setTotalChapters(bookToEdit.total_chapters || '');
                    setPrice(bookToEdit.price ? bookToEdit.price / 100 : 0);
                    setSelectedCategories(bookToEdit.category_ids || []);
                    setAccessPeriodDays(
                         bookToEdit.access_period_days !== undefined && bookToEdit.access_period_days !== null
                              ? bookToEdit.access_period_days
                              : ''
                    );
                    setIsTrending(bookToEdit.isTrending || false);
                    setIsNewRelease(bookToEdit.isNewRelease || false);
                    setCoverImageAlt(bookToEdit.cover_image_alt || '');
                    setPreviewAlts(bookToEdit.preview_pages_alt || []);
               } else {
                    setTitle('');
                    setDescription('');
                    setAuthor('');
                    setLanguage('English');
                    setIsbn('');
                    setTotalPages('');
                    setTotalChapters('');
                    setPrice('');
                    setSelectedCategories(initialCategoryId ? [initialCategoryId] : []);
                    setAccessPeriodDays('');
                    setPreviewPages([]);
                    setIsTrending(false);
                    setIsNewRelease(false);
                    setCoverImageAlt('');
                    setPreviewAlts([]);
               }
               setCoverImage(null);
               setBookFile(null);
               setError(null);
               setIsDropdownOpen(false);
          }
     }, [isOpen, fetchCategories, bookToEdit]);

     useEffect(() => {
          if (previewPages.length > 0) {
               setPreviewAlts((prev) => {
                    const next = [...prev];
                    while (next.length < previewPages.length) {
                         next.push('');
                    }
                    return next.slice(0, previewPages.length);
               });
          }
     }, [previewPages]);

     // Outside click listener for category dropdown
     useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
               if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsDropdownOpen(false);
               }
          };
          if (isDropdownOpen) {
               document.addEventListener('mousedown', handleClickOutside);
          }
          return () => {
               document.removeEventListener('mousedown', handleClickOutside);
          };
     }, [isDropdownOpen]);

     if (!isOpen) return null;

     const handleCategoryToggle = (id: string) => {
          setSelectedCategories((prev) =>
               prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
          );
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (
               !title ||
               !description ||
               !author ||
               !language ||
               !isbn ||
               !totalPages ||
               !totalChapters ||
               price === ''
          ) {
               setError('Please fill in all required text fields.');
               return;
          }
          if (!bookToEdit) {
               if (!coverImage) {
                    setError('Please upload a cover image.');
                    return;
               }
               if (!bookFile) {
                    setError('Please upload the book file (PDF).');
                    return;
               }
          }

          setIsLoading(true);
          setError(null);

          try {
               const payload: any = {
                    title,
                    description,
                    author,
                    publisher: author,
                    language,
                    isbn,
                    total_pages: Number(totalPages),
                    total_chapters: Number(totalChapters),
                    price: Number(price) * 100, // Convert to paise
                    category_ids: selectedCategories,
                    access_period_days: accessPeriodDays === '' || accessPeriodDays === null ? null : Number(accessPeriodDays),
                    isTrending,
                    isNewRelease,
                    cover_image_alt: coverImageAlt,
                    preview_pages_alt: previewAlts,
               };
               if (coverImage) payload.cover_image = coverImage;
               if (bookFile) payload.book_file = bookFile;
               if (previewPages.length > 0) payload.preview_pages = previewPages;

               await onSubmit(payload);
               onClose();
          } catch (err: unknown) {
               const errorMsg =
                    err instanceof Error
                         ? err.message
                         : 'Failed to upload book.';
               setError(errorMsg);
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <div className="book_modal__overlay" onClick={onClose}>
               <div
                    className="book_modal__content"
                    onClick={(e) => e.stopPropagation()}
               >
                    <div className="book_modal__header">
                         <div>
                              <h2>{bookToEdit ? 'Edit Manuscript' : 'New Manuscript'}</h2>
                              <p>{bookToEdit ? 'Update book details and files.' : 'Upload a new book to your author pipeline.'}</p>
                         </div>
                         <button
                              type="button"
                              className="book_modal__close"
                              onClick={onClose}
                         >
                              <svg
                                   viewBox="0 0 24 24"
                                   fill="none"
                                   stroke="currentColor"
                                   strokeWidth="2"
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                              >
                                   <line x1="18" y1="6" x2="6" y2="18" />
                                   <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                         </button>
                    </div>

                    <form onSubmit={handleSubmit} className="book_modal__form">
                         {error && <div className="book_modal__error">{error}</div>}

                         <div className="book_modal__grid">
                              {/* Left Column */}
                              <div className="book_modal__col">
                                   <div className="book_modal__field">
                                        <label htmlFor="title">
                                             Book Title <span className="required">*</span>
                                        </label>
                                        <input
                                             id="title"
                                             type="text"
                                             value={title}
                                             onChange={(e) => setTitle(e.target.value)}
                                             placeholder="e.g. Constitutional Law of India"
                                             disabled={isLoading}
                                        />
                                   </div>

                                   <div className="book_modal__field">
                                        <label htmlFor="description">
                                             Description <span className="required">*</span>
                                        </label>
                                        <textarea
                                             id="description"
                                             value={description}
                                             onChange={(e) => setDescription(e.target.value)}
                                             placeholder="Enter comprehensive book summary..."
                                             disabled={isLoading}
                                        />
                                   </div>

                                   <div className="book_modal__row">
                                        <div className="book_modal__field">
                                             <label htmlFor="author">
                                                  Author / Publisher <span className="required">*</span>
                                             </label>
                                             <input
                                                  id="author"
                                                  type="text"
                                                  value={author}
                                                  onChange={(e) => setAuthor(e.target.value)}
                                                  placeholder="e.g. Dr. A. P. J. Abdul Kalam"
                                                  disabled={isLoading}
                                             />
                                        </div>
                                        <div className="book_modal__field">
                                             <label htmlFor="language">
                                                  Language <span className="required">*</span>
                                             </label>
                                             <input
                                                  id="language"
                                                  type="text"
                                                  value={language}
                                                  onChange={(e) => setLanguage(e.target.value)}
                                                  placeholder="e.g. English"
                                                  disabled={isLoading}
                                             />
                                        </div>
                                   </div>

                                   <div className="book_modal__row">
                                        <div className="book_modal__field">
                                             <label htmlFor="isbn">
                                                  ISBN <span className="required">*</span>
                                             </label>
                                             <input
                                                  id="isbn"
                                                  type="text"
                                                  value={isbn}
                                                  onChange={(e) => setIsbn(e.target.value)}
                                                  placeholder="978-3-16-148410-0"
                                                  disabled={isLoading}
                                             />
                                        </div>
                                        <div className="book_modal__field">
                                             <label htmlFor="totalPages">
                                                  Total Pages <span className="required">*</span>
                                             </label>
                                             <input
                                                  id="totalPages"
                                                  type="number"
                                                  value={totalPages}
                                                  onChange={(e) =>
                                                       setTotalPages(
                                                            e.target.value === '' ? '' : Number(e.target.value)
                                                       )
                                                  }
                                                  disabled={isLoading}
                                             />
                                        </div>
                                   </div>

                                   <div className="book_modal__row">
                                        <div className="book_modal__field">
                                             <label htmlFor="chapters">
                                                  Chapters <span className="required">*</span>
                                             </label>
                                             <input
                                                  id="chapters"
                                                  type="number"
                                                  value={totalChapters}
                                                  onChange={(e) =>
                                                       setTotalChapters(
                                                            e.target.value === '' ? '' : Number(e.target.value)
                                                       )
                                                  }
                                                  disabled={isLoading}
                                             />
                                        </div>
                                        <div className="book_modal__field">
                                             <label htmlFor="price">
                                                  Price (₹) <span className="required">*</span>
                                             </label>
                                             <input
                                                  id="price"
                                                  type="number"
                                                  min="0"
                                                  value={price}
                                                  onChange={(e) =>
                                                       setPrice(
                                                            e.target.value === '' ? '' : Number(e.target.value)
                                                       )
                                                  }
                                                  disabled={isLoading}
                                             />
                                        </div>
                                   </div>

                                   <div className="book_modal__row">
                                        <div className="book_modal__field">
                                             <label htmlFor="accessPeriodDays">
                                                  Access Period (Days)
                                             </label>
                                             <input
                                                  id="accessPeriodDays"
                                                  type="number"
                                                  min="1"
                                                  placeholder="Leave empty for lifetime access"
                                                  value={accessPeriodDays}
                                                  onChange={(e) =>
                                                       setAccessPeriodDays(
                                                            e.target.value === '' ? '' : Number(e.target.value)
                                                       )
                                                  }
                                                  disabled={isLoading}
                                             />
                                        </div>
                                   </div>
                              </div>

                              {/* Right Column */}
                              <div className="book_modal__col">
                                   <div className="book_modal__field">
                                        <label>Categories <span className="required">*</span></label>
                                        <div className="book_modal__dropdown" ref={dropdownRef}>
                                             <div
                                                  className={`book_modal__dropdown_trigger ${isDropdownOpen ? 'open' : ''}`}
                                                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                             >
                                                  <span className="selected_text">
                                                       {selectedCategories.length > 0 ? (
                                                            selectedCategories
                                                                 .map((id) => categories.find((c) => c.id === id)?.category_name)
                                                                 .filter(Boolean)
                                                                 .join(', ')
                                                       ) : (
                                                            <span className="placeholder">
                                                                 Select categories...
                                                            </span>
                                                       )}
                                                  </span>
                                                  <svg
                                                       viewBox="0 0 24 24"
                                                       fill="none"
                                                       stroke="currentColor"
                                                       strokeWidth="2"
                                                  >
                                                       <path d="M6 9l6 6 6-6" />
                                                  </svg>
                                             </div>
                                             {isDropdownOpen && (
                                                  <div className="book_modal__dropdown_menu">
                                                       {categories.map((cat) => (
                                                            <label key={cat.id} className="book_modal__checkbox">
                                                                 <input
                                                                      type="checkbox"
                                                                      checked={selectedCategories.includes(cat.id)}
                                                                      onChange={() => handleCategoryToggle(cat.id)}
                                                                      disabled={isLoading}
                                                                 />
                                                                 <span>{cat.category_name}</span>
                                                            </label>
                                                       ))}
                                                       {categories.length === 0 && (
                                                            <span className="book_modal__hint">
                                                                 No categories found.
                                                            </span>
                                                       )}
                                                  </div>
                                             )}
                                        </div>
                                   </div>

                                   <div className="book_modal__field">
                                        <label>Cover Image (JPG/PNG) {!bookToEdit && <span className="required">*</span>}</label>
                                        <div className="book_modal__file_drop">
                                             <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) =>
                                                       setCoverImage(e.target.files?.[0] || null)
                                                  }
                                                  disabled={isLoading}
                                             />
                                             {coverImage ? (
                                                  <span className="file_name">{coverImage.name}</span>
                                             ) : (
                                                  <span className="file_placeholder">
                                                       {bookToEdit ? 'Choose new cover to replace...' : 'Choose cover image...'}
                                                  </span>
                                             )}
                                        </div>
                                        {(coverPreviewUrl || bookToEdit?.cover_image_url) && (
                                             <div className="book_modal__cover_preview">
                                                  <img 
                                                       src={coverPreviewUrl || bookToEdit?.cover_image_url} 
                                                       alt="Book Cover Preview" 
                                                  />
                                                  {coverImage && (
                                                       <button
                                                            type="button"
                                                            className="book_modal__remove_cover"
                                                            onClick={() => setCoverImage(null)}
                                                       >
                                                            Remove
                                                       </button>
                                                  )}
                                             </div>
                                        )}
                                   </div>

                                   <div className="book_modal__field">
                                        <label>Cover Image Alt-Text</label>
                                        <input
                                             type="text"
                                             value={coverImageAlt}
                                             onChange={(e) => setCoverImageAlt(e.target.value)}
                                             placeholder="Describe the cover image (SEO & Accessibility)..."
                                             disabled={isLoading}
                                        />
                                   </div>

                                   <div className="book_modal__field">
                                        <label>Book File (PDF) {!bookToEdit && <span className="required">*</span>}</label>
                                        <div className="book_modal__file_drop book_modal__file_drop--accent">
                                             <input
                                                  type="file"
                                                  accept=".pdf"
                                                  onChange={(e) =>
                                                       setBookFile(e.target.files?.[0] || null)
                                                  }
                                                  disabled={isLoading}
                                             />
                                             {bookFile ? (
                                                  <span className="file_name">{bookFile.name}</span>
                                             ) : (
                                                  <span className="file_placeholder">
                                                       {bookToEdit ? 'Choose new book file to replace...' : 'Choose PDF file...'}
                                                  </span>
                                             )}
                                        </div>
                                   </div>

                                   <div className="book_modal__field">
                                        <label>Sample Preview Pages (Optional)</label>
                                        <div className="book_modal__file_drop">
                                             <input
                                                  type="file"
                                                  accept="image/*,application/pdf"
                                                  multiple
                                                  onChange={(e) => {
                                                       const files = Array.from(e.target.files || []);
                                                       const hasPdf = files.some(
                                                            (f) =>
                                                                 f.type === 'application/pdf' ||
                                                                 f.name.toLowerCase().endsWith('.pdf')
                                                       );
                                                       if (hasPdf) {
                                                            const firstPdf = files.find(
                                                                 (f) =>
                                                                      f.type === 'application/pdf' ||
                                                                      f.name.toLowerCase().endsWith('.pdf')
                                                            );
                                                            setPreviewPages(firstPdf ? [firstPdf] : []);
                                                       } else {
                                                            setPreviewPages(files);
                                                       }
                                                  }}
                                                  disabled={isLoading}
                                             />
                                             {previewPages.length > 0 ? (
                                                  <span className="file_name">
                                                       {previewPages.length === 1 &&
                                                       (previewPages[0].type === 'application/pdf' ||
                                                            previewPages[0].name.toLowerCase().endsWith('.pdf'))
                                                            ? `Preview PDF: ${previewPages[0].name}`
                                                            : `${previewPages.length} preview images selected`}
                                                  </span>
                                             ) : (
                                                  <span className="file_placeholder">
                                                       Choose sample preview images or a PDF...
                                                  </span>
                                             )}
                                        </div>
                                   </div>

                                   {previewPages.length > 0 &&
                                        !(
                                             previewPages.length === 1 &&
                                             (previewPages[0].type === 'application/pdf' ||
                                                  previewPages[0].name.toLowerCase().endsWith('.pdf'))
                                        ) && (
                                             <div className="book_modal__field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                  <label>Sample Preview Pages Alt-Texts</label>
                                                  {previewPages.map((file, idx) => (
                                                       <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>Page {idx + 1}:</span>
                                                            <input
                                                                 type="text"
                                                                 value={previewAlts[idx] || ''}
                                                                 onChange={(e) => {
                                                                      const newVal = e.target.value;
                                                                      setPreviewAlts((prev) => {
                                                                           const copy = [...prev];
                                                                           copy[idx] = newVal;
                                                                           return copy;
                                                                      });
                                                                 }}
                                                                 placeholder={`Description for ${file.name}...`}
                                                                 disabled={isLoading}
                                                                 style={{ flex: 1, padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                                            />
                                                       </div>
                                                  ))}
                                             </div>
                                        )}

                                   {previewPages.length === 0 &&
                                        bookToEdit?.preview_pages &&
                                        bookToEdit.preview_pages.length > 0 &&
                                        !(
                                             bookToEdit.preview_pages.length === 1 &&
                                             (bookToEdit.preview_pages[0].toLowerCase().endsWith('.pdf') ||
                                                  bookToEdit.preview_pages[0].includes('.pdf'))
                                        ) && (
                                             <div className="book_modal__field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                  <label>Existing Preview Pages Alt-Texts</label>
                                                  {bookToEdit.preview_pages.map((_, idx) => (
                                                       <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>Page {idx + 1}:</span>
                                                            <input
                                                                 type="text"
                                                                 value={previewAlts[idx] || ''}
                                                                 onChange={(e) => {
                                                                      const newVal = e.target.value;
                                                                      setPreviewAlts((prev) => {
                                                                           const copy = [...prev];
                                                                           copy[idx] = newVal;
                                                                           return copy;
                                                                      });
                                                                 }}
                                                                 placeholder={`Describe the content of preview page ${idx + 1}...`}
                                                                 disabled={isLoading}
                                                                 style={{ flex: 1, padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                                            />
                                                       </div>
                                                  ))}
                                             </div>
                                        )}

                                   <div className="book_modal__field">
                                        <label>Storefront Curation</label>
                                        <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                             <label className="book_modal__checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                  <input
                                                       type="checkbox"
                                                       checked={isTrending}
                                                       onChange={(e) => setIsTrending(e.target.checked)}
                                                       disabled={isLoading}
                                                  />
                                                  <span>Trending Now</span>
                                             </label>
                                             <label className="book_modal__checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                  <input
                                                       type="checkbox"
                                                       checked={isNewRelease}
                                                       onChange={(e) => setIsNewRelease(e.target.checked)}
                                                       disabled={isLoading}
                                                  />
                                                  <span>New Releases</span>
                                             </label>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         <div className="book_modal__actions">
                              <button
                                   type="button"
                                   className="book_modal__btn--cancel"
                                   onClick={onClose}
                                   disabled={isLoading}
                              >
                                   Cancel
                              </button>
                              <button
                                   type="submit"
                                   className="book_modal__btn--submit"
                                   disabled={isLoading}
                              >
                                   {isLoading ? 'Saving...' : bookToEdit ? 'Update Book' : 'Publish Book'}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
};

export default Book_Upload_Modal;
