import type { Category } from '../../types/categories.api.types';
import './Category_Card.scss';

interface CategoryCardProps {
     category: Category;
     canManage: boolean;
     parentName?: string;
     onEdit?: () => void;
     onDelete?: () => void;
     onManageBooks?: () => void;
     onUploadBook?: () => void;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const CategoryIconSVG = ({ icon }: { icon: string }) => {
     const paths: Record<string, React.ReactElement> = {
          fiction: (
               <>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
               </>
          ),
          'non-fiction': (
               <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
               </>
          ),
          science: (
               <>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
               </>
          ),
          mystery: (
               <>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
               </>
          ),
          'self-help': (
               <>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
               </>
          ),
          romance: (
               <>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
               </>
          ),
          fantasy: (
               <>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
               </>
          ),
          children: (
               <>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
               </>
          ),
          biography: (
               <>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
               </>
          ),
     };

     return (
          <svg
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="1.75"
               strokeLinecap="round"
               strokeLinejoin="round"
               aria-hidden="true"
          >
               {paths[icon]}
          </svg>
     );
};

// ── Edit, Delete & Manage Books icons ─────────────────────────────────────────

const UploadIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
     </svg>
);

const BooksIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M12 6h4" />
          <path d="M12 10h4" />
          <path d="M12 14h4" />
     </svg>
);

const EditIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
     </svg>
);

const DeleteIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
     </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

const Category_Card = ({
     category,
     canManage,
     parentName,
     onEdit,
     onDelete,
     onManageBooks,
     onUploadBook,
}: CategoryCardProps) => {
     return (
          <article
               className={`category_card category_card--gray`}
               id={`category-${category.id}`}
          >
               <div className="category_card__icon_wrap">
                    <CategoryIconSVG icon="fiction" />
               </div>

               <div className="category_card__body">
                    {parentName && (
                         <span style={{ fontSize: '11px', fontWeight: '700', color: '#ff7a36', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
                              {parentName}
                         </span>
                    )}
                    <h3 className="category_card__title">
                         {category.category_name}
                    </h3>
                    <p className="category_card__desc">
                         Created at{' '}
                         {new Date(category.createdAt).toLocaleDateString()}
                    </p>

                    <div className="category_card__tags">
                         <span className="category_card__tag">Tag</span>
                    </div>
               </div>

               <div className="category_card__footer">
                    <div className="category_card__stats">
                         <span>
                              <strong>{category.book_count ?? 0}</strong> books
                         </span>
                    </div>

                    {canManage && (
                         <div className="category_card__actions">
                              <button
                                   type="button"
                                   className="category_card__action_btn category_card__action_btn--upload"
                                   aria-label={`Upload book to ${category.category_name}`}
                                   onClick={onUploadBook}
                              >
                                   <UploadIcon />
                              </button>
                              <button
                                   type="button"
                                   className="category_card__action_btn category_card__action_btn--manage"
                                   aria-label={`Manage books in ${category.category_name}`}
                                   onClick={onManageBooks}
                              >
                                   <BooksIcon />
                              </button>
                              <button
                                   type="button"
                                   className="category_card__action_btn category_card__action_btn--edit"
                                   aria-label={`Edit ${category.category_name}`}
                                   onClick={onEdit}
                              >
                                   <EditIcon />
                              </button>
                              <button
                                   type="button"
                                   className="category_card__action_btn category_card__action_btn--danger"
                                   aria-label={`Delete ${category.category_name}`}
                                   onClick={onDelete}
                              >
                                   <DeleteIcon />
                              </button>
                         </div>
                    )}
               </div>
          </article>
     );
};

export default Category_Card;
