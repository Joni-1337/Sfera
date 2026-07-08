import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

import { AppShell } from "@/components/layout/AppShell";

import { PauseView } from "@/components/pause/PauseView";

import { getPauseItems } from "@/lib/pause-actions";



export default async function PausePage() {

  const session = await getSession();

  if (!session) redirect("/login");

  if (session.role === "teacher") redirect("/dashboard");



  const items = await getPauseItems(session.id);



  return (

    <AppShell>

      <PauseView items={items} studentId={session.id} />

    </AppShell>

  );

}


