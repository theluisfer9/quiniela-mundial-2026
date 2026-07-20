import { createFileRoute } from "@tanstack/react-router";

import { FinalDashboard } from "@/features/final-dashboard/final-dashboard";

export const Route = createFileRoute("/")({ component: FinalDashboard });
