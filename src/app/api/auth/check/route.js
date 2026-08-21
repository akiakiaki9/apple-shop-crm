import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('sessionid');

    if (!session) {
      return NextResponse.json(
        { error: 'Неавторизован' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/api-auth/check/`, {
      headers: { Cookie: `sessionid=${session.value}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}