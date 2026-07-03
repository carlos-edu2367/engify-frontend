import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useUsers } from "@/hooks/useMembros";
import { useAuthStore } from "@/store/auth.store";
import { integracaoService, type AuthorizeArcaikaRequest } from "@/services/integracao.service";

// Descrições legíveis dos escopos solicitados.
const SCOPE_LABELS: Record<string, string> = {
  "obras:read": "Consultar o status das suas obras",
  "obras:write": "Criar e atualizar obras a partir de orçamentos aceitos",
  "webhooks:manage": "Enviar atualizações de obra de volta ao Arcaika",
};

// Papéis elegíveis a responsável por obra (usuários internos).
const RESPONSAVEL_ROLES = new Set(["admin", "engenheiro", "financeiro", "super_admin"]);

function useOAuthParams() {
  const [params] = useSearchParams();
  return {
    client_id: params.get("client_id") ?? "",
    redirect_uri: params.get("redirect_uri") ?? "",
    scope: params.get("scope") ?? "",
    code_challenge: params.get("code_challenge") ?? "",
    code_challenge_method: params.get("code_challenge_method") ?? "S256",
    state: params.get("state"),
    arcaika_organizacao_id: params.get("arcaika_organizacao_id") ?? "",
  };
}

export function ArcaikaConsentPage() {
  const p = useOAuthParams();
  const user = useAuthStore((s) => s.user);
  const { data: users, isLoading: loadingUsers } = useUsers();
  const [responsavelId, setResponsavelId] = useState("");

  const missing = !p.client_id || !p.redirect_uri || !p.scope || !p.code_challenge || !p.arcaika_organizacao_id;
  const scopes = useMemo(() => p.scope.split(" ").filter(Boolean), [p.scope]);

  const responsavelOptions = useMemo(
    () =>
      (users ?? [])
        .filter((u) => RESPONSAVEL_ROLES.has(u.role))
        .map((u) => ({ value: u.user_id, label: `${u.nome} · ${u.role}` })),
    [users]
  );

  const authorize = useMutation({
    mutationFn: (data: AuthorizeArcaikaRequest) => integracaoService.authorizeArcaika(data),
    onSuccess: ({ redirect_to }) => {
      // Volta o browser para o callback do Arcaika com o authorization code.
      window.location.assign(redirect_to);
    },
    onError: () => {
      toast.error("Não foi possível concluir a autorização. Tente novamente.");
    },
  });

  function handleAuthorize() {
    if (!responsavelId) {
      toast.error("Escolha o responsável padrão das obras.");
      return;
    }
    authorize.mutate({
      client_id: p.client_id,
      redirect_uri: p.redirect_uri,
      scope: p.scope,
      code_challenge: p.code_challenge,
      code_challenge_method: p.code_challenge_method,
      state: p.state,
      arcaika_organizacao_id: p.arcaika_organizacao_id,
      default_responsavel_id: responsavelId,
    });
  }

  function handleCancel() {
    if (p.redirect_uri) {
      const sep = p.redirect_uri.includes("?") ? "&" : "?";
      const st = p.state ? `&state=${encodeURIComponent(p.state)}` : "";
      window.location.assign(`${p.redirect_uri}${sep}error=access_denied${st}`);
      return;
    }
    window.location.assign("/dashboard");
  }

  if (missing) {
    return (
      <ConsentShell>
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-xl">Solicitação inválida</CardTitle>
            </div>
            <CardDescription>
              Faltam parâmetros obrigatórios na URL de autorização. Reinicie a conexão pelo Arcaika.
            </CardDescription>
          </CardHeader>
        </Card>
      </ConsentShell>
    );
  }

  return (
    <ConsentShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Conectar ao Arcaika</CardTitle>
          </div>
          <CardDescription>
            O Arcaika quer se conectar ao seu time{user?.nome ? ` (${user.nome})` : ""} para criar obras
            automaticamente quando um orçamento for aceito.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">Organização Arcaika</p>
            <p className="truncate font-mono text-sm">{p.arcaika_organizacao_id}</p>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Permissões solicitadas
            </p>
            <ul className="space-y-1.5">
              {scopes.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {SCOPE_LABELS[s] ?? s}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="responsavel">Responsável padrão das obras</Label>
            <SearchableSelect
              value={responsavelId}
              onChange={setResponsavelId}
              options={responsavelOptions}
              placeholder={loadingUsers ? "Carregando..." : "Selecione um responsável"}
              allOptionLabel="Selecione um responsável"
              emptyMessage="Nenhum usuário elegível"
            />
            <p className="text-xs text-muted-foreground">
              Toda obra criada pela integração será atribuída a esta pessoa (você pode alterar cada obra depois).
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel} disabled={authorize.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleAuthorize} disabled={authorize.isPending || !responsavelId}>
            {authorize.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Autorizar
          </Button>
        </CardFooter>
      </Card>
    </ConsentShell>
  );
}

function ConsentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">{children}</div>
  );
}
