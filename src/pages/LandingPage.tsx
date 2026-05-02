import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, Palette, Zap, Shield, BarChart3, Check, Smartphone, Share2, Users } from "lucide-react";
import { motion } from "framer-motion";
import nfcCard from "@/assets/nfc-card-hero.png";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const LandingPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar dark={false} />

    {/* Hero */}
    <section className="container py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mb-5 uppercase tracking-wider">
            Digital Networking
          </span>
          <h1 className="text-2xl md:text-4xl font-semibold text-black leading-snug tracking-normal">
            Tap to share<br />your professional identity
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-5 max-w-lg leading-relaxed">
            An elegant NFC business card that shares your complete profile, socials, and portfolio instantly, no app required.
          </p>
          <div className="hidden md:flex flex-wrap gap-4 mt-8">
            <Button asChild size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600">
              <Link to="/register">Get Your Card <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex justify-center">
          <img src={nfcCard} alt="NexTap NFC Business Card" width={480} height={360} className="drop-shadow-2xl" />
        </motion.div>
      </div>
      
      {/* Mobile button - below image */}
      <div className="flex md:hidden justify-center mt-8">
        <Button asChild size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600">
          <Link to="/register">Get Your Card <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
      </div>
    </section>

    {/* How it Works */}
    <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-5xl">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto"
          >
            Three elegant steps to transform your networking
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Design your card",
              desc: "Choose a refined layout, premium finish, and professional profile settings in one smooth flow.",
              step: "01",
            },
            {
              title: "Build your profile",
              desc: "Add your contact details, links, and portfolio items with a polished, minimalist structure.",
              step: "02",
            },
            {
              title: "Share instantly",
              desc: "Tap your card to connect with any phone, delivering your brand cleanly and instantly.",
              step: "03",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-2">
                {item.title}
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="py-12 md:py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="container max-w-6xl">
        <div className="text-center mb-8 md:mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-heading text-3xl md:text-5xl font-semibold tracking-tight text-black leading-tight mb-3"
          >
            Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            What makes NexTap powerful
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Instant Connection", desc: "Share your professional identity instantly with one effortless tap." },
            { icon: Shield, title: "Privacy Control", desc: "Choose what details to share and update them whenever your profile evolves." },
            { icon: Smartphone, title: "Universal Compatibility", desc: "Built to work flawlessly across every modern smartphone and NFC-enabled device." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-black mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing */}
    <section id="pricing" className="py-16 md:py-20 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="container max-w-6xl">
        <div className="text-center mb-10 md:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-heading text-3xl md:text-5xl font-semibold tracking-tight text-black leading-tight mb-4"
          >
            Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Fair and transparent
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          {[
            {
              name: "Individual",
              price: "Free",
              period: "",
              description: "Perfect for getting started",
              features: ["1 NFC Card", "Basic Profile", "5 Custom Links", "Basic Analytics"],
              buttonText: "Get Started",
              popular: false
            },
            {
              name: "Professional",
              price: "$9",
              period: "/month",
              description: "For active networkers",
              features: ["3 NFC Cards", "Advanced Themes", "Unlimited Links", "Detailed Analytics", "Priority Support"],
              buttonText: "Start Professional",
              popular: true
            },
            {
              name: "Enterprise",
              price: "$29",
              period: "/month",
              description: "For teams and organizations",
              features: ["10 NFC Cards", "Team Dashboard", "Company Branding", "Admin Controls", "API Access"],
              buttonText: "Contact Sales",
              popular: false
            },
          ].map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative flex h-full flex-col rounded-2xl border transition-all duration-300 ${
                plan.popular
                  ? 'border-gray-300 shadow-md overflow-visible pt-6'
                  : 'border-gray-200 overflow-hidden'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {plan.popular ? (
                <>
                  {/* Black section - header */}
                  <div className="bg-black text-white p-6 pt-8">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-sm text-gray-300 mt-1">{plan.description}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-sm text-gray-300">{plan.period}</span>
                    </div>
                  </div>

                  {/* White section - features and button */}
                  <div className="bg-white text-black p-6 flex-1 flex flex-col">
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 shrink-0 text-green-500" />
                          <span className="text-sm text-gray-800">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full py-2.5 font-semibold rounded-lg bg-black text-white hover:bg-white hover:text-black transition-all duration-200">
                      <Link to="/register">{plan.buttonText}</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Light cards - single white color */}
                  <div className="bg-white text-black p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-black">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    <div className="mt-4 flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-bold text-black">{plan.price}</span>
                      <span className="text-sm text-gray-600">{plan.period}</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 shrink-0 text-green-500" />
                          <span className="text-sm text-gray-800">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full py-2.5 font-semibold rounded-lg bg-black text-white hover:bg-white hover:text-black transition-all duration-200">
                      <Link to="/register">{plan.buttonText}</Link>
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-xs text-gray-500 mb-3">Trusted by professionals worldwide</p>
          <div className="flex justify-center items-center gap-6 opacity-50">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 md:py-20 bg-black text-white">
      <div className="container max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-4">
            Get Started Now
          </h2>
          <p className="text-base md:text-lg text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
            Join professionals using NexTap
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100 px-6 py-3 text-base font-semibold">
              <Link to="/register">
                Start Free Today <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-black px-6 py-3 text-base font-semibold">
              <a href="tel:+15550000000">Call Us</a>
            </Button>
          </div>
        </motion.div>

        {/* Architectural elements */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-10 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent origin-center"
        />
      </div>
    </section>

    <Footer dark={false} />
  </div>
);

export default LandingPage;
