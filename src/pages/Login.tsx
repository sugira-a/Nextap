import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { apiRequest, storeAuthTokens } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [tempActionLoading, setTempActionLoading] = useState(false);
  const [loginResponseTokens, setLoginResponseTokens] = useState<{ access?: string; refresh?: string } | null>(null);

  const navigateByRole = async (accessToken: string) => {
    const me = await apiRequest<{ user: { role?: string } }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (me.user?.role === "admin") navigate("/admin");
    else if (me.user?.role === "company_admin") navigate("/company");
    else navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiRequest<{
        message: string;
        access_token: string;
        refresh_token: string;
        user: { role?: string };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      storeAuthTokens(response.access_token, response.refresh_token);
      setLoginResponseTokens({ access: response.access_token, refresh: response.refresh_token });
      toast.success(response.message || "Logged in successfully");

      if (response.user?.must_change_password) {
        setShowTempModal(true);
        return;
      }

      const claimCode = searchParams.get("claim");
      if (claimCode) {
        try {
          await apiRequest<{ message: string }>("/api/card/claim", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
            body: JSON.stringify({ code: claimCode }),
          });
          toast.success("Card claimed successfully");
        } catch (claimError) {
          toast.error(claimError instanceof Error ? claimError.message : "Unable to claim card");
        }
      }

      await navigateByRole(response.access_token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeepPassword = async () => {
    if (!loginResponseTokens?.access) return;
    setTempActionLoading(true);
    try {
      await apiRequest<{ message: string }>("/api/auth/acknowledge-temp-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${loginResponseTokens.access}` },
      });
      toast.success("Temporary password acknowledged");
      setShowTempModal(false);
      await navigateByRole(loginResponseTokens.access);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to acknowledge password");
    } finally {
      setTempActionLoading(false);
    }
  };

  const handleChangeTemporaryPassword = async () => {
    if (!loginResponseTokens?.access) return;
    if (!newPassword || newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmNewPassword) { toast.error("Passwords do not match"); return; }
    setTempActionLoading(true);
    try {
      await apiRequest<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${loginResponseTokens.access}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: password, new_password: newPassword }),
      });
      toast.success("Password changed — you're all set");
      setShowTempModal(false);
      await navigateByRole(loginResponseTokens.access);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to change password");
    } finally {
      setTempActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar dark />
      
      <div className="flex-1 flex items-center justify-center px-4 py-16 md:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5"
        >
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs md:text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs md:text-sm font-medium text-foreground">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-xs md:text-sm text-center text-muted-foreground mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-accent hover:text-accent/80 transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>

      <Footer dark />
      {showTempModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" onClick={() => {}} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
          >
            <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">First login</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">Secure your account</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    We created a temporary password for your admin account. You can keep it for now or replace it immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              <button
                type="button"
                disabled={tempActionLoading}
                onClick={handleKeepPassword}
                className="group flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60"
              >
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-950">Keep temporary password</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    Continue with the current password and manage it later from your profile.
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-zinc-950">Change password now</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Recommended for security. Use at least 8 characters and keep it private.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-zinc-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-zinc-500"
                  />
                  <button
                    type="button"
                    disabled={tempActionLoading}
                    onClick={handleChangeTemporaryPassword}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                  >
                    Change password
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login;
