import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { apiRequest, storeAuthTokens } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      toast.success(response.message || "Logged in successfully");

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

      if (response.user?.role === "admin") {
        navigate("/admin");
      } else if (response.user?.role === "company_admin") {
        navigate("/company");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
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
    </div>
  );
};

export default Login;
