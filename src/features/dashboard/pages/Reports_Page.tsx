import { useEffect, useState, useCallback } from 'react';
import { dashboard_api } from '../api/dashboard_api';
import { apiClient } from '../../../config/axios.config';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/skeleton/Skeleton';
import './Reports_Page.scss';

interface Category {
     id: string;
     category_name: string;
     slug: string;
}

const REPORT_TYPES = [
     { id: 'sales', name: 'Sales Report', desc: 'Units sold and gross sales across a period' },
     { id: 'revenue', name: 'Revenue Report', desc: 'Financial breakdown — gross, discounts, tax, net, refunds' },
     { id: 'user-registration', name: 'User Registration', desc: 'New sign-ups over time' },
     { id: 'book-performance', name: 'Book Performance', desc: 'Per-title sales, revenue, rating and stock' },
     { id: 'institution-usage', name: 'Institution Usage', desc: 'Activity by institution / educator (desk copies, orders)' },
     { id: 'reviews-ratings', name: 'Reviews & Ratings', desc: 'Review volume, average rating and distribution' },
     { id: 'author-performance', name: 'Author Performance', desc: 'Per-author titles, units sold, revenue and rating' },
     { id: 'orders', name: 'Order Report', desc: 'Order-level list with status, payment and fulfilment' },
     { id: 'mother', name: 'Mother Report', desc: 'Comprehensive overview — all reports combined into one' }
];

// Sub-report keys used within the mother report (same order as REPORT_TYPES minus 'mother')
const MOTHER_SECTION_KEYS = [
     'sales', 'revenue', 'user-registration', 'book-performance',
     'institution-usage', 'reviews-ratings', 'author-performance', 'orders'
] as const;

