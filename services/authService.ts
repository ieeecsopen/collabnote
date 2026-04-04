// Auth Service - API client for authentication endpoints

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        avatar_url: string | null;
    };
}

interface RegisterResponse {
    message: string;
    user: {
        id: string;
        email: string;
        name: string;
        avatar_url: string | null;
    };
}

interface ApiError {
    error: string;
}

// Token storage
let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;
export const setAccessToken = (token: string | null): void => {
    accessToken = token;
};

// Helper to make authenticated requests
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for refresh token
    });

    // If token expired or missing, try to refresh
    if (response.status === 401) {
        const refreshed = await refreshTokens();
        if (refreshed) {
            // Retry request with new token
            const newAccessToken = getAccessToken();
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
            return fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });
        }
    }

    return response;
};

// Register new user
export const register = async (
    email: string,
    password: string,
    name?: string
): Promise<RegisterResponse> => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error((data as ApiError).error || 'Registration failed');
    }

    return data as RegisterResponse;
};

// Login user
export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error((data as ApiError).error || 'Login failed');
    }

    const authData = data as AuthResponse;
    setAccessToken(authData.accessToken);
    return authData;
};

// Refresh tokens
export const refreshTokens = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) {
            setAccessToken(null);
            return false;
        }

        const data = await response.json() as AuthResponse;
        setAccessToken(data.accessToken);
        return true;
    } catch {
        setAccessToken(null);
        return false;
    }
};

// Logout user
export const logout = async (): Promise<void> => {
    try {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        setAccessToken(null);
    }
};

// Logout from all devices
export const logoutAll = async (): Promise<void> => {
    try {
        await fetch(`${API_BASE}/api/auth/logout-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
    } catch (error) {
        console.error('Logout all error:', error);
    } finally {
        setAccessToken(null);
    }
};

// Check if user is authenticated (try to refresh token)
export const checkAuth = async (): Promise<AuthResponse | null> => {
    try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) {
            setAccessToken(null);
            return null;
        }

        const data = await response.json() as AuthResponse;
        setAccessToken(data.accessToken);
        return data;
    } catch {
        setAccessToken(null);
        return null;
    }
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error((data as ApiError).error || 'Failed to send reset email');
    }
};

// Reset password with token
export const resetPassword = async (token: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error((data as ApiError).error || 'Failed to reset password');
    }
};
