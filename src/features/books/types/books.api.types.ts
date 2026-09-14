/** One volume of a multi-volume set. Never listed or sold on its own. */
export interface BookVolume {
     id: string;
     volume_number: number | null;
     volume_label: string | null;
     total_pages: number;
     total_chapters: number;
     isbn: string;
     cover_image_url: string;
}

/** A volume waiting to be uploaded from the admin form. */
export interface PendingVolume {
     volume_label: string;
     total_pages: number;
     total_chapters: number;
     book_file: File | null;
}

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
     // Multi-volume sets
     is_set?: boolean;
     volumes?: BookVolume[];
     volume_count?: number;
     set_parent_id?: string | null;
     volume_number?: number | null;
     volume_label?: string | null;
     parent_set?: { id: string; title: string; slug: string } | null;
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
     // A multi-volume set has no file of its own - its volumes are uploaded
     // one at a time after the set itself is created.
     book_file?: File | null;
     is_set?: boolean;
     preview_pages?: File[];
}

export interface AddVolumePayload {
     volume_label?: string;
     volume_number?: number;
     total_pages?: number;
     total_chapters?: number;
     book_file: File;
     cover_image?: File;
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
     is_set?: boolean;
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
