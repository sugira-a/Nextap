import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { apiRequest, storeAuthTokens } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedName = name.trim().replace(/\s+/g, " ");
    const [firstName, ...rest] = trimmedName.split(" ");
    const lastName = rest.join(" ") || "User";

    try {
      const response = await apiRequest<{
        message: string;
        access_token: string;
        refresh_token: string;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          public_slug: username || undefined,
        }),
      });

      storeAuthTokens(response.access_token, response.refresh_token);
      toast.success(response.message || "Account created successfully");

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

      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
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
              Create your account
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Join to start networking
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs md:text-sm font-medium text-foreground">Full Name</label>
              <input id="name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required placeholder="Name" className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background transition-all" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs md:text-sm font-medium text-foreground">Username</label>
              <input id="username" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} autoComplete="username" placeholder="username" required className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background transition-all" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs md:text-sm font-medium text-foreground">Email address</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com" className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background transition-all" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs md:text-sm font-medium text-foreground">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required placeholder="••••••••" className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background transition-all" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 py-2 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-xs md:text-sm text-center text-muted-foreground mt-4">
            Already have an account? <Link to="/login" className="font-medium text-accent hover:text-accent/80 transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>

      <Footer dark />
    </div>
  );
};

export default Register;
