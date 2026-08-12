import { useState, useMemo, useEffect } from 'react';
import type { CategoriesPageData } from '../types/categories.types';
import type { Category } from '../types/categories.api.types';
import type { AuthRole } from '../../auth/types/auth.types';
import Category_Card from '../components/category_card/Category_Card';
import Category_Modal from '../components/category_modal/Category_Modal';
import Manage_Category_Books_Modal from '../components/manage_category_books_modal/Manage_Category_Books_Modal';
import Book_Upload_Modal from '../../books/components/book_upload_modal/Book_Upload_Modal';
import { useCategories } from '../hooks/use_categories';
import { useBooks } from '../../books/hooks/use_books';
import { useDebounce } from '../../../hooks/use_debounce';
import './Categories_Page.scss';

interface CategoriesPageProps {
     data: CategoriesPageData;
     role: AuthRole | 'SUPERADMIN';
}

const CAN_MANAGE_ROLES: Array<AuthRole | 'SUPERADMIN'> = [
     'SUPERADMIN',
     'ADMIN',
];

// ── Search icon ───────────────────────────────────────────────────────────────

const SearchIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
     </svg>
);

const PlusIcon = () => (
     <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
     >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
     </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

const Categories_Page = ({ data, role }: CategoriesPageProps) => {
     const canManage = CAN_MANAGE_ROLES.includes(role);
     const [query, setQuery] = useState('');
     const debouncedQuery = useDebounce(query, 300);

     const {
          categories,
          isLoading,
          fetchCategories,
          createCategory,
          updateCategory,
          deleteCategory,
          assignBooksToCategory,
     } = useCategories();
     const { createBook } = useBooks();

     const [isModalOpen, setIsModalOpen] = useState(false);
     const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(
          null
     );
     const [isManageBooksOpen, setIsManageBooksOpen] = useState(false);
     const [activeCategoryForBooks, setActiveCategoryForBooks] = useState<Category | null>(null);
     const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
     const [activeCategoryForUpload, setActiveCategoryForUpload] = useState<Category | null>(null);

     useEffect(() => {
          fetchCategories();
     }, [fetchCategories]);

     const filteredCategories = useMemo(() => {
          if (!debouncedQuery.trim()) return categories;
          const q = debouncedQuery.toLowerCase().trim();
          return categories.filter((cat) =>
               cat.category_name.toLowerCase().includes(q)
          );
     }, [categories, debouncedQuery]);


     const handleAddClick = () => {
          setCategoryToEdit(null);
          setIsModalOpen(true);
     };

     const handleEditClick = (category: Category) => {
          setCategoryToEdit(category);
          setIsModalOpen(true);
     };

     const handleDeleteClick = async (id: string) => {
          if (
               window.confirm('Are you sure you want to delete this category?')
          ) {
               await deleteCategory(id);
          }
     };

     const handleModalSubmit = async (payload: { category_name: string }) => {
          if (categoryToEdit) {
               await updateCategory(categoryToEdit.id, payload);
          } else {
               await createCategory(payload);
          }
     };

     const handleManageBooksClick = (category: Category) => {
          setActiveCategoryForBooks(category);
          setIsManageBooksOpen(true);
     };

     const handleAssignBooksSubmit = async (bookIds: string[]) => {
          if (activeCategoryForBooks) {
               await assignBooksToCategory(activeCategoryForBooks.id, bookIds);
          }
     };

     const handleUploadBookClick = (category: Category) => {
          setActiveCategoryForUpload(category);
          setIsUploadModalOpen(true);
     };

     const handleBookUploadSubmit = async (payload: any) => {
          await createBook(payload);
          await fetchCategories(true);
     };

     return (
          <section
               className="categories_page"
               aria-labelledby="categories-heading"
          >
               {/* ── Page header ─────────────────────────────────────────── */}
               <div className="categories_page__header">
                    <div className="categories_page__header_text">
                         <h1
                              id="categories-heading"
                              className="categories_page__title"
                         >
                              {data.page_title}
                         </h1>
                         <p className="categories_page__subtitle">
                              {data.page_description}
                         </p>
                    </div>

                    {canManage && (
                         <button
                              type="button"
                              className="categories_page__add_btn"
                              id="add-category-btn"
                              onClick={handleAddClick}
                         >
                              <PlusIcon />
                              {data.add_button_label}
                         </button>
                    )}
               </div>

               {/* ── Search bar ──────────────────────────────────────────── */}
               <div className="categories_page__search_wrap">
                    <span className="categories_page__search_icon">
                         <SearchIcon />
                    </span>
                    <input
                         id="categories-search"
                         type="search"
                         className="categories_page__search"
                         placeholder={data.search_placeholder}
                         value={query}
                         onChange={(e) => setQuery(e.target.value)}
                         aria-label={data.search_placeholder}
                    />
               </div>

               {/* ── Grid ────────────────────────────────────────────────── */}
               {isLoading && categories.length === 0 ? (
                    <div className="categories_page__empty">
                         <p>Loading categories...</p>
                    </div>
               ) : filteredCategories.length > 0 ? (
                    <div className="categories_page__grid">
                         {filteredCategories.map((category) => {
                              const parent = category.parent_id
                                   ? categories.find((c) => c.id === category.parent_id)
                                   : null;
                              return (
                                   <Category_Card
                                        key={category.id}
                                        category={category}
                                        parentName={parent?.category_name}
                                        canManage={canManage}
                                        onEdit={() => handleEditClick(category)}
                                        onDelete={() =>
                                             handleDeleteClick(category.id)
                                        }
                                        onManageBooks={() => handleManageBooksClick(category)}
                                        onUploadBook={() => handleUploadBookClick(category)}
                                   />
                              );
                         })}
                    </div>
               ) : (
                    <div className="categories_page__empty">
                         <p>{data.empty_label}</p>
                    </div>
               )}

               <Category_Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    categoryToEdit={categoryToEdit}
                    categories={categories}
               />

               {activeCategoryForBooks && (
                    <Manage_Category_Books_Modal
                         isOpen={isManageBooksOpen}
                         onClose={() => {
                              setIsManageBooksOpen(false);
                              setActiveCategoryForBooks(null);
                         }}
                         category={activeCategoryForBooks}
                         onAssign={handleAssignBooksSubmit}
                    />
               )}

               {activeCategoryForUpload && (
                    <Book_Upload_Modal
                         isOpen={isUploadModalOpen}
                         onClose={() => {
                              setIsUploadModalOpen(false);
                              setActiveCategoryForUpload(null);
                         }}
                         onSubmit={handleBookUploadSubmit}
                         initialCategoryId={activeCategoryForUpload.id}
                    />
               )}
          </section>
     );
};

export default Categories_Page;