export default function Reports_Page() {
     const [activeReport, setActiveReport] = useState('sales');
     const [categories, setCategories] = useState<Category[]>([]);
     const [loading, setLoading] = useState(false);
     const [reportData, setReportData] = useState<any>(null);

     // Filters State
     const [startDate, setStartDate] = useState('');
     const [endDate, setEndDate] = useState('');
     const [groupBy, setGroupBy] = useState('day');
     const [selectedCategory, setSelectedCategory] = useState('');
     const [sort, setSort] = useState('units');

     // Load Categories for filters
     useEffect(() => {
          const fetchCategories = async () => {
               try {
                    const response = await apiClient.get<{ categories: Category[] }>('/category/get-all-categories');
                    setCategories(response.data.categories || []);
               } catch (err) {
                    console.error('Failed to load categories', err);
               }
          };
          fetchCategories();
     }, []);

     // Fetch Report Data
     const runReport = useCallback(async () => {
          try {
               setLoading(true);
               const res = await dashboard_api.get_report_data({
                    type: activeReport,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    groupBy: groupBy,
                    category: selectedCategory || undefined,
                    sort: sort
               });
               setReportData(res.data);
          } catch (err: any) {
               toast.error(err.response?.data?.message || 'Failed to fetch report data');
          } finally {
               setLoading(false);
          }
     }, [activeReport, startDate, endDate, groupBy, selectedCategory, sort]);

     // Fetch when active report type changes
     useEffect(() => {
          // Reset relevant filters when changing reports
          let currentSort = sort;
          let currentGroupBy = groupBy;

          if (activeReport === 'mother') {
               currentGroupBy = 'month';
               setGroupBy('month');
          } else if (activeReport === 'revenue' && groupBy === 'day') {
               currentGroupBy = 'month';
               setGroupBy('month');
          } else if (activeReport === 'user-registration' && groupBy === 'day') {
               currentGroupBy = 'week';
               setGroupBy('week');
          } else if (activeReport === 'orders') {
               currentSort = 'all';
               setSort('all');
          } else if (['book-performance', 'author-performance'].includes(activeReport) && !['units', 'revenue', 'rating'].includes(sort)) {
               currentSort = 'units';
               setSort('units');
          }

          const fetchInitialData = async () => {
               try {
                    setLoading(true);
                    const res = await dashboard_api.get_report_data({
                         type: activeReport,
                         startDate: startDate || undefined,
                         endDate: endDate || undefined,
                         groupBy: currentGroupBy,
                         category: selectedCategory || undefined,
                         sort: currentSort
                    });
                    setReportData(res.data);
               } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to fetch report data');
               } finally {
                    setLoading(false);
               }
          };
          fetchInitialData();
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [activeReport]);

     // Robust helper formatters to prevent crash on undefined/null/non-number values
     const formatINR = (val: any) => {
          if (val === null || val === undefined) return '₹0';
          const num = Number(val);
          if (isNaN(num)) return '₹0';
          return `₹${num.toLocaleString('en-IN')}`;
     };

     const formatNegativeINR = (val: any) => {
          if (val === null || val === undefined) return '₹0';
          const num = Number(val);
          if (isNaN(num)) return '₹0';
          return `-₹${Math.abs(num).toLocaleString('en-IN')}`;
     };

     const formatRating = (val: any) => {
          if (val === null || val === undefined) return '0 ★';
          const num = Number(val);
          if (isNaN(num)) return '0 ★';
          return `${num.toFixed(1)} ★`;
     };

     // Helper for columns based on report type
     const getColumnsForType = (type: string) => {
          switch (type) {
               case 'sales':
                    return [
                         { key: 'period', label: 'Date/Period' },
                         { key: 'orders', label: 'Orders' },
                         { key: 'units', label: 'Units' },
                         { key: 'sales', label: 'Sales (₹)', format: formatINR },
                         { key: 'aov', label: 'AOV (₹)', format: formatINR },
                         { key: 'uniqueBuyers', label: 'Unique Buyers' }
                    ];
               case 'revenue':
                    return [
                         { key: 'period', label: 'Period' },
                         { key: 'gross', label: 'Gross (₹)', format: formatINR },
                         { key: 'discounts', label: 'Discounts (₹)', format: formatNegativeINR },
                         { key: 'shipping', label: 'Shipping (₹)', format: formatINR },
                         { key: 'gst', label: 'GST (₹)', format: formatINR },
                         { key: 'refunds', label: 'Refunds (₹)', format: formatNegativeINR },
                         { key: 'net', label: 'Net (₹)', format: formatINR }
                    ];
               case 'user-registration':
                    return [
                         { key: 'period', label: 'Period' },
                         { key: 'newUsers', label: 'New Users' },
                         { key: 'cumulative', label: 'Cumulative' }
                    ];
               case 'book-performance':
                    return [
                         { key: 'title', label: 'Title' },
                         { key: 'isbn', label: 'ISBN' },
                         { key: 'category', label: 'Category' },
                         { key: 'units', label: 'Units' },
                         { key: 'revenue', label: 'Revenue (₹)', format: formatINR },
                         { key: 'avgRating', label: 'Avg Rating', format: formatRating },
                         { key: 'reviews', label: 'Reviews' }
                    ];
               case 'institution-usage':
                    return [
                         { key: 'institution', label: 'Institution' },
                         { key: 'educatorRequests', label: 'Educator Requests' },
                         { key: 'deskCopies', label: 'Desk Copies' },
                         { key: 'orders', label: 'Orders' },
                         { key: 'titles', label: 'Titles' }
                    ];
               case 'reviews-ratings':
                    return [
                         { key: 'book', label: 'Book' },
                         { key: 'reviews', label: 'Reviews' },
                         { key: 'avgRating', label: 'Avg Rating', format: formatRating },
                         { key: 'star5', label: '5★' },
                         { key: 'star4', label: '4★' },
                         { key: 'star3', label: '3★' },
                         { key: 'star2', label: '2★' },
                         { key: 'star1', label: '1★' }
                    ];
               case 'author-performance':
                    return [
                         { key: 'author', label: 'Author' },
                         { key: 'titles', label: 'Titles' },
                         { key: 'unitsSold', label: 'Units Sold' },
                         { key: 'revenue', label: 'Revenue (₹)', format: formatINR },
                         { key: 'avgRating', label: 'Avg Rating', format: formatRating },
                         { key: 'reviews', label: 'Reviews' }
                    ];
               case 'orders':
                    return [
                         { key: 'orderId', label: 'Order #' },
                         { key: 'date', label: 'Date' },
                         { key: 'customer', label: 'Customer' },
                         { key: 'items', label: 'Items' },
                         { key: 'total', label: 'Total (₹)', format: formatINR },
                         { key: 'payment', label: 'Payment' },
                         { key: 'status', label: 'Status' }
                    ];
               default:
                    return [];
          }
     };

     // Active report columns (for non-mother reports)
     const getReportColumns = () => getColumnsForType(activeReport);

     // Helper for formatting KPI keys to friendly names
     const formatKpiKey = (key: string) => {
          switch (key) {
               case 'orders': return 'Orders';
               case 'unitsSold': return 'Units Sold';
               case 'grossSales': return 'Gross Sales';
               case 'avgOrderValue': return 'Avg Order Value';
               case 'grossSubtotal': return 'Gross (subtotal)';
               case 'discounts': return 'Discounts';
               case 'gstCollected': return 'GST Collected';
               case 'netRevenue': return 'Net Revenue';
               case 'newUsers': return 'New Users';
               case 'verified': return 'Verified';
               case 'unverified': return 'Unverified';
               case 'verificationRate': return 'Verification Rate';
               case 'titlesSold': return 'Titles Sold';
               case 'topSeller': return 'Top Seller';
               case 'bestRated': return 'Best Rated';
               case 'institutions': return 'Institutions';
               case 'deskCopies': return 'Desk-copy requests';
               case 'institutionalOrders': return 'Institutional orders';
               case 'titlesRequested': return 'Titles requested';
               case 'reviews': return 'Reviews';
               case 'avgRating': return 'Avg Rating';
               case 'star5Share': return '5-star share';
               case 'flagged': return 'Flagged';
               case 'authors': return 'Authors';
               case 'topAuthor': return 'Top Author';
               case 'unitsTop': return 'Units (top)';
               case 'avgRatingTop': return 'Avg rating (top)';
               case 'paid': return 'Paid';
               case 'failed': return 'Failed';
               case 'cancelled': return 'Cancelled';
               default:
                    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          }
     };

     // Export to CSV — Option A: single file with separator rows between sections
     const handleExportCSV = () => {
          if (!reportData) {
               toast.error('No data available for export');
               return;
          }

          let csvLines: string[] = [];

          if (activeReport === 'mother' && reportData.sections) {
               // Mother Report: iterate through all sections
               const sectionNames: Record<string, string> = {};
               REPORT_TYPES.forEach(r => { sectionNames[r.id] = r.name; });

               MOTHER_SECTION_KEYS.forEach((sectionKey, idx) => {
                    const section = reportData.sections[sectionKey];
                    if (!section) return;

                    // Add separator between sections
                    if (idx > 0) {
                         csvLines.push('');
                         csvLines.push('');
                    }

                    // Section header
                    csvLines.push(`"=== ${(sectionNames[sectionKey] || sectionKey).toUpperCase()} ==="`);

                    // KPIs as a row
                    if (section.kpis) {
                         const kpiKeys = Object.keys(section.kpis);
                         csvLines.push(kpiKeys.map(k => `"${formatKpiKey(k)}"`).join(','));
                         csvLines.push(kpiKeys.map(k => {
                              const v = section.kpis[k];
                              return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v;
                         }).join(','));
                         csvLines.push('');
                    }

                    // Data table
                    const columns = getColumnsForType(sectionKey);
                    if (columns.length > 0 && section.rows?.length > 0) {
                         csvLines.push(columns.map(col => `"${col.label}"`).join(','));
                         section.rows.forEach((row: any) => {
                              csvLines.push(
                                   columns.map(col => {
                                        const val = row[col.key];
                                        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : (val ?? '');
                                   }).join(',')
                              );
                         });
                    }
               });
          } else {
               // Single report export
               if (!reportData.rows || reportData.rows.length === 0) {
                    toast.error('No data available for export');
                    return;
               }
               const columns = getReportColumns();
               csvLines.push(columns.map(col => col.label).join(','));
               reportData.rows.forEach((row: any) => {
                    csvLines.push(
                         columns.map(col => {
                              const val = row[col.key];
                              return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
                         }).join(',')
                    );
               });
          }

          const csvContent = 'data:text/csv;charset=utf-8,' + csvLines.join('\n');
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement('a');
          link.setAttribute('href', encodedUri);
          link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Report exported to CSV successfully');
     };

     // Print report helper
     const handlePrint = () => {
          window.print();
     };

     const activeInfo = REPORT_TYPES.find(r => r.id === activeReport) || REPORT_TYPES[0];
     const isMotherReport = activeReport === 'mother';

     // Render a single report section (KPIs + Table) — used by both individual and mother views
     const renderReportSection = (sectionType: string, data: { kpis: Record<string, any>; rows: Array<Record<string, any>> }, sectionTitle?: string) => {
          const columns = getColumnsForType(sectionType);
          return (
               <div className={`report-section ${isMotherReport ? 'mother-report__section' : ''}`} key={sectionType}>
                    {sectionTitle && (
                         <div className="mother-section-header">
                              <h3>{sectionTitle}</h3>
                              <span className="mother-section-desc">
                                   {REPORT_TYPES.find(r => r.id === sectionType)?.desc || ''}
                              </span>
                         </div>
                    )}

                    {/* KPI Grid */}
                    <div className="report-kpi-grid">
                         {Object.entries(data.kpis || {}).map(([key, val]) => (
                              <div key={key} className="kpi-tile">
                                   <div className="kpi-label">{formatKpiKey(key)}</div>
                                   <div className="kpi-value">{val}</div>
                              </div>
                         ))}
                    </div>

                    {/* Data Table */}
                    <div className="report-table-wrapper">
                         <table className="report-data-table">
                              <thead>
                                   <tr>
                                        {columns.map(col => (
                                             <th key={col.key}>{col.label}</th>
                                        ))}
                                   </tr>
                              </thead>
                              <tbody>
                                   {data.rows.length === 0 ? (
                                        <tr>
                                             <td colSpan={columns.length} className="no-data-cell">
                                                  No data found matching the selected filters.
                                             </td>
                                        </tr>
                                   ) : (
                                        data.rows.map((row, idx) => (
                                             <tr key={idx}>
                                                  {columns.map(col => {
                                                       const rawVal = row[col.key];
                                                       const displayVal = col.format ? col.format(rawVal) : rawVal;
                                                       return (
                                                            <td key={col.key}>
                                                                 {displayVal !== null && displayVal !== undefined ? String(displayVal) : '-'}
                                                            </td>
                                                       );
                                                  })}
                                             </tr>
                                        ))
                                   )}
                              </tbody>
                         </table>
                    </div>
               </div>
          );
     };

     return (
          <div className="reports-page">
               {/* Horizontal tabs */}
               <div className="reports-tabs">
                    {REPORT_TYPES.map(report => (
                         <button
                              key={report.id}
                              type="button"
                              className={`report-tab-btn ${activeReport === report.id ? 'active' : ''} ${report.id === 'mother' ? 'report-tab-btn--mother' : ''}`}
                              onClick={() => setActiveReport(report.id)}
                         >
                              {report.name}
                         </button>
                    ))}
               </div>

               {/* Filters and Actions Bar */}
               <div className="reports-filters">
                    <div className="filters-grid">
                         <div className="filter-group">
                              <label>Start Date</label>
                              <input
                                   type="date"
                                   value={startDate}
                                   onChange={(e) => setStartDate(e.target.value)}
                              />
                         </div>

                         <div className="filter-group">
                              <label>End Date</label>
                              <input
                                   type="date"
                                   value={endDate}
                                   onChange={(e) => setEndDate(e.target.value)}
                              />
                         </div>

                         {/* Group By Filter - for Sales, Revenue, Registration, Mother */}
                         {['sales', 'revenue', 'user-registration', 'mother'].includes(activeReport) && (
                              <div className="filter-group">
                                   <label>Group By</label>
                                   <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                                        {(activeReport === 'sales') && <option value="day">Day</option>}
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                   </select>
                              </div>
                         )}

                         {/* Category Filter - available for all reports */}
                         <div className="filter-group">
                              <label>Category</label>
                              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                   <option value="">All Categories</option>
                                   {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                                   ))}
                              </select>
                         </div>

                         {/* Sort Filter - only for Book Performance, Author Performance */}
                         {['book-performance', 'author-performance'].includes(activeReport) && (
                              <div className="filter-group">
                                   <label>Sort By</label>
                                   <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                        <option value="units">Units Sold</option>
                                        <option value="revenue">Revenue</option>
                                        <option value="rating">Rating</option>
                                   </select>
                              </div>
                         )}

                         {activeReport === 'orders' && (
                              <div className="filter-group">
                                   <label>Order Status</label>
                                   <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                        <option value="all">All Statuses</option>
                                        <option value="completed">Completed</option>
                                        <option value="pending">Pending</option>
                                        <option value="failed">Failed</option>
                                   </select>
                              </div>
                         )}
                    </div>

                    <div className="reports-actions">
                         <button
                              type="button"
                              className="reports-btn reports-btn--run"
                              onClick={runReport}
                              disabled={loading}
                         >
                              Run Report
                         </button>
                         <button
                              type="button"
                              className="reports-btn reports-btn--export"
                              onClick={handleExportCSV}
                              disabled={!reportData}
                         >
                              Export CSV
                         </button>
                         <button
                              type="button"
                              className="reports-btn reports-btn--print"
                              onClick={handlePrint}
                              disabled={!reportData}
                         >
                              Print / PDF
                         </button>
                    </div>
               </div>

               {/* Report Visual Shell Container */}
               <div className="report-shell-container" id="printable-report-shell">
                    {/* Navy Header */}
                    <div className="report-shell-header">
                         <div className="header-info">
                              <h2 className="report-title">{activeInfo.name}</h2>
                              <p className="report-desc">{activeInfo.desc}</p>
                         </div>
                         <div className="header-brand">
                              Oakbridge <span className="brand-accent">Publishing</span>
                         </div>
                    </div>

                    {/* Filter Description Strip */}
                    <div className="report-shell-filter-strip">
                         FILTERS &nbsp;·&nbsp; 
                         Period: {startDate || 'Beginning'} to {endDate || 'Today'} 
                         {['sales', 'revenue', 'user-registration', 'mother'].includes(activeReport) && ` · Group by: ${groupBy.toUpperCase()}`}
                         {` · Category: ${selectedCategory ? (categories.find(c => c.id === selectedCategory)?.category_name) : 'All'}`}
                         {['book-performance', 'author-performance'].includes(activeReport) && ` · Sort: ${sort.toUpperCase()}`}
                         {activeReport === 'orders' && ` · Status: ${sort.toUpperCase()}`}
                    </div>

                    {/* Report Data Body */}
                    <div className="report-shell-body">
                         {loading ? (
                              <div className="report-loading">
                                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                                        {[...Array(4)].map((_, i) => (
                                             <Skeleton key={i} height="85px" borderRadius="8px" />
                                        ))}
                                   </div>
                                   <Skeleton height="350px" borderRadius="8px" />
                              </div>
                         ) : reportData ? (
                              <>
                                   {isMotherReport && reportData.sections ? (
                                        /* ── Mother Report: render all sections ── */
                                        <div className="mother-report">
                                             {MOTHER_SECTION_KEYS.map(sectionKey => {
                                                  const section = reportData.sections[sectionKey];
                                                  if (!section) return null;
                                                  const info = REPORT_TYPES.find(r => r.id === sectionKey);
                                                  return renderReportSection(sectionKey, section, info?.name || sectionKey);
                                             })}
                                        </div>
                                   ) : (
                                        /* ── Individual Report ── */
                                        <>
                                             {renderReportSection(activeReport, reportData)}
                                        </>
                                   )}

                                   {/* Footer Info */}
                                   <div className="report-shell-footer">
                                        Export Options: CSV · PDF. Generated {new Date().toLocaleString('en-IN')} · Oakbridge Publishing Pvt. Ltd.
                                   </div>
                              </>
                         ) : (
                              <div className="report-placeholder">
                                   Please select report parameters and click "Run Report".
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
}
