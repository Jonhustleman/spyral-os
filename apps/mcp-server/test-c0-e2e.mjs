/**
 * E2E Test: Phase C.0 Application Service Layer
 *
 * Tests the complete orchestrated workflow:
 *   User Request → MCP Tool → Application Service → Capabilities → Repositories
 *
 * Workflow:
 *   1. Initialize MCP session
 *   2. Create workspace
 *   3. Create decision (via CreateDecisionService)
 *   4. Get decision
 *   5. List decisions
 *   6. Get workspace
 *   7. Read widget resources
 */

const BASE = "http://localhost:3001";
let sessionId = null;

async function mcpCall(method, params, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  // Allow overriding session ID for initialize
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
      if (data.error) {
        const err = new Error(data.error.message);
        err.sessionId = sid;
        err.code = data.error.code;
        throw err;
      }
      return { result: data, sessionId: sid };
    }
    throw new Error("Could not parse SSE response: " + text.substring(0, 200));
  }

  // Handle JSON response
  const data = await res.json();
  if (data.result) return { result: data.result, sessionId: sid };
  if (data.error) {
    const err = new Error(data.error.message);
    err.sessionId = sid;
    err.code = data.error.code;
    throw err;
  }
  return { result: data, sessionId: sid };
}

async function main() {
  console.log("═══ SPYRAL OS — Phase C.0 E2E Test ═══\n");
  let passed = 0;
  let failed = 0;

  function check(description, condition) {
    if (condition) {
      console.log(`   ✅ ${description}`);
      passed++;
    } else {
      console.log(`   ❌ ${description}`);
      failed++;
    }
  }

  // ── 1. Initialize ──────────────────────────────────────────────────────────
  console.log("1. Initialize MCP session...");
  try {
    const { result: init, sessionId: sid } = await mcpCall("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "c0-e2e-test", version: "1.0.0" },
    }, { sessionId: null }); // Force no session ID for initialize
    console.log("   Server:", init.serverInfo?.name, init.serverInfo?.version);
    check("Server info present", !!init.serverInfo);
    if (sid) sessionId = sid;

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
    console.log("   Session ID:", sessionId);
    check("Session established", !!sessionId);
  } catch (e) {
    if (e.message.includes("already initialized")) {
      console.log("   (already initialized, reusing session)");
      // Try to use the session ID from the error response
      if (e.sessionId) {
        sessionId = e.sessionId;
        console.log("   Session ID from error:", sessionId);
      } else {
        console.log("   ⚠ No session ID in error response");
      }
      check("Session reused", !!sessionId);
    } else {
      console.log("   ❌ Initialize failed:", e.message);
      failed++;
    }
  }

  // ── 2. List tools ──────────────────────────────────────────────────────────
  console.log("\n2. List tools...");
  try {
    const { result: tools } = await mcpCall("tools/list", {});
    const toolNames = tools.tools.map((t) => t.name);
    console.log("   Tools:", toolNames.join(", "));
    const expectedTools = [
      "spyral_get_status",
      "spyral_create_decision",
      "spyral_get_decision",
      "spyral_list_decisions",
      "spyral_create_workspace",
      "spyral_get_workspace",
    ];
    for (const name of expectedTools) {
      check(`Tool registered: ${name}`, toolNames.includes(name));
    }
  } catch (e) {
    console.log("   ❌ List tools failed:", e.message);
    failed++;
  }

  // ── 3. Create workspace ────────────────────────────────────────────────────
  console.log("\n3. Create workspace...");
  let wsId;
  try {
    const { result: ws } = await mcpCall("tools/call", {
      name: "spyral_create_workspace",
      arguments: {
        name: "C.0 E2E Test Workspace",
        description: "Testing the Application Service Layer",
        goal: "Validate Phase C.0 end-to-end workflow",
      },
    });
    const wsText = ws.content?.[0]?.text;
    const wsResult = wsText ? JSON.parse(wsText) : ws;
    wsId = wsResult.id || wsResult.workspace?.id;
    console.log("   Workspace ID:", wsId);
    check("Workspace created with ID", !!wsId);
    check("Workspace is active", wsResult.status === "active");
    check("Workspace has name", wsResult.name === "C.0 E2E Test Workspace");
  } catch (e) {
    console.log("   ❌ Create workspace failed:", e.message);
    failed++;
  }

  // ── 4. Get workspace ───────────────────────────────────────────────────────
  console.log("\n4. Get workspace...");
  try {
    const { result: gw } = await mcpCall("tools/call", {
      name: "spyral_get_workspace",
      arguments: { id: wsId },
    });
    const gwText = gw.content?.[0]?.text;
    const gwResult = gwText ? JSON.parse(gwText) : gw;
    check("Get workspace returns workspace", !!gwResult.workspace?.id);
    check("Workspace name matches", gwResult.workspace?.name === "C.0 E2E Test Workspace");
  } catch (e) {
    console.log("   ❌ Get workspace failed:", e.message);
    failed++;
  }

  // ── 5. Create decision (via CreateDecisionService) ─────────────────────────
  console.log("\n5. Create decision (via CreateDecisionService)...");
  let decId;
  try {
    const { result: dec } = await mcpCall("tools/call", {
      name: "spyral_create_decision",
      arguments: {
        workspaceId: wsId,
        title: "E2E Test Decision",
        intent: "Should we launch a new enterprise product line targeting Fortune 500 companies?",
        context: "Market research shows 73% demand for AI-powered solutions in enterprise segment",
        tags: ["e2e-test", "enterprise"],
      },
    });
    const decText = dec.content?.[0]?.text;
    const decResult = decText ? JSON.parse(decText) : dec;
    decId = decResult.decision?.id || decResult.id;
    console.log("   Decision ID:", decId);
    check("Decision created with ID", !!decId);
    check("Decision has status", decResult.decision?.status === "analyzed");
    check("Decision has options", decResult.decision?.options?.length > 0);
    check("Decision has confidence > 0", decResult.decision?.confidence > 0);
    check("Decision has summary", !!decResult.summary);
    check("Decision has title in summary", decResult.summary?.title === "E2E Test Decision");
  } catch (e) {
    console.log("   ❌ Create decision failed:", e.message);
    failed++;
  }

  // ── 6. Get decision ────────────────────────────────────────────────────────
  console.log("\n6. Get decision...");
  try {
    const { result: gd } = await mcpCall("tools/call", {
      name: "spyral_get_decision",
      arguments: { decisionId: decId },
    });
    const gdText = gd.content?.[0]?.text;
    const gdResult = gdText ? JSON.parse(gdText) : gd;
    check("Get decision returns decision", !!gdResult.id);
    check("Decision title matches", gdResult.title === "E2E Test Decision");
    check("Decision has options", gdResult.options?.length > 0);
    check("Decision has workspaceId", gdResult.workspaceId === wsId);
  } catch (e) {
    console.log("   ❌ Get decision failed:", e.message);
    failed++;
  }

  // ── 7. List decisions ──────────────────────────────────────────────────────
  console.log("\n7. List decisions...");
  try {
    const { result: ld } = await mcpCall("tools/call", {
      name: "spyral_list_decisions",
      arguments: { workspaceId: wsId },
    });
    const ldText = ld.content?.[0]?.text;
    const ldResult = ldText ? JSON.parse(ldText) : ld;
    const decisions = ldResult.decisions || [];
    console.log("   Decisions found:", decisions.length);
    check("At least 1 decision listed", decisions.length >= 1);
    check("Decision summary has title", decisions[0]?.title === "E2E Test Decision");
    check("Decision summary has status", !!decisions[0]?.status);
  } catch (e) {
    console.log("   ❌ List decisions failed:", e.message);
    failed++;
  }

  // ── 8. Get status tool ─────────────────────────────────────────────────────
  console.log("\n8. Get system status...");
  try {
    const { result: st } = await mcpCall("tools/call", {
      name: "spyral_get_status",
      arguments: { detail: "basic" },
    });
    const stText = st.content?.[0]?.text;
    const stResult = stText ? JSON.parse(stText) : st;
    check("Status has system name", stResult.system === "SPYRAL OS");
    check("Status has health", !!stResult.health);
    check("Status has capabilities", stResult.capabilities?.length > 0);
  } catch (e) {
    console.log("   ❌ Get status failed:", e.message);
    failed++;
  }

  // ── 9. List resources (widgets) ────────────────────────────────────────────
  console.log("\n9. List widget resources...");
  try {
    const { result: resources } = await mcpCall("resources/list", {});
    const resourceUris = resources.resources.map((r) => r.uri);
    console.log("   Resources:", resourceUris.join(", "));
    const expectedUris = [
      "ui://widget/decision-card",
      "ui://widget/workspace-dashboard",
      "ui://widget/execution-timeline",
      "ui://widget/learning-summary",
      "ui://widget/validation-report",
      "ui://widget/status-badge",
    ];
    for (const uri of expectedUris) {
      check(`Resource registered: ${uri}`, resourceUris.includes(uri));
    }
  } catch (e) {
    console.log("   ❌ List resources failed:", e.message);
    failed++;
  }

  // ── 10. Read widget resources ──────────────────────────────────────────────
  console.log("\n10. Read widget resources...");
  
  // Status badge widget
  console.log("   Reading status-badge...");
  try {
    const { result: badge } = await mcpCall("resources/read", {
      uri: "ui://widget/status-badge",
    });
    const html = badge.contents?.[0]?.text || "";
    check("status-badge HTML returned", html.length > 0);
    check("status-badge has SPYRAL OS", html.includes("SPYRAL OS"));
  } catch (e) {
    console.log("   ❌ status-badge failed:", e.message);
    failed++;
  }

  // Decision card widget
  console.log("   Reading decision-card (id=" + decId + ")...");
  try {
    const { result: card } = await mcpCall("resources/read", {
      uri: "ui://widget/decision-card?id=" + decId,
    });
    const html = card.contents?.[0]?.text || "";
    check("decision-card HTML returned", html.length > 0);
    check("decision-card has title", html.includes("E2E Test Decision"));
  } catch (e) {
    console.log("   ❌ decision-card failed:", e.message);
    failed++;
  }

  // Workspace dashboard widget
  console.log("   Reading workspace-dashboard (id=" + wsId + ")...");
  try {
    const { result: dash } = await mcpCall("resources/read", {
      uri: "ui://widget/workspace-dashboard?id=" + wsId,
    });
    const html = dash.contents?.[0]?.text || "";
    check("workspace-dashboard HTML returned", html.length > 0);
    check("workspace-dashboard has workspace name", html.includes("C.0 E2E Test Workspace"));
  } catch (e) {
    console.log("   ❌ workspace-dashboard failed:", e.message);
    failed++;
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n═══ Results: ${passed}/${total} passed, ${failed} failed ═══`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
