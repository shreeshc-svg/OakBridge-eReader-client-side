import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../../books/hooks/use_books';
import { useCategories } from '../../categories/hooks/use_categories';
import { useBanners } from '../hooks/use_banners';
import { HeroBannerSlider } from '../components/HeroBannerSlider';
import Public_Navbar from '../components/public_navbar/Public_Navbar';
import { useAuthStore } from '../../../store/auth.store';
import { RecommendationsShelf } from '../components/RecommendationsShelf';
import { useDebounce } from '../../../hooks/use_debounce';
import { useCartStore } from '../../../store/cart.store';
import toast from 'react-hot-toast';
import './Store_Page.scss';

// Reusable Scrollable Shelf Wrapper
const ScrollableShelf = ({
     children,
     title,
     onSeeAll,
}: {
     children: React.ReactNode;
     title: string;
     onSeeAll?: () => void;
}) => {
     const scrollRef = useRef<HTMLDivElement>(null);

     const scroll = (direction: 'left' | 'right') => {
          if (scrollRef.current) {
               const scrollAmount = 600;
               scrollRef.current.scrollBy({
                    left: direction === 'left' ? -scrollAmount : scrollAmount,
                    behavior: 'smooth',
               });
          }
     };

     return (
          <div className="store_shelf">
               <div className="store_shelf__header">
                    <h3 className="store_shelf__label">{title}</h3>
                    <button type="button" className="store_shelf__see_all" onClick={onSeeAll}>
                         See all &rarr;
                    </button>
               </div>
               <div className="store_shelf__scroll_wrap">
                    <button
                         type="button"
                         className="store_shelf__arrow store_shelf__arrow--left"
                         onClick={() => scroll('left')}
                         aria-label="Scroll left"
                    >
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15 19l-7-7 7-7" />
                         </svg>
                    </button>
                    <div className="store_shelf__scroll" ref={scrollRef}>
                         {children}
                    </div>
                    <button
                         type="button"
                         className="store_shelf__arrow store_shelf__arrow--right"
                         onClick={() => scroll('right')}
                         aria-label="Scroll right"
                    >
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 5l7 7-7 7" />
                         </svg>
                    </button>
               </div>
          </div>
     );
};

// Reusable Skeleton Loader
const BookSkeleton = () => (
     <div className="store_book_skeleton">
          <div className="store_book_skeleton__cover skeleton" />
          <div className="store_book_skeleton__title skeleton" />
          <div className="store_book_skeleton__author skeleton" />
          <div className="store_book_skeleton__meta skeleton" />
     </div>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
     <svg viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
     </svg>
);

const ITEMS_PER_PAGE = 12;

