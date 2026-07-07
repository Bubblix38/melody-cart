# Google reCAPTCHA v3 Integration Guide

## Overview

Add Google reCAPTCHA v3 to the admin login form after multiple failed attempts.

## Step 1: Add reCAPTCHA Package

```bash
npm install react-google-recaptcha
```

## Step 2: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create new site for "TopDJ Admin" (v3)
3. Copy Site Key and Secret Key
4. Add to Lovable environment variables:
   - `VITE_RECAPTCHA_SITE_KEY` (public, goes in frontend)
   - `RECAPTCHA_SECRET_KEY` (secret, for server verification)

## Step 3: Update Admin Login Component

File: `src/routes/admin.tsx`

```typescript
import ReCAPTCHA from "react-google-recaptcha";

function Admin() {
  // ... existing code ...
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [showCaptcha, setShowCaptcha] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword;

    // Check rate limit
    const { checkRateLimit, recordLoginAttempt } = await import("@/lib/login-security");
    const rateCheckEmail = checkRateLimit("admin-login", email);
    const rateCheckIp = checkRateLimit("admin-login-ip", "client-ip");

    if (!rateCheckEmail.allowed || !rateCheckIp.allowed) {
      setLoginError(rateCheckEmail.reason || rateCheckIp.reason || "Too many attempts");
      setShowCaptcha(true); // Show captcha on rate limit
      return;
    }

    // Show captcha if required by rate limiter
    if (rateCheckEmail.requiresCaptcha || rateCheckIp.requiresCaptcha) {
      setShowCaptcha(true);
      setLoginError("Verificação requerida. Complete o reCAPTCHA abaixo.");
      return;
    }

    // If captcha is required but not completed
    if (showCaptcha && !recaptchaToken) {
      setLoginError("Por favor, complete o reCAPTCHA");
      return;
    }

    try {
      // Verify reCAPTCHA token with server
      if (showCaptcha && recaptchaToken) {
        const verifyRes = await fetch("/api/verify-recaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: recaptchaToken }),
        });
        
        if (!verifyRes.ok) {
          setLoginError("Falha na verificação do reCAPTCHA. Tente novamente.");
          return;
        }
      }

      // Proceed with normal login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      recordLoginAttempt(email, !error).catch(console.error);

      if (error) {
        setLoginError(error.message);
        logSecurityEvent("login_failed", { email, error: error.code });
      } else if (data.session?.user) {
        // Success - reset captcha
        setShowCaptcha(false);
        setRecaptchaToken("");
        logSecurityEvent("login_success", { email });
      }
    } catch (err) {
      setLoginError("Erro ao fazer login. Tente novamente.");
      console.error(err);
    }
  }

  // In JSX, replace login form section with:
  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {/* ... existing email/password inputs ... */}
      
      {showCaptcha && (
        <div className="rounded-lg border border-border bg-muted p-4">
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
            onChange={(token) => setRecaptchaToken(token || "")}
            onErrored={() => setLoginError("Erro no reCAPTCHA. Recarregue a página.")}
          />
        </div>
      )}

      {loginError && <p className="text-sm text-destructive">{loginError}</p>}
      <Button type="submit" className="w-full" disabled={showCaptcha && !recaptchaToken}>
        <LogIn className="mr-1 h-4 w-4" />
        {showCaptcha ? "Verificar e Entrar" : "Entrar"}
      </Button>
    </form>
  );
}
```

## Step 4: Create Server Verification Endpoint

File: `src/server.ts` (add to fetch handler)

```typescript
// Verify reCAPTCHA token
if (request.method === "POST" && url.pathname === "/api/verify-recaptcha") {
  try {
    const body = await request.json();
    const token = body.token as string;

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    // Verify with Google
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

    const verifyResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${recaptchaSecret}&response=${token}`,
    });

    const verifyData = await verifyResponse.json() as {
      success: boolean;
      score?: number;
      action?: string;
    };

    if (!verifyData.success || (verifyData.score && verifyData.score < 0.5)) {
      return new Response(JSON.stringify({ error: "reCAPTCHA verification failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("reCAPTCHA verification error:", err);
    return new Response("Verification error", { status: 500 });
  }
}
```

## Environment Variables

Add to `.env.local` (local development) and Lovable settings:

```
VITE_RECAPTCHA_SITE_KEY=your_public_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

## Testing

1. Go to admin login
2. Enter wrong password 5 times
3. You should see reCAPTCHA widget
4. Complete the challenge
5. Try login again

---

**Estimate**: 2-3 hours including testing
**Priority**: HIGH
**Blockers**: Need reCAPTCHA keys from Google account
