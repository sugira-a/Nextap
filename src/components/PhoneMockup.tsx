import { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
}

const PhoneMockup = ({ children }: PhoneMockupProps) => (
  <div className="relative mx-auto" style={{ width: 280, height: 560 }}>
    {/* Phone frame */}
    <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-foreground/90 bg-background shadow-2xl overflow-hidden">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground/90 rounded-b-2xl z-10" />
      {/* Screen content */}
      <div className="absolute inset-0 top-0 overflow-y-auto scrollbar-hide">
        {children}
      </div>
    </div>
    {/* Home indicator */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/30 rounded-full" />
  </div>
);

export default PhoneMockup;
