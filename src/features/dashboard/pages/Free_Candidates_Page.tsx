import { useEffect, useState } from 'react';
import { free_candidates_api, type FreeCandidate } from '../api/free-candidates.api';
import { categories_api } from '../../categories/api/categories.api';
import { books_api } from '../../books/api/books.api';
import type { Book } from '../../books/types/books.api.types';
import { useAuthStore } from '../../../store/auth.store';
import { useDebounce } from '../../../hooks/use_debounce';
import './Free_Candidates_Page.scss';

const Free_Candidates_Page = () => {
     const accessToken = useAuthStore((state) => state.accessToken);
     const [candidates, setCandidates] = useState<FreeCandidate[]>([]);
     const [categories, setCategories] = useState<{ id: string; category_name: string }[]>([]);
     const [books, setBooks] = useState<Book[]>([]);
     
     // Form state
     const [username, setUsername] = useState('');
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [formSuccess, setFormSuccess] = useState('');
     const [formError, setFormError] = useState('');
     const [creating, setCreating] = useState(false);

     // Modal state
     const [selectedCandidate, setSelectedCandidate] = useState<FreeCandidate | null>(null);
     const [allowedBookIds, setAllowedBookIds] = useState<string[]>([]);
     const [showBooksModal, setShowBooksModal] = useState(false);
     const [savingBooks, setSavingBooks] = useState(false);
     const [modalSuccess, setModalSuccess] = useState('');
     const [modalError, setModalError] = useState('');

     // Search and loading states
     const [searchQuery, setSearchQuery] = useState('');
     const debouncedSearchQuery = useDebounce(searchQuery, 300);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');

     const fetchCandidates = async () => {
          setLoading(true);
          try {
               const res = await free_candidates_api.get_candidates();
               if (res.success) {
                    setCandidates(res.data);
               } else {
                    setError('Failed to load free candidates.');
               }
          } catch (err: any) {
               setError(err.response?.data?.message || 'Error loading candidates.');
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          fetchCandidates();
     }, []);

     const handleCreateCandidate = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!username || !email || !password) {
               setFormError('All fields are required.');
               return;
          }
          setFormError('');
          setFormSuccess('');
          setCreating(true);

          try {
               const res = await free_candidates_api.create_candidate({ username, email, password });
               if (res.success) {
                    setFormSuccess('Candidate account created successfully!');
                    setUsername('');
                    setEmail('');
                    setPassword('');
                    fetchCandidates();
               } else {
                    setFormError(res.message || 'Failed to create candidate.');
               }
          } catch (err: any) {
               setFormError(err.response?.data?.message || 'Error creating account.');
          } finally {
               setCreating(false);
          }
     };

     const handleManageBooks = async (candidate: FreeCandidate) => {
          setSelectedCandidate(candidate);
          setShowBooksModal(true);
          setModalError('');
          setModalSuccess('');
          setAllowedBookIds([]);

          try {
               if (categories.length === 0) {
                    const catRes = await categories_api.get_all_categories(accessToken);
                    if (catRes && catRes.categories) {
                         setCategories(catRes.categories);
                    }
               }
               if (books.length === 0) {
                    const booksRes = await books_api.get_all_books(accessToken);
                    if (booksRes && booksRes.books) {
                         setBooks(booksRes.books);
                    }
               }
               const res = await free_candidates_api.get_allowed_books(candidate.id);
               if (res.success) {
                    setAllowedBookIds(res.data);
               } else {
                    setModalError('Failed to fetch allowed books.');
               }
          } catch (err: any) {
               setModalError(err.response?.data?.message || 'Error loading config.');
          }
     };

     const handleToggleBook = (bookId: string) => {
          setAllowedBookIds((prev) =>
               prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
          );
     };

     const handleSaveAllowedBooks = async () => {
          if (!selectedCandidate) return;
          setSavingBooks(true);
          setModalError('');
          setModalSuccess('');

          try {
               const res = await free_candidates_api.update_allowed_books(selectedCandidate.id, allowedBookIds);
               if (res.success) {
                    setModalSuccess('Allowed books updated successfully!');
                    setTimeout(() => {
                         setShowBooksModal(false);
                         setSelectedCandidate(null);
                    }, 1200);
               } else {
                    setModalError(res.message || 'Failed to update configuration.');
               }
          } catch (err: any) {
               setModalError(err.response?.data?.message || 'Error saving settings.');
          } finally {
               setSavingBooks(false);
          }
     };

     // Filter candidates list
     const filteredCandidates = candidates.filter((cand) => {
          const query = debouncedSearchQuery.toLowerCase();
          return (
               cand.username.toLowerCase().includes(query) ||
               cand.email.toLowerCase().includes(query)
          );
     });

     return (
          <div className="cand_page">
               {error && <div className="cand_page__error">{error}</div>}

               <div className="cand_page__layout">
                    {/* Add Candidate Form */}
                    <div className="cand_page__card cand_page__form_card">
                         <h2 className="cand_page__card_title">Add Free Candidate</h2>
                         <p className="cand_page__card_subtitle">
                              Register a new user to grant customized book access.
                         </p>

                         {formError && <div className="cand_page__form_error">{formError}</div>}
                         {formSuccess && <div className="cand_page__form_success">{formSuccess}</div>}

                         <form onSubmit={handleCreateCandidate} className="cand_page__form">
                              <div className="cand_page__form_group">
                                   <label htmlFor="username">Username</label>
                                   <input
                                        type="text"
                                        id="username"
                                        placeholder="e.g. janesmith"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                   />
                              </div>

                              <div className="cand_page__form_group">
                                   <label htmlFor="email">Email Address</label>
                                   <input
                                        type="email"
                                        id="email"
                                        placeholder="e.g. jane@oakbridge.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                   />
                              </div>

                              <div className="cand_page__form_group">
                                   <label htmlFor="password">Login Password</label>
                                   <input
                                        type="password"
                                        id="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                   />
                              </div>

                              <button
                                   type="submit"
                                   className="cand_page__btn cand_page__btn--primary cand_page__btn--full"
                                   disabled={creating}
                              >
                                   {creating ? 'Creating Account...' : 'Create Candidate Account'}
                              </button>
                         </form>
                    </div>

                    {/* Candidates List */}
                    <div className="cand_page__card cand_page__list_card">
                         <div className="cand_page__header">
                              <div>
                                   <h2 className="cand_page__card_title">Registered Free Candidates</h2>
                                   <p className="cand_page__card_subtitle">
                                        Manage retail candidate accounts and their book permissions.
                                   </p>
                              </div>
                              <div className="cand_page__count_pill">
                                   <span>{candidates.length}</span> Candidates
                              </div>
                         </div>

                         <div className="cand_page__search_bar">
                              <svg className="cand_page__search_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                   <circle cx="11" cy="11" r="8" />
                                   <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              </svg>
                              <input
                                   type="text"
                                   placeholder="Search by username or email..."
                                   value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}
                              />
                         </div>

                         {loading ? (
                              <div className="cand_page__empty">
                                   <div className="cand_page__spinner"></div>
                                   <p>Loading candidate list...</p>
                              </div>
                         ) : filteredCandidates.length === 0 ? (
                              <div className="cand_page__empty">
                                   <svg className="cand_page__empty_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                   </svg>
                                   <p>{searchQuery ? 'No candidates match your search.' : 'No candidates registered yet.'}</p>
                              </div>
                         ) : (
                              <div className="cand_page__table_container">
                                   <table className="cand_page__table">
                                        <thead>
                                             <tr>
                                                  <th>Candidate</th>
                                                  <th>Email</th>
                                                  <th>Registered Date</th>
                                                  <th>Actions</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             {filteredCandidates.map((cand) => (
                                                  <tr key={cand.id}>
                                                       <td>
                                                            <div className="cand_page__name_cell">
                                                                 <div className="cand_page__avatar">
                                                                      {cand.username.charAt(0).toUpperCase()}
                                                                 </div>
                                                                 <span className="cand_page__username">{cand.username}</span>
                                                            </div>
                                                       </td>
                                                       <td>{cand.email}</td>
                                                       <td>
                                                            {new Date(cand.createdAt).toLocaleDateString('en-IN', {
                                                                 day: 'numeric',
                                                                 month: 'short',
                                                                 year: 'numeric',
                                                            })}
                                                       </td>
                                                       <td>
                                                            <button
                                                                 className="cand_page__action_btn"
                                                                 onClick={() => handleManageBooks(cand)}
                                                                 title="Manage Allowed Books"
                                                            >
                                                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cand_page__action_icon">
                                                                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                                 </svg>
                                                                 <span>Manage Books</span>
                                                            </button>
                                                       </td>
                                                  </tr>
                                             ))}
                                        </tbody>
                                   </table>
                              </div>
                         )}
                    </div>
               </div>

               {/* Allowed Books Configuration Modal */}
               {showBooksModal && selectedCandidate && (
                    <div className="cand_page__modal_overlay">
                         <div className="cand_page__modal">
                              <div className="cand_page__modal_header">
                                   <h3>Manage Allowed Books</h3>
                                   <button className="cand_page__modal_close" onClick={() => setShowBooksModal(false)}>
                                        &times;
                                   </button>
                              </div>
                              <div className="cand_page__modal_body">
                                   <p className="cand_page__modal_info">
                                        Select individual paid books that <strong>{selectedCandidate.username}</strong> ({selectedCandidate.email}) is allowed to download and read for free.
                                   </p>

                                   {modalError && <div className="cand_page__modal_error">{modalError}</div>}
                                   {modalSuccess && <div className="cand_page__modal_success">{modalSuccess}</div>}

                                   {categories.length === 0 ? (
                                        <div className="cand_page__modal_loading">
                                             <div className="cand_page__spinner"></div>
                                             <p>Loading catalog...</p>
                                        </div>
                                   ) : (
                                        <div className="cand_page__categories_list">
                                             {categories.map((cat) => {
                                                  const categoryBooks = books.filter((b) => b.category_ids?.includes(cat.id));
                                                  if (categoryBooks.length === 0) return null;

                                                  return (
                                                       <div key={cat.id} className="cand_page__category_group">
                                                            <h4 className="cand_page__category_title">{cat.category_name}</h4>
                                                            <div className="cand_page__books_grid">
                                                                 {categoryBooks.map((book) => (
                                                                      <label key={book.id} className={`cand_page__book_item ${allowedBookIds.includes(book.id) ? 'cand_page__book_item--active' : ''}`}>
                                                                           <input
                                                                                type="checkbox"
                                                                                checked={allowedBookIds.includes(book.id)}
                                                                                onChange={() => handleToggleBook(book.id)}
                                                                           />
                                                                           <div className="cand_page__book_info">
                                                                                <span className="cand_page__book_title">{book.title}</span>
                                                                                <span className="cand_page__book_author">by {book.author}</span>
                                                                                {book.price && book.price > 0 ? (
                                                                                     <span className="cand_page__book_price">₹{(book.price / 100).toLocaleString('en-IN')}</span>
                                                                                ) : (
                                                                                     <span className="cand_page__book_free">FREE</span>
                                                                                )}
                                                                           </div>
                                                                      </label>
                                                                 ))}
                                                            </div>
                                                       </div>
                                                  );
                                             })}
                                        </div>
                                   )}
                              </div>
                              <div className="cand_page__modal_footer">
                                   <button
                                        className="cand_page__btn cand_page__btn--secondary"
                                        onClick={() => setShowBooksModal(false)}
                                        disabled={savingBooks}
                                   >
                                        Cancel
                                   </button>
                                   <button
                                        className="cand_page__btn cand_page__btn--primary"
                                        onClick={handleSaveAllowedBooks}
                                        disabled={savingBooks}
                                   >
                                        {savingBooks ? 'Saving...' : 'Save Configuration'}
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default Free_Candidates_Page;
