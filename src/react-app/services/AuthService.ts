import { supabase } from '../lib/supabaseClient';

export interface User {
    id: string;
    username: string;
    role: 'admin' | 'staff';
    name: string;
    branch?: string;
}

class AuthService {
    private USER_KEY = 'user';

    async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
        console.log(`🔐 Attempting login for user: ${username} via Supabase`);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, password, role, name, branch')
                .eq('username', username)
                .single();

            if (error || !data) {
                console.error('Login failed: User not found');
                return { success: false, error: 'Invalid username or password' };
            }

            // Simple password check (plain text as in original)
            if (data.password !== password) {
                console.error('Login failed: Incorrect password');
                return { success: false, error: 'Invalid username or password' };
            }

            const user: User = {
                id: data.id,
                username: data.username,
                role: data.role,
                name: data.name,
                branch: data.branch
            };

            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return { success: true, user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network Error: Unable to reach Supabase. Please check your connection.' };
        }
    }

    logout() {
        localStorage.removeItem(this.USER_KEY);
        window.location.href = '/login';
    }

    getCurrentUser(): User | null {
        try {
            const userStr = localStorage.getItem(this.USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getCurrentUser();
    }

    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    }
}

export const authService = new AuthService();
