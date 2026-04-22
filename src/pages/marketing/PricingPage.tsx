import MarketingPageLayout from "./MarketingPageLayout";

const PricingPage = () => (
  <MarketingPageLayout
    title="Pricing"
    subtitle="Transparent plans for individuals, growing teams, and enterprise programs."
    sections={[
      {
        title: "Starter - Free",
        description:
          "Best for trying NexTap and running a personal networking workflow.",
        points: [
          "1 digital profile",
          "Basic customization",
          "Core analytics",
          "Community support",
        ],
      },
      {
        title: "Pro - $9/month",
        description:
          "Designed for professionals who want stronger branding and better conversion visibility.",
        points: [
          "Multiple card profiles",
          "Advanced profile customization",
          "Expanded analytics insights",
          "Priority support",
        ],
      },
      {
        title: "Team - $29/month",
        description:
          "Built for organizations that manage multiple users, cards, and performance goals.",
        points: [
          "Team workspace with role controls",
          "Centralized user and card management",
          "Department-level analytics",
          "Admin controls and invitation workflows",
        ],
      },
      {
        title: "Enterprise - Contact Sales",
        description:
          "For large organizations requiring custom deployment, controls, and support terms.",
        points: [
          "Custom onboarding and rollout planning",
          "Governance and policy support",
          "Dedicated account management",
          "Tailored implementation roadmap",
        ],
      },
    ]}
    ctaLabel="Start Free"
    ctaTo="/register"
  />
);

export default PricingPage;
