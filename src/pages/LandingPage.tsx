import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Smartphone, Share2, Users, Zap, Shield, BarChart3, Check } from "lucide-react";
import { motion } from "framer-motion";
import nfcCard from "@/assets/nfc-card-hero.png";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const LandingPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="container py-20 md:py-32">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent mb-6">
            The future of networking
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Tap. Share.<br />Connect instantly.
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-md">
            Your digital business card, powered by NFC. Share your contact info, socials, and portfolio with a single tap.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/register">Get Your Card <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/u/demo">See Demo Profile</Link>
            </Button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex justify-center">
          <img src={nfcCard} alt="NexTap NFC Business Card" width={480} height={360} className="drop-shadow-2xl" />
        </motion.div>
      </div>
    </section>

    {/* How it Works */}
    <section id="how-it-works" className="bg-surface py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">How it works</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Three simple steps to start sharing your professional identity.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Get Your Card", desc: "Order your custom NFC-enabled business card.", icon: Smartphone },
            { step: "02", title: "Set Up Your Profile", desc: "Add your info, links, and customize your page.", icon: Share2 },
            { step: "03", title: "Tap & Share", desc: "Tap your card on any phone to share instantly.", icon: Users },
          ].map((item, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="bg-card border border-border rounded-xl p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <item.icon className="w-6 h-6 text-accent" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">Step {item.step}</span>
              <h3 className="font-heading font-semibold text-lg mt-2 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="container py-20 md:py-28">
      <div className="text-center mb-16">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Why NexTap?</h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Everything you need to make a lasting impression.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: "Instant Sharing", desc: "One tap to share your full profile. No app needed." },
          { icon: Shield, title: "Privacy First", desc: "Control what you share. Update anytime." },
          { icon: BarChart3, title: "Analytics", desc: "Track views and taps to measure your networking." },
          { icon: Users, title: "Team Management", desc: "Manage cards for your entire team from one place." },
          { icon: Share2, title: "Custom Links", desc: "Add social profiles, websites, and custom links." },
          { icon: Smartphone, title: "Works Everywhere", desc: "Compatible with all modern smartphones." },
        ].map((f, i) => (
          <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
            className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5 text-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-foreground">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Pricing */}
    <section id="pricing" className="bg-surface py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Simple pricing</h2>
          <p className="text-muted-foreground mt-3">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: "Starter", price: "Free", features: ["1 NFC Card", "Basic Profile", "5 Links", "Basic Analytics"] },
            { name: "Pro", price: "$9/mo", popular: true, features: ["3 NFC Cards", "Custom Themes", "Unlimited Links", "Advanced Analytics", "Priority Support"] },
            { name: "Team", price: "$29/mo", features: ["10 NFC Cards", "Team Dashboard", "Company Branding", "Admin Controls", "API Access"] },
          ].map((plan, i) => (
            <div key={i} className={`bg-card border rounded-xl p-8 relative ${plan.popular ? 'border-accent shadow-lg' : 'border-border'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading font-semibold text-lg text-foreground">{plan.name}</h3>
              <p className="font-heading text-3xl font-bold mt-2 text-foreground">{plan.price}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className={`w-full mt-8 ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`} variant={plan.popular ? "default" : "outline"}>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="container py-20 md:py-28 text-center">
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Ready to go digital?</h2>
      <p className="text-muted-foreground mt-4 max-w-md mx-auto">Join thousands of professionals already using NexTap to network smarter.</p>
      <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
        <Link to="/register">Get Started Free <ArrowRight className="ml-2 w-4 h-4" /></Link>
      </Button>
    </section>

    <Footer />
  </div>
);

export default LandingPage;
