import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../../store/cart.store';
import { useAuthStore } from '../../../store/auth.store';
import Public_Navbar from '../../public_store/components/public_navbar/Public_Navbar';
import toast from 'react-hot-toast';
import './Wishlist_Page.scss';

const BookCoverImage = ({ src, title, className }: { src?: string; title: string; className: string }) => {
     const [hasError, setHasError] = useState(false);

     if (!src || hasError) {
          const initials = title ? title.slice(0, 2).toUpperCase() : 'BK';
          return (
               <div className={`${className}_placeholder`}>
                    <span>{initials}</span>
               </div>
          );
     }

     return (
          <img
               src={src}
               alt={title}
               onError={() => setHasError(true)}
          />
     );
};

const HeartIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
     </svg>
);

const TrashIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
     </svg>
);

const CartIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
     </svg>
);

const Wishlist_Page = () => {
     const navigate = useNavigate();
     const user = useAuthStore((state) => state.user);
     const {
          savedItems,
          isLoading,
          fetchCart,
          removeFromCart,
          moveToActive,
     } = useCartStore();

     useEffect(() => {
          if (!user) {
               navigate('/login?redirect=/wishlist');
               return;
          }
          fetchCart();
     }, [user, fetchCart, navigate]);

     const handleRemove = async (bookId: string) => {
          try {
               await removeFromCart(bookId);
               toast.success('Removed from wishlist');
          } catch {
               toast.error('Failed to remove item');
          }
     };

     const handleMoveToCart = async (bookId: string) => {
          try {
               await moveToActive(bookId);
               toast.success('Moved to cart');
          } catch {
               toast.error('Failed to move item');
          }
     };

     if (isLoading) {
          return (
               <div className="wishlist_page">
                    <Public_Navbar />
                    <div className="wishlist_container wishlist_container--loading">
                         <div className="wishlist_spinner" />
                         <p>Loading your wishlist...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="wishlist_page">
               <Public_Navbar />

               <div className="wishlist_container">
                    <h1 className="wishlist_heading">My Wishlist</h1>

                    {savedItems.length === 0 ? (
                         <div className="wishlist_empty">
                              <div className="wishlist_empty__icon">
                                   <HeartIcon />
                              </div>
                              <h2>Your wishlist is empty</h2>
                              <p>Save books for later to build your personal reading list.</p>
                              <Link to="/" className="wishlist_btn wishlist_btn--primary">
                                   Explore Books
                              </Link>
                         </div>
                    ) : (
                         <div className="wishlist_grid">
                              {savedItems.map((item) => (
                                   <div key={item.id} className="wishlist_card">
                                        <div
                                             className="wishlist_card__cover_wrap"
                                             onClick={() => navigate(`/book/${item.book_id}`)}
                                        >
                                             <BookCoverImage
                                                  src={item.book_cover}
                                                  title={item.book_title}
                                                  className="wishlist_card__cover"
                                             />
                                        </div>

                                        <div className="wishlist_card__content">
                                             <h3
                                                  className="wishlist_card__title"
                                                  onClick={() => navigate(`/book/${item.book_id}`)}
                                             >
                                                  {item.book_title}
                                             </h3>
                                             <p className="wishlist_card__author">
                                                  by {item.book_author}
                                             </p>
                                             <p className="wishlist_card__price">
                                                  ₹{(item.book_price / 100).toLocaleString('en-IN')}
                                             </p>

                                             <div className="wishlist_card__actions">
                                                  <button
                                                       type="button"
                                                       className="wishlist_btn wishlist_btn--primary wishlist_btn--sm"
                                                       onClick={() => handleMoveToCart(item.book_id)}
                                                  >
                                                       <CartIcon />
                                                       <span>Add to Cart</span>
                                                  </button>
                                                  <button
                                                       type="button"
                                                       className="wishlist_btn wishlist_btn--outline wishlist_btn--sm wishlist_btn--danger"
                                                       onClick={() => handleRemove(item.book_id)}
                                                       aria-label="Remove item"
                                                  >
                                                       <TrashIcon />
                                                       <span>Remove</span>
                                                  </button>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    )}
               </div>
          </div>
     );
};

export default Wishlist_Page;
