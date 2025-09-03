"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import logoDark from "@/assets/logo-logz-dark.svg"
import heroMock  from "@/assets/auth-mockup.png"
import { AuthDTO } from "@/dtos/Auth/Auth.dto"
import { AuthResource } from "@/resources/Auth/auth.resource"
import { Loader } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import EyeSvg from "@/assets/icons-figma/EyeBlue.svg"
import CurrencyDollarSvg from "@/assets/icons-figma/CurrencyDollarBlue.svg"
import BellRingingSvg from "@/assets/icons-figma/BellRingingBlue.svg"
import ChartLineSvg from "@/assets/icons-figma/ChartLineBlue.svg"
import CloudArrowUpSvg from "@/assets/icons-figma/CloudArrowUpBlue.svg"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex basis-[65%] flex-col items-center justify-center bg-gray-100">

      <Image
        src={heroMock}
        alt="Aplicativo LogZ em notebook e celular"
        className="w-1/2 max-w-xs object-contain"
        priority
      />
      <Carousel
        className="mt-20 w-[700px] overflow-visible"
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
      >
        <CarouselContent className="!ml-0">
          {[
            {
              icon: CurrencyDollarSvg,
              title: "Redução de custos",
              desc: "Economize até 15 % com a plataforma.",
            },
            {
              icon: EyeSvg,
              title: "Controle em tempo real",
              desc: "Saiba tudo que acontece no estoque.",
            },
            {
              icon: BellRingingSvg,
              title: "Notificações urgentes",
              desc: "Receba alertas de reposição imediata.",
            },
            {
              icon: ChartLineSvg,
              title: "Dashboards claros",
              desc: "Indicadores atualizados 24 horas por dia.",
            },
            {
              icon: CloudArrowUpSvg,
              title: "Implantação rápida",
              desc: "Pronto para uso em poucas horas.",
            },
          ].map((s, i) => (
            <CarouselItem key={i} className="basis-1/3 p-2">
              <div className="flex flex-col h-60 gap-4 rounded-xl bg-white p-6 shadow">
                <Image
                  src={s.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain text-blue-600"
                />
                <h3 className="text-xl font-bold text-black-700 dark:text-white">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="text-blue-600 hover:text-blue-800" />
        <CarouselNext className="text-blue-600 hover:text-blue-800" />
      </Carousel>
      </div>

      <div className="flex flex-col basis-full lg:basis-[35%] items-center justify-center bg-black px-8 py-12">
        <Image
          src={logoDark}
          alt="LogZ Tech"
          className="mb-6 h-32 w-32"
          priority
        />

        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-4 text-white"
        >
          <Input
            placeholder="Login"
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

          <small className="text-right text-xs opacity-70">
            Esqueceu sua senha?{" "}
            <button
              type="button"
              className="underline transition-opacity hover:opacity-100"
            >
              Clique aqui
            </button>
          </small>

          {error && <span className="text-destructive text-sm">{error}</span>}

          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <Loader className="mr-2 size-4 animate-spin" />
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
