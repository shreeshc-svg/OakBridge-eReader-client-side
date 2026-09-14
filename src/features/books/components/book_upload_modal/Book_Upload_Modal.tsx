import { useState, useEffect, useRef } from 'react';
import { useCategories } from '../../../categories/hooks/use_categories';
import { books_api } from '../../api/books.api';
import { useAuthStore } from '../../../../store/auth.store';
import type {
     Book,
     BookVolume,
     PendingVolume,
} from '../../types/books.api.types';
import './Book_Upload_Modal.scss';

interface BookUploadModalProps {
     isOpen: boolean;
     onClose: () => void;
     // Returns the saved book when the caller has it, so a set can upload its
     // volumes straight afterwards.
     onSubmit: (payload: any) => Promise<any>;
     bookToEdit?: Book;
     initialCategoryId?: string;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const volumeLabelFor = (index: number) =>
     `Volume ${ROMAN[index] || index}`;

const emptyVolume = (index: number): PendingVolume => ({
     volume_label: volumeLabelFor(index),
     total_pages: 0,
     total_chapters: 0,
     book_file: null,
});

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

     // ── Multi-volume set ────────────────────────────────────────────────
     const accessToken = useAuthStore((state) => state.accessToken);
     const [isSet, setIsSet] = useState(false);
     const [existingVolumes, setExistingVolumes] = useState<BookVolume[]>([]);
     const [newVolumes, setNewVolumes] = useState<PendingVolume[]>([]);
     const [volumeProgress, setVolumeProgress] = useState<
          { label: string; percent: number; done: boolean }[]
     >([]);

