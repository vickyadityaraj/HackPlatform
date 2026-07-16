export interface Team {
    id: string;
    full_name: string;
    team_members: string[];
    final_score?: number;
    assigned_mentor_id?: string;
    completed_reviews?: string[];
    created_at?: string;
    github_link?: string;
    table_no?: string;
}

export interface User {
    id: string;
    login_id: string;
    role: 'admin' | 'judge' | 'team' | 'coordinator';
    phone?: string;
    full_name: string;
    email?: string;
    mentor_group_id?: string;
    mentor_group?: {
        id: string;
        name: string;
    };
    created_at?: string;
}

export interface MentorGroup {
    id: string;
    name: string;
    created_at: string;
}
