import MarketingPageLayout from "./MarketingPageLayout";

const PrivacyPage = () => (
  <MarketingPageLayout
    title="Privacy Policy"
    subtitle="Your trust matters. This page outlines how NexTap handles personal and organizational data."
    sections={[
      {
        title: "Data We Collect",
        description:
          "We collect account information, profile content, and operational analytics needed to deliver and improve the service.",
        points: [
          "Account data such as name and email",
          "Profile and contact information you publish",
          "Usage metrics like profile views and card interactions",
        ],
      },
      {
        title: "How We Use Data",
        description:
          "Data is used to operate the platform, secure accounts, and provide analytics to authorized users.",
        points: [
          "Service delivery and feature functionality",
          "Fraud prevention and security monitoring",
          "Performance reporting and product improvement",
        ],
      },
      {
        title: "Control and Retention",
        description:
          "You control profile visibility and can request changes or deletion according to applicable policies and law.",
        points: [
          "Access and update account information anytime",
          "Request account deletion through support",
          "Retention periods based on legal and operational needs",
        ],
      },
    ]}
    ctaLabel="Contact Privacy Team"
    ctaTo="/contact"
  />
);

export default PrivacyPage;
