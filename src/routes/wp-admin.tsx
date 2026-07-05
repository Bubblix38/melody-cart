import { createFileRoute } from "@tanstack/react-router";
import { HoneypotTrap } from "@/components/HoneypotTrap";

export const Route = createFileRoute("/wp-admin")({
  component: () => <HoneypotTrap pathName="/wp-admin" />,
});
