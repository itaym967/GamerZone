import type { Metadata } from "next";
import DashboardClientPage from "./dashboard-page-client";

export const metadata: Metadata = {
  title: "GamerZone",
  description: "Find teammates, chat, and build your gaming squad.",
};

export default function HomePage() {
  return <DashboardClientPage />;
}
