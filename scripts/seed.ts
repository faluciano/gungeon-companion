/**
 * Seed the database with Gungeon reference data from src/lib/data/dataset.json.
 * Idempotent: clears and re-inserts item / synergy tables. Never touches user
 * data (users, runs, passkeys).
 *
 * Run with: bun run db:seed
 */
import { readFileSync } from "fs";
import { join } from "path";
import { db, schema } from "../src/lib/db";

type Dataset = {
  items: Array<{
    id: string;
    name: string;
    type: "gun" | "passive" | "active";
    quality: "D" | "C" | "B" | "A" | "S" | "N";
    description: string;
    quote: string | null;
  }>;
  synergies: Array<{
    id: string;
    name: string;
    effect: string;
    requiredGroups: number;
    components: Array<{ itemId: string; groupIndex: number }>;
  }>;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const path = join(process.cwd(), "src/lib/data/dataset.json");
  const data = JSON.parse(readFileSync(path, "utf-8")) as Dataset;

  console.log(`Seeding ${data.items.length} items and ${data.synergies.length} synergies...`);

  // Clear existing reference data (respect FK order).
  await db.delete(schema.synergyComponent);
  await db.delete(schema.synergy);
  await db.delete(schema.item);

  // Items.
  for (const batch of chunk(data.items, 200)) {
    await db.insert(schema.item).values(batch);
  }

  // Synergies + components.
  for (const batch of chunk(data.synergies, 200)) {
    await db.insert(schema.synergy).values(
      batch.map((s) => ({
        id: s.id,
        name: s.name,
        effect: s.effect,
        requiredGroups: s.requiredGroups,
      })),
    );
  }

  const components = data.synergies.flatMap((s) =>
    s.components.map((c) => ({
      synergyId: s.id,
      itemId: c.itemId,
      groupIndex: c.groupIndex,
    })),
  );
  for (const batch of chunk(components, 500)) {
    await db.insert(schema.synergyComponent).values(batch);
  }

  console.log(`Inserted ${components.length} synergy components.`);
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
