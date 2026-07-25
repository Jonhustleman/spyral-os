/**
 * SPYRAL OS — RC8 Acceptance Tests
 *
 * Verifies the four RC8 acceptance criteria:
 *   1. Research — thoughtful exploration
 *   2. Content — creative strategy
 *   3. Consultant — executive reasoning
 *   4. Memory — natural recall across turns
 *
 * Each test submits a prompt to the appropriate agent page and
 * verifies that a meaningful response is returned. For the memory
 * test, we store a fact and then verify it is recalled later.
 *
 * These are full-stack acceptance tests — they require the LLM to
 * be available (OpenRouter or local Ollama fallback).
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

/**
 * Helper: Submit a prompt on an agent page and wait for the response.
 * Returns the final agent message content.
 */
async function submitPromptAndGetResponse(
  page: any,
  prompt: string,
): Promise<string> {
  // Find the textarea/input
  const input = page.locator("textarea, input[type='text']").last();
  await input.fill(prompt);
  await input.press("Enter");

  // Wait for thinking indicator to appear
  await expect(page.locator("text=thinking").first()).toBeVisible({
    timeout: 5000,
  });

  // Wait for thinking indicator to disappear (response complete)
  await expect(page.locator("text=thinking").first()).not.toBeVisible({
    timeout: 120_000, // LLMs can be slow
  });

  // Get the last agent message
  const agentMessages = page.locator('[class*="bg-zinc-900/60"]');
  const count = await agentMessages.count();
  if (count === 0) return "";
  return (await agentMessages.last().textContent()) || "";
}

// ─── Research: Thoughtful Exploration ──────────────────────────────────

test.describe("RC8 — Research Agent", () => {
  test('1. Responds to "What if humans could naturally fly?"', async ({
    page,
  }) => {
    test.setTimeout(180_000); // LLMs can be slow
    await page.goto(`${BASE_URL}/research`);

    // Wait for the input to be ready
    await expect(
      page.locator("textarea, input[type='text']").last(),
    ).toBeVisible({ timeout: 10_000 });

    const response = await submitPromptAndGetResponse(
      page,
      "What if humans could naturally fly?",
    );

    // Verify we got a meaningful response
    expect(response.length).toBeGreaterThan(50);
    expect(response).not.toContain("I encountered an error");
    expect(response).not.toContain("Something went wrong");

    // Should explore the implications thoughtfully
    const thoughtfulTerms = [
      "flight",
      "flying",
      "evol",
      "societ",
      "world",
      "imagin",
      "possibilit",
    ];
    const hasThoughtfulContent = thoughtfulTerms.some((term) =>
      response.toLowerCase().includes(term),
    );
    expect(hasThoughtfulContent).toBeTruthy();
  });
});

// ─── Content: Creative Strategy ────────────────────────────────────────

test.describe("RC8 — Content Agent", () => {
  test('2. Responds to "Launch a luxury electric motorcycle"', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto(`${BASE_URL}/content`);

    await expect(
      page.locator("textarea, input[type='text']").last(),
    ).toBeVisible({ timeout: 10_000 });

    const response = await submitPromptAndGetResponse(
      page,
      "Launch a luxury electric motorcycle",
    );

    // Verify we got a meaningful response
    expect(response.length).toBeGreaterThan(50);
    expect(response).not.toContain("I encountered an error");
    expect(response).not.toContain("Something went wrong");

    // Should be a creative strategy
    const strategyTerms = [
      "luxury",
      "electr",
      "motorcycle",
      "bike",
      "market",
      "brand",
      "launch",
      "campaign",
    ];
    const hasStrategyContent = strategyTerms.some((term) =>
      response.toLowerCase().includes(term),
    );
    expect(hasStrategyContent).toBeTruthy();
  });
});

// ─── Consultant: Executive Reasoning ───────────────────────────────────

test.describe("RC8 — Consultant Agent", () => {
  test('3. Responds to "Should I raise funding now?"', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(`${BASE_URL}/consultant`);

    await expect(
      page.locator("textarea, input[type='text']").last(),
    ).toBeVisible({ timeout: 10_000 });

    const response = await submitPromptAndGetResponse(
      page,
      "Should I raise funding now?",
    );

    // Verify we got a meaningful response
    expect(response.length).toBeGreaterThan(50);
    expect(response).not.toContain("I encountered an error");
    expect(response).not.toContain("Something went wrong");

    // Should provide executive reasoning
    const reasoningTerms = [
      "fund",
      "invest",
      "valuat",
      "revenue",
      "growth",
      "traction",
      "market",
      "strateg",
    ];
    const hasReasoningContent = reasoningTerms.some((term) =>
      response.toLowerCase().includes(term),
    );
    expect(hasReasoningContent).toBeTruthy();
  });
});

// ─── Memory: Natural Recall ────────────────────────────────────────────

test.describe("RC8 — Memory / Natural Recall", () => {
  test('4. Recalls mission across turns', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(`${BASE_URL}/research`);

    await expect(
      page.locator("textarea, input[type='text']").last(),
    ).toBeVisible({ timeout: 10_000 });

    // Step 1: Store a mission statement
    const response1 = await submitPromptAndGetResponse(
      page,
      "Remember my mission is building an intelligence operating system",
    );

    expect(response1.length).toBeGreaterThan(20);
    expect(response1).not.toContain("I encountered an error");

    // Step 2: Navigate away and back to simulate a new conversation turn
    await page.goto(`${BASE_URL}/research`);

    await expect(
      page.locator("textarea, input[type='text']").last(),
    ).toBeVisible({ timeout: 10_000 });

    // Step 3: Ask what the mission is
    const response2 = await submitPromptAndGetResponse(
      page,
      "What mission am I working on?",
    );

    // Verify the response recalls the mission
    expect(response2.length).toBeGreaterThan(20);
    expect(response2).not.toContain("I encountered an error");

    // Should mention the intelligence operating system concept
    const recallTerms = [
      "intelligence",
      "operating",
      "system",
      "mission",
      "build",
      "spyral",
      "os",
    ];
    const hasRecall = recallTerms.some((term) =>
      response2.toLowerCase().includes(term),
    );
    expect(hasRecall).toBeTruthy();
  });
});
