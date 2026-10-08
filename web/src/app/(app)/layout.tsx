import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { currentActor } from "@/server/session";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await currentActor();
  if (!actor) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
