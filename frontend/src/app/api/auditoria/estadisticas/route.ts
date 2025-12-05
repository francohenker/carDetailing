export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verificar que el token esté presente
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auditoria/estadisticas`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Token inválido o expirado' },
          { status: 401 }
        )
      }
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching auditoria estadisticas:', error);
    return NextResponse.json(
      { error: 'Error fetching auditoria estadisticas' },
      { status: 500 }
    );
  }
}