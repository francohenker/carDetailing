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

    const { searchParams } = new URL(request.url);
    
    // Obtener los parámetros de consulta
    const params = new URLSearchParams();
    
    // Agregar parámetros de filtro si existen
    const filters = ['accion', 'entidad', 'entidadId', 'usuarioId', 'fechaInicio', 'fechaFin', 'page', 'limit'];
    
    filters.forEach(filter => {
      const value = searchParams.get(filter);
      if (value) {
        if(value === 'ALL') return; // Skip 'ALL' values
        else params.append(filter, value);
      }
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auditoria?${params.toString()}`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
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
    console.error('Error fetching auditoria:', error);
    return NextResponse.json(
      { error: 'Error fetching auditoria data' },
      { status: 500 }
    );
  }
}