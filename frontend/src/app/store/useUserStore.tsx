import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    name: string
    role: 'admin' | 'user' 
}

interface UserStore {
    isAuthenticated: boolean
    user: User | null
    setUser: (user: User) => void
    logout: () => void
    login: () => void;
}


export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            setUser: (user) => set({ user }),
            logout: () => set({ isAuthenticated: false, user: null }),
            login: () => set({ isAuthenticated: true }),
        }),
        {
            name: 'user-storage', // clave en localStorage
        }
    )
)