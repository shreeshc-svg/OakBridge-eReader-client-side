export interface Book {
     id: string;
     title: string;
     slug: string;
     description: string;
     author: string;
     publisher: string;
     language: string;
     isbn: string;
     cover_image_url: string;
     cover_image_alt?: string;
     file_url: string;
     preview_pages: string[];
     preview_pages_alt?: string[];
     total_pages: number;
     total_chapters: number;
     price: number;
     category_ids?: string[];
     access_period_days?: number | null;
     is_active?: boolean;
     isTrending: boolean;
     isNewRelease: boolean;
     createdAt: string;
     updatedAt: string;
}

export interface CreateBookPayload {
     title: string;
     description: string;
     author: string;
     language: string;
     isbn: string;
     total_pages: number;
     total_chapters: number;
     price?: number;
     category_ids?: string[]; // JSON stringified or just sent in FormData
     category_names?: string[];
     access_period_days?: number | null;
     is_active?: boolean;
     isTrending?: boolean;
     isNewRelease?: boolean;
     cover_image_alt?: string;
     preview_pages_alt?: string[];
     cover_image: File;
     book_file: File;
     preview_pages?: File[];
}

export interface UpdateBookPayload {
     title?: string;
     description?: string;
     author?: string;
     language?: string;
     isbn?: string;
     total_pages?: number;
     total_chapters?: number;
     price?: number;
     category_ids?: string[];
     access_period_days?: number | null;
     is_active?: boolean;
     isTrending?: boolean;
     isNewRelease?: boolean;
     cover_image_alt?: string;
     preview_pages_alt?: string[];
     cover_image?: File;
     book_file?: File;
     preview_pages?: File[];
}

export interface BookResponse {
     message: string;
     book: Book;
}

export interface BooksResponse {
     message: string;
     books: Book[];
}
