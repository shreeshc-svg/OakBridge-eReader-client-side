import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../../store/cart.store';
import { usePayments } from '../../payments/hooks/use_payments';
import { useAuthStore } from '../../../store/auth.store';
import { payments_api } from '../../payments/api/payments.api';
import posthog from 'posthog-js';
import Public_Navbar from '../../public_store/components/public_navbar/Public_Navbar';
import toast from 'react-hot-toast';
import Checkout_Address_Modal from '../../payments/components/Checkout_Address_Modal';
import './Cart_Page.scss';

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

const CartIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
     </svg>
);

const TrashIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
     </svg>
);

const BookmarkIcon = () => (
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
     </svg>
);

const Cart_Page = () => {
     const navigate = useNavigate();
     const user = useAuthStore((state) => state.user);
     const {
          items,
          isLoading,
          fetchCart,
          removeFromCart,
          moveToSaved,
     } = useCartStore();
     const { initiateCartPayment, isProcessing } = usePayments();
     const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
     
     // Coupon states
     const [couponCode, setCouponCode] = useState('');
     const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
     const [discountAmount, setDiscountAmount] = useState(0);
     const [couponError, setCouponError] = useState<string | null>(null);
     const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

     useEffect(() => {
          if (!user) {
               navigate('/login?redirect=/cart');
               return;
          }
          fetchCart();
     }, [user, fetchCart, navigate]);

     const subtotal = items.reduce((sum, item) => sum + item.book_price, 0);

     const handleRemove = async (bookId: string) => {
          try {
               await removeFromCart(bookId);
               toast.success('Removed from cart');
          } catch {
               toast.error('Failed to remove item');
          }
     };

     const handleSaveForLater = async (bookId: string) => {
          try {
               await moveToSaved(bookId);
               toast.success('Saved to wishlist');
          } catch {
               toast.error('Failed to save item');
          }
     };

     const handleAddressSubmit = async (shippingAddress: string, billingAddress: string) => {
          setIsAddressModalOpen(false);
          if (items.length === 0) return;
          const bookIds = items.map((item) => item.book_id);
          await initiateCartPayment(
               bookIds,
               shippingAddress,
               billingAddress,
               () => {
                    fetchCart();
                    navigate('/user/dashboard');
               },
               appliedCoupon || undefined
          );
     };

     const handleApplyCoupon = async () => {
          const trimmed = couponCode.trim();
          if (!trimmed) return;
          try {
               setIsCheckingCoupon(true);
               setCouponError(null);
               const res = await payments_api.validateCoupon(trimmed, subtotal);
               setDiscountAmount(res.result.discountAmount);
               setAppliedCoupon(res.result.code);
               toast.success('Coupon applied successfully!');

               posthog.capture('coupon_applied', {
                    code: trimmed,
                    discountAmount: res.result.discountAmount,
                    subtotal: subtotal
               });
          } catch (err: any) {
               const errMsg = err.response?.data?.message || 'Invalid coupon code';
               setCouponError(errMsg);
               setDiscountAmount(0);
               setAppliedCoupon(null);
               toast.error(errMsg);
          } finally {
               setIsCheckingCoupon(false);
          }
     };

     const handleRemoveCoupon = () => {
          setCouponCode('');
          setAppliedCoupon(null);
          setDiscountAmount(0);
          setCouponError(null);
          toast.success('Coupon removed');
     };

     const handleCheckout = async () => {
          if (items.length === 0) return;
          setIsAddressModalOpen(true);
     };

     if (isLoading) {
          return (
               <div className="cart_page">
                    <Public_Navbar />
                    <div className="cart_container cart_container--loading">
                         <div className="cart_spinner" />
                         <p>Loading your cart...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="cart_page">
               <Public_Navbar />

               <div className="cart_container">
                    <h1 className="cart_heading">Shopping Cart</h1>

                    {items.length === 0 ? (
                         <div className="cart_empty">
                              <div className="cart_empty__icon">
                                   <CartIcon />
                              </div>
                              <h2>Your cart is empty</h2>
                              <p>Looks like you haven't added any books yet.</p>
                              <Link to="/" className="cart_btn cart_btn--primary">
                                   Continue Shopping
                              </Link>
                         </div>
                    ) : (
                         <div className="cart_layout">
                              {/* Cart Items */}
                              <div className="cart_items_section">
                                   <div className="cart_items_header">
                                        <span>{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</span>
                                   </div>

                                   <div className="cart_items_list">
                                        {items.map((item) => (
                                             <div key={item.id} className="cart_item">
                                                  <div
                                                       className="cart_item__cover"
                                                       onClick={() => navigate(`/book/${item.book_id}`)}
                                                  >
                                                       <BookCoverImage
                                                            src={item.book_cover}
                                                            title={item.book_title}
                                                            className="cart_item__cover"
                                                       />
                                                  </div>

                                                  <div className="cart_item__info">
                                                       <h3
                                                            className="cart_item__title"
                                                            onClick={() => navigate(`/book/${item.book_id}`)}
                                                       >
                                                            {item.book_title}
                                                       </h3>
                                                       <p className="cart_item__author">
                                                            by {item.book_author}
                                                       </p>
                                                       <div className="cart_item__actions">
                                                            <button
                                                                 type="button"
                                                                 className="cart_item__action_btn"
                                                                 onClick={() => handleRemove(item.book_id)}
                                                            >
                                                                 <TrashIcon />
                                                                 <span>Remove</span>
                                                            </button>
                                                            <button
                                                                 type="button"
                                                                 className="cart_item__action_btn"
                                                                 onClick={() => handleSaveForLater(item.book_id)}
                                                            >
                                                                 <BookmarkIcon />
                                                                 <span>Save for later</span>
                                                            </button>
                                                       </div>
                                                  </div>

                                                  <div className="cart_item__price">
                                                       ₹{(item.book_price / 100).toLocaleString('en-IN')}
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>

                              {/* Order Summary Sidebar */}
                              <div className="cart_summary">
                                   <div className="cart_summary__card">
                                        <h2 className="cart_summary__title">Order Summary</h2>

                                        <div className="cart_summary__row">
                                             <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                                             <span>₹{(subtotal / 100).toLocaleString('en-IN')}</span>
                                        </div>

                                        {discountAmount > 0 && (
                                             <div className="cart_summary__row cart_summary__row--discount">
                                                  <span>Discount ({appliedCoupon})</span>
                                                  <span>- ₹{(discountAmount / 100).toLocaleString('en-IN')}</span>
                                             </div>
                                        )}

                                        {/* Coupon Code Section */}
                                        <div className="cart_summary__divider" />
                                        <div className="cart_summary__coupon_section">
                                             <label className="cart_summary__coupon_label">Promo Code</label>
                                             {!appliedCoupon ? (
                                                  <div className="cart_summary__coupon_input_group">
                                                       <input
                                                            type="text"
                                                            className="cart_summary__coupon_input"
                                                            placeholder="Enter coupon code"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                            disabled={isCheckingCoupon}
                                                       />
                                                       <button
                                                            type="button"
                                                            className="cart_btn cart_btn--secondary cart_summary__coupon_btn"
                                                            onClick={handleApplyCoupon}
                                                            disabled={isCheckingCoupon || !couponCode.trim()}
                                                       >
                                                            {isCheckingCoupon ? '...' : 'Apply'}
                                                       </button>
                                                  </div>
                                             ) : (
                                                  <div className="cart_summary__coupon_applied">
                                                       <span className="cart_summary__coupon_applied_tag">
                                                            ✅ {appliedCoupon} Applied
                                                       </span>
                                                       <button
                                                            type="button"
                                                            className="cart_summary__coupon_remove_btn"
                                                            onClick={handleRemoveCoupon}
                                                       >
                                                            Remove
                                                       </button>
                                                  </div>
                                             )}
                                             {couponError && (
                                                  <p className="cart_summary__coupon_error">{couponError}</p>
                                             )}
                                        </div>

                                        <div className="cart_summary__divider" />

                                        <div className="cart_summary__row cart_summary__row--total">
                                             <span>Total</span>
                                             <span>₹{((subtotal - discountAmount) / 100).toLocaleString('en-IN')}</span>
                                        </div>

                                        <button
                                             type="button"
                                             className="cart_btn cart_btn--primary cart_btn--full"
                                             onClick={handleCheckout}
                                             disabled={isProcessing || items.length === 0}
                                        >
                                             {isProcessing ? 'Processing...' : `Proceed to Buy (${items.length} ${items.length === 1 ? 'item' : 'items'})`}
                                        </button>

                                        <Link to="/" className="cart_summary__continue">
                                             Continue Shopping
                                        </Link>
                                   </div>
                              </div>
                         </div>
                    )}

                    <Checkout_Address_Modal
                         isOpen={isAddressModalOpen}
                         onClose={() => setIsAddressModalOpen(false)}
                         onSubmit={handleAddressSubmit}
                         title="Cart Checkout Address Details"
                    />
               </div>
          </div>
     );
};

export default Cart_Page;
