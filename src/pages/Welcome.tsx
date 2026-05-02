import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Welcome = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get email from location state
    const state = window.history.state?.usr;
    if (state?.email) {
      setEmail(state.email);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md text-center"
        >
          {/* Icon */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-6"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-accent/10 rounded-full animate-pulse" />
              <CheckCircle className="w-12 h-12 text-accent relative z-10" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2"
          >
            Welcome to NexTap!
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-sm md:text-base text-muted-foreground mb-8"
          >
            Your account is all set and ready to go
          </motion.p>

          {/* Message */}
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-lg bg-muted/30 border border-border mb-8"
          >
            <p className="text-sm text-foreground">
              A confirmation link has been sent to
            </p>
            <p className="font-medium text-accent mt-1">
              {email || "your email address"}
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={itemVariants}
            className="space-y-3"
          >
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Back to Home
            </button>
          </motion.div>

          {/* Helper text */}
          <motion.p
            variants={itemVariants}
            className="text-xs text-muted-foreground mt-8"
          >
            You can now create your professional NFC card and share your network instantly.
          </motion.p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Welcome;
