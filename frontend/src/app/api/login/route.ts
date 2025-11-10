// import { access } from 'fs';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { email, password } = body;

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Error al iniciar sesión' },
                { status: 401 }
            );
        }

        const data = await response.json();

        // Create response with data
        const res = NextResponse.json({
            access_token: data.access_token,
            success: true,
            name: data.name,
            role: data.role
        });

        res.cookies.set({
            name: "jwt",
            value: data.access_token,
            httpOnly: true,
            path: "/",
            sameSite: "strict",
        });
        return res;
    } catch {
        return NextResponse.json(
            { error: 'Error al iniciar sesión' },
            { status: 500 }
        );
    }
}