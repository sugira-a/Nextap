import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  gradient?: string;
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({ title, value, icon: Icon, change, gradient = "from-slate-500/5 to-slate-400/5", trend = "neutral" }: StatCardProps) => {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, shadow: "0 12px 24px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border border-slate-200/50 p-6 hover:shadow-lg transition-all duration-300`}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

      {/* Subtle glow effect */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none bg-accent" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-widest opacity-70">{title}</p>
          <div className="mt-3 mb-2">
            <p className="text-3xl lg:text-4xl font-heading font-bold text-slate-900">{value}</p>
          </div>
          {change && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-sm font-semibold mt-2 flex items-center gap-1.5 ${trendColor}`}
            >
              <span className="text-base">{trendIcon}</span>
              {change}
            </motion.p>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.15, rotate: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/80 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-accent" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatCard;
