import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, CreditCard, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";

const teamMembers = [
  { name: "Sarah Johnson", role: "Admin", card: "NTW001", status: "active" },
  { name: "Mike Chen", role: "Member", card: "NTW003", status: "active" },
  { name: "Emily Davis", role: "Member", card: "NTW004", status: "pending" },
];

const TeamDashboard = () => (
  <div className="flex min-h-screen w-full bg-surface">
    <main className="flex-1 p-6 md:p-8 overflow-auto max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Team Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your organization's cards</p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Invite Member</Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard title="Team Members" value={3} icon={Users} />
          <StatCard title="Cards Assigned" value={3} icon={CreditCard} />
          <StatCard title="Organization" value="NexTap" icon={Building2} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4">Company Branding</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <Label>Company Name</Label>
              <Input defaultValue="NexTap Inc." className="mt-1.5" />
            </div>
            <div>
              <Label>Brand Color</Label>
              <Input defaultValue="#22c55e" type="color" className="mt-1.5 h-10" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-heading font-semibold text-foreground">Team Members</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Card</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.role}</td>
                  <td className="px-4 py-3 font-mono text-foreground hidden sm:table-cell">{m.card}</td>
                  <td className="px-4 py-3">
                    <Badge className={m.status === "active" ? "bg-accent/10 text-accent border-0" : ""}
                      variant={m.status === "active" ? "default" : "secondary"}>
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </main>
  </div>
);

export default TeamDashboard;
