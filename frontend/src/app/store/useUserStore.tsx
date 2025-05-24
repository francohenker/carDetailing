import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    name: string
    role: 'admin' | 'user' 
}

interface UserStore {
    user: User | null
    setUser: (user: User) => void
    logout: () => void
}


export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            logout: () => set({ user: null }),
        }),
        {
            name: 'user-storage', // clave en localStorage
        }
    )
)