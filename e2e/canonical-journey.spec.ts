/**
 * SPYRAL OS — Canonical Journey E2E Test
 *
 * The heartbeat of SPYRAL:
 * When this passes, a founder can travel from intent → reality → decision
 * → execution → validation → learning.
 *
 * Per ADR-0048, the UI is a projection of session state.
 * This test verifies the complete founder journey by:
 * 1. Creating a navigation session through the UI
 * 2. Answering clarifying questions
 * 3. Verifying each stage page renders correctly
 * 4. Using localStorage manipulation to advance through stages
 *    that can't be fully completed via UI interaction alone
 * 5. Verifying the journey is resumable
 *
 * UI Flow Details:
 * - Session starts at INTENT stage after prompt submission
 * - The same <input> is used for both the initial prompt and answers
 * - First answer transitions INTENT → CLARIFICATION
 * - Second answer fills context (e.g., targetDate) and advances to REALITY
 * - Router navigates to "/" when stage becomes REALITY
 */

import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'spyral_navigation_sessions';
const TEST_PROMPT = 'Grow monthly revenue to ₦10M within 6 months';
const BASE_URL = 'http://localhost:3000';
const FALLBACK_QUESTION = "Great. Let's figure out what has to change to get you there.";

/**
 * Helper: Read sessions from localStorage via page.evaluate
 */
async function getSessions(page: any) {
  return page.evaluate((key: string) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }, STORAGE_KEY);
}

/**
 * Helper: Write sessions to localStorage via page.evaluate
 */
async function setSessions(page: any, sessions: any[]) {
  await page.evaluate(({ key, data }: { key: string; data: any[] }) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  }, { key: STORAGE_KEY, data: sessions });
}

/**
 * Helper: Advance a session to a given stage by manipulating localStorage.
 */
async function advanceSessionToStage(
  page: any,
  sessionId: string,
  targetStage: string,
  contextOverrides: Record<string, any> = {}
) {
  const sessions = await getSessions(page);
  const idx = sessions.findIndex((s: any) => s.id === sessionId);
  if (idx === -1) throw new Error(`Session ${sessionId} not found`);

  sessions[idx].stage = targetStage;
  sessions[idx].context = { ...sessions[idx].context, ...contextOverrides };
  sessions[idx].updatedAt = new Date().toISOString();

  await setSessions(page, sessions);
}

/**
 * Helper: Fill the prompt/answer input and submit via Enter.
 * The same <input> is reused for both the initial prompt and clarifying answers.
 */
async function fillAndSubmit(page: any, text: string) {
  // After navigating, the input placeholder changes to "Type your answer..."
  const input = page.locator(
    'input[placeholder*="Grow monthly revenue"], input[placeholder="Type your answer..."]'
  ).first();
  await input.fill(text);
  await input.press('Enter');
}

// ─── Tests ──────────────────────────────────────────────────────────────

