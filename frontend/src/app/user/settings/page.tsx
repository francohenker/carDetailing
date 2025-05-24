'use client';

import HeaderDefault from "@/app/header";
import ProtectedRoute from "@/components/ProtectedRoutes";


export default function UserSettings() {
    return (
        <ProtectedRoute allowedRoles={['admin', 'user']}>
            <HeaderDefault />
        </ProtectedRoute>
    )
}