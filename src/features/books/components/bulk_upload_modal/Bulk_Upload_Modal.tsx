import { useState, useRef } from 'react';
import { useBooks } from '../../hooks/use_books';
import * as XLSX from 'xlsx';
import './Bulk_Upload_Modal.scss';

interface BulkUploadModalProps {
     isOpen: boolean;
     onClose: () => void;
}

interface MatchedBook {
     isbn: string;
     title: string;
     author: string;
     description: string;
     category: string;
     price: number; // Decimal (e.g. 14.99 or 1499), will multiply by 100 on upload
     language: string;
     total_pages: number;
     total_chapters: number;
     access_period_days: number | null;
     coverFile: File | null;
     pdfFile: File | null;
}

const Bulk_Upload_Modal = ({ isOpen, onClose }: BulkUploadModalProps) => {
     const { createBook } = useBooks();

     const [step, setStep] = useState(1);
     const [csvFile, setCsvFile] = useState<File | null>(null);
     const [booksData, setBooksData] = useState<MatchedBook[]>([]);

     // Bulk upload arrays
     const [coverFiles, setCoverFiles] = useState<File[]>([]);
     const [pdfFiles, setPdfFiles] = useState<File[]>([]);

     // Progress & Processing State
     const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
     const [uploadStatuses, setUploadStatuses] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
     const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
     const [isUploading, setIsUploading] = useState(false);

     // File input refs for step drops & button clicks
     const csvInputRef = useRef<HTMLInputElement>(null);
     const coverInputRef = useRef<HTMLInputElement>(null);
     const pdfInputRef = useRef<HTMLInputElement>(null);
     const singleCoverInputRef = useRef<HTMLInputElement>(null);
     const singlePdfInputRef = useRef<HTMLInputElement>(null);
     const activeRowIsbnRef = useRef<string | null>(null);

     if (!isOpen) return null;

     // Simple robust CSV parser
     const parseCSV = (text: string): Record<string, string>[] => {
          const lines: string[][] = [];
          let row: string[] = [];
          let inQuotes = false;
          let currentToken = '';

          for (let i = 0; i < text.length; i++) {
               const char = text[i];
               const nextChar = text[i + 1];

               if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                         currentToken += '"';
                         i++;
                    } else {
                         inQuotes = !inQuotes;
                    }
               } else if (char === ',' && !inQuotes) {
                    row.push(currentToken.trim());
                    currentToken = '';
               } else if ((char === '\r' || char === '\n') && !inQuotes) {
                    if (char === '\r' && nextChar === '\n') {
                         i++;
                    }
                    row.push(currentToken.trim());
                    if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
                         lines.push(row);
                    }
                    row = [];
                    currentToken = '';
               } else {
                    currentToken += char;
               }
          }
          if (currentToken || row.length > 0) {
               row.push(currentToken.trim());
               lines.push(row);
          }

          if (lines.length < 2) return [];

          const headers = lines[0].map((h) => h.toLowerCase().trim());
          const results: Record<string, string>[] = [];

          for (let r = 1; r < lines.length; r++) {
               const values = lines[r];
               if (values.length < headers.length) continue;
               const entry: Record<string, string> = {};
               for (let h = 0; h < headers.length; h++) {
                    entry[headers[h]] = values[h] || '';
               }
               results.push(entry);
          }
          return results;
     };

     const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setCsvFile(file);

          const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

          if (isExcel) {
               const reader = new FileReader();
               reader.onload = (event) => {
                    try {
                         const data = new Uint8Array(event.target?.result as ArrayBuffer);
                         const workbook = XLSX.read(data, { type: 'array' });
                         const firstSheetName = workbook.SheetNames[0];
                         const worksheet = workbook.Sheets[firstSheetName];
                         const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

                         const formatted: MatchedBook[] = jsonData.map((row) => {
                              const normalizedRow: Record<string, string> = {};
                              Object.keys(row).forEach((k) => {
                                   normalizedRow[k.toLowerCase().trim()] = String(row[k]);
                              });

                              return {
                                   isbn: normalizedRow.isbn || '',
                                   title: normalizedRow.title || 'Untitled Book',
                                   author: normalizedRow.author || 'Unknown Author',
                                   description: normalizedRow.description || '',
                                   category: normalizedRow.category || 'General',
                                   price: Number(normalizedRow.price || 0),
                                   language: normalizedRow.language || 'English',
                                   total_pages: Number(normalizedRow.total_pages || 0),
                                   total_chapters: Number(normalizedRow.total_chapters || 0),
                                   access_period_days: normalizedRow.access_period_days ? Number(normalizedRow.access_period_days) : null,
                                   coverFile: null,
                                   pdfFile: null,
                              };
                         });

                         setBooksData(formatted);
                    } catch (err) {
                         console.error('Failed to parse Excel file:', err);
                         alert('Failed to parse Excel file. Please ensure it is valid.');
                    }
               };
               reader.readAsArrayBuffer(file);
          } else {
               const reader = new FileReader();
               reader.onload = (event) => {
                    const text = event.target?.result as string;
                    const parsed = parseCSV(text);

                    const formatted: MatchedBook[] = parsed.map((row) => ({
                         isbn: row.isbn || '',
                         title: row.title || 'Untitled Book',
                         author: row.author || 'Unknown Author',
                         description: row.description || '',
                         category: row.category || 'General',
                         price: Number(row.price || 0),
                         language: row.language || 'English',
                         total_pages: Number(row.total_pages || 0),
                         total_chapters: Number(row.total_chapters || 0),
                         access_period_days: row.access_period_days ? Number(row.access_period_days) : null,
                         coverFile: null,
                         pdfFile: null,
                    }));

                    setBooksData(formatted);
               };
               reader.readAsText(file);
          }
     };

     // Match files uploaded in bulk to the parsed CSV rows
     const matchFiles = (csvRows: MatchedBook[], covers: File[], pdfs: File[]): MatchedBook[] => {
          return csvRows.map((row) => {
               const isbnClean = row.isbn.replace(/\s+/g, '').toLowerCase();

               const matchedCover = covers.find((f) => {
                    const nameNoExt = f.name.substring(0, f.name.lastIndexOf('.')).replace(/\s+/g, '').toLowerCase();
                    return nameNoExt === isbnClean;
               });

               const matchedPdf = pdfs.find((f) => {
                    const nameNoExt = f.name.substring(0, f.name.lastIndexOf('.')).replace(/\s+/g, '').toLowerCase();
                    return nameNoExt === isbnClean;
               });

               return {
                    ...row,
                    coverFile: matchedCover || row.coverFile,
                    pdfFile: matchedPdf || row.pdfFile,
               };
          });
     };

     const handleCoverFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = Array.from(e.target.files || []);
          const updatedCovers = [...coverFiles, ...files];
          setCoverFiles(updatedCovers);
          setBooksData((prev) => matchFiles(prev, updatedCovers, pdfFiles));
     };

     const handlePdfFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = Array.from(e.target.files || []);
          const updatedPdfs = [...pdfFiles, ...files];
          setPdfFiles(updatedPdfs);
          setBooksData((prev) => matchFiles(prev, coverFiles, updatedPdfs));
     };

     const handleSingleCoverUpload = (isbn: string) => {
          activeRowIsbnRef.current = isbn;
          singleCoverInputRef.current?.click();
     };

     const handleSinglePdfUpload = (isbn: string) => {
          activeRowIsbnRef.current = isbn;
          singlePdfInputRef.current?.click();
     };

     const handleSingleCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          const isbn = activeRowIsbnRef.current;
          if (!file || !isbn) return;

          setBooksData((prev) =>
               prev.map((book) => (book.isbn === isbn ? { ...book, coverFile: file } : book))
          );
          activeRowIsbnRef.current = null;
          e.target.value = ''; // Reset input
     };

     const handleSinglePdfFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          const isbn = activeRowIsbnRef.current;
          if (!file || !isbn) return;

          setBooksData((prev) =>
               prev.map((book) => (book.isbn === isbn ? { ...book, pdfFile: file } : book))
          );
          activeRowIsbnRef.current = null;
          e.target.value = ''; // Reset input
     };

     const startUploadProcess = async () => {
          const uploadable = booksData.filter((b) => b.coverFile && b.pdfFile);
          if (uploadable.length === 0) return;

          setIsUploading(true);
          setStep(4);

          // Initialize statuses
          const initialStatuses: Record<string, 'pending' | 'success' | 'error'> = {};
          booksData.forEach((b) => {
               if (b.coverFile && b.pdfFile) {
                    initialStatuses[b.isbn] = 'pending';
               }
          });
          setUploadStatuses(initialStatuses);
          setUploadErrors({});

          for (let i = 0; i < booksData.length; i++) {
               const book = booksData[i];
               if (!book.coverFile || !book.pdfFile) continue;

               setCurrentUploadIndex(i);

               try {
                    const payload = {
                         title: book.title,
                         description: book.description,
                         author: book.author,
                         language: book.language,
                         isbn: book.isbn,
                         total_pages: book.total_pages,
                         total_chapters: book.total_chapters,
                         price: Math.round(book.price * 100), // convert to paise/cents
                         category_names: [book.category],
                         access_period_days: book.access_period_days,
                         cover_image: book.coverFile,
                         book_file: book.pdfFile,
                    };

                    await createBook(payload as any);

                    setUploadStatuses((prev) => ({ ...prev, [book.isbn]: 'success' }));
               } catch (err: any) {
                    console.error(`Failed to upload ${book.title}:`, err);
                    setUploadStatuses((prev) => ({ ...prev, [book.isbn]: 'error' }));
                    setUploadErrors((prev) => ({
                         ...prev,
                         [book.isbn]: err.message || 'Server upload error',
                    }));
               }
          }

          setIsUploading(false);
          setStep(5);
     };

     const handleReset = () => {
          setStep(1);
          setCsvFile(null);
          setBooksData([]);
          setCoverFiles([]);
          setPdfFiles([]);
          setCurrentUploadIndex(0);
          setUploadStatuses({});
          setUploadErrors({});
          setIsUploading(false);
     };

     const matchedCount = booksData.filter((b) => b.coverFile && b.pdfFile).length;
     const progressPercent = booksData.length > 0 ? Math.round((currentUploadIndex / booksData.length) * 100) : 0;

     return (
          <div className="bulk_modal__overlay" onClick={isUploading ? undefined : onClose}>
               <div className="bulk_modal__content" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bulk_modal__header">
                         <div>
                              <h2>Bulk Upload Wizard</h2>
                              <p>Import books in bulk using CSV metadata and matched media files.</p>
                         </div>
                         <button className="bulk_modal__close" onClick={onClose} disabled={isUploading}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                   <line x1="18" y1="6" x2="6" y2="18"></line>
                                   <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                         </button>
                    </div>

                    {/* Hidden inputs for triggers */}
                    <input
                         type="file"
                         ref={singleCoverInputRef}
                         style={{ display: 'none' }}
                         accept="image/*"
                         onChange={handleSingleCoverFileSelected}
                    />
                    <input
                         type="file"
                         ref={singlePdfInputRef}
                         style={{ display: 'none' }}
                         accept="application/pdf"
                         onChange={handleSinglePdfFileSelected}
                    />

                    {/* Steps Indicator */}
                    <div className="bulk_modal__body">
                         <div className="bulk_modal__steps">
                              <div
                                   className="bulk_modal__step-track"
                                   style={{ width: `${((step - 1) / 4) * 100}%` }}
                              ></div>
                              <div className={`bulk_modal__step ${step >= 1 ? 'bulk_modal__step--active' : ''} ${step > 1 ? 'bulk_modal__step--completed' : ''}`}>
                                   <div className="bulk_modal__step-circle">1</div>
                                   <span className="bulk_modal__step-label">CSV Upload</span>
                              </div>
                              <div className={`bulk_modal__step ${step >= 2 ? 'bulk_modal__step--active' : ''} ${step > 2 ? 'bulk_modal__step--completed' : ''}`}>
                                   <div className="bulk_modal__step-circle">2</div>
                                   <span className="bulk_modal__step-label">Add Media</span>
                              </div>
                              <div className={`bulk_modal__step ${step >= 3 ? 'bulk_modal__step--active' : ''} ${step > 3 ? 'bulk_modal__step--completed' : ''}`}>
                                   <div className="bulk_modal__step-circle">3</div>
                                   <span className="bulk_modal__step-label">Verify Matches</span>
                              </div>
                              <div className={`bulk_modal__step ${step >= 4 ? 'bulk_modal__step--active' : ''} ${step > 4 ? 'bulk_modal__step--completed' : ''}`}>
                                   <div className="bulk_modal__step-circle">4</div>
                                   <span className="bulk_modal__step-label">Processing</span>
                              </div>
                              <div className={`bulk_modal__step ${step >= 5 ? 'bulk_modal__step--active' : ''}`}>
                                   <div className="bulk_modal__step-circle">5</div>
                                   <span className="bulk_modal__step-label">Finish</span>
                              </div>
                         </div>

                         {/* Step Contents */}
                         {step === 1 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                   <div
                                        className="bulk_modal__dropzone"
                                        onClick={() => csvInputRef.current?.click()}
                                   >
                                        <input
                                             type="file"
                                             ref={csvInputRef}
                                             style={{ display: 'none' }}
                                             accept=".csv,.xlsx,.xls"
                                             onChange={handleCsvChange}
                                        />
                                        <div className="bulk_modal__dropzone-icon">
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                  <polyline points="14 2 14 8 20 8"></polyline>
                                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                                  <polyline points="10 9 9 9 8 9"></polyline>
                                             </svg>
                                        </div>
                                        <p className="bulk_modal__dropzone-text">
                                             Drag and drop your books metadata CSV/Excel or <span>browse files</span>
                                        </p>
                                        <p className="bulk_modal__dropzone-hint">Supported formats: .csv, .xlsx, .xls</p>
                                   </div>

                                   {csvFile && (
                                        <div className="bulk_modal__file-preview">
                                             <div className="bulk_modal__file-preview-info">
                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                       <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                       <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                  </svg>
                                                  <span>{csvFile.name} ({booksData.length} records found)</span>
                                             </div>
                                             <button
                                                  className="bulk_modal__file-preview-remove"
                                                  onClick={() => {
                                                       setCsvFile(null);
                                                       setBooksData([]);
                                                  }}
                                             >
                                                  Remove
                                             </button>
                                        </div>
                                   )}
                              </div>
                         )}

                         {step === 2 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                   <div className="bulk_modal__file-grid">
                                        {/* Cover Images Bulk Card */}
                                        <div className="bulk_modal__file-card">
                                             <div>
                                                  <h4>Cover Images</h4>
                                                  <p style={{ fontSize: '13px', color: '#78716c' }}>
                                                       Upload cover images named [ISBN].jpg/png
                                                  </p>
                                             </div>
                                             <div
                                                  className="bulk_modal__dropzone"
                                                  onClick={() => coverInputRef.current?.click()}
                                                  style={{ padding: '24px 16px' }}
                                             >
                                                  <input
                                                       type="file"
                                                       ref={coverInputRef}
                                                       style={{ display: 'none' }}
                                                       accept="image/*"
                                                       multiple
                                                       onChange={handleCoverFilesChange}
                                                  />
                                                  <div className="bulk_modal__dropzone-icon" style={{ color: '#d97706' }}>
                                                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                            <polyline points="21 15 16 10 5 21"></polyline>
                                                       </svg>
                                                  </div>
                                                  <p className="bulk_modal__dropzone-text" style={{ fontSize: '14px' }}>
                                                       <span>Browse covers</span>
                                                  </p>
                                             </div>
                                             {coverFiles.length > 0 && (
                                                  <span className="bulk_modal__file-badge">
                                                       {coverFiles.length} files selected
                                                  </span>
                                             )}
                                        </div>

                                        {/* PDF Files Bulk Card */}
                                        <div className="bulk_modal__file_card">
                                             <div>
                                                  <h4>PDF Manuscripts</h4>
                                                  <p style={{ fontSize: '13px', color: '#78716c' }}>
                                                       Upload book PDFs named [ISBN].pdf
                                                  </p>
                                             </div>
                                             <div
                                                  className="bulk_modal__dropzone"
                                                  onClick={() => pdfInputRef.current?.click()}
                                                  style={{ padding: '24px 16px' }}
                                             >
                                                  <input
                                                       type="file"
                                                       ref={pdfInputRef}
                                                       style={{ display: 'none' }}
                                                       accept="application/pdf"
                                                       multiple
                                                       onChange={handlePdfFilesChange}
                                                  />
                                                  <div className="bulk_modal__dropzone-icon" style={{ color: '#4f46e5' }}>
                                                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                            <polyline points="14 2 14 8 20 8"></polyline>
                                                       </svg>
                                                  </div>
                                                  <p className="bulk_modal__dropzone-text" style={{ fontSize: '14px' }}>
                                                       <span>Browse PDFs</span>
                                                  </p>
                                             </div>
                                             {pdfFiles.length > 0 && (
                                                  <span className="bulk_modal__file-badge">
                                                       {pdfFiles.length} files selected
                                                  </span>
                                             )}
                                        </div>
                                    </div>
                               </div>
                         )}

                         {step === 3 && (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                   {matchedCount < booksData.length && (
                                        <div className="bulk_modal__stats-summary">
                                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <circle cx="12" cy="12" r="10"></circle>
                                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                             </svg>
                                             <div>
                                                  Matched {matchedCount} of {booksData.length} books. Make sure your files are named with the correct ISBN numbers. You can upload missing files directly in the rows below.
                                             </div>
                                        </div>
                                   )}

                                   <div className="bulk_modal__table-wrapper">
                                        <table className="bulk_modal__table">
                                             <thead>
                                                  <tr>
                                                       <th>ISBN</th>
                                                       <th>Title</th>
                                                       <th>Cover Image</th>
                                                       <th>PDF File</th>
                                                  </tr>
                                             </thead>
                                             <tbody>
                                                  {booksData.map((book) => (
                                                       <tr key={book.isbn}>
                                                            <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{book.isbn}</td>
                                                            <td>
                                                                 <div style={{ fontWeight: '600' }}>{book.title}</div>
                                                                 <div style={{ fontSize: '12px', color: '#78716c' }}>{book.author}</div>
                                                            </td>
                                                            <td>
                                                                 {book.coverFile ? (
                                                                      <span className="bulk_modal__table-status bulk_modal__table-status--matched">
                                                                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                           </svg>
                                                                           {book.coverFile.name}
                                                                      </span>
                                                                 ) : (
                                                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                           <span className="bulk_modal__table-status bulk_modal__table-status--missing">
                                                                                Missing
                                                                           </span>
                                                                           <button
                                                                                className="bulk_modal__table-btn"
                                                                                onClick={() => handleSingleCoverUpload(book.isbn)}
                                                                           >
                                                                                Attach File
                                                                           </button>
                                                                      </div>
                                                                 )}
                                                            </td>
                                                            <td>
                                                                 {book.pdfFile ? (
                                                                      <span className="bulk_modal__table-status bulk_modal__table-status--matched">
                                                                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                           </svg>
                                                                           {book.pdfFile.name}
                                                                      </span>
                                                                 ) : (
                                                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                           <span className="bulk_modal__table-status bulk_modal__table-status--missing">
                                                                                Missing
                                                                           </span>
                                                                           <button
                                                                                className="bulk_modal__table-btn"
                                                                                onClick={() => handleSinglePdfUpload(book.isbn)}
                                                                           >
                                                                                Attach File
                                                                           </button>
                                                                      </div>
                                                                 )}
                                                            </td>
                                                       </tr>
                                                  ))}
                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         )}

                         {step === 4 && (
                              <div className="bulk_modal__progress-container">
                                   <div className="bulk_modal__progress-percentage">{progressPercent}%</div>
                                   <div className="bulk_modal__progress-label">
                                        Uploading Book: {booksData[currentUploadIndex]?.title}
                                   </div>
                                   <div className="bulk_modal__progress-bar">
                                        <div
                                             className="bulk_modal__progress-bar-fill"
                                             style={{ width: `${progressPercent}%` }}
                                        ></div>
                                   </div>
                                   <div className="bulk_modal__progress-sub">
                                        Processing DRM Encryption and S3 uploads. Please do not close this window.
                                   </div>

                                   <div className="bulk_modal__log">
                                        {booksData.map((book, idx) => {
                                             const status = uploadStatuses[book.isbn];
                                             if (status === 'success') {
                                                  return (
                                                       <div key={book.isbn} className="bulk_modal__log-item bulk_modal__log-item--success">
                                                            <span>✓ {book.title}</span>
                                                            <span>Completed</span>
                                                       </div>
                                                  );
                                             }
                                             if (status === 'error') {
                                                  return (
                                                       <div key={book.isbn} className="bulk_modal__log-item bulk_modal__log-item--error">
                                                            <span>✗ {book.title}</span>
                                                            <span>Error: {uploadErrors[book.isbn]}</span>
                                                       </div>
                                                  );
                                             }
                                             if (idx === currentUploadIndex) {
                                                  return (
                                                       <div key={book.isbn} className="bulk_modal__log-item bulk_modal__log-item--pending" style={{ fontWeight: '700', color: '#d97706' }}>
                                                            <span>⚡ {book.title}</span>
                                                            <span>Uploading...</span>
                                                       </div>
                                                  );
                                             }
                                             return null;
                                        })}
                                   </div>
                              </div>
                         )}

                         {step === 5 && (
                              <div className="bulk_modal__summary-card">
                                   <div className="bulk_modal__summary-card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                             <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                   </div>
                                   <h3>Bulk Upload Completed!</h3>
                                   <p>
                                        The upload process has finished. Check the summary below to confirm which manuscripts were successfully saved.
                                   </p>

                                   <div className="bulk_modal__log" style={{ maxHeight: '250px' }}>
                                        {booksData.map((book) => {
                                             const status = uploadStatuses[book.isbn];
                                             if (status === 'success') {
                                                  return (
                                                       <div key={book.isbn} className="bulk_modal__log-item bulk_modal__log-item--success">
                                                            <span>✓ {book.title} (ISBN: {book.isbn})</span>
                                                            <span>Success</span>
                                                       </div>
                                                  );
                                             }
                                             if (status === 'error') {
                                                  return (
                                                       <div key={book.isbn} className="bulk_modal__log-item bulk_modal__log-item--error">
                                                            <span>✗ {book.title} (ISBN: {book.isbn})</span>
                                                            <span>Failed ({uploadErrors[book.isbn]})</span>
                                                       </div>
                                                  );
                                             }
                                             return null;
                                        })}
                                   </div>
                              </div>
                         )}
                    </div>

                    {/* Footer Controls */}
                    <div className="bulk_modal__footer">
                         <div>
                              {step > 1 && step < 4 && (
                                   <button
                                        className="bulk_modal__btn bulk_modal__btn--ghost"
                                        onClick={() => setStep((s) => s - 1)}
                                        disabled={isUploading}
                                   >
                                        Back
                                   </button>
                              )}
                         </div>
                         <div style={{ display: 'flex', gap: 12 }}>
                              {step < 3 && (
                                   <button
                                        className="bulk_modal__btn bulk_modal__btn--primary"
                                        onClick={() => setStep((s) => s + 1)}
                                        disabled={step === 1 && !csvFile}
                                   >
                                        Next
                                   </button>
                              )}
                              {step === 3 && (
                                   <button
                                        className="bulk_modal__btn bulk_modal__btn--primary bulk_modal__btn--action"
                                        onClick={startUploadProcess}
                                        disabled={matchedCount === 0}
                                   >
                                        Start Bulk Upload ({matchedCount} books)
                                   </button>
                              )}
                              {step === 5 && (
                                   <>
                                        <button
                                             className="bulk_modal__btn bulk_modal__btn--ghost"
                                             onClick={handleReset}
                                        >
                                             Upload More
                                        </button>
                                        <button
                                             className="bulk_modal__btn bulk_modal__btn--primary"
                                             onClick={onClose}
                                        >
                                             Close Wizard
                                        </button>
                                   </>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default Bulk_Upload_Modal;
