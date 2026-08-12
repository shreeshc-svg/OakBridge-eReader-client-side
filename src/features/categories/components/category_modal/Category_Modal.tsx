import { useState, useEffect } from 'react';
import type { Category } from '../../types/categories.api.types';
import './Category_Modal.scss';

interface CategoryModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (data: { category_name: string; parent_id?: string | null }) => Promise<void>;
     categoryToEdit?: Category | null;
     categories: Category[];
}

const Category_Modal = ({
     isOpen,
     onClose,
     onSubmit,
     categoryToEdit,
     categories,
}: CategoryModalProps) => {
     const [categoryName, setCategoryName] = useState('');
     const [parentId, setParentId] = useState<string>('');
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
          if (isOpen) {
               // eslint-disable-next-line react-hooks/set-state-in-effect
               setCategoryName(categoryToEdit?.category_name || '');
               setParentId(categoryToEdit?.parent_id || '');
               setError(null);
          }
     }, [isOpen, categoryToEdit]);

     if (!isOpen) return null;

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!categoryName.trim()) {
               setError('Category name is required');
               return;
          }

          setIsLoading(true);
          setError(null);
          try {
               await onSubmit({ 
                    category_name: categoryName, 
                    parent_id: parentId || null 
               });
               onClose();
          } catch (err: unknown) {
               const errorMsg =
                    err instanceof Error ? err.message : 'Something went wrong';
               setError(errorMsg);
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <div className="category_modal__overlay" onClick={onClose}>
               <div
                    className="category_modal__content"
                    onClick={(e) => e.stopPropagation()}
               >
                    <div className="category_modal__header">
                         <h2>
                              {categoryToEdit
                                   ? 'Edit Category'
                                   : 'New Category'}
                         </h2>
                         <button
                              className="category_modal__close"
                              onClick={onClose}
                         >
                              <svg
                                   viewBox="0 0 24 24"
                                   fill="none"
                                   stroke="currentColor"
                                   strokeWidth="2"
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                              >
                                   <line x1="18" y1="6" x2="6" y2="18"></line>
                                   <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                         </button>
                    </div>

                    <form
                         onSubmit={handleSubmit}
                         className="category_modal__form"
                    >
                         {error && (
                              <div className="category_modal__error">
                                   {error}
                              </div>
                         )}

                         <div className="category_modal__field">
                              <label htmlFor="category_name">
                                   Category Name
                              </label>
                              <input
                                   id="category_name"
                                   type="text"
                                   placeholder="e.g. Science Fiction"
                                   value={categoryName}
                                   onChange={(e) =>
                                        setCategoryName(e.target.value)
                                   }
                                   disabled={isLoading}
                                   autoFocus
                              />
                         </div>

                         <div className="category_modal__field">
                              <label htmlFor="parent_id">
                                   Parent Category (Optional)
                              </label>
                              <select
                                   id="parent_id"
                                   value={parentId}
                                   onChange={(e) => setParentId(e.target.value)}
                                   disabled={isLoading}
                                   style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#0f172a',
                                        outline: 'none',
                                        cursor: 'pointer'
                                   }}
                              >
                                   <option value="">None (Top-Level Category)</option>
                                   {categories
                                        .filter((cat) => !cat.parent_id && cat.id !== categoryToEdit?.id)
                                        .map((cat) => (
                                             <option key={cat.id} value={cat.id}>
                                                  {cat.category_name}
                                             </option>
                                        ))}
                              </select>
                         </div>

                         <div className="category_modal__actions">
                              <button
                                   type="button"
                                   className="category_modal__btn--cancel"
                                   onClick={onClose}
                                   disabled={isLoading}
                              >
                                   Cancel
                              </button>
                              <button
                                   type="submit"
                                   className="category_modal__btn--submit"
                                   disabled={isLoading}
                              >
                                   {isLoading ? 'Saving...' : 'Save Category'}
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
};

export default Category_Modal;
