import MarketingPageLayout from "./MarketingPageLayout";

const ContactPage = () => (
  <MarketingPageLayout
    title="Contact"
    subtitle="Reach our team for sales, support, or partnership inquiries."
    sections={[
      {
        title: "Sales",
        description:
          "Planning a rollout or evaluating team pricing? We can help design the right package for your organization.",
        points: [
          "Email: sales@nextap.com",
          "Response window: within 1 business day",
        ],
      },
      {
        title: "Support",
        description:
          "Need help with setup, profile updates, or account issues? Our support team is ready to assist.",
        points: [
          "Email: support@nextap.com",
          "Hours: Monday to Friday, 9:00 to 18:00",
        ],
      },
      {
        title: "Partnerships",
        description:
          "We collaborate with distributors, agencies, and enterprise teams on custom initiatives.",
        points: [
          "Email: partnerships@nextap.com",
          "Include your company details and proposal scope",
        ],
      },
    ]}
    ctaLabel="Create Your NexTap Account"
    ctaTo="/register"
  />
);

export default ContactPage;
