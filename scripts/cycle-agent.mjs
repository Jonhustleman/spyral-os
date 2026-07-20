/**
 * SPYRAL OS — Cycle Agent
 *
 * Autonomous agent that:
 * 1. Checks ChatGPT conversation for latest direction
 * 2. Executes development tasks (test, build, file ops)
 * 3. Reports results back to ChatGPT
 * 4. Loops until project completion
 *
 * Usage: node scripts/cycle-agent.mjs
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CYCLE_DIR = path.resolve(__dirname, '..', '.cycle');
const CHAT_URL = 'https://chatgpt.com/share/6a5dc226-e680-83ea-9db1-fb4091aa12fd';
const PROJECT_DIR = path.resolve(__dirname, '..');
const COOKIES_FILE = path.join(CYCLE_DIR, 'cookies.json');
const STATE_FILE = path.join(CYCLE_DIR, 'state.json');
const MAX_CYCLES = 500;

// ─── Helpers ────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function runCmd(cmd) {
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: 'cmd.exe',
      timeout: 120000,
      env: { ...process.env, Path: `C:\\Program Files\\nodejs;${process.env.Path}` },
    });
    return { success: true, output: output.trim() };
  } catch (e) {
    return { success: false, output: e.stdout?.trim() || e.message };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── State Management ──────────────────────────────────────────────────

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {
    log(`Warning: Could not load state: ${e.message}`);
  }
  return { cycleCount: 0, lastResponseHash: '', phase: 'initializing' };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log(`Warning: Could not save state: ${e.message}`);
  }
}

// ─── Browser Automation ────────────────────────────────────────────────

async function launchBrowser() {
  log('Launching browser...');
  let browser, context, page;

  // Strategy 1: Headless with cookies (most reliable for auth)
  if (fs.existsSync(COOKIES_FILE)) {
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
      });
      page = await context.newPage();

      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));

      // Method A: context.addCookies
      try {
        await context.addCookies(cookies);
        log(`[Strategy 1A] Added ${cookies.length} cookies`);
      } catch (e) {
        log(`[Strategy 1A] addCookies failed: ${e.message}`);
      }

      // Navigate to establish secure context
      log('[Strategy 1] Navigating to chatgpt.com...');
      await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3000);

      // Method B: Set cookies via page.evaluate (more reliable for __Secure- prefix)
      try {
        for (const c of cookies) {
          const cookieStr = `${c.name}=${c.value}; domain=${c.domain}; path=${c.path}; secure; ${c.sameSite === 'None' ? 'SameSite=None;' : ''} ${c.name === '__Secure-oai-is' ? 'SameSite=None;' : ''}`;
          await page.evaluate((cs) => { document.cookie = cs; }, cookieStr);
        }
        log(`[Strategy 1B] Set ${cookies.length} cookies via evaluate()`);
      } catch (e) {
        log(`[Strategy 1B] evaluate failed: ${e.message}`);
      }

      // Reload to pick up cookies
      await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3000);

      log('[Strategy 1] Browser ready');
      return { browser, context, page };
    } catch (e) {
      log(`[Strategy 1] Headless with cookies failed: ${e.message}`);
      if (browser) await browser.close();
    }
  }

  // Strategy 2: Try persistent Chrome profile
  const chromePaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Default'),
    path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default'),
  ];

  for (const userDataDir of chromePaths) {
    if (fs.existsSync(userDataDir)) {
      try {
        log(`Found Chrome profile at ${userDataDir}`);
        context = await chromium.launchPersistentContext(userDataDir, {
          headless: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          viewport: { width: 1280, height: 800 },
        });
        page = context.pages()[0] || await context.newPage();
        browser = context.browser;
        log('Launched with Chrome profile');
        return { browser, context, page };
      } catch (e) {
        log(`Chrome profile approach failed: ${e.message}`);
        if (context) await context.close();
      }
    }
  }

  // Strategy 3: Try headless with saved cookies
  if (fs.existsSync(COOKIES_FILE)) {
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: { width: 1280, height: 800 },
      });
      page = await context.newPage();
      
      // Navigate first to establish secure context, then set cookies
      log('Navigating to chatgpt.com to set cookies...');
      await page.goto('https://chatgpt.com', { waitUntil: 'networkidle', timeout: 30000 });
      
      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
      
      // Method A: Try addCookies
      try {
        await context.addCookies(cookies);
        log(`Method A: Added ${cookies.length} cookies via context.addCookies()`);
      } catch (e) {
        log(`Method A failed: ${e.message}`);
      }
      
      // Method B: Set cookies via page.evaluate (works for __Secure- prefix on HTTPS)
      try {
        for (const c of cookies) {
          const cookieStr = `${c.name}=${c.value}; domain=${c.domain}; path=${c.path}; secure; ${c.sameSite === 'None' ? 'SameSite=None;' : ''}`;
          await page.evaluate((cs) => { document.cookie = cs; }, cookieStr);
        }
        log(`Method B: Set ${cookies.length} cookies via page.evaluate()`);
      } catch (e) {
        log(`Method B failed: ${e.message}`);
      }
      
      // Reload to pick up cookies
      await page.goto('https://chatgpt.com', { waitUntil: 'networkidle', timeout: 30000 });
      log('Testing session...');
      return { browser, context, page };
    } catch (e) {
      log(`Headless cookies failed: ${e.message}`);
      if (browser) await browser.close();
    }
  }

  // Strategy 4: Visible browser as last resort
  log('Launching visible browser (last resort)...');
  browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();

  // Try to save cookies after navigation
  page.on('load', async () => {
    try {
      const cookies = await context.cookies();
      const chatCookies = cookies.filter(c =>
        c.domain.includes('chatgpt.com') || c.domain.includes('openai.com')
      );
      if (chatCookies.length > 0) {
        fs.writeFileSync(COOKIES_FILE, JSON.stringify(chatCookies, null, 2));
        log(`Saved ${chatCookies.length} cookies`);
      }
    } catch (e) { /* silent */ }
  });

  return { browser, context, page };
}

