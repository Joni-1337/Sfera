import Link from "next/link";
import { CreditCard } from "lucide-react";
import { btnPrimary } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

export function SubscriptionCreateGate({
  canCreate,
  className,
}: {
  canCreate: boolean;
  className?: string;
}) {
  if (canCreate) return null;

  return (
    <Link href="/pricing" className={cn(btnPrimary, className)}>
      <CreditCard className="h-4 w-4" />
      Подписка для добавления
    </Link>
  );
}
