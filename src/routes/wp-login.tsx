import { createFileRoute } from "@tanstack/react-router";
import { HoneypotTrap } from "@/components/HoneypotTrap";

export const Route = createFileRoute("/wp-login")({
  component: () => <HoneypotTrap pathName="/wp-login.php" />,
});
