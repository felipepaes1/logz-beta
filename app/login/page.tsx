"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import logoDark from "@/assets/logo-logz-dark.svg"
import logoLight from "@/assets/logo-logz-light.svg"
import { AuthDTO } from "@/dtos/Auth/Auth.dto"
import { AuthResource } from "@/resources/Auth/auth.resource"
import { Loader } from "lucide-react"
import { useTheme } from "next-themes"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { resolvedTheme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const authDTO = new AuthDTO();

    authDTO.force_connection = true;
    authDTO.login = email;
    authDTO.password = password;
    authDTO.force_connection = true;

    setLoading(true);
    AuthResource.login(authDTO)
      .then(() => {
        router.push("/dashboard")
      })
      .catch((error: unknown) => {
        if (error.status === 401) {
            setError("Usuário ou senha incorretos");

            return;
        }

        if (error.message) {
            setError(error.message);
        } else {
            setError("Erro ao fazer login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        {
          !!resolvedTheme && (
            <Image src={
              resolvedTheme && resolvedTheme === "dark" ? logoDark : logoLight
            } alt="Logz Tech" className="mx-auto mb-4 h-32 w-32" />
          )
        }

        <Input
          type="text"
          placeholder="Usuário ou e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <span className="text-destructive text-sm">{error}</span>}
        <Button className="text-white" variant="default" type="submit" disabled={loading}>
          {loading ? <Loader className="mr-2 animate-spin" /> : "Entrar"}
        </Button>
      </form>
    </div>
  )
}
