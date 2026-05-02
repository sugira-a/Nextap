import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-16 md:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5"
        >
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Reset password
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {sent ? "Check your email for the reset link" : "Enter your email to reset"}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs md:text-sm font-medium text-foreground">Email address</label>
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background transition-all" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="text-center p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-foreground mb-2">Password reset link sent to <span className="font-medium">{email}</span></p>
              <p className="text-xs text-muted-foreground">Check your spam folder if needed</p>
            </div>
          )}

          <Link to="/login" className="flex items-center justify-center gap-1 text-xs md:text-sm text-accent hover:text-accent/80 transition-colors mt-6">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
