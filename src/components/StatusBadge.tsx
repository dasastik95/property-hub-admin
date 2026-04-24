import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20",
  active: "bg-success/15 text-success border-success/30 hover:bg-success/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
  sold: "bg-info/15 text-info border-info/30 hover:bg-info/20",
  rented: "bg-purple-500/15 text-purple-600 border-purple-500/30 hover:bg-purple-500/20 dark:text-purple-400",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = styles[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium capitalize border", style, className)}>
      {status}
    </Badge>
  );
}
