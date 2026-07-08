import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { SearchView } from "@/components/search/SearchView";
import { globalSearch } from "@/lib/search-actions";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q = "" } = await searchParams;
  const query = q.trim();
  const results =
    query.length >= 2 ? await globalSearch(session, query) : {
      texts: [],
      assignments: [],
      tests: [],
      hardWords: [],
    };

  return (
    <AppShell>
      <SearchView query={query} results={results} />
    </AppShell>
  );
}
