import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import HomeLanding from "@/components/home/HomeLanding";

export default async function HomePage() {
  const session = await getSession();

  if (session?.role === "teacher") {
    redirect("/dashboard");
  }

  if (session?.role === "student") {
    redirect("/dashboard");
  }

  return <HomeLanding />;
}