     const setTotalPages_computed =
          existingVolumes.reduce((sum, v) => sum + (v.total_pages || 0), 0) +
          newVolumes.reduce((sum, v) => sum + (Number(v.total_pages) || 0), 0);

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
                    setIsSet(
                         !!bookToEdit.is_set ||
                              (bookToEdit.volumes || []).length > 0
                    );
                    setExistingVolumes(bookToEdit.volumes || []);
                    setNewVolumes([]);
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
                    setIsSet(false);
                    setExistingVolumes([]);
                    setNewVolumes([]);
               }
               setCoverImage(null);
               setBookFile(null);
               setError(null);
               setIsDropdownOpen(false);
               setVolumeProgress([]);
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

     const handleAddVolume = () => {
          setNewVolumes((prev) => [
               ...prev,
               emptyVolume(existingVolumes.length + prev.length + 1),
          ]);
     };

     const patchVolume = (index: number, patch: Partial<PendingVolume>) => {
          setNewVolumes((prev) =>
               prev.map((vol, i) => (i === index ? { ...vol, ...patch } : vol))
          );
     };

     const handleRemoveNewVolume = (index: number) => {
          setNewVolumes((prev) => prev.filter((_, i) => i !== index));
     };

     const handleDeleteExistingVolume = async (volume: BookVolume) => {
          if (!accessToken) return;
          if (
               !window.confirm(
                    `Remove ${volume.volume_label || 'this volume'} from the set? This deletes its file and cannot be undone.`
               )
          ) {
               return;
          }
          try {
               await books_api.delete_volume(volume.id, accessToken);
               setExistingVolumes((prev) =>
                    prev.filter((v) => v.id !== volume.id)
               );
          } catch (err: unknown) {
               const errorObj = err as { response?: { data?: { message?: string } } };
               setError(
                    errorObj.response?.data?.message || 'Failed to remove volume'
               );
          }
     };

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (
               !title ||
               !description ||
               !author ||
               !language ||
               !isbn ||
               (!isSet && !totalPages) ||
               (!isSet && !totalChapters) ||
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
               if (!isSet && !bookFile) {
                    setError('Please upload the book file (PDF).');
                    return;
               }
          }
          if (isSet) {
               if (existingVolumes.length + newVolumes.length === 0) {
                    setError('Add at least one volume to this set.');
                    return;
               }
               const incomplete = newVolumes.findIndex(
                    (vol) => !vol.book_file || !Number(vol.total_pages)
               );
               if (incomplete !== -1) {
                    setError(
                         `${newVolumes[incomplete].volume_label || `Volume ${incomplete + 1}`}: choose a PDF and enter its page count.`
                    );
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
                    // A set's page count is the sum of its volumes
                    total_pages: isSet
                         ? setTotalPages_computed
                         : Number(totalPages),
                    total_chapters: isSet
                         ? Number(totalChapters) || 0
                         : Number(totalChapters),
                    is_set: isSet,
                    price: Number(price) * 100, // Convert to paise
                    category_ids: selectedCategories,
                    access_period_days: accessPeriodDays === '' || accessPeriodDays === null ? null : Number(accessPeriodDays),
                    isTrending,
                    isNewRelease,
                    cover_image_alt: coverImageAlt,
                    preview_pages_alt: previewAlts,
               };
               if (coverImage) payload.cover_image = coverImage;
               if (bookFile && !isSet) payload.book_file = bookFile;
               if (previewPages.length > 0) payload.preview_pages = previewPages;

               const saved = await onSubmit(payload);

               // Volumes go up one at a time, so a big PDF can't take the whole
               // set down with it and the admin sees which one is uploading.
               if (isSet && newVolumes.length > 0) {
                    const setId = saved?.id || bookToEdit?.id;
                    if (!setId) {
                         throw new Error(
                              'The set was saved but its volumes could not be uploaded. Open it again and add them.'
                         );
                    }
                    if (!accessToken) throw new Error('Not authenticated');

                    setVolumeProgress(
                         newVolumes.map((vol) => ({
                              label: vol.volume_label,
                              percent: 0,
                              done: false,
                         }))
                    );

                    for (let i = 0; i < newVolumes.length; i += 1) {
                         const vol = newVolumes[i];
                         await books_api.add_volume(
                              setId,
                              {
                                   volume_label: vol.volume_label,
                                   volume_number:
                                        existingVolumes.length + i + 1,
                                   total_pages: Number(vol.total_pages) || 0,
                                   total_chapters:
                                        Number(vol.total_chapters) || 0,
                                   book_file: vol.book_file as File,
                              },
                              accessToken,
                              (percent) =>
                                   setVolumeProgress((prev) =>
                                        prev.map((p, idx) =>
                                             idx === i ? { ...p, percent } : p
                                        )
                                   )
                         );
                         setVolumeProgress((prev) =>
                              prev.map((p, idx) =>
                                   idx === i
                                        ? { ...p, percent: 100, done: true }
                                        : p
                              )
                         );
                    }
               }

               onClose();
          } catch (err: unknown) {
               const errorObj = err as {
                    response?: { data?: { message?: string } };
               };
               const errorMsg =
                    errorObj.response?.data?.message ||
                    (err instanceof Error ? err.message : 'Failed to upload book.');
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

                         {/* ── Multi-volume set ── */}
                         <label className="book_modal__set_toggle">
                              <input
                                   type="checkbox"
                                   checked={isSet}
                                   onChange={(e) => {
                                        setIsSet(e.target.checked);
                                        if (e.target.checked && newVolumes.length === 0 && existingVolumes.length === 0) {
                                             setNewVolumes([emptyVolume(1), emptyVolume(2)]);
                                        }
                                   }}
                                   disabled={isLoading}
                              />
                              <span>
                                   <strong>This is a multi-volume set</strong>
                                   <small>
                                        The set is sold as one book. Upload a PDF per
                                        volume below - volumes are not listed or sold
                                        separately, and they share this ISBN,
                                        description and price.
                                   </small>
                              </span>
                         </label>

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
                                                  Total Pages{' '}
                                                  {isSet ? (
                                                       <small>(sum of volumes)</small>
                                                  ) : (
                                                       <span className="required">*</span>
                                                  )}
                                             </label>
                                             <input
                                                  id="totalPages"
                                                  type="number"
                                                  value={isSet ? setTotalPages_computed : totalPages}
                                                  onChange={(e) =>
                                                       setTotalPages(
                                                            e.target.value === '' ? '' : Number(e.target.value)
                                                       )
                                                  }
                                                  disabled={isLoading || isSet}
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

                                   {!isSet && (
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
                                   )}

                                   {isSet && (
                                        <div className="book_modal__volumes">
                                             <div className="book_modal__volumes_head">
                                                  <label>
                                                       Volumes <span className="required">*</span>
                                                  </label>
                                                  <span className="book_modal__volumes_total">
                                                       {existingVolumes.length + newVolumes.length} volume
                                                       {existingVolumes.length + newVolumes.length === 1 ? '' : 's'}
                                                       {setTotalPages_computed > 0 &&
                                                            ` · ${setTotalPages_computed.toLocaleString('en-IN')} pages`}
                                                  </span>
                                             </div>

                                             {existingVolumes.map((volume) => (
                                                  <div
                                                       key={volume.id}
                                                       className="book_modal__volume book_modal__volume--saved"
                                                  >
                                                       <div className="book_modal__volume_saved_info">
                                                            <strong>
                                                                 {volume.volume_label ||
                                                                      `Volume ${volume.volume_number || ''}`}
                                                            </strong>
                                                            <span>
                                                                 {(volume.total_pages || 0).toLocaleString('en-IN')} pages
                                                                 {volume.total_chapters
                                                                      ? ` · ${volume.total_chapters} chapters`
                                                                      : ''}
                                                            </span>
                                                       </div>
                                                       <button
                                                            type="button"
                                                            className="book_modal__volume_remove"
                                                            onClick={() => handleDeleteExistingVolume(volume)}
                                                            disabled={isLoading}
                                                       >
                                                            Remove
                                                       </button>
                                                  </div>
                                             ))}

                                             {newVolumes.map((volume, index) => (
                                                  <div key={index} className="book_modal__volume">
                                                       <div className="book_modal__volume_row">
                                                            <input
                                                                 type="text"
                                                                 className="book_modal__volume_label"
                                                                 value={volume.volume_label}
                                                                 onChange={(e) =>
                                                                      patchVolume(index, { volume_label: e.target.value })
                                                                 }
                                                                 placeholder="Volume I"
                                                                 disabled={isLoading}
                                                            />
                                                            <input
                                                                 type="number"
                                                                 className="book_modal__volume_pages"
                                                                 value={volume.total_pages || ''}
                                                                 onChange={(e) =>
                                                                      patchVolume(index, {
                                                                           total_pages:
                                                                                e.target.value === '' ? 0 : Number(e.target.value),
                                                                      })
                                                                 }
                                                                 placeholder="Pages"
                                                                 disabled={isLoading}
                                                            />
                                                            <input
                                                                 type="number"
                                                                 className="book_modal__volume_pages"
                                                                 value={volume.total_chapters || ''}
                                                                 onChange={(e) =>
                                                                      patchVolume(index, {
                                                                           total_chapters:
                                                                                e.target.value === '' ? 0 : Number(e.target.value),
                                                                      })
                                                                 }
                                                                 placeholder="Chapters"
                                                                 disabled={isLoading}
                                                            />
                                                            <button
                                                                 type="button"
                                                                 className="book_modal__volume_remove"
                                                                 onClick={() => handleRemoveNewVolume(index)}
                                                                 disabled={isLoading}
                                                            >
                                                                 Remove
                                                            </button>
                                                       </div>
                                                       <div className="book_modal__file_drop book_modal__file_drop--accent">
                                                            <input
                                                                 type="file"
                                                                 accept=".pdf"
                                                                 onChange={(e) =>
                                                                      patchVolume(index, {
                                                                           book_file: e.target.files?.[0] || null,
                                                                      })
                                                                 }
                                                                 disabled={isLoading}
                                                            />
                                                            {volume.book_file ? (
                                                                 <span className="file_name">
                                                                      {volume.book_file.name}
                                                                 </span>
                                                            ) : (
                                                                 <span className="file_placeholder">
                                                                      Choose the PDF for this volume...
                                                                 </span>
                                                            )}
                                                       </div>
                                                  </div>
                                             ))}

                                             <button
                                                  type="button"
                                                  className="book_modal__add_volume"
                                                  onClick={handleAddVolume}
                                                  disabled={isLoading}
                                             >
                                                  + Add Volume
                                             </button>

                                             {volumeProgress.length > 0 && (
                                                  <div className="book_modal__volume_progress">
                                                       {volumeProgress.map((p, i) => (
                                                            <div key={i} className="book_modal__volume_progress_row">
                                                                 <span>{p.label}</span>
                                                                 <div className="book_modal__progress_track">
                                                                      <div
                                                                           className="book_modal__progress_bar"
                                                                           style={{ width: `${p.percent}%` }}
                                                                      />
                                                                 </div>
                                                                 <span>{p.done ? 'Uploaded' : `${p.percent}%`}</span>
                                                            </div>
                                                       ))}
                                                  </div>
                                             )}
                                        </div>
                                   )}

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
