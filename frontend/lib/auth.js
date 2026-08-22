'use server';

import { cookies } from 'next/headers';

export async function checkAuth() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('sessionid');

        if (!session) {
            return { isAuthenticated: false };
        }

        return { isAuthenticated: true };
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return { isAuthenticated: false };
    }
}

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('sessionid');
        return session?.value || null;
    } catch (error) {
        console.error('Ошибка получения сессии:', error);
        return null;
    }
}