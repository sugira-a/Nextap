import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const posts = [
  {
    title: "Designing Better First Impressions with Digital Cards",
    category: "Product",
    date: "April 2026",
    summary:
      "How modern teams replace static paper cards with live, measurable identity touchpoints.",
  },
  {
    title: "NFC Networking Playbook for Field Teams",
    category: "Guides",
    date: "March 2026",
    summary:
      "A practical framework for onboarding teams, assigning cards, and measuring networking performance.",
  },
  {
    title: "What to Track: From Profile Views to Qualified Leads",
    category: "Analytics",
    date: "February 2026",
    summary:
      "Key engagement metrics that matter for sales, partnerships, and recruitment outcomes.",
  },
];

const BlogPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    <main className="container py-16 md:py-20">
      <header className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-foreground">Blog</h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          Insights, playbooks, and product updates from the NexTap team.
        </p>
      </header>

      <section className="max-w-5xl mx-auto grid gap-6">
        {posts.map((post) => (
          <article key={post.title} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-full bg-secondary text-foreground">{post.category}</span>
              <span>{post.date}</span>
            </div>
            <h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">{post.title}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{post.summary}</p>
          </article>
        ))}
      </section>

      <div className="text-center mt-12 text-sm text-muted-foreground">
        Looking for a specific topic? <Link to="/contact" className="text-accent hover:underline">Talk to us</Link>.
      </div>
    </main>

    <Footer />
  </div>
);

export default BlogPage;
