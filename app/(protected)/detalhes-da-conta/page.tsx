"use client";

import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserDto } from "@/resources/User/user.dto";
import { UserResource } from "@/resources/User/user.resource";


function prefillFromLocalStorage(setPerfil: (f: any) => void) {
  try {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("@user_response");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const d = parsed?.axiosResponse?.data;
    const attrs = d?.data?.attributes ?? d?.attributes ?? d ?? {};
    const name = attrs?.name ?? "";
    const email = attrs?.email ?? "";
    if (name || email) {
      setPerfil((s: any) => ({ ...s, name, email }));
    }
  } catch {}
}

function extractUserPayload(res: any) {
  const d = res?.axiosResponse?.data ?? res?.data ?? res;
  const tryMerge = (base: any) => {
    if (!base) return null;
    const core = base?.data ?? base;
    const attrs = core?.attributes ?? core;
    if (attrs && typeof attrs === "object") {
      const id = core?.id ?? attrs?.id ?? d?.data?.id ?? d?.id;
      return { id, ...attrs };
    }
    return null;
  };


  const candidates = [d?.data, d?.data?.attributes?.user, d?.data?.user, d?.user];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c?.getAttribute === "function") {
      return {
        id: c?.getApiId?.(),
        tenant_id: c?.getAttribute("tenant_id"),
        role_id: c?.getAttribute("role_id"),
        avatar_id: c?.getAttribute("avatar_id"),
        name: c?.getAttribute("name"),
        email: c?.getAttribute("email"),
        document_number: c?.getAttribute?.("document_number"),
        phone: c?.getAttribute?.("phone"),
        invited: !!c?.getAttribute?.("invited"),
        created_at: c?.getAttribute?.("created_at"),
        updated_at: c?.getAttribute?.("updated_at"),
        deleted_at: c?.getAttribute?.("deleted_at"),
      };
    }
    const merged = tryMerge(c);
    if (merged) return merged;
  }


  const fallback = tryMerge(d);
  if (fallback) return fallback;
  return {};
}


const perfilSchema = z.object({
  name: z.string().min(2, "Nome e Sobrenome obrigatórios"),
  email: z.string().email("E-mail inválido"),
});

const senhaSchema = z
  .object({
    current_password: z.string().min(1, "Informe sua senha atual"),
    password: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres"),
    password_confirmation: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "A confirmação deve ser igual à nova senha",
    path: ["password_confirmation"],
  });

type PerfilForm = z.infer<typeof perfilSchema>;
type SenhaForm = z.infer<typeof senhaSchema>;

