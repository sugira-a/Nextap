import MarketingPageLayout from "./MarketingPageLayout";

const FeaturesPage = () => (
  <MarketingPageLayout
    title="Features"
    subtitle="NexTap gives professionals and teams everything needed to share identity, capture leads, and stay in control."
    sections={[
      {
        title: "Instant Card Sharing",
        description:
          "Share your profile with one NFC tap or QR scan. Prospects receive your details immediately with no app install.",
        points: [
          "Tap-to-share on modern iOS and Android devices",
          "Fallback QR code for universal compatibility",
          "Always-on profile links for remote networking",
        ],
      },
      {
        title: "Live Profile Editing",
        description:
          "Update your profile once and every shared card reflects the latest details in real time.",
        points: [
          "Edit title, bio, links, and contact actions",
          "Design controls for colors, typography, and layout",
          "No reprinting required when your details change",
        ],
      },
      {
        title: "Business Intelligence",
        description:
          "Track engagement and improve outcomes with clear, actionable analytics across users and teams.",
        points: [
          "Card view and tap performance",
          "Activity timelines and usage patterns",
          "Role-aware dashboards for admins and managers",
        ],
      },
      {
        title: "Enterprise Controls",
        description:
          "Scale confidently with governance and admin controls built for distributed organizations.",
        points: [
          "Role-based access for admin, company admin, and employee",
          "Team card assignment and invitation workflows",
          "Policy enforcement and centralized management",
        ],
      },
    ]}
    ctaLabel="Create Your Account"
    ctaTo="/register"
  />
);

export default FeaturesPage;
