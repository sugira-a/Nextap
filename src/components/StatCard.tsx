import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
}

const StatCard = ({ title, value, icon: Icon, change }: StatCardProps) => (
  <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-heading font-bold text-foreground mt-1">{value}</p>
        {change && <p className="text-xs text-accent mt-1">{change}</p>}
      </div>
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  </div>
);

export default StatCard;
