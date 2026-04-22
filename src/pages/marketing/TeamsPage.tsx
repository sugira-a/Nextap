import MarketingPageLayout from "./MarketingPageLayout";

const TeamsPage = () => (
  <MarketingPageLayout
    title="For Teams"
    subtitle="Equip every employee with a consistent digital identity and manage everything from one dashboard."
    sections={[
      {
        title: "Centralized Team Management",
        description:
          "Invite members, assign cards, and keep ownership clear with role-based controls.",
        points: [
          "Batch team onboarding",
          "Card lifecycle tracking",
          "Role-aware access management",
        ],
      },
      {
        title: "Brand Consistency",
        description:
          "Ensure every profile reflects your company standards without limiting individual flexibility.",
        points: [
          "Shared brand styles and defaults",
          "Controlled editable fields",
          "Consistent customer-facing presentation",
        ],
      },
      {
        title: "Performance Visibility",
        description:
          "Understand how your team networks in the field and where opportunities are strongest.",
        points: [
          "Company and member analytics",
          "Engagement trend monitoring",
          "Operational insights for leadership",
        ],
      },
    ]}
    ctaLabel="Explore Team Dashboard"
    ctaTo="/team"
  />
);

export default TeamsPage;
