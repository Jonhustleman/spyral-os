/**
 * Phase D.1 — Auth E2E Test
 * Quick verification that registration, login, profile, and error handling work.
 * Uses raw MCP protocol over HTTP (same pattern as test-c0-e2e.mjs).
 */

const BASE = "http://localhost:3001";
let sessionId = null;

async function mcpCall(method, params, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  const useSessionId = options.sessionId !== undefined ? options.sessionId : sessionId;
  if (useSessionId) {
    headers["Mcp-Session-Id"] = useSessionId;
  }

  const res = await fetch(BASE + "/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: params.id || "1",
      method,
      params,
    }),
  });

  // Capture session ID from response headers
  const sid = res.headers.get("Mcp-Session-Id");
  if (sid) {
    sessionId = sid;
  }

  const contentType = res.headers.get("content-type") || "";

  // Handle SSE response (text/event-stream)
  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    const match = text.match(/data: (\{.*\})/);
    if (match) {
      const data = JSON.parse(match[1]);
      if (data.result) return { result: data.result, sessionId: sid };
      if (data.error) throw new Error(data.error.message);
      return { result: data, sessionId: sid };
    }
    throw new Error("Could not parse SSE response: " + text.substring(0, 200));
  }

  // Handle JSON response
  const data = await res.json();
  if (data.result) return { result: data.result, sessionId: sid };
  if (data.error) throw new Error(data.error.message);
  return { result: data, sessionId: sid };
}

async function initialize() {
  console.log("1. Initialize MCP session...");
  const { result: init, sessionId: sid } = await mcpCall("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "spyral-e2e-test", version: "0.1.0" },
  }, { sessionId: null });
  console.log(`   Server: ${init?.serverInfo?.name || "unknown"}`);
  if (sid) sessionId = sid;
  console.log(`   Session ID: ${sessionId}`);

  // Send initialized notification
  const initHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) {
    initHeaders["Mcp-Session-Id"] = sessionId;
  }
  await fetch(BASE + "/messages", {
    method: "POST",
    headers: initHeaders,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
  });

  console.log("   ✅ Session established\n");
}

async function main() {
  console.log("═══ SPYRAL OS — Phase D.1 Auth E2E Test ═══\n");

  await initialize();

  let passed = 0;
  let failed = 0;
  let userId = "";

  function check(description, condition) {
    if (condition) {
      console.log(`   ✅ ${description}`);
      passed++;
    } else {
      console.log(`   ❌ ${description}`);
      failed++;
    }
  }

  // 1. List tools
  console.log("1. List tools...");
  const { result: tools } = await mcpCall("tools/list", {});
  const toolNames = (tools?.tools || []).map((t) => t.name);
  const expectedTools = ["spyral_register", "spyral_login", "spyral_get_profile", "spyral_logout"];
  for (const t of expectedTools) {
    check(`Tool registered: ${t}`, toolNames.includes(t));
  }

  // 2. Register
  console.log("\n2. Register user...");
  const { result: reg } = await mcpCall("tools/call", {
    name: "spyral_register",
    arguments: { email: "e2e@spyral.dev", username: "e2euser", displayName: "E2E User", password: "password123", orgName: "E2EOrg" },
  });
  const regData = JSON.parse(reg.content[0].text);
  check("Registration successful", regData.success);
  if (regData.success) {
    console.log(`      User ID: ${regData.userId}`);
    console.log(`      Org ID: ${regData.orgId}`);
    userId = regData.userId;
  }

  // 3. Login
  console.log("\n3. Login...");
  const { result: login } = await mcpCall("tools/call", {
    name: "spyral_login",
    arguments: { email: "e2e@spyral.dev", password: "password123" },
  });
  const loginData = JSON.parse(login.content[0].text);
  check("Login successful", loginData.success);
  if (loginData.success) {
    check("Has organizations", loginData.organizations?.length > 0);
  }

  // 4. Login with bad credentials
  console.log("\n4. Login with bad password (should fail)...");
  let badData;
  try {
    const { result: bad } = await mcpCall("tools/call", {
      name: "spyral_login",
      arguments: { email: "e2e@spyral.dev", password: "wrongpassword" },
    });
    badData = JSON.parse(bad.content[0].text);
  } catch (e) {
    badData = { success: false, error: e.message };
  }
  check("Bad login rejected", !badData.success);

  // 5. Duplicate registration
  console.log("\n5. Duplicate registration (should fail)...");
  let dupData;
  try {
    const { result: dup } = await mcpCall("tools/call", {
      name: "spyral_register",
      arguments: { email: "e2e@spyral.dev", username: "e2euser", displayName: "E2E User", password: "password123" },
    });
    dupData = JSON.parse(dup.content[0].text);
  } catch (e) {
    dupData = { success: false, error: e.message };
  }
  check("Duplicate rejected", !dupData.success);

  // 6. Get profile
  console.log("\n6. Get profile...");
  const { result: profile } = await mcpCall("tools/call", {
    name: "spyral_get_profile",
    arguments: { userId },
  });
  const profileData = JSON.parse(profile.content[0].text);
  check("Profile retrieved", profileData.success);
  if (profileData.success) {
    check("Username matches", profileData.user.username === "e2euser");
  }

  // 7. Logout
  console.log("\n7. Logout...");
  const { result: logout } = await mcpCall("tools/call", {
    name: "spyral_logout",
    arguments: { sessionId: loginData.sessionId },
  });
  const logoutData = JSON.parse(logout.content[0].text);
  check("Logout successful", logoutData.success);

  // Summary
  console.log(`\n═══ Results: ${passed}/${passed + failed} passed, ${failed} failed ═══`);
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

