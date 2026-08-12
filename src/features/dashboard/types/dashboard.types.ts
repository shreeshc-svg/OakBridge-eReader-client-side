export type DashboardRole = 'author' | 'user' | 'superadmin';

export type DashboardSidebarIcon =
     | 'dashboard'
     | 'books'
     | 'add'
     | 'drafts'
     | 'reviews'
     | 'analytics'
     | 'earnings'
     | 'settings'
     | 'discover'
     | 'reading'
     | 'bookmark'
     | 'notes'
     | 'history';

export interface DashboardNavbarData {
     brand_mark: string;
     brand_name: string;
     search_placeholder: string;
     nav_items: string[];
     active_item: string;
}

export interface DashboardLogoutData {
     idle_label: string;
     pending_label: string;
     error_fallback: string;
}

export interface DashboardSidebarItem {
     label: string;
     path: string;
     icon: DashboardSidebarIcon;
}

export interface DashboardSidebarSection {
     title: string;
     items: DashboardSidebarItem[];
}

export interface DashboardSidebarData {
     label: string;
     sections: DashboardSidebarSection[];
}

export interface DashboardLayoutData {
     superadmin_navbar: DashboardNavbarData;
     user_navbar: DashboardNavbarData;
     sidebar: Record<DashboardRole, DashboardSidebarData>;
     logout: DashboardLogoutData;
}

// ── Legacy metric strip (kept for backwards-compat, not used in new design) ──

export interface DashboardOverviewMetric {
     label: string;
     value: string;
     change: string;
     tone: 'amber' | 'ink' | 'green' | 'violet';
}

export interface DashboardOverviewProject {
     label: string;
     title: string;
     meta: string;
     progress_label: string;
     progress_value: number;
}

export interface DashboardOverviewListItem {
     label: string;
     value: string;
     meta: string;
}

export interface DashboardOverviewCardLine {
     title: string;
     meta: string;
     quantity: string;
}

export interface DashboardOverviewCard {
     owner: string;
     reference: string;
     status: string;
     tone: 'amber' | 'green' | 'violet' | 'rose' | 'ink';
     primary_label: string;
     primary_value: string;
     secondary_label: string;
     secondary_value: string;
     items: DashboardOverviewCardLine[];
     extra_items: string;
     note_label: string;
     note: string;
     action_label: string;
}

// ── Superadmin-specific types ─────────────────────────────────────────────────────

export interface SuperadminPipelineBucket {
     status: string;
     count: number;
     sub_label: string;
     tone: 'violet' | 'amber' | 'green' | 'ink';
     progress: number; // 0–100, visual fill percentage
}

export interface SuperadminWritingGoal {
     label: string;
     current: number;
     target: number;
     unit: string;
}

export interface SuperadminRevenuePoint {
     month: string;
     value: number;
}

export interface SuperadminFeaturedManuscript {
     title: string;
     subtitle: string;
     edit_pass: string;
     reviewer_notes: number;
     word_count: string;
     launch_readiness: number; // 0–100
}

// ── User-specific types ───────────────────────────────────────────────────────

export interface UserNowReading {
     id?: string;
     title: string;
     author: string;
     chapter: string;
     progress: number; // 0–100
     gradient_from: string; // CSS color
     gradient_to: string; // CSS color
     time_left: string;
     cover_url?: string;
}

export interface UserShelfBook {
     id: string;
     title: string;
     author: string;
     meta?: string;
     color: string; // spine color
     cover_url?: string;
}

export interface UserShelf {
     label: string;
     books: UserShelfBook[];
}

export interface UserStreakDay {
     date: string; // ISO date string e.g. "2026-06-22"
     minutes: number; // minutes read that day, 0 = no reading
}

export interface UserReadingStats {
     streak_days: number;
     minutes_this_week: number;
     books_finished: number;
     streak_label: string;
     minutes_label: string;
     books_label: string;
}

// ── Combined overview data (Superadmin) ──────────────────────────────────────────

export interface DashboardOverviewData {
     eyebrow: string;
     title: string;
     description: string;
     primary_action: string;
     secondary_action: string;
     metrics: DashboardOverviewMetric[];
     project: DashboardOverviewProject;
     activity_title: string;
     activity_items: DashboardOverviewListItem[];
     shelf_title: string;
     shelf_items: DashboardOverviewListItem[];
     cards: DashboardOverviewCard[];
     // Superadmin extras
     pipeline?: SuperadminPipelineBucket[];
     writing_goal?: SuperadminWritingGoal;
     revenue_chart?: SuperadminRevenuePoint[];
     featured_manuscript?: SuperadminFeaturedManuscript;
     // User extras
     now_reading?: UserNowReading[];
     shelves?: UserShelf[];
     streak_data?: UserStreakDay[];
     reading_stats?: UserReadingStats;
}
