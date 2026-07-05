import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar ou Cadastrar — TopDJ" }, { name: "robots", content: "noindex" }],
  }),
  component: Login,
});

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Entrar
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Cadastrar
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupError, setSignupError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/perfil" });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: "/perfil" });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleGoogleAuth() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/perfil`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Erro ao conectar com Google");
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
    });

    if (authError) {
      setLoginError(authError.message);
      setLoading(false);
      return;
    }

    toast.success("Login realizado!");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError("");

    if (signupPassword.length < 6) {
      setSignupError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
      options: {
        data: { full_name: signupName.trim() },
        emailRedirectTo: `${window.location.origin}/perfil`,
      },
    });

    if (authError) {
      setSignupError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    // Se a confirmação por e-mail estiver ativa, ainda não haverá sessão.
    if (!data.session) {
      toast.success("Conta criada!", {
        description: "Verifique seu e-mail para confirmar o cadastro.",
      });
    } else {
      toast.success("Conta criada com sucesso!");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <h1 className="mb-2 text-center text-2xl font-extrabold">Bem-vindo à TopDJ</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Entre na sua conta ou cadastre-se para salvar músicas e acessar seus downloads.
        </p>

        <Tabs defaultValue="entrar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="entrar">Entrar</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
          </TabsList>

          {/* ENTRAR */}
          <TabsContent value="entrar" className="space-y-6 mt-0">
            <Button
              type="button"
              disabled={loading}
              onClick={handleGoogleAuth}
              className="w-full bg-white text-black hover:bg-gray-100 font-semibold shadow-sm border border-gray-200"
            >
              <GoogleIcon />
              Entrar com o Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou entre com e-mail</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  placeholder="voce@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
              >
                <LogIn className="mr-1 h-4 w-4" />
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          {/* CADASTRAR */}
          <TabsContent value="cadastrar" className="space-y-6 mt-0">
            <Button
              type="button"
              disabled={loading}
              onClick={handleGoogleAuth}
              className="w-full bg-white text-black hover:bg-gray-100 font-semibold shadow-sm border border-gray-200"
            >
              <GoogleIcon />
              Cadastrar com o Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com e-mail</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Nome</Label>
                <Input
                  id="signup-name"
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input
                  id="signup-email"
                  type="email"
                  required
                  placeholder="voce@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm">Confirmar senha</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                />
              </div>
              {signupError && <p className="text-sm text-destructive">{signupError}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[image:var(--gradient-primary)] font-semibold text-primary-foreground hover:opacity-90"
              >
                <UserPlus className="mr-1 h-4 w-4" />
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
