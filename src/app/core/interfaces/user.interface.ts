export interface User {
    user_id?: number;
    name: string;
    last_name:  string;
    company: string;
    email: string;
    password?: string;
    profile_picture_url: string;
}