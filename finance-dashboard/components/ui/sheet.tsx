import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ isOpen, onClose, children }: SheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Dialog Drawer container */}
          <div className="relative z-50 flex">
            {children}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface SheetContentProps {
  onClose: () => void;
  side?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}

export function SheetContent({
  onClose,
  side = "left",
  className,
  children,
}: SheetContentProps) {
  const xStart = side === "left" ? "-100%" : "100%";

  return (
    <motion.div
      initial={{ x: xStart }}
      animate={{ x: 0 }}
      exit={{ x: xStart }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cn(
        "fixed top-0 bottom-0 z-50 w-72 bg-card/65 backdrop-blur-2xl border-r border-white/10 shadow-2xl flex flex-col p-6",
        side === "left" ? "left-0" : "right-0",
        className
      )}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {children}
    </motion.div>
  );
}
