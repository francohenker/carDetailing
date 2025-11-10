export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auditoria/estadisticas`,
      {
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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