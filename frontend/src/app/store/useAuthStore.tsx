import { toast } from "sonner";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: {
        id: number;
        role: string;
        description: string;
        permissions: Array<{
            id: number;
            permission: string;
            description: string | null;
        }>;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ role: string }>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    setIsLoading: (isLoading: boolean) => void;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true, // Inicialmente, estamos cargando
            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    console.log('useAuthStore login: ', process.env.NEXT_PUBLIC_BACKEND_URL);
                    console.log('email: ', email, 'password: ', password);
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ email, password }),
                        },
                    );
                    // console.log(response);
                    if (!response.ok) {
                        toast.error("Credenciales incorrectas");
                        throw new Error("Credenciales incorrectas");
                    }
                    const data = await response.json();
                    console.log('data: ', data);
                    set({
                        user: data.user,
                        token: data.access_token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return data.user.role;
                } catch (error) {
                    const errorMessage =
                        error instanceof Error ? error.message : "Error desconocido";
                    toast.error(`Error de login ${errorMessage}`);
                    set({ isLoading: false });
                    throw error;
                }
            },
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                window.location.href = "/login";
            },
            hasPermission: (permission: string) => {
                const { user } = get();
                return (
                    user?.role.permissions.some((p) => p.permission === permission) ||
                    false
                );
            },
            setIsLoading: (isLoading: boolean) => set({ isLoading }),
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                // Cuando el estado se rehidrata, establecemos isLoading en false
                state?.setIsLoading(false);
            },
        },
    ),
);

export default useAuthStore;