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
            className="fixed inset-0 z-50 md:hidden bg-white/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -18, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex min-h-full w-full flex-col ${dark ? 'bg-white text-slate-900' : 'bg-background'}`}
            >
              <div className={`flex items-center justify-between border-b px-5 py-4 ${dark ? 'border-slate-200 bg-white' : 'border-border'}`}>
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-sm">N</span>
                  </div>
                  <span className="font-heading font-bold text-xl text-slate-900">NexTap</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full border border-slate-200 p-2 transition-colors hover:bg-slate-100"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-between px-5 py-6">
                <div className="space-y-2.5">
                  <a href="#features" className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all hover:bg-accent hover:text-white hover:border-accent" onClick={() => setMobileOpen(false)}>Features</a>
                  <a href="#how-it-works" className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all hover:bg-accent hover:text-white hover:border-accent" onClick={() => setMobileOpen(false)}>How it Works</a>
                  <a href="#pricing" className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-900 transition-all hover:bg-accent hover:text-white hover:border-accent" onClick={() => setMobileOpen(false)}>Pricing</a>
                </div>

                <div className="mt-8 flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
                  <Button variant="outline" asChild className="h-10 rounded-lg text-sm font-semibold border-slate-300 text-slate-900 hover:bg-slate-100">
                    <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
                  </Button>
                  <Button asChild className="h-10 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent/90">
                    <Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
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
