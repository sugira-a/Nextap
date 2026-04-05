import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type CardLookupResponse = {
  card: {
    code: string;
    short_code?: string;
    status: string;
    claim_status: boolean;
  };
  status: "claimed" | "assigned" | "unclaimed";
  redirect?: string;
  can_claim?: boolean;
  display_mode?: "profile" | "activation";
};

const CardRoute = () => {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<CardLookupResponse | null>(null);

  useEffect(() => {
    const loadCard = async () => {
      if (!code) return;

      try {
        setLoading(true);
        const response = await apiRequest<CardLookupResponse>(`/api/card/${code}`);
        setCardData(response);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Card not found");
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [code]);

  if (loading) {
    return <Card className="max-w-xl mx-auto mt-16 p-8 text-center text-muted-foreground">Loading card...</Card>;
  }

  if (cardData?.redirect && cardData.display_mode === "profile") {
    return <Navigate to={cardData.redirect} replace />;
  }

  if (!cardData) {
    return <Card className="max-w-xl mx-auto mt-16 p-8 text-center text-muted-foreground">Card not found</Card>;
  }

  const claimTarget = cardData.card.short_code || cardData.card.code;
  const loginTarget = `/login?claim=${encodeURIComponent(claimTarget)}`;
  const registerTarget = `/register?claim=${encodeURIComponent(claimTarget)}`;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-8 h-8 text-accent" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Activate Your Card</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Card <span className="font-mono font-semibold text-foreground">{cardData.card.short_code || cardData.card.code}</span> is ready.
        </p>
        <div className="flex flex-col gap-3 mt-7">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to={registerTarget}><UserPlus className="w-4 h-4 mr-2" />Create Account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={loginTarget}><LogIn className="w-4 h-4 mr-2" />Log In</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CardRoute;
