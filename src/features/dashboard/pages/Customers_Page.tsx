import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
     customers_api,
     type CustomerDetail,
     type CustomerOrder,
     type CustomerRow,
} from '../api/customers.api';
import { useBooks } from '../../books/hooks/use_books';
import { useDebounce } from '../../../hooks/use_debounce';
import './Customers_Page.scss';

const rupees = (paise: number) =>
     `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const when = (value?: string | null) =>
     value
          ? new Date(value).toLocaleString('en-IN', {
                 day: '2-digit',
                 month: 'short',
                 year: 'numeric',
                 hour: '2-digit',
                 minute: '2-digit',
            })
          : '—';

const Customers_Page = () => {
     const { books, fetchBooks } = useBooks();

     const [rows, setRows] = useState<CustomerRow[]>([]);
     const [total, setTotal] = useState(0);
     const [page, setPage] = useState(1);
     const [search, setSearch] = useState('');
     const debouncedSearch = useDebounce(search, 300);
     const [isLoading, setIsLoading] = useState(false);

     const [detail, setDetail] = useState<CustomerDetail | null>(null);
     const [detailLoading, setDetailLoading] = useState(false);
     const [editing, setEditing] = useState(false);
     const [form, setForm] = useState<Record<string, string>>({});
     const [grantBookId, setGrantBookId] = useState('');
     const [busy, setBusy] = useState(false);

     const limit = 25;
     const totalPages = Math.max(1, Math.ceil(total / limit));

     const load = useCallback(async () => {
          setIsLoading(true);
          try {
               const data = await customers_api.list({ page, limit, search: debouncedSearch });
               setRows(data.customers || []);
               setTotal(data.total || 0);
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to load customers');
          } finally {
               setIsLoading(false);
          }
     }, [page, debouncedSearch]);

     useEffect(() => {
          load();
     }, [load]);

     useEffect(() => {
          setPage(1);
     }, [debouncedSearch]);

     useEffect(() => {
          fetchBooks();
     }, [fetchBooks]);

     const openCustomer = async (id: string) => {
          setDetailLoading(true);
          setEditing(false);
          setGrantBookId('');
          try {
               const data = await customers_api.detail(id);
               setDetail(data);
               setForm({
                    username: data.customer.username || '',
                    email: data.customer.email || '',
                    billing_address_line1: data.customer.billing_address_line1 || '',
                    billing_address_line2: data.customer.billing_address_line2 || '',
                    billing_city: data.customer.billing_city || '',
                    billing_state: data.customer.billing_state || '',
                    billing_postal_code: data.customer.billing_postal_code || '',
                    billing_country: data.customer.billing_country || 'India',
               });
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to load customer');
          } finally {
               setDetailLoading(false);
          }
     };

     const saveCustomer = async () => {
          if (!detail) return;
          setBusy(true);
          try {
               const res = await customers_api.update(detail.customer.id, form);
               toast.success(res.message || 'Saved');
               setEditing(false);
               await openCustomer(detail.customer.id);
               await load();
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to save');
          } finally {
               setBusy(false);
          }
     };

     const removeCustomer = async (row: CustomerRow) => {
          const ok = window.confirm(
               `Delete ${row.username} (${row.email})?\n\nThis removes the account, its library, orders, invoices and reading history. The books themselves are not affected. This cannot be undone.`
          );
          if (!ok) return;

          setBusy(true);
          try {
               const res = await customers_api.remove(row.id);
               toast.success(res.message || 'Deleted');
               if (detail?.customer.id === row.id) setDetail(null);
               await load();
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to delete');
          } finally {
               setBusy(false);
          }
     };

     const grantBook = async () => {
          if (!detail || !grantBookId) return;
          setBusy(true);
          try {
               const res = await customers_api.grant_book(detail.customer.id, grantBookId);
               toast.success(res.message || 'Book issued');
               setGrantBookId('');
               await openCustomer(detail.customer.id);
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to issue the book');
          } finally {
               setBusy(false);
          }
     };

     const fulfilOrder = async (order: CustomerOrder) => {
          const ok = window.confirm(
               `Fulfil order ${order.razorpay_order_id}?\n\nOnly do this once you have confirmed in Razorpay that the amount was captured. The customer gets the book, an invoice and a receipt email.`
          );
          if (!ok) return;

          setBusy(true);
          try {
               const res = await customers_api.fulfil_order(order.id);
               toast.success(res.message || 'Order fulfilled');
               if (detail) await openCustomer(detail.customer.id);
               await load();
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to fulfil');
          } finally {
               setBusy(false);
          }
     };

     const runReconcile = async () => {
          setBusy(true);
          try {
               const res = await customers_api.reconcile();
               toast.success(res.message || 'Reconcile finished');
               await load();
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Reconcile failed');
          } finally {
               setBusy(false);
          }
     };

     const sellableBooks = useMemo(
          () => books.filter((b) => !b.set_parent_id),
          [books]
     );

     const unfulfilled = (detail?.orders || []).filter((o) => o.status !== 'completed');

     return (
          <div className="cust_page">
               <div className="cust_page__header">
                    <div>
                         <h1 className="cust_page__title">Customers</h1>
                         <p className="cust_page__subtitle">
                              Accounts, their orders and what they own. Issue a book directly
                              when a payment was captured but never registered.
                         </p>
                    </div>
                    <button
                         type="button"
                         className="cust_page__reconcile_btn"
                         onClick={runReconcile}
                         disabled={busy}
                    >
                         Check Razorpay for unregistered payments
                    </button>
               </div>

               <div className="cust_page__toolbar">
                    <input
                         type="text"
                         className="cust_page__search"
                         placeholder="Search by name or email..."
                         value={search}
                         onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="cust_page__count">{total} customer(s)</span>
               </div>

               <div className="cust_page__table_wrap">
                    <table className="cust_page__table">
                         <thead>
                              <tr>
                                   <th>Customer</th>
                                   <th>Email</th>
                                   <th>Orders</th>
                                   <th>Spent</th>
                                   <th>Books</th>
                                   <th>Last order</th>
                                   <th />
                              </tr>
                         </thead>
                         <tbody>
                              {isLoading ? (
                                   <tr>
                                        <td colSpan={7} className="cust_page__empty_cell">
                                             Loading...
                                        </td>
                                   </tr>
                              ) : rows.length === 0 ? (
                                   <tr>
                                        <td colSpan={7} className="cust_page__empty_cell">
                                             No customers found.
                                        </td>
                                   </tr>
                              ) : (
                                   rows.map((row) => (
                                        <tr key={row.id}>
                                             <td>
                                                  <button
                                                       type="button"
                                                       className="cust_page__link"
                                                       onClick={() => openCustomer(row.id)}
                                                  >
                                                       {row.username || '—'}
                                                  </button>
                                                  {row.is_free_candidate && (
                                                       <span className="cust_page__tag">free</span>
                                                  )}
                                             </td>
                                             <td>{row.email}</td>
                                             <td>{row.orders}</td>
                                             <td>{rupees(Number(row.spent_paise))}</td>
                                             <td>{row.books}</td>
                                             <td>{when(row.last_order_at)}</td>
                                             <td className="cust_page__row_actions">
                                                  <button
                                                       type="button"
                                                       className="cust_page__action"
                                                       onClick={() => openCustomer(row.id)}
                                                  >
                                                       View
                                                  </button>
                                                  <button
                                                       type="button"
                                                       className="cust_page__action cust_page__action--danger"
                                                       onClick={() => removeCustomer(row)}
                                                       disabled={busy}
                                                  >
                                                       Delete
                                                  </button>
                                             </td>
                                        </tr>
                                   ))
                              )}
                         </tbody>
                    </table>
               </div>

               {totalPages > 1 && (
                    <div className="cust_page__pager">
                         <button
                              type="button"
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                              disabled={page === 1}
                         >
                              Previous
                         </button>
                         <span>
                              Page {page} of {totalPages}
                         </span>
                         <button
                              type="button"
                              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                              disabled={page === totalPages}
                         >
                              Next
                         </button>
                    </div>
               )}

               {(detail || detailLoading) && (
                    <div className="cust_page__drawer_backdrop" onClick={() => setDetail(null)}>
                         <aside
                              className="cust_page__drawer"
                              onClick={(e) => e.stopPropagation()}
                         >
                              {detailLoading || !detail ? (
                                   <div className="cust_page__drawer_loading">Loading...</div>
                              ) : (
                                   <>
                                        <div className="cust_page__drawer_head">
                                             <div>
                                                  <h2>{detail.customer.username}</h2>
                                                  <p>{detail.customer.email}</p>
                                             </div>
                                             <button
                                                  type="button"
                                                  className="cust_page__drawer_close"
                                                  onClick={() => setDetail(null)}
                                             >
                                                  ×
                                             </button>
                                        </div>

                                        {unfulfilled.length > 0 && (
                                             <div className="cust_page__alert">
                                                  {unfulfilled.length} order(s) never completed. If
                                                  Razorpay shows the amount as captured, fulfil it
                                                  below.
                                             </div>
                                        )}

                                        <section className="cust_page__section">
                                             <div className="cust_page__section_head">
                                                  <h3>Details</h3>
                                                  <button
                                                       type="button"
                                                       className="cust_page__action"
                                                       onClick={() => setEditing((v) => !v)}
                                                  >
                                                       {editing ? 'Cancel' : 'Edit'}
                                                  </button>
                                             </div>

                                             {editing ? (
                                                  <div className="cust_page__form">
                                                       {[
                                                            ['username', 'Name'],
                                                            ['email', 'Email'],
                                                            ['billing_address_line1', 'Address line 1'],
                                                            ['billing_address_line2', 'Address line 2'],
                                                            ['billing_city', 'City'],
                                                            ['billing_state', 'State'],
                                                            ['billing_postal_code', 'PIN code'],
                                                            ['billing_country', 'Country'],
                                                       ].map(([key, label]) => (
                                                            <label key={key}>
                                                                 <span>{label}</span>
                                                                 <input
                                                                      type="text"
                                                                      value={form[key] || ''}
                                                                      onChange={(e) =>
                                                                           setForm((f) => ({
                                                                                ...f,
                                                                                [key]: e.target.value,
                                                                           }))
                                                                      }
                                                                 />
                                                            </label>
                                                       ))}
                                                       <button
                                                            type="button"
                                                            className="cust_page__save"
                                                            onClick={saveCustomer}
                                                            disabled={busy}
                                                       >
                                                            Save changes
                                                       </button>
                                                  </div>
                                             ) : (
                                                  <dl className="cust_page__facts">
                                                       <dt>Joined</dt>
                                                       <dd>{when(detail.customer.createdAt)}</dd>
                                                       <dt>Role</dt>
                                                       <dd>{detail.customer.role}</dd>
                                                       <dt>Billing address</dt>
                                                       <dd>
                                                            {[
                                                                 detail.customer.billing_address_line1,
                                                                 detail.customer.billing_address_line2,
                                                                 detail.customer.billing_city,
                                                                 detail.customer.billing_state,
                                                                 detail.customer.billing_postal_code,
                                                                 detail.customer.billing_country,
                                                            ]
                                                                 .filter(Boolean)
                                                                 .join(', ') || '— not provided —'}
                                                       </dd>
                                                  </dl>
                                             )}
                                        </section>

                                        <section className="cust_page__section">
                                             <h3>Issue a book</h3>
                                             <div className="cust_page__grant">
                                                  <select
                                                       value={grantBookId}
                                                       onChange={(e) => setGrantBookId(e.target.value)}
                                                  >
                                                       <option value="">Choose a book...</option>
                                                       {sellableBooks.map((b) => (
                                                            <option key={b.id} value={b.id}>
                                                                 {b.title}
                                                            </option>
                                                       ))}
                                                  </select>
                                                  <button
                                                       type="button"
                                                       onClick={grantBook}
                                                       disabled={!grantBookId || busy}
                                                  >
                                                       Issue
                                                  </button>
                                             </div>
                                        </section>

                                        <section className="cust_page__section">
                                             <h3>Orders ({detail.orders.length})</h3>
                                             {detail.orders.length === 0 ? (
                                                  <p className="cust_page__muted">No orders yet.</p>
                                             ) : (
                                                  <ul className="cust_page__orders">
                                                       {detail.orders.map((o) => (
                                                            <li key={o.id}>
                                                                 <div className="cust_page__order_top">
                                                                      <strong>
                                                                           {o.items || o.tier || 'Purchase'}
                                                                      </strong>
                                                                      <span
                                                                           className={`cust_page__status cust_page__status--${o.status}`}
                                                                      >
                                                                           {o.status}
                                                                      </span>
                                                                 </div>
                                                                 <div className="cust_page__order_meta">
                                                                      {rupees(o.amount)} · {when(o.created_at)}
                                                                      <br />
                                                                      {o.razorpay_order_id}
                                                                      {o.razorpay_payment_id
                                                                           ? ` · ${o.razorpay_payment_id}`
                                                                           : ''}
                                                                 </div>
                                                                 {(o.billing_address || o.shipping_address) && (
                                                                      <div className="cust_page__order_addr">
                                                                           {o.billing_address || o.shipping_address}
                                                                      </div>
                                                                 )}
                                                                 {o.status !== 'completed' && (
                                                                      <button
                                                                           type="button"
                                                                           className="cust_page__action"
                                                                           onClick={() => fulfilOrder(o)}
                                                                           disabled={busy}
                                                                      >
                                                                           Fulfil this order
                                                                      </button>
                                                                 )}
                                                            </li>
                                                       ))}
                                                  </ul>
                                             )}
                                        </section>

                                        <section className="cust_page__section">
                                             <h3>Library ({detail.library.length})</h3>
                                             {detail.library.length === 0 ? (
                                                  <p className="cust_page__muted">Nothing on the shelf.</p>
                                             ) : (
                                                  <ul className="cust_page__library">
                                                       {detail.library.map((item) => (
                                                            <li key={item.book_id}>
                                                                 <span>{item.title}</span>
                                                                 <small>
                                                                      {item.shelf_name} · {when(item.added_at)}
                                                                 </small>
                                                            </li>
                                                       ))}
                                                  </ul>
                                             )}
                                        </section>
                                   </>
                              )}
                         </aside>
                    </div>
               )}
          </div>
     );
};

export default Customers_Page;
