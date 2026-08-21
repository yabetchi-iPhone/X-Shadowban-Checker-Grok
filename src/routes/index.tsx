import { createFileRoute } from "@tanstack/react-router";
import { CheckerApp } from "@/components/checker-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CheckerApp />;
}
