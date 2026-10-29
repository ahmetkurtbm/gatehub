// Yerel PostgreSQL'i kurar.
//   npm run db:setup  → bekleyen migration'ları uygular
//   npm run db:reset  → her şeyi silip baştan kurar (yalnızca localhost'ta çalışır)
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const command = process.argv[2];
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tanımlı değil. .env dosyasına yazın (bkz. .env.example).");
  process.exit(1);
}

const host = new URL(url).hostname;
if (command === "reset" && !["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(`db:reset yalnızca yerel veritabanında çalışır (hedef: ${host}).`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
console.log(`Hedef: ${host}${new URL(url).pathname}`);

try {
  if (command === "reset") {
    await client.query("drop schema public cascade; create schema public;");
    console.log("Şema silindi.");
  }

  await client.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");

  // Prisma döneminden kalan bir veritabanında tablolar zaten var: ilk migration'ı uygulanmış say.
  const { rows: [legacy] } = await client.query("select to_regclass('public._prisma_migrations') is not null as exists");
  if (legacy.exists) await client.query("insert into schema_migrations (name) values ('001_init.sql') on conflict do nothing");

  const { rows } = await client.query("select name from schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const dir = join("db", "migrations");

  for (const name of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (applied.has(name)) continue;
    await client.query("begin");
    await client.query(readFileSync(join(dir, name), "utf8"));
    await client.query("insert into schema_migrations (name) values ($1)", [name]);
    await client.query("commit");
    console.log(`✓ ${name}`);
  }
  console.log("Veritabanı hazır. İlk hesabı /login sayfasından oluşturun.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
