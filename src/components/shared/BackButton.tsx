import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({ className }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(-1)}
      className={cn("rounded-full", className)}
      aria-label="Voltar"
    >
      <ArrowLeft className="size-6" />
    </Button>
  );
}
