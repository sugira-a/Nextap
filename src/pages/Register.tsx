import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { apiRequest, storeAuthTokens } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">N</span>
            </div>
            <span className="font-heading font-bold text-xl">NexTap</span>
          </Link>
          <h1 className="font-heading font-bold text-2xl text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start networking smarter today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" required />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Create Account</Button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-accent hover:underline font-medium">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
