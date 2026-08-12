import { useEffect, useState, useCallback } from 'react';
import { institutions_api, type RegisteredInstitution, type AllowedCategoryRestriction } from '../api/institutions.api';
import { useAuthStore } from '../../../store/auth.store';
import { categories_api } from '../../categories/api/categories.api';
import { books_api } from '../../books/api/books.api';
import type { Book } from '../../books/types/books.api.types';
import { useDebounce } from '../../../hooks/use_debounce';
import './Institutions_Page.scss';

const Institutions_Page = () => {
     const [institutions, setInstitutions] = useState<RegisteredInstitution[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [searchQuery, setSearchQuery] = useState('');
     const debouncedSearchQuery = useDebounce(searchQuery, 300);


     // Categories restriction states
     const [showCategoryModal, setShowCategoryModal] = useState(false);
     const [selectedInst, setSelectedInst] = useState<RegisteredInstitution | null>(null);
     const [categories, setCategories] = useState<{ id: string; category_name: string }[]>([]);
     const [allowedRestrictions, setAllowedRestrictions] = useState<AllowedCategoryRestriction[]>([]);
     const [books, setBooks] = useState<Book[]>([]);
     const [allowedBookIds, setAllowedBookIds] = useState<string[]>([]);
     const [savingCategories, setSavingCategories] = useState(false);
     const [modalError, setModalError] = useState('');
     const [modalSuccess, setModalSuccess] = useState('');

     // Edit details modal states
     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [editingInst, setEditingInst] = useState<RegisteredInstitution | null>(null);
     const [editAdminEmail, setEditAdminEmail] = useState('');
     const [editExpiryDate, setEditExpiryDate] = useState('');
     const [savingDetails, setSavingDetails] = useState(false);

     const accessToken = useAuthStore((state: any) => state.accessToken);

     const fetchInstitutions = useCallback(async () => {
          try {
               setLoading(true);
               setError('');
               const res = await institutions_api.get_institutions();
               if (res.success) {
                    setInstitutions(res.data);
               } else {
                    setError('Failed to load institutions');
               }
          } catch (err: any) {
               setError(err.response?.data?.message || 'Failed to fetch registered institutions');
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          fetchInstitutions();
     }, [fetchInstitutions]);

     const handleDeleteInstitution = async (id: string, name: string) => {
          if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
               try {
                    const res = await institutions_api.delete_institution(id);
                    if (res.success) {
                         fetchInstitutions();
                    } else {
                         alert(res.message || 'Failed to delete institution');
                    }
               } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to delete institution');
               }
          }
     };

     const handleOpenEditModal = (inst: RegisteredInstitution) => {
          setEditingInst(inst);
          setEditAdminEmail(inst.adminEmail || '');
          setEditExpiryDate(inst.subscription_expires_at ? inst.subscription_expires_at.split('T')[0] : '');
          setIsEditModalOpen(true);
     };

     const handleSaveInstitutionDetails = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!editingInst) return;

          setSavingDetails(true);
          try {
               const res = await institutions_api.update_institution(editingInst.id, {
                    adminEmail: editAdminEmail,
                    subscription_expires_at: editExpiryDate || null,
               });
               if (res.success) {
                    setIsEditModalOpen(false);
                    fetchInstitutions();
               } else {
                    alert('Failed to update details');
               }
          } catch (err: any) {
               alert(err.response?.data?.message || 'Failed to update details');
          } finally {
               setSavingDetails(false);
          }
     };

     const handleManageCategories = async (inst: RegisteredInstitution) => {
          setSelectedInst(inst);
          setShowCategoryModal(true);
          setModalError('');
          setModalSuccess('');
          setAllowedRestrictions([]);
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
               const resCats = await institutions_api.get_allowed_categories(inst.id);
               if (resCats.success) {
                    setAllowedRestrictions(resCats.data);
               } else {
                    setModalError('Failed to fetch allowed categories.');
               }
               const resBooks = await institutions_api.get_allowed_books(inst.id);
               if (resBooks.success) {
                    setAllowedBookIds(resBooks.data);
               } else {
                    setModalError('Failed to fetch allowed books.');
               }
          } catch (err: any) {
               setModalError(err.response?.data?.message || 'Error loading categories.');
          }
     };

     const isCategoryAllowed = (catId: string) => {
          return allowedRestrictions.some((r) => r.categoryId === catId);
     };

     const handleToggleCategory = (catId: string) => {
          setAllowedRestrictions((prev) => {
               const exists = prev.some((r) => r.categoryId === catId);
               if (exists) {
                    return prev.filter((r) => r.categoryId !== catId);
               } else {
                    return [...prev, { categoryId: catId, allowAllBooks: true }];
               }
          });
     };

     const handleToggleAccessType = (catId: string, allowAll: boolean) => {
          setAllowedRestrictions((prev) =>
               prev.map((r) => (r.categoryId === catId ? { ...r, allowAllBooks: allowAll } : r))
          );
     };

     const handleToggleBook = (bookId: string) => {
          setAllowedBookIds((prev) =>
               prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
          );
     };

     const handleSaveCategories = async () => {
          if (!selectedInst) return;
          setSavingCategories(true);
          setModalError('');
          setModalSuccess('');
          try {
               const catRes = await institutions_api.update_allowed_categories(selectedInst.id, allowedRestrictions);
               
               const customCategoryIds = allowedRestrictions.filter((r) => !r.allowAllBooks).map((r) => r.categoryId);
               const activeBookIds = allowedBookIds.filter((bookId) => {
                    const book = books.find((b) => b.id === bookId);
                    return book && book.category_ids?.some((cid) => customCategoryIds.includes(cid));
               });
               
               const bookRes = await institutions_api.update_allowed_books(selectedInst.id, activeBookIds);

               if (catRes.success && bookRes.success) {
                    setModalSuccess('Allowed categories and books updated successfully!');
                    setTimeout(() => {
                         setShowCategoryModal(false);
                         setSelectedInst(null);
                    }, 1200);
               } else {
                    setModalError(catRes.message || bookRes.message || 'Failed to update configuration.');
               }
          } catch (err: any) {
               setModalError(err.response?.data?.message || 'Error saving settings.');
          } finally {
               setSavingCategories(false);
          }
     };

     // Filter institutions based on search query
     const filteredInstitutions = institutions.filter(inst => {
          const query = debouncedSearchQuery.toLowerCase();
          return (
               inst.name.toLowerCase().includes(query) ||
               inst.location.toLowerCase().includes(query) ||
               (inst.adminUsername && inst.adminUsername.toLowerCase().includes(query)) ||
               (inst.adminEmail && inst.adminEmail.toLowerCase().includes(query))
          );
     });


     const getTierBadgeClass = (tier: string) => {
          switch (tier.toUpperCase()) {
               case 'GOLD':
                    return 'inst_page__badge inst_page__badge--gold';
               case 'PLATINUM':
                    return 'inst_page__badge inst_page__badge--platinum';
               default:
                    return 'inst_page__badge inst_page__badge--none';
          }
     };

     return (
          <div className="inst_page">
               {error && <div className="inst_page__error">{error}</div>}

               <div className="inst_page__card">
                    <div className="inst_page__header">
                         <div>
                              <h2 className="inst_page__card_title">Registered Institutions</h2>
                              <p className="inst_page__card_subtitle">
                                   View and manage institution partners subscribed to academic plans.
                              </p>
                         </div>
                         <div className="inst_page__count_pill">
                              <span>{institutions.length}</span> Total Institutions
                         </div>
                    </div>

                    {/* Filter / Search bar */}
                    <div className="inst_page__search_bar">
                         <svg className="inst_page__search_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                         </svg>
                         <input
                              type="text"
                              placeholder="Search by institution name, location, or admin contact..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                         />
                    </div>

                    {/* Content */}
                    {loading ? (
                         <div className="inst_page__empty">
                              <div className="inst_page__spinner"></div>
                              <p>Loading registered institutions...</p>
                         </div>
                    ) : filteredInstitutions.length === 0 ? (
                         <div className="inst_page__empty">
                              <svg className="inst_page__empty_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                   <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                   <line x1="9" y1="22" x2="9" y2="16" />
                                   <line x1="15" y1="22" x2="15" y2="16" />
                                   <line x1="9" y1="16" x2="15" y2="16" />
                                   <path d="M8 6h2v2H8V6zm4 0h2v2h-2V6zm4 0h2v2h-2V6z" />
                              </svg>
                              <p>{searchQuery ? 'No institutions match your search query.' : 'No registered institutions found.'}</p>
                         </div>
                    ) : (
                         <div className="inst_page__table_container">
                              <table className="inst_page__table">
                                   <thead>
                                        <tr>
                                             <th>Institution</th>
                                             <th>Location</th>
                                             <th>Administrator</th>
                                             <th>Subscription Tier</th>
                                             <th>Expires On</th>
                                             <th>Registered Date</th>
                                             <th>Actions</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {filteredInstitutions.map((inst) => (
                                             <tr key={inst.id}>
                                                  <td>
                                                       <div className="inst_page__name_cell">
                                                            <div className="inst_page__avatar">
                                                                 {inst.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="inst_page__name">{inst.name}</span>
                                                       </div>
                                                  </td>
                                                  <td>{inst.location}</td>
                                                  <td>
                                                       <div className="inst_page__admin_cell">
                                                            <span className="inst_page__admin_username">{inst.adminUsername || '—'}</span>
                                                            <span className="inst_page__admin_email">{inst.adminEmail || '—'}</span>
                                                       </div>
                                                  </td>
                                                  <td>
                                                       <span className={getTierBadgeClass(inst.tier)}>
                                                            {inst.tier}
                                                       </span>
                                                  </td>
                                                  <td className="inst_page__expiry_cell">
                                                       {inst.subscription_expires_at ? (
                                                            new Date(inst.subscription_expires_at).toLocaleDateString('en-IN', {
                                                                 day: 'numeric',
                                                                 month: 'short',
                                                                 year: 'numeric',
                                                            })
                                                       ) : (
                                                            <span className="inst_page__expired_badge">No active expiry</span>
                                                       )}
                                                  </td>
                                                  <td>
                                                       {new Date(inst.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                       })}
                                                  </td>
                                                  <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                             <button 
                                                                  className="inst_page__action_btn"
                                                                  onClick={() => handleOpenEditModal(inst)}
                                                                  title="Edit Details"
                                                                  style={{ borderColor: '#3b82f6', color: '#2563eb' }}
                                                             >
                                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inst_page__action_icon">
                                                                       <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                       <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                                                  </svg>
                                                                  <span>Edit</span>
                                                             </button>
                                                             <button 
                                                                  className="inst_page__action_btn"
                                                                  onClick={() => handleManageCategories(inst)}
                                                                  title="Manage Allowed Categories"
                                                             >
                                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inst_page__action_icon">
                                                                       <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                                                  </svg>
                                                                  <span>Categories</span>
                                                             </button>
                                                             <button 
                                                                  className="inst_page__action_btn inst_page__action_btn--delete"
                                                                  onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                                                                  title="Delete Institution"
                                                             >
                                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inst_page__action_icon">
                                                                       <polyline points="3 6 5 6 21 6"></polyline>
                                                                       <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                  </svg>
                                                                  <span>Delete</span>
                                                             </button>
                                                        </div>
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    )}
               </div>

               {showCategoryModal && selectedInst && (
                    <div className="inst_page__modal_overlay">
                         <div className="inst_page__modal">
                              <div className="inst_page__modal_header">
                                   <h3>Manage Allowed Categories</h3>
                                   <button className="inst_page__modal_close" onClick={() => setShowCategoryModal(false)}>
                                        &times;
                                   </button>
                              </div>
                              <div className="inst_page__modal_body">
                                   <p className="inst_page__modal_info">
                                        Select the book categories that <strong>{selectedInst.name}</strong> and its members are allowed to view. Leave all unchecked to allow all categories (default).
                                   </p>

                                   {modalError && <div className="inst_page__modal_error">{modalError}</div>}
                                   {modalSuccess && <div className="inst_page__modal_success">{modalSuccess}</div>}

                                   {categories.length === 0 ? (
                                        <div className="inst_page__modal_loading">
                                             <div className="inst_page__spinner"></div>
                                             <p>Loading categories...</p>
                                        </div>
                                   ) : (
                                        <div className="inst_page__categories_list">
                                             {categories.map((cat) => {
                                                  const isAllowed = isCategoryAllowed(cat.id);
                                                  const restriction = allowedRestrictions.find((r) => r.categoryId === cat.id);
                                                  const allowAll = restriction ? restriction.allowAllBooks : true;

                                                  return (
                                                       <div key={cat.id} className={`inst_page__category_card ${isAllowed ? 'inst_page__category_card--active' : ''}`}>
                                                            <div className="inst_page__category_header">
                                                                 <label className="inst_page__category_checkbox_label">
                                                                      <input
                                                                           type="checkbox"
                                                                           checked={isAllowed}
                                                                           onChange={() => handleToggleCategory(cat.id)}
                                                                      />
                                                                      <span className="inst_page__category_name_text">{cat.category_name}</span>
                                                                 </label>
                                                                 {isAllowed && (
                                                                      <select
                                                                           className="inst_page__access_select"
                                                                           value={allowAll ? 'all' : 'custom'}
                                                                           onChange={(e) => handleToggleAccessType(cat.id, e.target.value === 'all')}
                                                                      >
                                                                           <option value="all">Allow All Books</option>
                                                                           <option value="custom">Select Specific Books</option>
                                                                      </select>
                                                                 )}
                                                            </div>

                                                            {isAllowed && !allowAll && (
                                                                 <div className="inst_page__books_section">
                                                                      {books.filter((b) => b.category_ids?.includes(cat.id)).length === 0 ? (
                                                                           <p className="inst_page__no_books">No books uploaded in this category.</p>
                                                                      ) : (
                                                                           <div className="inst_page__books_sublist">
                                                                                {books
                                                                                     .filter((b) => b.category_ids?.includes(cat.id))
                                                                                     .map((book) => (
                                                                                          <label key={book.id} className="inst_page__book_item">
                                                                                               <input
                                                                                                    type="checkbox"
                                                                                                    checked={allowedBookIds.includes(book.id)}
                                                                                                    onChange={() => handleToggleBook(book.id)}
                                                                                               />
                                                                                               <div className="inst_page__book_details">
                                                                                                    <span className="inst_page__book_title">{book.title}</span>
                                                                                                    <span className="inst_page__book_author">by {book.author}</span>
                                                                                               </div>
                                                                                          </label>
                                                                                     ))}
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                            )}
                                                       </div>
                                                  );
                                             })}
                                        </div>
                                   )}
                              </div>
                              <div className="inst_page__modal_footer">
                                   <button 
                                        className="inst_page__btn inst_page__btn--secondary" 
                                        onClick={() => setShowCategoryModal(false)}
                                        disabled={savingCategories}
                                   >
                                        Cancel
                                   </button>
                                   <button 
                                        className="inst_page__btn inst_page__btn--primary" 
                                        onClick={handleSaveCategories}
                                        disabled={savingCategories}
                                   >
                                        {savingCategories ? 'Saving...' : 'Save Settings'}
                                   </button>
                              </div>
                         </div>
                    </div>
               )}

               {isEditModalOpen && editingInst && (
                    <div className="inst_page__modal_overlay">
                         <div className="inst_page__modal" style={{ maxWidth: '480px' }}>
                              <div className="inst_page__modal_header">
                                   <h3>Edit Institution Details</h3>
                                   <button className="inst_page__modal_close" onClick={() => setIsEditModalOpen(false)}>
                                        &times;
                                   </button>
                              </div>
                              <form onSubmit={handleSaveInstitutionDetails}>
                                   <div className="inst_page__modal_body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                             <label style={{ fontSize: '12px', fontWeight: 700, color: '#44403c' }}>Institution Name</label>
                                             <input
                                                  type="text"
                                                  value={editingInst.name}
                                                  disabled
                                                  style={{ padding: '10px 14px', border: '1px solid #d6d3d1', borderRadius: '8px', fontSize: '13px', background: '#f5f5f4', color: '#78716c', cursor: 'not-allowed' }}
                                             />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                             <label style={{ fontSize: '12px', fontWeight: 700, color: '#44403c' }}>Administrator Email Address *</label>
                                             <input
                                                  type="email"
                                                  value={editAdminEmail}
                                                  onChange={(e) => setEditAdminEmail(e.target.value)}
                                                  placeholder="e.g. admin@school.com"
                                                  required
                                                  style={{ padding: '10px 14px', border: '1px solid #d6d3d1', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                                             />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                             <label style={{ fontSize: '12px', fontWeight: 700, color: '#44403c' }}>Subscription Expiry Date</label>
                                             <input
                                                  type="date"
                                                  value={editExpiryDate}
                                                  onChange={(e) => setEditExpiryDate(e.target.value)}
                                                  style={{ padding: '10px 14px', border: '1px solid #d6d3d1', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                                             />
                                             <span style={{ fontSize: '11px', color: '#78716c' }}>Leave empty to remove any subscription expiry constraints.</span>
                                        </div>
                                   </div>
                                   <div className="inst_page__modal_footer" style={{ borderTop: '1px solid #e7e5e4', padding: '18px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button 
                                             type="button"
                                             className="inst_page__btn inst_page__btn--secondary" 
                                             onClick={() => setIsEditModalOpen(false)}
                                             disabled={savingDetails}
                                        >
                                             Cancel
                                        </button>
                                        <button 
                                             type="submit"
                                             className="inst_page__btn inst_page__btn--primary" 
                                             disabled={savingDetails}
                                        >
                                             {savingDetails ? 'Saving...' : 'Save Changes'}
                                        </button>
                                   </div>
                              </form>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default Institutions_Page;