const Store_Page = () => {
     const navigate = useNavigate();
     const accessToken = useAuthStore((state) => state.accessToken);
     const { books, isLoading: booksLoading, fetchBooks, error: booksError } = useBooks();
     const { categories, fetchCategories, error: categoriesError } = useCategories();
     const { banners, isLoading: bannersLoading } = useBanners();

     const featuredGridRef = useRef<HTMLDivElement>(null);
     const [activeTab, setActiveTab] = useState<string>('All');
     const [activeSubTab, setActiveSubTab] = useState<string>('All');

     // Gallery Search & Sort States
     const [searchQuery, setSearchQuery] = useState<string>('');
     const debouncedSearch = useDebounce(searchQuery, 300);
     const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
     const [sortBy, setSortBy] = useState<'newest' | 'title' | 'price_low' | 'price_high'>('newest');

     // Pagination State
     const [currentPage, setCurrentPage] = useState<number>(1);

     const { cartBookIds, savedItems, addToCart, fetchCart, removeFromCart, moveToSaved } = useCartStore();
     const savedBookIds = useMemo(() => new Set(savedItems.map((item) => item.book_id)), [savedItems]);
     const [addingBookId, setAddingBookId] = useState<string>('');

     const parentCategories = useMemo(() => {
          return categories.filter((c) => !c.parent_id);
     }, [categories]);

     useEffect(() => {
          fetchBooks();
          fetchCategories();
          if (accessToken) {
               fetchCart();
          }
     }, [fetchBooks, fetchCategories, accessToken, fetchCart]);

     // Reset subcategory on parent change
     useEffect(() => {
          setActiveSubTab('All');
     }, [activeTab]);

     // Reset to page 1 on filter/search change
     useEffect(() => {
          setCurrentPage(1);
     }, [activeTab, activeSubTab, priceFilter, debouncedSearch, sortBy]);

     const getCategoryNames = (ids?: string[]) => {
          if (!ids || ids.length === 0) return 'General';
          const names = ids
               .map((id) => categories.find((c) => c.id === id)?.category_name)
               .filter(Boolean);
          return names.length > 0 ? names.join(', ') : 'General';
     };

     // Resolved category IDs for active parent tab (including parent + all children)
     const resolvedActiveCategoryIds = useMemo(() => {
          if (activeTab === 'All') return [];
          const childrenIds = categories
               .filter((c) => c.parent_id === activeTab)
               .map((c) => c.id);
          return [activeTab, ...childrenIds];
     }, [activeTab, categories]);

     // Filter books for Shelves View
     const filteredShelfBooks = useMemo(() => {
          if (activeTab === 'All') return books;
          return books.filter((book) =>
               book.category_ids?.some((id) => resolvedActiveCategoryIds.includes(id))
          );
     }, [activeTab, resolvedActiveCategoryIds, books]);

     const trendingBooks = useMemo(() => filteredShelfBooks.filter((book) => book.isTrending), [filteredShelfBooks]);
     const newReleases = useMemo(() => {
          return filteredShelfBooks
               .filter((book) => book.isNewRelease)
               .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
     }, [filteredShelfBooks]);

     // Filter and sort books for Gallery Grid View
     const galleryBooks = useMemo(() => {
          let list = [...books];

          // Category filter
          if (activeTab !== 'All') {
               if (activeSubTab === 'All') {
                    list = list.filter((b) =>
                         b.category_ids?.some((id) => resolvedActiveCategoryIds.includes(id))
                    );
               } else {
                    list = list.filter((b) => b.category_ids?.includes(activeSubTab));
               }
          }

          // Price filter
          if (priceFilter === 'free') {
               list = list.filter((b) => !b.price || b.price <= 0);
          } else if (priceFilter === 'paid') {
               list = list.filter((b) => b.price && b.price > 0);
          }

          // Search filter
          if (debouncedSearch) {
               const q = debouncedSearch.toLowerCase();
               list = list.filter(
                    (b) =>
                         b.title?.toLowerCase().includes(q) ||
                         (b.author || b.publisher || '').toLowerCase().includes(q) ||
                         b.isbn?.toLowerCase().includes(q) ||
                         b.language?.toLowerCase().includes(q)
               );
          }

          // Sorting
          if (sortBy === 'newest') {
               list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          } else if (sortBy === 'title') {
               list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
          } else if (sortBy === 'price_low') {
               list.sort((a, b) => (a.price || 0) - (b.price || 0));
          } else if (sortBy === 'price_high') {
               list.sort((a, b) => (b.price || 0) - (a.price || 0));
          }

          return list;
     }, [books, activeTab, activeSubTab, resolvedActiveCategoryIds, priceFilter, debouncedSearch, sortBy]);

     // Paginated Slice
     const totalPages = Math.ceil(galleryBooks.length / ITEMS_PER_PAGE);
     const paginatedBooks = useMemo(() => {
          const start = (currentPage - 1) * ITEMS_PER_PAGE;
          return galleryBooks.slice(start, start + ITEMS_PER_PAGE);
     }, [galleryBooks, currentPage]);

     const handleSeeAll = (catId: string = 'All') => {
          setActiveTab(catId);
          setCurrentPage(1);
          featuredGridRef.current?.scrollIntoView({ behavior: 'smooth' });
     };

     const isLoading = booksLoading || bannersLoading;

     return (
          <div className="store_page">
               <Public_Navbar />
               {booksError && <div style={{ color: 'red', padding: '100px 24px 0' }}>Books Error: {booksError}</div>}
               {categoriesError && <div style={{ color: 'red', padding: '10px 24px' }}>Categories Error: {categoriesError}</div>}

               <HeroBannerSlider banners={banners} />

               <div className="store_layout">
                    {/* ── Mode Navigation Bar ── */}
                    <div className="store_view_header">
                         <div className="store_view_header__left">
                              <h2 className="store_view_header__title">Explore E-Book Catalog</h2>
                              <span className="store_view_header__count">
                                   {books.length} Books
                              </span>
                         </div>
                    </div>

                    {/* ── Category Filter Tabs ── */}
                    <div className="store_tabs">
                         <button
                              type="button"
                              className={`store_tabs__item ${activeTab === 'All' ? 'store_tabs__item--active' : ''}`}
                              onClick={() => setActiveTab('All')}
                         >
                              All Categories
                         </button>
                         {parentCategories.map((cat) => (
                              <button
                                   key={cat.id}
                                   type="button"
                                   className={`store_tabs__item ${activeTab === cat.id ? 'store_tabs__item--active' : ''}`}
                                   onClick={() => setActiveTab(cat.id)}
                              >
                                   {cat.category_name}
                              </button>
                         ))}
                    </div>

                    {/* ── Nested Subcategory Tabs ── */}
                    {activeTab !== 'All' && categories.some((c) => c.parent_id === activeTab) && (
                         <div className="store_sub_tabs" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '-12px', marginBottom: '12px' }}>
                              <button
                                   type="button"
                                   className={`store_sub_tabs__item ${activeSubTab === 'All' ? 'store_sub_tabs__item--active' : ''}`}
                                   onClick={() => setActiveSubTab('All')}
                                   style={{
                                        background: activeSubTab === 'All' ? '#ff7a36' : 'transparent',
                                        color: activeSubTab === 'All' ? '#ffffff' : '#64748b',
                                        border: 'none',
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                   }}
                              >
                                   All {parentCategories.find(c => c.id === activeTab)?.category_name}
                              </button>
                              {categories
                                   .filter((c) => c.parent_id === activeTab)
                                   .map((subCat) => (
                                        <button
                                             key={subCat.id}
                                             type="button"
                                             className={`store_sub_tabs__item ${activeSubTab === subCat.id ? 'store_sub_tabs__item--active' : ''}`}
                                             onClick={() => setActiveSubTab(subCat.id)}
                                             style={{
                                                  background: activeSubTab === subCat.id ? '#ff7a36' : 'transparent',
                                                  color: activeSubTab === subCat.id ? '#ffffff' : '#64748b',
                                                  border: 'none',
                                                  padding: '6px 14px',
                                                  borderRadius: '6px',
                                                  fontSize: '13px',
                                                  fontWeight: '700',
                                                  cursor: 'pointer',
                                                  transition: 'all 0.2s ease'
                                             }}
                                        >
                                             {subCat.category_name}
                                        </button>
                                   ))}
                         </div>
                    )}

                    {/* ── Featured Books Grid Section ── */}
                    <div className="store_gallery_view" ref={featuredGridRef} style={{ marginBottom: '60px' }}>
                         {/* <h3 className="store_shelf__label" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Featured Books</h3> */}
                         {/* ── Search, Filters, & Sorting Bar ── */}
                         <div className="store_gallery_toolbar">
                              <div className="store_gallery_search">
                                   <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                   </svg>
                                   <input
                                        type="text"
                                        placeholder="Search books by title, author, ISBN..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                   />
                                   {searchQuery && (
                                        <button
                                             type="button"
                                             className="store_gallery_search_clear"
                                             onClick={() => setSearchQuery('')}
                                        >
                                             ✕
                                        </button>
                                   )}
                              </div>

                              <div className="store_gallery_controls">
                                   <div className="store_gallery_filter_pills">
                                        {(['all', 'free', 'paid'] as const).map((pf) => (
                                             <button
                                                  key={pf}
                                                  type="button"
                                                  className={`store_pill_btn ${priceFilter === pf ? 'store_pill_btn--active' : ''}`}
                                                  onClick={() => setPriceFilter(pf)}
                                             >
                                                  {pf === 'all' ? 'All Prices' : pf === 'free' ? 'Free Only' : 'Paid Only'}
                                             </button>
                                        ))}
                                   </div>

                                   <div className="store_gallery_sort">
                                        <label htmlFor="store-sort-by">Sort By:</label>
                                        <select
                                             id="store-sort-by"
                                             value={sortBy}
                                             onChange={(e) => setSortBy(e.target.value as any)}
                                        >
                                             <option value="newest">Newest First</option>
                                             <option value="title">Title (A - Z)</option>
                                             <option value="price_low">Price: Low to High</option>
                                             <option value="price_high">Price: High to Low</option>
                                        </select>
                                   </div>
                              </div>
                         </div>

                         {/* ── Grid Cards ── */}
                         {isLoading ? (
                              <div className="store_gallery_grid">
                                   {[...Array(8)].map((_, i) => (
                                        <BookSkeleton key={i} />
                                   ))}
                              </div>
                         ) : galleryBooks.length === 0 ? (
                              <div className="store_gallery_empty">
                                   <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
                                   </svg>
                                   <h3>No E-Books Match Your Criteria</h3>
                                   <p>Try clearing your search or picking a different category filter.</p>
                                   <button
                                        type="button"
                                        className="store_view_toggle_btn store_view_toggle_btn--primary"
                                        onClick={() => {
                                             setSearchQuery('');
                                             setActiveTab('All');
                                             setPriceFilter('all');
                                        }}
                                        style={{ marginTop: 16 }}
                                   >
                                        Reset Filters
                                   </button>
                              </div>
                         ) : (
                              <>
                                   <div className="store_gallery_grid">
                                        {paginatedBooks.map((book) => (
                                             <div
                                                  key={book.id}
                                                  className="store_book_card"
                                                  onClick={() => navigate(`/book/${book.id}`)}
                                             >
                                                  <div className="store_book_card__cover">
                                                       {book.cover_image_url ? (
                                                            <img src={book.cover_image_url} alt={book.cover_image_alt || book.title} />
                                                       ) : (
                                                            <div className="store_book_card__placeholder">
                                                                 <span>{book.title?.slice(0, 2).toUpperCase()}</span>
                                                            </div>
                                                       )}
                                                       <div className="store_book_card__badge">
                                                            {getCategoryNames(book.category_ids)}
                                                       </div>
                                                       {(!book.price || book.price <= 0) && (
                                                            <div className="store_book_card__free_badge">FREE</div>
                                                       )}
                                                  </div>
                                                  <div className="store_book_card__info">
                                                       <h4 className="store_book_card__title">{book.title}</h4>
                                                       <span className="store_book_card__author">
                                                            {book.author || book.publisher || 'Unknown'}
                                                       </span>
                                                       <span className="store_book_card__meta">
                                                            {book.language} &bull; {book.total_pages} Pages
                                                       </span>
                                                       <div className="store_book_card__footer">
                                                            <span className="store_book_card__price">
                                                                 {!book.price || book.price <= 0 ? 'Free' : `₹${(book.price / 100).toLocaleString('en-IN')}`}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                 <button
                                                                      type="button"
                                                                      className={`store_book_card__cart_btn ${cartBookIds.has(book.id) ? 'store_book_card__cart_btn--in-cart' : ''}`}
                                                                      disabled={addingBookId === book.id}
                                                                      onClick={async (e) => {
                                                                           e.stopPropagation();
                                                                           if (!accessToken) {
                                                                                navigate('/login?redirect=/');
                                                                                return;
                                                                           }
                                                                           if (cartBookIds.has(book.id)) {
                                                                                navigate('/cart');
                                                                                return;
                                                                           }
                                                                           setAddingBookId(book.id);
                                                                           try {
                                                                                await addToCart(book.id);
                                                                                toast.success('Added to cart!');
                                                                           } catch (err: any) {
                                                                                toast.error(err?.response?.data?.message || 'Failed to add to cart');
                                                                           } finally {
                                                                                setAddingBookId('');
                                                                           }
                                                                      }}
                                                                 >
                                                                      {addingBookId === book.id ? (
                                                                           '...'
                                                                      ) : cartBookIds.has(book.id) ? (
                                                                           'In Cart'
                                                                      ) : (
                                                                           'Add'
                                                                      )}
                                                                 </button>
                                                                 <button
                                                                      type="button"
                                                                      className={`store_book_card__save_btn ${savedBookIds.has(book.id) ? 'store_book_card__save_btn--saved' : ''}`}
                                                                      onClick={async (e) => {
                                                                           e.stopPropagation();
                                                                           if (!accessToken) {
                                                                                navigate('/login?redirect=/');
                                                                                return;
                                                                           }
                                                                           try {
                                                                                if (savedBookIds.has(book.id)) {
                                                                                     await removeFromCart(book.id);
                                                                                     toast.success('Removed from Saved');
                                                                                } else {
                                                                                     await moveToSaved(book.id);
                                                                                     toast.success('Saved for Later');
                                                                                }
                                                                           } catch (err: any) {
                                                                                toast.error('Failed to update Saved');
                                                                           }
                                                                      }}
                                                                      title={savedBookIds.has(book.id) ? "Remove from Saved for Later" : "Save for Later"}
                                                                 >
                                                                      <BookmarkIcon filled={savedBookIds.has(book.id)} />
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>

                                   {/* ── Pagination Controls ── */}
                                   {totalPages > 1 && (
                                        <div className="store_pagination">
                                             <div className="store_pagination__info">
                                                  Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, galleryBooks.length)}–
                                                  {Math.min(currentPage * ITEMS_PER_PAGE, galleryBooks.length)} of {galleryBooks.length} E-Books
                                             </div>

                                             <div className="store_pagination__controls">
                                                  <button
                                                       type="button"
                                                       className="store_pagination_btn"
                                                       disabled={currentPage === 1}
                                                       onClick={() => {
                                                            setCurrentPage((p) => Math.max(p - 1, 1));
                                                            window.scrollTo({ top: 380, behavior: 'smooth' });
                                                       }}
                                                  >
                                                       &larr; Previous
                                                  </button>

                                                  <div className="store_pagination__pages">
                                                       {[...Array(totalPages)].map((_, idx) => {
                                                            const pageNum = idx + 1;
                                                            return (
                                                                 <button
                                                                      key={pageNum}
                                                                      type="button"
                                                                      className={`store_page_num_btn ${currentPage === pageNum ? 'store_page_num_btn--active' : ''}`}
                                                                      onClick={() => {
                                                                           setCurrentPage(pageNum);
                                                                           window.scrollTo({ top: 380, behavior: 'smooth' });
                                                                      }}
                                                                 >
                                                                      {pageNum}
                                                                 </button>
                                                            );
                                                       })}
                                                  </div>

                                                  <button
                                                       type="button"
                                                       className="store_pagination_btn"
                                                       disabled={currentPage === totalPages}
                                                       onClick={() => {
                                                            setCurrentPage((p) => Math.min(p + 1, totalPages));
                                                            window.scrollTo({ top: 380, behavior: 'smooth' });
                                                       }}
                                                  >
                                                       Next &rarr;
                                                  </button>
                                             </div>
                                        </div>
                                   )}
                              </>
                         )}
                    </div>

                    {/* ── Horizontal Shelves Mode ── */}
                    <div className="store_shelves">
                         {isLoading ? (
                              <>
                                   <ScrollableShelf title="New Releases" onSeeAll={() => handleSeeAll('All')}>
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                             <BookSkeleton key={i} />
                                        ))}
                                   </ScrollableShelf>
                                   <ScrollableShelf title="Trending Now" onSeeAll={() => handleSeeAll('All')}>
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                             <BookSkeleton key={i} />
                                        ))}
                                   </ScrollableShelf>
                              </>
                         ) : (
                              <>
                                   <ScrollableShelf title="New Releases" onSeeAll={() => handleSeeAll('All')}>
                                        {newReleases.map((book) => (
                                             <div
                                                  key={book.id}
                                                  className="store_book_card"
                                                  onClick={() => navigate(`/book/${book.id}`)}
                                             >
                                                  <div className="store_book_card__cover">
                                                       <img src={book.cover_image_url} alt={book.cover_image_alt || book.title} />
                                                       <div className="store_book_card__badge">
                                                            {getCategoryNames(book.category_ids)}
                                                       </div>
                                                       {(!book.price || book.price <= 0) && (
                                                            <div className="store_book_card__free_badge">FREE</div>
                                                       )}
                                                  </div>
                                                  <div className="store_book_card__info">
                                                       <h4 className="store_book_card__title">{book.title}</h4>
                                                       <span className="store_book_card__author">
                                                            {book.author || book.publisher || 'Unknown'}
                                                       </span>
                                                       <span className="store_book_card__meta">
                                                            {book.language} &bull; {book.total_pages} Pages
                                                       </span>
                                                       <div className="store_book_card__footer">
                                                            <span className="store_book_card__price">
                                                                 {!book.price || book.price <= 0 ? 'Free' : `₹${(book.price / 100).toLocaleString('en-IN')}`}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                 <button
                                                                      type="button"
                                                                      className={`store_book_card__cart_btn ${cartBookIds.has(book.id) ? 'store_book_card__cart_btn--in-cart' : ''}`}
                                                                      disabled={addingBookId === book.id}
                                                                      onClick={async (e) => {
                                                                           e.stopPropagation();
                                                                           if (!accessToken) {
                                                                                navigate('/login?redirect=/');
                                                                                return;
                                                                           }
                                                                           if (cartBookIds.has(book.id)) {
                                                                                navigate('/cart');
                                                                                return;
                                                                           }
                                                                           setAddingBookId(book.id);
                                                                           try {
                                                                                await addToCart(book.id);
                                                                                toast.success('Added to cart!');
                                                                           } catch (err: any) {
                                                                                toast.error(err?.response?.data?.message || 'Failed to add to cart');
                                                                           } finally {
                                                                                setAddingBookId('');
                                                                           }
                                                                      }}
                                                                 >
                                                                      {addingBookId === book.id ? (
                                                                           '...'
                                                                      ) : cartBookIds.has(book.id) ? (
                                                                           'In Cart'
                                                                      ) : (
                                                                           'Add'
                                                                      )}
                                                                 </button>
                                                                 <button
                                                                      type="button"
                                                                      className={`store_book_card__save_btn ${savedBookIds.has(book.id) ? 'store_book_card__save_btn--saved' : ''}`}
                                                                      onClick={async (e) => {
                                                                           e.stopPropagation();
                                                                           if (!accessToken) {
                                                                                navigate('/login?redirect=/');
                                                                                return;
                                                                           }
                                                                           try {
                                                                                if (savedBookIds.has(book.id)) {
                                                                                     await removeFromCart(book.id);
                                                                                     toast.success('Removed from Saved');
                                                                                } else {
                                                                                     await moveToSaved(book.id);
                                                                                     toast.success('Saved for Later');
                                                                                }
                                                                           } catch (err: any) {
                                                                                toast.error('Failed to update Saved');
                                                                           }
                                                                      }}
                                                                      title={savedBookIds.has(book.id) ? "Remove from Saved for Later" : "Save for Later"}
                                                                 >
                                                                      <BookmarkIcon filled={savedBookIds.has(book.id)} />
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </ScrollableShelf>

                                   <ScrollableShelf title="Trending Now" onSeeAll={() => handleSeeAll('All')}>
                                        {trendingBooks.map((book) => (
                                             <div
                                                  key={book.id}
                                                  className="store_book_card"
                                                  onClick={() => navigate(`/book/${book.id}`)}
                                             >
                                                  <div className="store_book_card__cover">
                                                       <img src={book.cover_image_url} alt={book.cover_image_alt || book.title} />
                                                       <div className="store_book_card__badge">
                                                            {getCategoryNames(book.category_ids)}
                                                       </div>
                                                       {(!book.price || book.price <= 0) && (
                                                            <div className="store_book_card__free_badge">FREE</div>
                                                       )}
                                                  </div>
                                                  <div className="store_book_card__info">
                                                       <h4 className="store_book_card__title">{book.title}</h4>
                                                       <span className="store_book_card__author">
                                                            {book.author || book.publisher || 'Unknown'}
                                                       </span>
                                                       <span className="store_book_card__meta">
                                                            {book.language} &bull; {book.total_pages} Pages
                                                       </span>
                                                       <div className="store_book_card__footer">
                                                            <span className="store_book_card__price">
                                                                 {!book.price || book.price <= 0 ? 'Free' : `₹${(book.price / 100).toLocaleString('en-IN')}`}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                 <button
                                                                      type="button"
                                                                      className={`store_book_card__cart_btn ${cartBookIds.has(book.id) ? 'store_book_card__cart_btn--in-cart' : ''}`}
                                                                      disabled={addingBookId === book.id}
                                                                      onClick={async (e) => {
                                                                           e.stopPropagation();
                                                                           if (!accessToken) {
                                                                                navigate('/login?redirect=/');
                                                                                return;
                                                                           }
                                                                           if (cartBookIds.has(book.id)) {
                                                                                navigate('/cart');
                                                                                return;
                                                                           }
                                                                           setAddingBookId(book.id);
                                                                           try {
                                                                                await addToCart(book.id);
                                                                                toast.success('Added to cart!');
                                                                           } catch (err: any) {
                                                                                toast.error(err?.response?.data?.message || 'Failed to add to cart');
                                                                           } finally {
                                                                                setAddingBookId('');
                                                                           }
                                                                      }}
                                                                 >
                                                                      {addingBookId === book.id ? (
                                                                           '...'
                                                                      ) : cartBookIds.has(book.id) ? (
                                                                           'In Cart'
                                                                      ) : (
                                                                           'Add'
                                                                      )}
                                                                 </button>
                                                                 <button
                                                                      type="button"
                                                                      className={`store_book_card__save_btn ${savedBookIds.has(book.id) ? 'store_book_card__save_btn--saved' : ''}`}
                                                                      onClick={async (e) => {
                                                                           e.stopPropagation();
                                                                           if (!accessToken) {
                                                                                navigate('/login?redirect=/');
                                                                                return;
                                                                           }
                                                                           try {
                                                                                if (savedBookIds.has(book.id)) {
                                                                                     await removeFromCart(book.id);
                                                                                     toast.success('Removed from Saved');
                                                                                } else {
                                                                                     await moveToSaved(book.id);
                                                                                     toast.success('Saved for Later');
                                                                                }
                                                                           } catch (err: any) {
                                                                                toast.error('Failed to update Saved');
                                                                           }
                                                                      }}
                                                                      title={savedBookIds.has(book.id) ? "Remove from Saved for Later" : "Save for Later"}
                                                                 >
                                                                      <BookmarkIcon filled={savedBookIds.has(book.id)} />
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </ScrollableShelf>

                                   {accessToken && (
                                        <RecommendationsShelf
                                             onSelectBook={(book) => navigate(`/book/${book.id}`)}
                                             categories={categories}
                                        />
                                   )}
                              </>
                         )}
                    </div>
               </div>
          </div>
     );
};

export default Store_Page;
