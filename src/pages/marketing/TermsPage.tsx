import MarketingPageLayout from "./MarketingPageLayout";

const TermsPage = () => (
  <MarketingPageLayout
    title="Terms of Service"
    subtitle="These terms govern access to and use of NexTap products and services."
    sections={[
      {
        title: "Account Responsibilities",
        description:
          "Users and organizations are responsible for maintaining accurate account data and securing access credentials.",
        points: [
          "Provide truthful registration information",
          "Maintain password confidentiality",
          "Notify us promptly of unauthorized access",
        ],
      },
      {
        title: "Acceptable Use",
        description:
          "You may not misuse the platform, interfere with service integrity, or upload prohibited content.",
        points: [
          "No unlawful, abusive, or fraudulent activity",
          "No attempts to bypass security controls",
          "No content that infringes third-party rights",
        ],
      },
      {
        title: "Service and Liability",
        description:
          "We continuously improve the service and may update features. Liability is limited to the extent permitted by law.",
        points: [
          "Features may evolve over time",
          "Planned maintenance may affect availability",
          "Commercial terms apply per selected plan",
        ],
      },
    ]}
    ctaLabel="Questions About Terms"
    ctaTo="/contact"
  />
);

export default TermsPage;
