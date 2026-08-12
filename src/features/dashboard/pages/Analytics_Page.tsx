import { useEffect, useState, useCallback } from 'react';
import { dashboard_api } from '../api/dashboard_api';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/skeleton/Skeleton';
import './Analytics_Page.scss';

interface RevenueData {
     totalRevenue: number;
     averageSpending: number;
     bestPerformingProduct: { name: string; count: number } | null;
     leastPerformingProduct: { name: string; count: number } | null;
     weeklyGrowthPercent: number;
     monthlyGrowthPercent: number;
     reviews: {
          total: number;
          approved: number;
          pending: number;
          rejected: number;
     };
}

interface ActivityLog {
     id: string;
     userId: string;
     email: string | null;
     action: string;
     details: any;
     createdAt: string;
}

interface PaginationInfo {
     page: number;
     limit: number;
     totalLogs: number;
     totalPages: number;
}

const RefreshIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
     </svg>
);

const Analytics_Page = () => {
     const [revenue, setRevenue] = useState<RevenueData | null>(null);
     const [logs, setLogs] = useState<ActivityLog[]>([]);
     const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, totalLogs: 0, totalPages: 1 });
     
     const [loadingRev, setLoadingRev] = useState(true);
     const [loadingLogs, setLoadingLogs] = useState(true);
     const [currentPage, setCurrentPage] = useState(1);
     const [timeframe, setTimeframe] = useState<string>('all');

     const fetchRevenue = useCallback(async () => {
          try {
               setLoadingRev(true);
               const res = await dashboard_api.get_revenue_analytics();
               setRevenue(res.data);
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to fetch revenue analytics');
          } finally {
               setLoadingRev(false);
          }
     }, []);

     const fetchLogs = useCallback(async (page: number, tf: string) => {
          try {
               setLoadingLogs(true);
               const res = await dashboard_api.get_activity_logs(page, 10, tf);
               setLogs(res.data.logs);
               setPagination(res.data.pagination);
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to fetch activity logs');
          } finally {
               setLoadingLogs(false);
          }
     }, []);

     useEffect(() => {
          fetchRevenue();
     }, [fetchRevenue]);

     useEffect(() => {
          fetchLogs(currentPage, timeframe);
     }, [fetchLogs, currentPage, timeframe]);

     const formatActionBadge = (action: string) => {
          const actionClass = `action-badge action-badge--${action.toLowerCase()}`;
          return <span className={actionClass}>{action}</span>;
     };

     const renderDetails = (details: any) => {
          if (!details) return '-';
          if (typeof details === 'string') return details;
          try {
               // Render key-value pairs in a readable way
               const keys = Object.keys(details);
               if (keys.length === 0) return '-';
               return (
                    <div className="log-details-grid">
                         {keys.map((k) => (
                              <div key={k} className="log-detail-item">
                                   <span className="log-detail-key">{k}:</span>
                                   <span className="log-detail-val">
                                        {typeof details[k] === 'object' ? JSON.stringify(details[k]) : String(details[k])}
                                   </span>
                              </div>
                         ))}
                    </div>
               );
          } catch {
               return JSON.stringify(details);
          }
     };

     return (
          <div className="analytics-page">
               {/* Page Header */}
               <div className="analytics-page__header">
                    <div className="analytics-page__title-group">
                         <h1>Analytics & Activity Logs</h1>
                         <p>Monitor platform financial metrics, export order reports, and track system operations.</p>
                    </div>
                    <div className="analytics-page__actions">
                         <button 
                              type="button" 
                              className="analytics-btn analytics-btn--secondary" 
                              onClick={() => { fetchRevenue(); fetchLogs(currentPage, timeframe); toast.success('Data refreshed'); }}
                              disabled={loadingRev || loadingLogs}
                         >
                              <RefreshIcon />
                              Refresh
                         </button>
                    </div>
               </div>

               {/* KPI Grid */}
               <div className="analytics-page__kpis">
                    {loadingRev ? (
                         <>
                              <Skeleton height="130px" borderRadius="16px" />
                              <Skeleton height="130px" borderRadius="16px" />
                              <Skeleton height="130px" borderRadius="16px" />
                              <Skeleton height="130px" borderRadius="16px" />
                         </>
                    ) : (
                         <>
                              <div className="kpi-card kpi-card--revenue">
                                   <div className="kpi-card__header">
                                        <span className="kpi-card__label">Total Revenue</span>
                                        <div className="kpi-card__icon">₹</div>
                                   </div>
                                   <strong className="kpi-card__value">
                                        ₹{(revenue?.totalRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </strong>
                                   <div className="kpi-card__trends">
                                        <div className={`trend-badge trend-badge--${(revenue?.weeklyGrowthPercent ?? 0) >= 0 ? 'up' : 'down'}`}>
                                             <span className="trend-badge__arrow">{(revenue?.weeklyGrowthPercent ?? 0) >= 0 ? '▲' : '▼'}</span>
                                             <span className="trend-badge__val">{Math.abs(revenue?.weeklyGrowthPercent ?? 0)}%</span>
                                             <span className="trend-badge__label">this week</span>
                                        </div>
                                        <div className={`trend-badge trend-badge--${(revenue?.monthlyGrowthPercent ?? 0) >= 0 ? 'up' : 'down'}`}>
                                             <span className="trend-badge__arrow">{(revenue?.monthlyGrowthPercent ?? 0) >= 0 ? '▲' : '▼'}</span>
                                             <span className="trend-badge__val">{Math.abs(revenue?.monthlyGrowthPercent ?? 0)}%</span>
                                             <span className="trend-badge__label">this month</span>
                                        </div>
                                   </div>
                                   <p className="kpi-card__subtext">Gross platform billing from orders</p>
                              </div>

                              <div className="kpi-card kpi-card--spend">
                                   <div className="kpi-card__header">
                                        <span className="kpi-card__label">Avg. User Spending</span>
                                        <div className="kpi-card__icon">📈</div>
                                   </div>
                                   <strong className="kpi-card__value">
                                        ₹{(revenue?.averageSpending ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </strong>
                                   <p className="kpi-card__subtext">Average spend per buyer account</p>
                              </div>

                              <div className="kpi-card kpi-card--best">
                                   <div className="kpi-card__header">
                                        <span className="kpi-card__label">Best Performing Book</span>
                                        <div className="kpi-card__icon">🏆</div>
                                   </div>
                                   {revenue?.bestPerformingProduct ? (
                                        <>
                                             <strong className="kpi-card__value title-truncate" title={revenue.bestPerformingProduct.name}>
                                                  {revenue.bestPerformingProduct.name}
                                             </strong>
                                             <p className="kpi-card__subtext">Most bought · <strong>{revenue.bestPerformingProduct.count}</strong> sales</p>
                                        </>
                                   ) : (
                                        <>
                                             <strong className="kpi-card__value">None</strong>
                                             <p className="kpi-card__subtext">No books purchased yet</p>
                                        </>
                                   )}
                              </div>

                              <div className="kpi-card kpi-card--least">
                                   <div className="kpi-card__header">
                                        <span className="kpi-card__label">Least Performing Book</span>
                                        <div className="kpi-card__icon">⚠️</div>
                                   </div>
                                   {revenue?.leastPerformingProduct ? (
                                        <>
                                             <strong className="kpi-card__value title-truncate" title={revenue.leastPerformingProduct.name}>
                                                  {revenue.leastPerformingProduct.name}
                                             </strong>
                                             <p className="kpi-card__subtext">Lowest sales · <strong>{revenue.leastPerformingProduct.count}</strong> sales</p>
                                        </>
                                   ) : (
                                        <>
                                             <strong className="kpi-card__value">None</strong>
                                             <p className="kpi-card__subtext">No books purchased yet</p>
                                        </>
                                   )}
                              </div>
                         </>
                    )}
               </div>

               

               {/* Activity Logs Table */}
               <div className="analytics-page__logs-section">
                    <div className="logs-header">
                         <div className="logs-header__title">
                              <h2>System Audit & Activity Logs</h2>
                              <p>Paginated view of registration, authorization, management, and transactions.</p>
                         </div>
                         <div className="timeframe-filters">
                              {[
                                   { value: 'all', label: 'All Time' },
                                   { value: 'day', label: 'Today' },
                                   { value: 'week', label: 'This Week' },
                                   { value: 'month', label: 'This Month' },
                              ].map((t) => (
                                   <button
                                        key={t.value}
                                        type="button"
                                        className={`timeframe-btn ${timeframe === t.value ? 'timeframe-btn--active' : ''}`}
                                        onClick={() => {
                                             setTimeframe(t.value);
                                             setCurrentPage(1);
                                        }}
                                   >
                                        {t.label}
                                   </button>
                              ))}
                         </div>
                    </div>

                    {loadingLogs ? (
                         <div className="logs-skeleton">
                              <Skeleton height="40px" style={{ marginBottom: 12 }} />
                              {[...Array(5)].map((_, i) => (
                                   <Skeleton key={i} height="60px" style={{ marginBottom: 8 }} />
                              ))}
                         </div>
                    ) : logs.length === 0 ? (
                         <div className="logs-empty">
                              <h3>No logs found</h3>
                              <p>System audit trail is currently empty.</p>
                         </div>
                    ) : (
                         <div className="logs-table-wrapper">
                              <table className="logs-table">
                                   <thead>
                                        <tr>
                                             <th>Timestamp</th>
                                             <th>User Email</th>
                                             <th>Action Type</th>
                                             <th>Meta Details</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {logs.map((log) => (
                                             <tr key={log.id}>
                                                  <td className="timestamp-cell">
                                                       {new Date(log.createdAt).toLocaleString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                       })}
                                                  </td>
                                                  <td className="email-cell" title={log.userId}>
                                                       {log.email || <span className="null-text">System / Guest</span>}
                                                  </td>
                                                  <td className="action-cell">
                                                       {formatActionBadge(log.action)}
                                                  </td>
                                                  <td className="details-cell">
                                                       {renderDetails(log.details)}
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                         <div className="logs-pagination">
                              <button
                                   type="button"
                                   className="pagination-btn"
                                   disabled={currentPage === 1 || loadingLogs}
                                   onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                              >
                                   &larr; Previous
                              </button>
                              <span className="pagination-info">
                                   Page <strong>{currentPage}</strong> of <strong>{pagination.totalPages}</strong>
                                   <span className="pagination-count">({pagination.totalLogs} records)</span>
                              </span>
                              <button
                                   type="button"
                                   className="pagination-btn"
                                   disabled={currentPage === pagination.totalPages || loadingLogs}
                                   onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                              >
                                   Next &rarr;
                              </button>
                         </div>
                    )}
               </div>
          </div>
     );
};

export default Analytics_Page;