test.describe('SPYRAL Canonical Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('1. Home page loads with core branding', async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator('h1:has-text("SPYRAL")').first()).toBeVisible();
    await expect(page.locator('text=Reality Navigation Platform').first()).toBeVisible();
    await expect(page.locator('text=Where do you want to go today').first()).toBeVisible();

    // Category buttons
    await expect(page.locator('a:has-text("Business")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Marketing")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Finance")').first()).toBeVisible();

    // Create Workspace link
    const createLink = page.locator('a:has-text("Create Workspace")');
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute('href', '/navigate');
  });

  test('2. Navigate page renders prompt input', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);

    await expect(page.locator('input[placeholder*="Grow monthly revenue"]')).toBeVisible();
    await expect(page.locator('button:has-text("Navigate")')).toBeDisabled();
    await expect(
      page.locator('text=Describe your destination and SPYRAL will help you navigate there.')
    ).toBeVisible();
  });

  test('3. Create a navigation session via UI', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);

    // Fill prompt and submit
    const input = page.locator('input[placeholder*="Grow monthly revenue"]');
    await input.fill(TEST_PROMPT);

    const navigateButton = page.locator('button:has-text("Navigate")');
    await expect(navigateButton).toBeEnabled();
    await navigateButton.click();

    // After submit, the fallback question appears (not "target date" because
    // canProceed(INTENT) returns true immediately, so nextQuestion returns null)
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });

    // Answer input with placeholder "Type your answer..." should appear
    await expect(page.locator('input[placeholder="Type your answer..."]')).toBeVisible();

    // Answer button present but disabled (input cleared after submit)
    await expect(page.locator('button:has-text("Answer")')).toBeDisabled();

    // Verify session in localStorage
    const sessions = await getSessions(page);
    expect(sessions.length).toBe(1);
    expect(sessions[0].prompt).toBe(TEST_PROMPT);
    expect(sessions[0].stage).toBe('INTENT');
    expect(sessions[0].status).toBe('ACTIVE');
    expect(sessions[0].context.intent).toBe(TEST_PROMPT);
  });

  test('4. Answer clarifying questions and transition to Reality stage', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);

    // Step 1: Submit prompt
    await fillAndSubmit(page, TEST_PROMPT);
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });

    // Step 2: First answer — transitions INTENT → CLARIFICATION
    await fillAndSubmit(page, '6 months');
    let sessions = await getSessions(page);
    expect(sessions[0].stage).toBe('CLARIFICATION');

    // Step 3: Second answer — fills targetDate, transitions CLARIFICATION → REALITY
    await fillAndSubmit(page, '6 months');
    await page.waitForURL(BASE_URL + '/', { timeout: 5000 });
    await expect(page.locator('text=Reality Navigation Platform').first()).toBeVisible();

    sessions = await getSessions(page);
    expect(sessions[0].stage).toBe('REALITY');
    expect(sessions[0].context.targetDate).toBe('6 months');
  });

  test('5. Reality stage renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);
    await fillAndSubmit(page, TEST_PROMPT);
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });
    await fillAndSubmit(page, '6 months');
    await fillAndSubmit(page, '6 months');
    await page.waitForURL(BASE_URL + '/', { timeout: 5000 });

    const sessions = await getSessions(page);
    expect(sessions[0].stage).toBe('REALITY');
    expect(sessions[0].context.targetDate).toBe('6 months');

    await expect(page.locator('h1:has-text("SPYRAL")').first()).toBeVisible();
    await expect(page.locator('text=Reality Navigation Platform').first()).toBeVisible();
  });

  test('6. Decision Studio page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);
    await fillAndSubmit(page, TEST_PROMPT);
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });
    await fillAndSubmit(page, '6 months');
    await fillAndSubmit(page, '6 months');
    await page.waitForURL(BASE_URL + '/', { timeout: 5000 });

    const sessions = await getSessions(page);
    const sessionId = sessions[0].id;
    await advanceSessionToStage(page, sessionId, 'DECISION', {
      currentRealityKnown: true,
      goalDefined: true,
    });

    await page.goto(`${BASE_URL}/decisions`);
    await expect(page.locator('h1:has-text("Decision Studio")')).toBeVisible();
    await expect(page.locator('text=Map choices, compare options').first()).toBeVisible();
  });

  test('7. Execution Studio page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);
    await fillAndSubmit(page, TEST_PROMPT);
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });
    await fillAndSubmit(page, '6 months');
    await fillAndSubmit(page, '6 months');
    await page.waitForURL(BASE_URL + '/', { timeout: 5000 });

    const sessions = await getSessions(page);
    const sessionId = sessions[0].id;
    await advanceSessionToStage(page, sessionId, 'EXECUTION', {
      currentRealityKnown: true,
      goalDefined: true,
    });

    await page.goto(`${BASE_URL}/execution`);
    await expect(page.locator('h1:has-text("Execution Studio")')).toBeVisible();
    await expect(page.locator('text=Plan, track, and execute work').first()).toBeVisible();
    await expect(page.locator('button:has-text("New Plan")')).toBeVisible();
  });

  test('8. Validation Studio page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);
    await fillAndSubmit(page, TEST_PROMPT);
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });
    await fillAndSubmit(page, '6 months');
    await fillAndSubmit(page, '6 months');
    await page.waitForURL(BASE_URL + '/', { timeout: 5000 });

    const sessions = await getSessions(page);
    const sessionId = sessions[0].id;
    await advanceSessionToStage(page, sessionId, 'EXECUTION', {
      currentRealityKnown: true,
      goalDefined: true,
    });

    await page.goto(`${BASE_URL}/validation`);
    await expect(page.locator('h1:has-text("Validation Studio")')).toBeVisible();
    await expect(page.locator('text=Compare expected vs observed results').first()).toBeVisible();
    await expect(page.locator('button:has-text("New Validation")')).toBeVisible();
  });

  test('9. Learning Studio page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/learning`);
    await expect(page.locator('h1:has-text("Learning Studio")')).toBeVisible();
    await expect(page.locator('text=Discover patterns, generate insights').first()).toBeVisible();
    await expect(page.locator('button:has-text("Discover Pattern")')).toBeVisible();
    await expect(page.locator('button:has-text("Generate Insights")')).toBeVisible();
    await expect(page.locator('button:has-text("Generate Recommendations")')).toBeVisible();
  });

  test('10. Journey is resumable — paused session can be continued', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);
    await fillAndSubmit(page, TEST_PROMPT);
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });
    await fillAndSubmit(page, '6 months');
    await fillAndSubmit(page, '6 months');
    await page.waitForURL(BASE_URL + '/', { timeout: 5000 });

    // Advance to DECISION and mark PAUSED
    const sessions = await getSessions(page);
    const sessionId = sessions[0].id;
    await advanceSessionToStage(page, sessionId, 'DECISION', {
      currentRealityKnown: true,
      goalDefined: true,
    });

    await page.evaluate(({ key, id }: { key: string; id: string }) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const all = JSON.parse(raw);
        const idx = all.findIndex((s: any) => s.id === id);
        if (idx !== -1) {
          all[idx].status = 'PAUSED';
          localStorage.setItem(key, JSON.stringify(all));
          window.dispatchEvent(new Event('storage'));
        }
      }
    }, { key: STORAGE_KEY, id: sessionId });

    // Navigate back — paused session appears in "Continue Journey"
    await page.goto(`${BASE_URL}/navigate`);
    await expect(page.locator('h2:has-text("Continue Journey")')).toBeVisible();
    await expect(page.locator(`text=${TEST_PROMPT.substring(0, 20)}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('11. Complete Canonical Journey — Intent to Reality to Decision', async ({ page }) => {
    await page.goto(`${BASE_URL}/navigate`);

    // Step 1: Express Intent → INTENT stage
    await fillAndSubmit(page, TEST_PROMPT);
    await expect(page.locator(`text=${FALLBACK_QUESTION}`).first()).toBeVisible({ timeout: 5000 });

    // Step 2: First answer → CLARIFICATION
    await fillAndSubmit(page, '6 months');

    // Step 3: Second answer → REALITY (router navigates to /)
    await fillAndSubmit(page, '6 months');
    await page.waitForURL(BASE_URL + '/', { timeout: 5000 });

    let sessions = await getSessions(page);
    expect(sessions.length).toBe(1);
    expect(sessions[0].stage).toBe('REALITY');
    expect(sessions[0].context.targetDate).toBe('6 months');

    // Step 4: Advance to DECISION via localStorage
    const sessionId = sessions[0].id;
    await advanceSessionToStage(page, sessionId, 'DECISION', {
      currentRealityKnown: true,
      goalDefined: true,
    });

    // Step 5: Navigate to Decision Studio
    await page.goto(`${BASE_URL}/decisions`);
    await expect(page.locator('h1:has-text("Decision Studio")')).toBeVisible();

    const updatedSessions = await getSessions(page);
    expect(updatedSessions.length).toBe(1);
    expect(updatedSessions[0].stage).toBe('DECISION');
    expect(updatedSessions[0].prompt).toBe(TEST_PROMPT);
  });
});