async function saveCookies(page) {
  const cookies = await page.context().cookies();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  log(`Saved ${cookies.length} cookies`);
}

// ─── ChatGPT Interaction ───────────────────────────────────────────────

async function waitForPage(page) {
  log('Navigating to ChatGPT...');
  await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(5000); // Wait for dynamic content
}

async function getLatestMessage(page) {
  try {
    // Get all message elements
    const messages = await page.evaluate(() => {
      const articles = document.querySelectorAll('[data-message-author-role]');
      return Array.from(articles).map(el => ({
        role: el.getAttribute('data-message-author-role'),
        text: el.textContent?.trim() || '',
      }));
    });

    if (messages.length === 0) {
      // Fallback: try getting main content
      const main = document.querySelector('main');
      const text = main?.innerText || '';
      return { role: 'unknown', text, allMessages: [] };
    }

    const last = messages[messages.length - 1];
    return { role: last.role, text: last.text, allMessages: messages };
  } catch (e) {
    log(`Error reading messages: ${e.message}`);
    return { role: 'unknown', text: '', allMessages: [] };
  }
}

async function sendMessage(page, message) {
  log(`Sending message to ChatGPT...`);
  try {
    await page.evaluate((msg) => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = msg;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, message);

    await sleep(1000);

    // Click send button or press Enter
    await page.evaluate(() => {
      const sendBtn = document.querySelector('button[data-testid="send-button"], button[aria-label="Send prompt"]');
      if (sendBtn) {
        sendBtn.click();
        return;
      }
      // Fallback: press Enter
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      }
    });

    log('Message sent, waiting for response...');
    await sleep(3000);
  } catch (e) {
    log(`Error sending message: ${e.message}`);
  }
}

