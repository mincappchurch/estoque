import { seedDefaultUnits } from "../server/db";

async function main() {
  console.log("Seeding default units...");
  await seedDefaultUnits();
  console.log("Units seeded successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error seeding units:", error);
  process.exit(1);
});
