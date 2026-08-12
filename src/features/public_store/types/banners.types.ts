export interface Banner {
     id: string;
     title: string;
     subtitle?: string;
     image_url: string;
     image_alt?: string;
     link_url?: string;
     button_text?: string;
     is_active: boolean;
     order: number;
}

export interface BannersResponse {
     banners: Banner[];
}
