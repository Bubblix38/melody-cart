import { createFileRoute } from "@tanstack/react-router";
import { HoneypotTrap } from "@/components/HoneypotTrap";

export const Route = createFileRoute("/phpmyadmin")({
  component: () => <HoneypotTrap pathName="/phpmyadmin" />,
});
