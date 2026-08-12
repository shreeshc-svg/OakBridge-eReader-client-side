import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { payments_api } from '../api/payments.api';
import Dashboard_Layout from '../../../layout/Dashboard_Layout';
import { dashboard_layout_data } from '../../../data';
import type { DashboardLayoutData } from '../../dashboard/types/dashboard.types';
import './Purchases_Page.scss';

interface PurchaseItem {
     title: string;
     author?: string;
}

interface PurchaseRecord {
     id: string;
     amount: number;
     status: string;
     tier: string | null;
     book_id: string | null;
     createdAt: string;
     invoice_key: string | null;
     razorpay_order_id: string;
     razorpay_payment_id: string | null;
     items: PurchaseItem[];
}

const Purchases_Page = () => {
     const navigate = useNavigate();
     const accessToken = useAuthStore((state) => state.accessToken);

     const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [downloadingId, setDownloadingId] = useState<string | null>(null);

     useEffect(() => {
          if (!accessToken) {
               navigate('/login', { replace: true });
          }
     }, [accessToken, navigate]);

     useEffect(() => {
          const fetchHistory = async () => {
               try {
                    setLoading(true);
                    setError('');
                    const data = await payments_api.getPaymentHistory();
                    setPurchases(data);
               } catch (err: any) {
                    console.error('Failed to load purchase history:', err);
                    setError('Failed to retrieve your order history. Please try again.');
               } finally {
                    setLoading(false);
               }
          };

          if (accessToken) {
               fetchHistory();
          }
     }, [accessToken]);

     const handleDownloadInvoice = async (paymentId: string) => {
          try {
               setDownloadingId(paymentId);
               const url = await payments_api.getInvoiceDownloadUrl(paymentId);
               if (url) {
                    window.open(url, '_blank');
               } else {
                    alert('Invoice download link is not available.');
               }
          } catch (err: any) {
               console.error('Invoice download error:', err);
               alert('Unable to generate invoice download link. Please try again.');
          } finally {
               setDownloadingId(null);
          }
     };

     const layoutData = dashboard_layout_data as DashboardLayoutData;

     return (
          <Dashboard_Layout data={layoutData} role="user">
               <div className="purchases_page">
                    <header className="purchases_page__header">
                         <h1 className="purchases_page__title">Order History & Invoices</h1>
                         <p className="purchases_page__subtitle">
                              View details of your past transactions and download official GST invoices.
                         </p>
                    </header>

                    {error && <div className="purchases_page__error">{error}</div>}

                    {loading ? (
                         <div className="purchases_page__loading">
                              <span className="purchases_page__spinner"></span>
                              <p>Loading your purchases...</p>
                         </div>
                    ) : purchases.length === 0 ? (
                         <div className="purchases_page__empty">
                              <div className="purchases_page__empty_icon">🧾</div>
                              <h3>No Orders Found</h3>
                              <p>You haven't purchased any e-books or subscriptions yet.</p>
                              <button
                                   className="purchases_page__shop_btn"
                                   onClick={() => navigate('/')}
                              >
                                   Go to Bookstore
                              </button>
                         </div>
                    ) : (
                         <div className="purchases_page__table_container">
                              <table className="purchases_page__table">
                                   <thead>
                                        <tr>
                                             <th>Date</th>
                                             <th>Order ID</th>
                                             <th>Items</th>
                                             <th>Amount</th>
                                             <th>Invoice</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {purchases.map((purchase) => {
                                             const formattedDate = new Date(purchase.createdAt).toLocaleDateString('en-GB', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                             });
                                             const displayAmount = `₹${(purchase.amount / 100).toFixed(2)}`;
                                             const itemsList = purchase.items.map((it) => it.title).join(', ');

                                             return (
                                                  <tr key={purchase.id}>
                                                       <td data-label="Date" className="purchases_page__td_date">
                                                            {formattedDate}
                                                       </td>
                                                       <td data-label="Order ID" className="purchases_page__td_order_id">
                                                            <code>{purchase.razorpay_order_id}</code>
                                                       </td>
                                                       <td data-label="Items" className="purchases_page__td_items">
                                                            {itemsList}
                                                       </td>
                                                       <td data-label="Amount" className="purchases_page__td_amount">
                                                            {displayAmount}
                                                       </td>
                                                       <td data-label="Invoice">
                                                            {purchase.invoice_key ? (
                                                                 <button
                                                                      type="button"
                                                                      className="purchases_page__download_btn"
                                                                      onClick={() => handleDownloadInvoice(purchase.id)}
                                                                      disabled={downloadingId === purchase.id}
                                                                 >
                                                                      {downloadingId === purchase.id ? (
                                                                           'Opening...'
                                                                      ) : (
                                                                           <>
                                                                                <svg
                                                                                     viewBox="0 0 24 24"
                                                                                     fill="none"
                                                                                     stroke="currentColor"
                                                                                     strokeWidth="2"
                                                                                     strokeLinecap="round"
                                                                                     strokeLinejoin="round"
                                                                                     width="14"
                                                                                     height="14"
                                                                                >
                                                                                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                                     <polyline points="7 10 12 15 17 10" />
                                                                                     <line x1="12" y1="15" x2="12" y2="3" />
                                                                                </svg>
                                                                                <span>Download Invoice</span>
                                                                           </>
                                                                      )}
                                                                 </button>
                                                            ) : (
                                                                 <span className="purchases_page__pending">Processing</span>
                                                            )}
                                                       </td>
                                                  </tr>
                                             );
                                        })}
                                   </tbody>
                              </table>
                         </div>
                    )}
               </div>
          </Dashboard_Layout>
     );
};

export default Purchases_Page;
