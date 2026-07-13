import fs from "fs";
import path from "path";
import {
  parseAnswerKey,
  parseFolderTests,
  parseTestPage,
  type ParsedRusskij100Variant,
} from "./russkij100-parser";

const BASE_URL = "https://test.russkij100.ru";
const DEFAULT_FOLDER_ID = "641";
const OUTPUT = path.join(process.cwd(), "src", "data", "question-bank", "russkij100-ege-variants.json");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing env ${name}. Example:`);
    console.error(`  $env:RUSSKIJ100_EMAIL="teacher@example.com"`);
    console.error(`  $env:RUSSKIJ100_PASSWORD="secret"`);
    console.error(`  npx tsx scripts/import-russkij100-tests.ts`);
    process.exit(1);
  }
  return value;
}

function extractCookies(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") {
    const values = headers.getSetCookie();
    if (values.length > 0) return values;
  }

  const rawGetter = (response.headers as unknown as { raw?: () => Record<string, string[]> })
    .raw;
  if (typeof rawGetter === "function") {
    const raw = rawGetter.call(response.headers);
    const fromRaw = raw["set-cookie"];
    if (fromRaw?.length) return fromRaw;
  }

  const single = response.headers.get("set-cookie");
  return single ? single.split(/,(?=[^;]+=)/) : [];
}

function mergeCookies(existing: Map<string, string>, setCookie: string[]) {
  for (const raw of setCookie) {
    const pair = raw.split(";")[0]?.trim();
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    existing.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function fetchWithSession(
  jar: Map<string, string>,
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookies = cookieHeader(jar);
  if (cookies) headers.set("Cookie", cookies);

  const response = await fetch(url, {
    ...init,
    headers,
    redirect: init.redirect ?? "follow",
  });
  mergeCookies(jar, extractCookies(response));
  return response;
}

async function login(
  jar: Map<string, string>,
  email: string,
  password: string,
  folderId: string
) {
  const body = new URLSearchParams({
    email,
    password,
    timezone: String(new Date().getTimezoneOffset()),
    "policy-checkbox": "on",
    "eula-checkbox": "on",
  });

  const response = await fetchWithSession(
    jar,
    `${BASE_URL}/aauth?r=${encodeURIComponent(`/testFolder/${folderId}`)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "manual",
    }
  );

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      await fetchWithSession(jar, new URL(location, BASE_URL).toString());
    }
  } else if (!response.ok) {
    throw new Error(`Login failed: HTTP ${response.status}`);
  }

  if (jar.size === 0) {
    throw new Error("Login failed: no session cookie received");
  }
}

async function fetchText(jar: Map<string, string>, url: string): Promise<string> {
  const response = await fetchWithSession(jar, url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`GET ${url} failed: HTTP ${response.status}`);
  }
  return response.text();
}

async function importFolder(folderId: string, email: string, password: string) {
  const jar = new Map<string, string>();
  await login(jar, email, password, folderId);

  const folderHtml = await fetchText(jar, `${BASE_URL}/testFolder/${folderId}`);
  if (!folderHtml.includes('id="test-folder"')) {
    throw new Error("Not authenticated — check RUSSKIJ100_EMAIL / RUSSKIJ100_PASSWORD");
  }

  const refs = parseFolderTests(folderHtml);
  if (refs.length === 0) {
    throw new Error(`No tests found in folder ${folderId}`);
  }

  const variants: ParsedRusskij100Variant[] = [];

  for (const ref of refs) {
    process.stdout.write(`Importing ${ref.title} (#${ref.sourceId})... `);
    const [testHtml, answersHtml] = await Promise.all([
      fetchText(jar, `${BASE_URL}/test/test${ref.sourceId}/`),
      fetchText(jar, `${BASE_URL}/testAnswers/${ref.sourceId}`),
    ]);

    const answerKey = parseAnswerKey(answersHtml);
    const questions = parseTestPage(testHtml, answerKey);

    if (questions.length === 0) {
      console.log("skipped (0 questions)");
      continue;
    }

    variants.push({
      sourceId: ref.sourceId,
      title: ref.title,
      questions,
    });
    console.log(`${questions.length} questions`);
  }

  return variants;
}

async function main() {
  const email = requireEnv("RUSSKIJ100_EMAIL");
  const password = requireEnv("RUSSKIJ100_PASSWORD");
  const folderId = process.env.RUSSKIJ100_FOLDER_ID?.trim() || DEFAULT_FOLDER_ID;

  const variants = await importFolder(folderId, email, password);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(variants, null, 2), "utf8");

  const totalQuestions = variants.reduce((sum, v) => sum + v.questions.length, 0);
  console.log(`\nSaved ${variants.length} variants (${totalQuestions} questions) → ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