export default function Page() {
  const [userDto, setUserDto] = React.useState<UserDto | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [perfil, setPerfil] = React.useState<PerfilForm>({
    name: "",
    email: "",
  });
  const [sendingPerfil, setSendingPerfil] = React.useState(false);
  const [perfilErrors, setPerfilErrors] = React.useState<Partial<Record<keyof PerfilForm, string>>>({});
  const [senha, setSenha] = React.useState<SenhaForm>({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [sendingSenha, setSendingSenha] = React.useState(false);
  const [senhaErrors, setSenhaErrors] = React.useState<Partial<Record<keyof SenhaForm, string>>>({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUser(true);
        prefillFromLocalStorage(setPerfil);
        const res = await UserResource.loadAuthenticated();
        const u = extractUserPayload(res);

        const dto = new UserDto();
        dto.id = (u?.id ?? "")?.toString?.() ?? "";
        dto.tenant_id = u?.tenant_id ?? undefined;
        dto.role_id = u?.role_id ?? null;
        dto.avatar_id = u?.avatar_id ?? null;
        dto.name = u?.name ?? "";
        dto.email = u?.email ?? "";
        dto.document_number = u?.document_number ?? null;
        dto.phone = u?.phone ?? null;
        dto.invited = !!u?.invited;
        dto.created_at = u?.created_at;
        dto.updated_at = u?.updated_at;
        dto.deleted_at = u?.deleted_at ?? null;

        if (!mounted) return;
        setUserDto(dto);
        setPerfil({ name: dto.name ?? "", email: dto.email ?? "" });
      } catch (e) {
        if (!mounted) return;
        toast.error("Não foi possível carregar os dados da conta.");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);


  async function onSubmitPerfil(e: React.FormEvent) {
    e.preventDefault();
    setPerfilErrors({});
    const parsed = perfilSchema.safeParse(perfil);

    if (!parsed.success) {
      const map: Partial<Record<keyof PerfilForm, string>> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as keyof PerfilForm] = i.message));
      setPerfilErrors(map);
      toast.error("Corrija os campos destacados.");
      return;
    }

    if (!userDto) {
      toast.error("Usuário não carregado.");
      return;
    }

    const name = parsed.data.name.trim();

    const dtoToSave = new UserDto();
    dtoToSave.id = userDto.id;
    dtoToSave.tenant_id = userDto.tenant_id;
    dtoToSave.role_id = userDto.role_id ?? null;
    dtoToSave.avatar_id = userDto.avatar_id ?? null;
    dtoToSave.name = name;
    dtoToSave.email = parsed.data.email;
    dtoToSave.document_number = userDto.document_number ?? null;
    dtoToSave.phone = userDto.phone ?? null;
    dtoToSave.invited = userDto.invited;

    try {
      setSendingPerfil(true);

      await UserResource.saveAuthenticated({ id: userDto.id, ...dtoToSave.bindToSave() });

      toast.success("Informações atualizadas com sucesso.");
      setUserDto({ ...userDto, name, email: parsed.data.email });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Não foi possível atualizar seu perfil.";
      toast.error(msg);
    } finally {
      setSendingPerfil(false);
    }
  }

  
  async function onSubmitSenha(e: React.FormEvent) {
    e.preventDefault();
    setSenhaErrors({});
    const parsed = senhaSchema.safeParse(senha);

    if (!parsed.success) {
      const map: Partial<Record<keyof SenhaForm, string>> = {};
      parsed.error.issues.forEach((i) => (map[i.path[0] as keyof SenhaForm] = i.message));
      setSenhaErrors(map);
      toast.error("Corrija os campos destacados.");
      return;
    }

    if (!userDto?.id) {
      toast.error("Usuário não carregado.");
      return;
    }

    try {
      setSendingSenha(true);

      await UserResource.updatePassword({
        user_id: userDto.id!,
        password: parsed.data.password,
        current_password: parsed.data.current_password,
      });

      toast.success("Senha alterada com sucesso.");
      setSenha({ current_password: "", password: "", password_confirmation: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Não foi possível alterar a senha.";
      toast.error(msg);
    } finally {
      setSendingSenha(false);
    }
  }

  return (
    <section className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Configurações da conta</h1>
        <p className="text-sm text-muted-foreground">Visualize e atualize seus dados pessoais e de acesso.</p>
      </header>

      <Card role="region" aria-labelledby="titulo-infos-basicas">
        <CardHeader>
          <CardTitle id="titulo-infos-basicas">Informações básicas</CardTitle>
          <CardDescription>Atualize seus dados de perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitPerfil} className="grid gap-4 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome e Sobrenome</Label>
            <Input
              id="name"
              value={perfil.name}
              onChange={(e) => setPerfil((s) => ({ ...s, name: e.target.value }))}
              aria-invalid={!!perfilErrors.name}
              disabled={loadingUser}
            />
            {perfilErrors.name && <p className="text-sm text-destructive">{perfilErrors.name}</p>}
          </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil((s) => ({ ...s, email: e.target.value }))}
                aria-invalid={!!perfilErrors.email}
                disabled={loadingUser}
              />
              {perfilErrors.email && <p className="text-sm text-destructive">{perfilErrors.email}</p>}
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={sendingPerfil || loadingUser} aria-busy={sendingPerfil || loadingUser}>
                {sendingPerfil ? "Salvando..." : loadingUser ? "Carregando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card role="region" aria-labelledby="titulo-trocar-senha">
        <CardHeader>
          <CardTitle id="titulo-trocar-senha">Trocar senha</CardTitle>
          <CardDescription>Atualize sua senha para manter sua conta segura.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitSenha} className="grid gap-4 max-w-xl">
            <div className="grid gap-2">
              <Label htmlFor="current_password">Senha atual</Label>
              <Input
                id="current_password"
                type="password"
                value={senha.current_password}
                onChange={(e) => setSenha((s) => ({ ...s, current_password: e.target.value }))}
                aria-invalid={!!senhaErrors.current_password}
              />
              {senhaErrors.current_password && <p className="text-sm text-destructive">{senhaErrors.current_password}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={senha.password}
                onChange={(e) => setSenha((s) => ({ ...s, password: e.target.value }))}
                aria-invalid={!!senhaErrors.password}
              />
              {senhaErrors.password && <p className="text-sm text-destructive">{senhaErrors.password}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password_confirmation">Confirmar nova senha</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={senha.password_confirmation}
                onChange={(e) => setSenha((s) => ({ ...s, password_confirmation: e.target.value }))}
                aria-invalid={!!senhaErrors.password_confirmation}
              />
              {senhaErrors.password_confirmation && (
                <p className="text-sm text-destructive">{senhaErrors.password_confirmation}</p>
              )}
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={sendingSenha || loadingUser} aria-busy={sendingSenha || loadingUser}>
                {sendingSenha ? "Salvando..." : loadingUser ? "Carregando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}


