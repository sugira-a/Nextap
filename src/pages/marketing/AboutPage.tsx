import MarketingPageLayout from "./MarketingPageLayout";

const AboutPage = () => (
  <MarketingPageLayout
    title="About NexTap"
    subtitle="We are building a modern identity layer for real-world networking."
    sections={[
      {
        title: "Our Mission",
        description:
          "NexTap helps professionals share who they are in seconds while giving organizations clarity and control at scale.",
      },
      {
        title: "What We Believe",
        description:
          "Business networking should be instant, measurable, and easy to manage across every role and every team.",
        points: [
          "Fast interactions create stronger first impressions",
          "Live digital profiles beat static printed cards",
          "Clear analytics improve team performance",
        ],
      },
      {
        title: "How We Work",
        description:
          "Our product and support teams partner closely with customers to deliver practical outcomes, not vanity features.",
        points: [
          "Customer-led roadmap prioritization",
          "Security and privacy by default",
          "Continuous performance and UX improvements",
        ],
      },
    ]}
    ctaLabel="Contact Our Team"
    ctaTo="/contact"
  />
);

export default AboutPage;
