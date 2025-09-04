import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-floating-action hover:bg-floating-action/90 text-floating-action-foreground shadow-lg transition-all duration-300 hover:scale-110 z-50"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}