async function waitForResponse(page, previousMessageCount) {
  log('Waiting for ChatGPT response...');
  let waitCycles = 0;
  const maxWaitCycles = 60; // ~5 minutes

  while (waitCycles < maxWaitCycles) {
    await sleep(5000);
    try {
      const messageCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-message-author-role]').length;
      });
      if (messageCount > previousMessageCount) {
        log('New response detected!');
        return true;
      }
    } catch (e) {
      // Ignore
    }
    waitCycles++;
    if (waitCycles % 6 === 0) {
      log(`Still waiting... (${waitCycles * 5}s)`);
    }
  }
  log('Wait timeout - no new response detected');
  return false;
}

// ─── Task Execution ────────────────────────────────────────────────────

function executeTask(response) {
  const lower = response.toLowerCase();
  const results = [];

  // Run tests if response mentions testing
  if (lower.includes('test') || lower.includes('vitest') || lower.includes('spec')) {
    log('Running tests...');
    const testResult = runCmd('npx vitest run');
    results.push({ task: 'tests', ...testResult });
  }

  // Run build if mentioned
  if (lower.includes('build') || lower.includes('compile')) {
    log('Running build...');
    const buildResult = runCmd('npx next build');
    results.push({ task: 'build', ...buildResult });
  }

  // Run lint if mentioned
  if (lower.includes('lint') || lower.includes('eslint')) {
    log('Running lint...');
    const lintResult = runCmd('npx eslint . --max-warnings=0');
    results.push({ task: 'lint', ...lintResult });
  }

  // Create file if mentioned (pattern: "create file /path/to/file")
  const createFileMatch = lower.match(/create file\s+(\S+)/i);
  if (createFileMatch) {
    const filePath = createFileMatch[1];
    log(`Creating file: ${filePath}`);
    // Extract content between code blocks
    const codeMatch = response.match(/```[\s\S]*?```/);
    if (codeMatch) {
      const content = codeMatch[0].replace(/```\w*\n?|```/g, '');
      try {
        const fullPath = path.resolve(PROJECT_DIR, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
        results.push({ task: `create_file:${filePath}`, success: true, output: 'File created' });
      } catch (e) {
        results.push({ task: `create_file:${filePath}`, success: false, output: e.message });
      }
    }
  }

  // If no specific task, just run tests as default
  if (results.length === 0) {
    log('No specific task detected, running default checks...');
    const testResult = runCmd('npx vitest run');
    results.push({ task: 'default_checks', ...testResult });
  }

  return results;
}

// ─── Main Loop ─────────────────────────────────────────────────────────

async function main() {
  log('=== SPYRAL OS Cycle Agent Starting ===');
  log(`Project: ${PROJECT_DIR}`);
  log(`Chat URL: ${CHAT_URL}`);

  const state = loadState();
  log(`Cycle count: ${state.cycleCount}, Phase: ${state.phase}`);

  // Get cookies from the environment or use saved ones
  // First time: cookies must be provided
  if (!fs.existsSync(COOKIES_FILE)) {
    log('No cookies found. Please run init-cookies.ps1 first to capture session cookies.');
    log('Or manually export cookies from the browser session.');
    log('');
    log('Quick start:');
    log('1. Open Chrome DevTools on the ChatGPT page');
    log('2. Run: copy(document.cookie)');
    log('3. Paste into .cycle/cookies.json as an array of cookie objects');
    return;
  }

  // Launch browser with fallback strategies
  let { browser, context, page } = await launchBrowser();

  try {
    await waitForPage(page);

    // Check if we need to login
    let pageText = await page.evaluate(() => document.body.innerText);
    let attempt = 0;
    const maxLoginAttempts = 3;

    while ((pageText.includes('Log in') || pageText.includes('Sign up') || pageText.includes('auth0')) && attempt < maxLoginAttempts) {
      attempt++;
      log(`Session check failed (attempt ${attempt}/${maxLoginAttempts}). Closing and retrying with next strategy...`);
      await browser.close();
      await sleep(2000);
      
      // Try next strategy
      ({ browser, context, page } = await launchBrowser());
      await waitForPage(page);
      pageText = await page.evaluate(() => document.body.innerText);
    }

    if (pageText.includes('Log in') || pageText.includes('Sign up') || pageText.includes('auth0')) {
      log('All strategies exhausted - session still invalid.');
      log('Please log into ChatGPT in the VS Code browser, then run:');
      log('  node .cycle\\update-cookies.mjs');
      log('to refresh the cookies, and try again.');
      await browser.close();
      return;
    }

    log('Session valid! Starting automation cycle...');

    // Read current message count
    let prevCount = await page.evaluate(() => {
      return document.querySelectorAll('[data-message-author-role]').length;
    });
    log(`Current message count: ${prevCount}`);

    // If we have sent a message that hasn't been responded to yet, wait
    const allMessages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-message-author-role]')).map(el => ({
        role: el.getAttribute('data-message-author-role'),
      }));
    });

    const lastRole = allMessages.length > 0 ? allMessages[allMessages.length - 1].role : null;
    log(`Last message from: ${lastRole}`);

    // The cycle:
    // 1. If last message is from assistant (ChatGPT), we need to execute and respond
    // 2. If last message is from user (us), wait for ChatGPT to respond

    let cycleIterations = 0;
    while (cycleIterations < MAX_CYCLES) {
      cycleIterations++;
      state.cycleCount++;
      log(`\n--- Cycle ${state.cycleCount} ---`);

      const currentMessages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-message-author-role]')).map(el => ({
          role: el.getAttribute('data-message-author-role'),
          text: el.textContent?.trim() || '',
        }));
      });

      const currentLastRole = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].role : null;
      const lastText = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].text : '';

      // Hash the last response to detect changes
      const responseHash = lastText.substring(0, 200);
      if (responseHash === state.lastResponseHash && currentLastRole === 'assistant') {
        log('No new response from ChatGPT. Waiting...');
        await sleep(15000);
        continue;
      }

      if (currentLastRole === 'assistant') {
        // ChatGPT has spoken - execute tasks
        log('New response from ChatGPT detected!');
        log(`Response preview: ${lastText.substring(0, 300)}...`);
        state.lastResponseHash = responseHash;

        // Check for completion signal
        if (lastText.toLowerCase().includes('project complete') ||
            lastText.toLowerCase().includes('milestone complete') ||
            lastText.toLowerCase().includes('operational excellence complete')) {
          log('🎉 Project completion detected! Shutting down.');
          break;
        }

        // Execute tasks based on response
        log('Executing tasks...');
        const results = executeTask(lastText);

        // Build summary
        let summary = '';
        for (const r of results) {
          const status = r.success ? '✅' : '❌';
          const outputPreview = r.output ? r.output.substring(0, 500) : '(no output)';
          summary += `${status} ${r.task}:\n${outputPreview}\n\n`;
        }

        // Send results back to ChatGPT
        const responseMsg = `Cycle ${state.cycleCount} complete.\n\n${summary}\n\nWhat's next? 🌀`;
        await sendMessage(page, responseMsg);

        // Wait for new response
        const newCount = await page.evaluate(() => {
          return document.querySelectorAll('[data-message-author-role]').length;
        });
        await waitForResponse(page, newCount);

      } else if (currentLastRole === 'user') {
        // Our message is the last one - wait for ChatGPT
        log('Waiting for ChatGPT to respond to our message...');
        const newCount = await page.evaluate(() => {
          return document.querySelectorAll('[data-message-author-role]').length;
        });
        const responded = await waitForResponse(page, newCount);
        if (!responded) {
          log('No response yet. Will check again next cycle.');
          await sleep(10000);
        }
      } else {
        // No messages or unknown - navigate and wait
        log('No messages detected. Navigating...');
        await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(8000);
      }

      // Save state periodically
      saveState(state);
      log(`Cycle ${state.cycleCount} complete. Sleeping briefly...`);
      await sleep(3000);
    }

    log(`\n=== Cycle Agent finished after ${state.cycleCount} cycles ===`);
    state.phase = 'completed';
    saveState(state);

  } catch (e) {
    log(`Fatal error: ${e.message}`);
    log(e.stack);
  } finally {
    await browser.close();
  }
}

main().catch(e => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
