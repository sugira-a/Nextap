import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ dark = true }: { dark?: boolean } = {}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const headerClass = dark
    ? "sticky top-0 z-50 w-full border-b border-transparent bg-black text-white"
    : "sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg";

  const mutedClass = dark ? "text-slate-300" : "text-muted-foreground";

  return (
    <header className={headerClass}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-sm">N</span>
          </div>
          <span className={`font-heading font-bold text-xl ${dark ? 'text-white' : 'text-foreground'}`}>NexTap</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className={`text-sm ${mutedClass} hover:${dark ? 'text-white/90' : 'text-foreground'} transition-colors`}>Features</a>
          <a href="#how-it-works" className={`text-sm ${mutedClass} hover:${dark ? 'text-white/90' : 'text-foreground'} transition-colors`}>How it Works</a>
          <a href="#pricing" className={`text-sm ${mutedClass} hover:${dark ? 'text-white/90' : 'text-foreground'} transition-colors`}>Pricing</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className={`md:hidden rounded-full border p-2.5 shadow-sm transition-colors ${dark ? 'border-transparent bg-black/0 hover:bg-black/5' : 'border-border bg-background hover:bg-muted'}`}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: -16, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-white via-white to-slate-50 text-slate-900"
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 right-[-4rem] h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
                <div className="absolute bottom-[-5rem] left-[-4rem] h-56 w-56 rounded-full bg-slate-900/5 blur-3xl" />
              </div>

              <div className="relative flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur-xl">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-black/10">
                    <span className="text-primary-foreground font-heading font-bold text-sm">N</span>
                  </div>
                  <span className="font-heading font-bold text-xl text-slate-900">NexTap</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full border border-slate-200 bg-white p-2 transition-colors hover:bg-slate-100"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              <div className="relative flex flex-1 flex-col px-5 py-6 sm:px-6">
                <div className="space-y-3">
                  <a href="#features" className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-md" onClick={() => setMobileOpen(false)}>Features</a>
                  <a href="#how-it-works" className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-md" onClick={() => setMobileOpen(false)}>How it Works</a>
                  <a href="#pricing" className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-md" onClick={() => setMobileOpen(false)}>Pricing</a>
                </div>

                <div className="mt-auto pt-8">
                  <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm">
                    <div className="flex flex-col gap-2.5">
                      <Button variant="outline" asChild className="h-11 rounded-xl border-slate-300 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                        <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
                      </Button>
                      <Button asChild className="h-11 rounded-xl text-sm font-semibold bg-accent text-white shadow-sm shadow-accent/25 hover:bg-accent/90">
                        <Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
