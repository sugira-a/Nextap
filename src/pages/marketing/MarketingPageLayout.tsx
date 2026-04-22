import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type MarketingSection = {
  title: string;
  description: string;
  points?: string[];
};

type MarketingPageLayoutProps = {
  title: string;
  subtitle: string;
  sections: MarketingSection[];
  ctaLabel?: string;
  ctaTo?: string;
};

const MarketingPageLayout = ({
  title,
  subtitle,
  sections,
  ctaLabel = "Get Started",
  ctaTo = "/register",
}: MarketingPageLayoutProps) => (
  <div className="min-h-screen bg-background">
    <Navbar />

    <main className="container py-16 md:py-20">
      <header className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">{subtitle}</p>
      </header>

      <section className="grid gap-6 md:gap-8 max-w-5xl mx-auto">
        {sections.map((section) => (
          <article key={section.title} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground">
              {section.title}
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{section.description}</p>
            {section.points && section.points.length > 0 && (
              <ul className="mt-5 space-y-2 text-sm md:text-base text-muted-foreground list-disc pl-5">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <div className="text-center mt-12">
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to={ctaTo}>{ctaLabel}</Link>
        </Button>
      </div>
    </main>

    <Footer />
  </div>
);

export default MarketingPageLayout;
