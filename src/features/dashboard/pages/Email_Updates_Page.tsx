import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Confirm_Modal from '../../../components/common/confirm_modal/Confirm_Modal';
import { useDebounce } from '../../../hooks/use_debounce';
import {
     mailing_api,
     type Audience,
     type AudienceType,
     type AutomaticEmails,
     type MailingOverview,
     type MailingUser,
} from '../api/mailing.api';
import './Email_Updates_Page.scss';

type BookFilter = 'pending' | 'all';

const formatPrice = (paise: number) =>
     paise > 0 ? `₹${(paise / 100).toLocaleString('en-IN')}` : 'Free';

const formatDate = (value: string) =>
     new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const errorMessage = (err: any, fallback: string) =>
     err?.response?.data?.message || fallback;

const Email_Updates_Page = () => {
     const [overview, setOverview] = useState<MailingOverview | null>(null);
     const [loading, setLoading] = useState(true);
     const [loadError, setLoadError] = useState('');

     // Automatic emails
     const [savingAutomatic, setSavingAutomatic] = useState<keyof AutomaticEmails | null>(null);

     // Step 1: books
     const [bookFilter, setBookFilter] = useState<BookFilter>('pending');
     const [bookSearch, setBookSearch] = useState('');
     const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

     // Step 2: audience
     const [audienceType, setAudienceType] = useState<AudienceType>('all_readers');
     const [institutionId, setInstitutionId] = useState('');
     const [selectedUsers, setSelectedUsers] = useState<MailingUser[]>([]);
     const [userSearch, setUserSearch] = useState('');
     const debouncedUserSearch = useDebounce(userSearch, 300);
     const [userResults, setUserResults] = useState<MailingUser[]>([]);
     const [searchingUsers, setSearchingUsers] = useState(false);
     const [pastedEmails, setPastedEmails] = useState('');
     const [notFoundEmails, setNotFoundEmails] = useState<string[]>([]);
     const [matchingEmails, setMatchingEmails] = useState(false);

     // Step 3: message
     const [subject, setSubject] = useState('');
     const [message, setMessage] = useState('');

     // Preview + send
     const [preview, setPreview] = useState<{ recipients: number; unsubscribed_skipped: number } | null>(null);
     const [previewError, setPreviewError] = useState('');
     const [confirmOpen, setConfirmOpen] = useState(false);
     const [sending, setSending] = useState(false);

     const loadOverview = useCallback(async () => {
          try {
               setLoadError('');
               const data = await mailing_api.get_overview();
               setOverview(data);
          } catch (err: any) {
               setLoadError(errorMessage(err, 'Failed to load email settings'));
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          loadOverview();
     }, [loadOverview]);

     const maxBooks = overview?.max_books_per_email ?? 50;

     // ── Books ──────────────────────────────────────────────────────────────
     const pendingCount = useMemo(
          () => (overview?.books || []).filter((b) => !b.announced_at).length,
          [overview]
     );

     const visibleBooks = useMemo(() => {
          const term = bookSearch.trim().toLowerCase();
          return (overview?.books || []).filter((b) => {
               if (bookFilter === 'pending' && b.announced_at) return false;
               if (!term) return true;
               return (
                    b.title.toLowerCase().includes(term) ||
                    (b.author || '').toLowerCase().includes(term) ||
                    (b.isbn || '').includes(term)
               );
          });
     }, [overview, bookFilter, bookSearch]);

     const toggleBook = (id: string) => {
          if (selectedBookIds.includes(id)) {
               setSelectedBookIds(selectedBookIds.filter((x) => x !== id));
               return;
          }
          if (selectedBookIds.length >= maxBooks) {
               toast.error(`You can include up to ${maxBooks} books in one email`);
               return;
          }
          setSelectedBookIds([...selectedBookIds, id]);
     };

     const allVisibleSelected =
          visibleBooks.length > 0 && visibleBooks.every((b) => selectedBookIds.includes(b.id));

     const toggleAllVisible = () => {
          if (allVisibleSelected) {
               const visibleIds = new Set(visibleBooks.map((b) => b.id));
               setSelectedBookIds(selectedBookIds.filter((id) => !visibleIds.has(id)));
               return;
          }
          const next = [...selectedBookIds];
          for (const b of visibleBooks) {
               if (next.length >= maxBooks) break;
               if (!next.includes(b.id)) next.push(b.id);
          }
          if (visibleBooks.some((b) => !next.includes(b.id))) {
               toast(`Only the first ${maxBooks} books were selected`);
          }
          setSelectedBookIds(next);
     };

     // ── Audience ───────────────────────────────────────────────────────────
     const audience: Audience | null = useMemo(() => {
          if (audienceType === 'institution') {
               return institutionId ? { type: 'institution', institution_id: institutionId } : null;
          }
          if (audienceType === 'selected') {
               return selectedUsers.length > 0
                    ? { type: 'selected', user_ids: selectedUsers.map((u) => u.id) }
                    : null;
          }
          return { type: audienceType };
     }, [audienceType, institutionId, selectedUsers]);

     useEffect(() => {
          if (audienceType !== 'selected') return;
          let cancelled = false;
          setSearchingUsers(true);
          mailing_api
               .search_users(debouncedUserSearch)
               .then((users) => {
                    if (!cancelled) setUserResults(users);
               })
               .catch(() => {
                    if (!cancelled) setUserResults([]);
               })
               .finally(() => {
                    if (!cancelled) setSearchingUsers(false);
               });
          return () => {
               cancelled = true;
          };
     }, [audienceType, debouncedUserSearch]);

     useEffect(() => {
          setPreview(null);
          setPreviewError('');
          if (!audience) return;
          let cancelled = false;
          const timer = setTimeout(() => {
               mailing_api
                    .preview_audience(audience)
                    .then((data) => {
                         if (!cancelled) setPreview(data);
                    })
                    .catch((err) => {
                         if (!cancelled) setPreviewError(errorMessage(err, 'Could not count recipients'));
                    });
          }, 250);
          return () => {
               cancelled = true;
               clearTimeout(timer);
          };
     }, [audience]);

     const addUser = (user: MailingUser) => {
          if (!user.marketing_emails) return;
          setSelectedUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
     };

     const removeUser = (id: string) => {
          setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
     };

     const handleAddPastedEmails = async () => {
          const emails = pastedEmails
               .split(/[\s,;]+/)
               .map((e) => e.trim())
               .filter(Boolean);
          if (emails.length === 0) return;
          setMatchingEmails(true);
          try {
               const { matched, not_found } = await mailing_api.match_emails(emails);
               const subscribed = matched.filter((u) => u.marketing_emails);
               const unsubscribed = matched.length - subscribed.length;
               setSelectedUsers((prev) => {
                    const ids = new Set(prev.map((u) => u.id));
                    return [...prev, ...subscribed.filter((u) => !ids.has(u.id))];
               });
               setNotFoundEmails(not_found);
               setPastedEmails('');
               toast.success(
                    `Added ${subscribed.length} user(s)` +
                         (unsubscribed ? `, skipped ${unsubscribed} unsubscribed` : '') +
                         (not_found.length ? `, ${not_found.length} not registered` : '')
               );
          } catch (err: any) {
               toast.error(errorMessage(err, 'Could not look up those emails'));
          } finally {
               setMatchingEmails(false);
          }
     };

     // ── Automatic emails ───────────────────────────────────────────────────
     const handleToggleAutomatic = async (key: keyof AutomaticEmails, value: boolean) => {
          setSavingAutomatic(key);
          try {
               const automatic = await mailing_api.update_automatic({ [key]: value });
               setOverview((prev) => (prev ? { ...prev, automatic } : prev));
               toast.success(value ? 'Emails switched on' : 'Emails switched off');
          } catch (err: any) {
               toast.error(errorMessage(err, 'Failed to update setting'));
          } finally {
               setSavingAutomatic(null);
          }
     };

     // ── Send ───────────────────────────────────────────────────────────────
     const canSend =
          selectedBookIds.length > 0 && !!audience && !!preview && preview.recipients > 0 && !sending;

     const handleSend = async () => {
          if (!audience) return;
          setSending(true);
          try {
               const result = await mailing_api.announce({
                    book_ids: selectedBookIds,
                    audience,
                    subject: subject.trim() || undefined,
                    message: message.trim() || undefined,
               });
               toast.success(
                    `Sending 1 email about ${result.books} book(s) to ${result.recipients} people`
               );
               setConfirmOpen(false);
               setSelectedBookIds([]);
               setSubject('');
               setMessage('');
               await loadOverview();
          } catch (err: any) {
               toast.error(errorMessage(err, 'Failed to send'));
          } finally {
               setSending(false);
          }
     };

     if (loading) {
          return <div className="email_page__loading">Loading email settings...</div>;
     }

     if (!overview) {
          return <div className="email_page__error">{loadError || 'Failed to load email settings'}</div>;
     }

     const counts = overview.audience_counts;
     const audienceOptions: { type: AudienceType; label: string; hint: string }[] = [
          { type: 'all_readers', label: 'All readers', hint: `${counts.all_readers} people` },
          { type: 'individual_readers', label: 'Individual readers only', hint: `${counts.individual_readers} people` },
          { type: 'institution_users', label: 'All institution users', hint: `${counts.institution_users} people` },
          { type: 'institution', label: 'One institution', hint: 'Choose below' },
          { type: 'selected', label: 'Specific users', hint: 'Search or paste emails' },
     ];

     const confirmText = preview
          ? `Send one email about ${selectedBookIds.length} book(s) to ${preview.recipients} people? This can't be undone.`
          : '';

     return (
          <div className="email_page">
               {loadError && <div className="email_page__error">{loadError}</div>}

               {/* ── Automatic emails ─────────────────────────────────────── */}
               <section className="email_page__card">
                    <h2 className="email_page__card_title">Automatic emails</h2>
                    <p className="email_page__card_desc">
                         Uploading books never emails anyone. Login codes, password resets and purchase receipts are always sent.
                    </p>

                    <div className="email_page__toggle_row">
                         <div>
                              <h3 className="email_page__toggle_label">Inactivity reminders</h3>
                              <p className="email_page__toggle_desc">Daily at 9am, to readers who haven't opened a book on their shelf for 6 months.</p>
                         </div>
                         <label className="email_toggle">
                              <input
                                   type="checkbox"
                                   checked={overview.automatic.inactivity_reminders}
                                   disabled={savingAutomatic !== null}
                                   onChange={(e) => handleToggleAutomatic('inactivity_reminders', e.target.checked)}
                              />
                              <span className="email_toggle__slider" />
                         </label>
                    </div>

                    <div className="email_page__toggle_row">
                         <div>
                              <h3 className="email_page__toggle_label">Abandoned cart reminders</h3>
                              <p className="email_page__toggle_desc">Daily at 10am, to readers who left books in their cart (after 12 hours, 1 week and 1 month). In-app notifications are still shown.</p>
                         </div>
                         <label className="email_toggle">
                              <input
                                   type="checkbox"
                                   checked={overview.automatic.cart_reminders}
                                   disabled={savingAutomatic !== null}
                                   onChange={(e) => handleToggleAutomatic('cart_reminders', e.target.checked)}
                              />
                              <span className="email_toggle__slider" />
                         </label>
                    </div>

                    <p className="email_page__note">
                         {counts.unsubscribed} user(s) have unsubscribed and never receive these emails or announcements.
                    </p>
               </section>

               {/* ── Announce books ───────────────────────────────────────── */}
               <section className="email_page__card">
                    <h2 className="email_page__card_title">Announce new books</h2>
                    <p className="email_page__card_desc">
                         Pick the books, pick who gets it, and everyone receives one email listing all the chosen books.
                    </p>

                    {/* Step 1 */}
                    <div className="email_page__step">
                         <div className="email_page__step_head">
                              <span className="email_page__step_num">1</span>
                              <h3>Choose books</h3>
                              <span className="email_page__step_meta">
                                   {selectedBookIds.length} selected (max {maxBooks})
                              </span>
                         </div>

                         <div className="email_page__book_tools">
                              <div className="email_page__chips">
                                   <button
                                        type="button"
                                        className={`email_page__chip ${bookFilter === 'pending' ? 'is-active' : ''}`}
                                        onClick={() => setBookFilter('pending')}
                                   >
                                        Not announced ({pendingCount})
                                   </button>
                                   <button
                                        type="button"
                                        className={`email_page__chip ${bookFilter === 'all' ? 'is-active' : ''}`}
                                        onClick={() => setBookFilter('all')}
                                   >
                                        All books ({overview.books.length})
                                   </button>
                              </div>
                              <input
                                   className="email_page__input email_page__book_search"
                                   placeholder="Search title, author or ISBN"
                                   value={bookSearch}
                                   onChange={(e) => setBookSearch(e.target.value)}
                              />
                         </div>

                         {visibleBooks.length === 0 ? (
                              <div className="email_page__empty">
                                   {bookFilter === 'pending'
                                        ? 'No new books waiting to be announced. Switch to "All books" to announce an older title.'
                                        : 'No books match your search.'}
                              </div>
                         ) : (
                              <div className="email_page__book_list">
                                   <label className="email_page__book_row email_page__book_row--head">
                                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                                        <span>Select all shown ({visibleBooks.length})</span>
                                   </label>
                                   {visibleBooks.map((book) => (
                                        <label key={book.id} className="email_page__book_row">
                                             <input
                                                  type="checkbox"
                                                  checked={selectedBookIds.includes(book.id)}
                                                  onChange={() => toggleBook(book.id)}
                                             />
                                             {book.cover_image_url ? (
                                                  <img className="email_page__cover" src={book.cover_image_url} alt="" loading="lazy" />
                                             ) : (
                                                  <span className="email_page__cover email_page__cover--empty" />
                                             )}
                                             <span className="email_page__book_info">
                                                  <span className="email_page__book_title">{book.title}</span>
                                                  <span className="email_page__book_meta">
                                                       {book.author} · {formatPrice(book.price)} · added {formatDate(book.created_at)}
                                                  </span>
                                             </span>
                                             <span className={`email_page__badge ${book.announced_at ? '' : 'email_page__badge--new'}`}>
                                                  {book.announced_at ? `Announced ${formatDate(book.announced_at)}` : 'Not announced'}
                                             </span>
                                        </label>
                                   ))}
                              </div>
                         )}
                    </div>

                    {/* Step 2 */}
                    <div className="email_page__step">
                         <div className="email_page__step_head">
                              <span className="email_page__step_num">2</span>
                              <h3>Choose who receives it</h3>
                         </div>

                         <div className="email_page__audience_grid">
                              {audienceOptions.map((opt) => (
                                   <label
                                        key={opt.type}
                                        className={`email_page__audience_option ${audienceType === opt.type ? 'is-active' : ''}`}
                                   >
                                        <input
                                             type="radio"
                                             name="audience"
                                             checked={audienceType === opt.type}
                                             onChange={() => setAudienceType(opt.type)}
                                        />
                                        <span className="email_page__audience_label">{opt.label}</span>
                                        <span className="email_page__audience_hint">{opt.hint}</span>
                                   </label>
                              ))}
                         </div>

                         {audienceType === 'institution' && (
                              <select
                                   className="email_page__input"
                                   value={institutionId}
                                   onChange={(e) => setInstitutionId(e.target.value)}
                              >
                                   <option value="">Select an institution</option>
                                   {overview.institutions.map((inst) => (
                                        <option key={inst.id} value={inst.id}>
                                             {inst.name} ({inst.members} people)
                                        </option>
                                   ))}
                              </select>
                         )}

                         {audienceType === 'selected' && (
                              <div className="email_page__users">
                                   <div className="email_page__users_col">
                                        <input
                                             className="email_page__input"
                                             placeholder="Search by name or email"
                                             value={userSearch}
                                             onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                        <div className="email_page__user_results">
                                             {searchingUsers && <div className="email_page__muted">Searching...</div>}
                                             {!searchingUsers && userResults.length === 0 && (
                                                  <div className="email_page__muted">No users found</div>
                                             )}
                                             {userResults.map((user) => {
                                                  const added = selectedUsers.some((u) => u.id === user.id);
                                                  return (
                                                       <button
                                                            key={user.id}
                                                            type="button"
                                                            className="email_page__user_row"
                                                            disabled={!user.marketing_emails || added}
                                                            onClick={() => addUser(user)}
                                                       >
                                                            <span>
                                                                 <strong>{user.username}</strong>
                                                                 <span className="email_page__muted"> {user.email}</span>
                                                            </span>
                                                            <span className="email_page__muted">
                                                                 {!user.marketing_emails ? 'Unsubscribed' : added ? 'Added' : '+ Add'}
                                                            </span>
                                                       </button>
                                                  );
                                             })}
                                        </div>

                                        <textarea
                                             className="email_page__input email_page__textarea"
                                             placeholder="Or paste emails (one per line, or separated by commas)"
                                             value={pastedEmails}
                                             onChange={(e) => setPastedEmails(e.target.value)}
                                             rows={3}
                                        />
                                        <button
                                             type="button"
                                             className="email_page__btn email_page__btn--ghost"
                                             disabled={matchingEmails || !pastedEmails.trim()}
                                             onClick={handleAddPastedEmails}
                                        >
                                             {matchingEmails ? 'Checking...' : 'Add pasted emails'}
                                        </button>
                                        {notFoundEmails.length > 0 && (
                                             <p className="email_page__warn">
                                                  Not registered on the platform: {notFoundEmails.join(', ')}
                                             </p>
                                        )}
                                   </div>

                                   <div className="email_page__users_col">
                                        <div className="email_page__selected_head">
                                             <span>Selected ({selectedUsers.length})</span>
                                             {selectedUsers.length > 0 && (
                                                  <button type="button" className="email_page__link" onClick={() => setSelectedUsers([])}>
                                                       Clear
                                                  </button>
                                             )}
                                        </div>
                                        <div className="email_page__selected_list">
                                             {selectedUsers.length === 0 && (
                                                  <div className="email_page__muted">No users selected yet</div>
                                             )}
                                             {selectedUsers.map((user) => (
                                                  <span key={user.id} className="email_page__user_chip">
                                                       {user.email}
                                                       <button type="button" aria-label={`Remove ${user.email}`} onClick={() => removeUser(user.id)}>
                                                            &times;
                                                       </button>
                                                  </span>
                                             ))}
                                        </div>
                                   </div>
                              </div>
                         )}
                    </div>

                    {/* Step 3 */}
                    <div className="email_page__step">
                         <div className="email_page__step_head">
                              <span className="email_page__step_num">3</span>
                              <h3>Message (optional)</h3>
                         </div>
                         <input
                              className="email_page__input"
                              placeholder={
                                   selectedBookIds.length === 1
                                        ? 'Subject: New Release: "<title>" by <author>'
                                        : `Subject: ${selectedBookIds.length || 'N'} new books on Oakbridge`
                              }
                              value={subject}
                              maxLength={200}
                              onChange={(e) => setSubject(e.target.value)}
                         />
                         <textarea
                              className="email_page__input email_page__textarea"
                              placeholder="Intro line shown above the books (leave empty for the default)"
                              value={message}
                              maxLength={2000}
                              rows={3}
                              onChange={(e) => setMessage(e.target.value)}
                         />
                    </div>

                    {/* Send */}
                    <div className="email_page__send_bar">
                         <div className="email_page__send_summary">
                              {previewError ? (
                                   <span className="email_page__warn">{previewError}</span>
                              ) : !audience ? (
                                   <span className="email_page__muted">Choose who receives it</span>
                              ) : !preview ? (
                                   <span className="email_page__muted">Counting recipients...</span>
                              ) : (
                                   <>
                                        <strong>{preview.recipients}</strong> people will get one email
                                        {selectedBookIds.length > 0 && <> about <strong>{selectedBookIds.length}</strong> book(s)</>}
                                        {preview.unsubscribed_skipped > 0 && (
                                             <span className="email_page__muted"> · {preview.unsubscribed_skipped} unsubscribed skipped</span>
                                        )}
                                   </>
                              )}
                         </div>
                         <button
                              type="button"
                              className="email_page__btn"
                              disabled={!canSend}
                              onClick={() => setConfirmOpen(true)}
                         >
                              Send email
                         </button>
                    </div>
               </section>

               <Confirm_Modal
                    isOpen={confirmOpen}
                    onClose={() => !sending && setConfirmOpen(false)}
                    onConfirm={handleSend}
                    title="Send book announcement"
                    message={confirmText}
                    confirmText="Send"
                    isProcessing={sending}
               />
          </div>
     );
};

export default Email_Updates_Page;
