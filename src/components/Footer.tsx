import { Link } from "react-router-dom";

const Footer = ({ dark = true }: { dark?: boolean } = {}) => (
  <footer className={dark ? "border-t border-transparent bg-black text-white" : "border-t border-border bg-surface"}>
    <div className="container py-12 md:py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">N</span>
            </div>
            <span className={`font-heading font-bold text-xl ${dark ? 'text-white' : ''}`}>NexTap</span>
          </Link>
          <p className={`text-sm ${dark ? 'text-slate-300' : 'text-muted-foreground'}`}>Smart digital business cards for the modern professional.</p>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-sm mb-4">Product</h4>
          <ul className={`space-y-2 text-sm ${dark ? 'text-slate-300' : 'text-muted-foreground'}`}>
            <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
            <li><Link to="/for-teams" className="hover:text-foreground transition-colors">For Teams</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-sm mb-4">Company</h4>
          <ul className={`space-y-2 text-sm ${dark ? 'text-slate-300' : 'text-muted-foreground'}`}>
            <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-sm mb-4">Legal</h4>
          <ul className={`space-y-2 text-sm ${dark ? 'text-slate-300' : 'text-muted-foreground'}`}>
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className={`border-t ${dark ? 'border-transparent' : 'border-border'} mt-8 pt-8 text-center text-sm ${dark ? 'text-slate-300' : 'text-muted-foreground'}`}>
        © {new Date().getFullYear()} NexTap. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
