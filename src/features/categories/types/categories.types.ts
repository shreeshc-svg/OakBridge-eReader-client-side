export type CategoryColor =
     | 'violet'
     | 'amber'
     | 'blue'
     | 'rose'
     | 'green'
     | 'pink'
     | 'indigo'
     | 'orange'
     | 'teal';

export type CategoryIcon =
     | 'fiction'
     | 'non-fiction'
     | 'science'
     | 'mystery'
     | 'self-help'
     | 'romance'
     | 'fantasy'
     | 'children'
     | 'biography';

export interface Category {
     id: string;
     name: string;
     slug: string;
     description: string;
     color: CategoryColor;
     icon: CategoryIcon;
     book_count: number;
     author_count: number;
     featured: boolean;
     tags: string[];
}

export interface CategoriesPageData {
     page_title: string;
     page_description: string;
     add_button_label: string;
     search_placeholder: string;
     empty_label: string;
     categories: Category[];
}
