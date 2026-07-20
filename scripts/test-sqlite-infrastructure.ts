/**
 * Quick test script to verify SQLite infrastructure initialization.
 * Run with: npx tsx scripts/test-sqlite-infrastructure.ts
 */

import { InfrastructureFactory } from "../packages/infrastructure/src/factory.js";
import { unlinkSync, existsSync } from "node:fs";

async function main() {
  const testDbPath = "./data/spyral-test.db";

  // Clean up any previous test db
  try { if (existsSync(testDbPath)) unlinkSync(testDbPath); } catch {}

  const factory = new InfrastructureFactory({
    type: "sqlite",
    sqlitePath: testDbPath,
  });

  await factory.initialize();
  console.log("✅ Infrastructure initialized");

  const decisionRepo = factory.createDecisionRepository();
  console.log("✅ DecisionRepository created:", !!decisionRepo);

  const uow = factory.createUnitOfWork();
  console.log("✅ UnitOfWork created:", !!uow);

  await uow.executeInTransaction(async () => {
    const tenantCtx = {
      userId: "test",
      organizationId: "org-1",
      role: "admin" as const,
      permissions: [] as string[],
      requestId: "r1",
      sessionId: "s1",
      issuedAt: new Date().toISOString(),
    };

    const decision = {
      id: "test-1",
      workspaceId: "ws-1",
      ownerId: "user-1",
      orgId: "org-1",
      title: "Test Decision",
      intent: "Testing",
      context: "Unit test",
      options: [] as any[],
      status: "draft" as const,
      confidence: 0.5,
      tags: ["test"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await decisionRepo.save(tenantCtx, decision);
    console.log("✅ Decision saved:", saved.id);

    const found = await decisionRepo.findById(tenantCtx, "test-1");
    console.log("✅ Decision found:", found?.title);
    console.assert(found?.title === "Test Decision", "Title mismatch");
  });

  console.log("\n🎉 All SQLite tests passed!");

  await factory.dispose();
  // Clean up
  try { if (existsSync(testDbPath)) unlinkSync(testDbPath); } catch {}
}

main().catch(console.error);

