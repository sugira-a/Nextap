import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ContactSupportPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent! We'll get back to you soon.");
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { q: "How do I create my first NFC profile?", a: "Sign up and follow the guided setup wizard to create your profile in minutes. You can choose from professional templates and customize colors, fonts, and contact info." },
    { q: "Can I use multiple templates?", a: "Yes, you can switch between templates anytime in your dashboard. Each template can be customized independently." },
    { q: "What formats do you support?", a: "We support vCard (VCF), QR codes, and direct contact imports. You can share your profile via NFC, QR code, or a unique web link." },
    { q: "Is my data secure?", a: "Yes, all data is encrypted and stored securely. We comply with GDPR and other privacy regulations." },
    { q: "Can I export my contacts?", a: "Absolutely. Export in VCF, CSV, or JSON formats from your dashboard." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-bold text-slate-900">Get in Touch</h1>
          <p className="mt-2 text-lg text-slate-600">We're here to help. Reach out with questions or feedback.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Contact Info Cards */}
          <div className="md:col-span-1 space-y-6">
            {[
              { icon: Mail, label: "Email", value: "support@nextap.com" },
              { icon: Phone, label: "Phone", value: "+1 (555) 000-0000" },
              { icon: MapPin, label: "Address", value: "123 Innovation Way, Tech City, TC 12345" },
              { icon: Clock, label: "Hours", value: "Mon-Fri, 9am-6pm EST" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg border border-slate-100 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-green-50 p-3">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">{label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>

              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Message Received!</h3>
                  <p className="mt-2 text-slate-600">Thank you for contacting us. We'll respond within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Name</label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 border-slate-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 border-slate-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Subject</label>
                    <Input
                      type="text"
                      placeholder="How can we help?"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="mt-1 border-slate-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Message</label>
                    <textarea
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg border border-slate-100 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{faq.q}</h3>
                    <p className="mt-2 text-sm text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-12 text-center text-white shadow-lg">
          <h3 className="text-2xl font-bold">Ready to get started?</h3>
          <p className="mt-2 text-green-100">Join thousands using NexTap to share their contact info effortlessly.</p>
          <Button className="mt-6 bg-white text-green-600 hover:bg-slate-100">
            Create Your Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactSupportPage;