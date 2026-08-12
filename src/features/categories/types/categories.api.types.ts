export interface Category {
     id: string;
     category_name: string;
     slug: string;
     parent_id?: string | null;
     book_count?: number;
     createdAt: string;
     updatedAt: string;
}

export interface CreateCategoryPayload {
     category_name: string;
     parent_id?: string | null;
}

export interface UpdateCategoryPayload {
     category_name: string;
     parent_id?: string | null;
}

export interface CategoryResponse {
     message: string;
     category: Category;
}

export interface CategoriesResponse {
     message: string;
     categories: Category[];
}
