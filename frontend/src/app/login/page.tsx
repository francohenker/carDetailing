import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HeaderDefault from "../header"

export default function login() {
    return (
        <div className="flex min-h-screen flex-col bg-base-100 bg"  >
            <HeaderDefault />

            <div className="flex items-center justify-center min-h-screen bg-base-100">
                <Card className="w-full max-w-md ">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
                        <CardDescription className="text-center">
                            Ingresa tus credenciales para acceder
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Nombre de usuario</Label>
                            <Input id="username" placeholder="Ingresa tu nombre de usuario" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" type="password" placeholder="Ingresa tu contraseña" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
            
                        <button className="w-full btn btn-neutral ">Iniciar Sesión</button>
            
                        <button className="w-full btn btn-ghost">Olvide mi contraseña</button>
                        <span className="text-center text-sm text-base-content/70">
                            ¿No tienes una cuenta? <a href="/register" className="text-red-500">Registrate</a>
                        </span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}