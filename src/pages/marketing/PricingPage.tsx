import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PricingPage = () => {
  const plans = [
    {
      name: "Individual",
      subtitle: "Perfect for getting started",
      price: "Free",
      description: "",
      cta: "Get Started",
      ctaLink: "/register",
      popular: false,
      features: [
        "1 NFC Card",
        "Basic Profile",
        "5 Custom Links",
        "Basic Analytics",
      ],
    },
    {
      name: "Professional",
      subtitle: "For active networkers",
      price: "$9",
      period: "/month",
      description: "",
      cta: "Start Professional",
      ctaLink: "/register",
      popular: true,
      features: [
        "3 NFC Cards",
        "Advanced Themes",
        "Unlimited Links",
        "Detailed Analytics",
        "Priority Support",
      ],
    },
    {
      name: "Enterprise",
      subtitle: "For teams and organizations",
      price: "$29",
      period: "/month",
      description: "",
      cta: "Contact Sales",
      ctaLink: "/contact",
      popular: false,
      features: [
        "10 NFC Cards",
        "Team Dashboard",
        "Company Branding",
        "Admin Controls",
        "API Access",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Transparent Pricing</h1>
          <p className="text-lg text-slate-600">Clear, straightforward pricing with no hidden costs</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "md:scale-105 md:ring-2 md:ring-green-500 shadow-2xl hover:shadow-xl"
                  : "shadow-lg hover:shadow-xl"
              } ${plan.popular ? "bg-white border-2 border-green-500" : "bg-white border border-slate-100"}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-center">
                  <span className="text-xs font-bold text-white tracking-widest">MOST POPULAR</span>
                </div>
              )}

              <div className={`p-6 ${plan.popular ? "pt-12" : ""}`}>
                {/* Plan Name */}
                <h3 className={`text-xl font-bold mb-1 text-slate-900`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.popular ? "text-green-600 font-medium" : "text-slate-600"}`}>
                  {plan.subtitle}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className={`text-4xl font-bold ${plan.popular ? "text-green-600" : "text-slate-900"}`}>
                    {plan.price}
                    {plan.period && <span className={`text-lg text-slate-600`}>{plan.period}</span>}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 flex-shrink-0 text-green-600" />
                      <span className="text-sm text-slate-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link to={plan.ctaLink} className="block">
                  <Button
                    className={`w-full font-semibold py-2 ${
                      plan.popular
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: "Can I upgrade or downgrade anytime?", a: "Yes, you can change your plan at any time." },
              { q: "Do you offer refunds?", a: "Yes, we offer a 30-day money-back guarantee." },
              { q: "What payment methods do you accept?", a: "We accept all major credit cards and PayPal." },
              { q: "Is there a free trial?", a: "Yes, start with our free Individual plan forever." },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1">
                <h4 className="font-semibold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
