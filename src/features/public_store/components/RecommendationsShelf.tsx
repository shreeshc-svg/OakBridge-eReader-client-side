import { useEffect, useRef, useState } from 'react';
import { useRecommendations } from '../../books/hooks/use_recommendations';
import type { Book } from '../../books/types/books.api.types';
import type { Category } from '../../categories/types/categories.api.types';
import { useCartStore } from '../../../store/cart.store';
import { useAuthStore } from '../../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface RecommendationsShelfProps {
     onSelectBook: (book: Book) => void;
     categories: Category[];
}

export const RecommendationsShelf = ({ onSelectBook, categories }: RecommendationsShelfProps) => {
     const navigate = useNavigate();
     const accessToken = useAuthStore((state) => state.accessToken);
     const { cartBookIds, addToCart } = useCartStore();
     const [addingBookId, setAddingBookId] = useState<string>('');
     const { recommendations, isLoading, fetchRecommendations } = useRecommendations();
     const scrollRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
          fetchRecommendations();
     }, [fetchRecommendations]);

     const scroll = (direction: 'left' | 'right') => {
          if (scrollRef.current) {
               const scrollAmount = 600;
               scrollRef.current.scrollBy({
                    left: direction === 'left' ? -scrollAmount : scrollAmount,
                    behavior: 'smooth'
               });
          }
     };

     const getCategoryNames = (ids?: string[]) => {
          if (!ids || ids.length === 0) return 'General';
          const names = ids
               .map((id) => categories.find((c) => c.id === id)?.category_name)
               .filter(Boolean);
          return names.length > 0 ? names.join(', ') : 'General';
     };

     if (isLoading) {
          return (
               <div className="store_shelf">
                    <div className="store_shelf__header">
                         <h3 className="store_shelf__label">Recommended For You</h3>
                    </div>
                    <div className="store_shelf__scroll_wrap">
                         <div className="store_shelf__scroll">
                              {[1, 2, 3, 4, 5, 6].map(i => (
                                   <div key={i} className="store_book_skeleton">
                                        <div className="store_book_skeleton__cover skeleton" />
                                        <div className="store_book_skeleton__title skeleton" />
                                        <div className="store_book_skeleton__author skeleton" />
                                        <div className="store_book_skeleton__meta skeleton" />
                                   </div>
                              ))}
                         </div>
                    </div>
               </div>
          );
     }

     if (recommendations.length === 0) return null;

     return (
          <div className="store_shelf">
               <div className="store_shelf__header">
                    <h3 className="store_shelf__label">Recommended For You</h3>
               </div>
               <div className="store_shelf__scroll_wrap">
                    <button className="store_shelf__arrow store_shelf__arrow--left" onClick={() => scroll('left')} aria-label="Scroll left">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="store_shelf__scroll" ref={scrollRef}>
                         {recommendations.map(book => (
                              <div key={book.id} className="store_book_card" onClick={() => onSelectBook(book)}>
                                   <div className="store_book_card__cover">
                                        <img src={book.cover_image_url} alt={book.cover_image_alt || book.title} />
                                        <div className="store_book_card__badge">{getCategoryNames(book.category_ids)}</div>{(!book.price || book.price <= 0) && (<div className="store_book_card__free_badge">FREE</div>)}
                                   </div>
                                    <div className="store_book_card__info">
                                         <h4 className="store_book_card__title">{book.title}</h4>
                                         <span className="store_book_card__author">{book.author || book.publisher || 'Unknown'}</span>
                                         <span className="store_book_card__meta">{book.language} &bull; {book.total_pages} Pages</span>
                                         <div className="store_book_card__footer">
                                              <span className="store_book_card__price">
                                                   {!book.price || book.price <= 0 ? 'Free' : `₹${(book.price / 100).toLocaleString('en-IN')}`}
                                              </span>
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
                                                        'Adding...'
                                                   ) : cartBookIds.has(book.id) ? (
                                                        'In Cart'
                                                   ) : (
                                                        'Add'
                                                   )}
                                              </button>
                                         </div>
                                    </div>
                              </div>
                         ))}
                    </div>
                    <button className="store_shelf__arrow store_shelf__arrow--right" onClick={() => scroll('right')} aria-label="Scroll right">
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
               </div>
          </div>
     );
};
