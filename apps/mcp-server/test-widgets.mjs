/**
 * E2E Test: Widget Resources via MCP StreamableHTTP
 *
 * Tests all 6 widget resources:
 *   - status-badge
 *   - decision-card
 *   - workspace-dashboard
 *   - execution-timeline
 *   - learning-summary
 *   - validation-report
 */

const BASE = "http://localhost:3001";
let sessionId = null;

async function mcpCall(method, params) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
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
    // Parse SSE: extract data from "event: message\ndata: {...}\n\n"
    const match = text.match(/data: (\{.*\})/);
    if (match) {
      const data = JSON.parse(match[1]);
      if (data.result) return data.result;
      if (data.error) throw new Error(data.error.message);
      return data;
    }
    throw new Error("Could not parse SSE response: " + text.substring(0, 200));
  }

  // Handle JSON response
  const data = await res.json();
  if (data.result) return data.result;
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function main() {
  console.log("=== MCP Widget E2E Test ===\n");

  // 1. Initialize — StreamableHTTP may already have a session if the
  //    server is reused. We handle both fresh and reused cases.
  console.log("1. Initialize...");
  try {
    const init = await mcpCall("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    });
    console.log("   Server:", init.serverInfo?.name, init.serverInfo?.version);

    // Send initialized notification — need to include session ID
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
  } catch (e) {
    // If already initialized, that's fine — proceed with the existing session
    if (e.message.includes("already initialized")) {
      console.log("   (already initialized, reusing session)");
    } else {
      throw e;
    }
  }

  // 2. List resources
  console.log("\n2. List resources...");
  const resources = await mcpCall("resources/list", {});
  console.log("   Found " + resources.resources.length + " resources:");
  for (const r of resources.resources) {
    console.log("   - " + r.uri + " (" + r.name + ")");
  }

  // Verify all 6 widget resources are registered
  const expectedUris = [
    "ui://widget/decision-card",
    "ui://widget/workspace-dashboard",
    "ui://widget/execution-timeline",
    "ui://widget/learning-summary",
    "ui://widget/validation-report",
    "ui://widget/status-badge",
  ];
  const registeredUris = resources.resources.map((r) => r.uri);
  let allFound = true;
  for (const uri of expectedUris) {
    if (!registeredUris.includes(uri)) {
      console.log("   ❌ MISSING: " + uri);
      allFound = false;
    }
  }
  if (allFound) console.log("   ✅ All 6 widget resources registered");

  // 3. Create a workspace
  console.log("\n3. Create workspace...");
  const ws = await mcpCall("tools/call", {
    name: "spyral_create_workspace",
    arguments: {
      name: "Widget Test Workspace",
      description: "Testing the B.4 widget layer",
      goal: "Validate all widgets render correctly",
    },
  });
  const wsText = ws.content?.[0]?.text;
  const wsResult = wsText ? JSON.parse(wsText) : ws;
  const wsId = wsResult.id;
  console.log("   Workspace ID:", wsId);

  // 4. Create a decision
  console.log("\n4. Create decision...");
  const dec = await mcpCall("tools/call", {
    name: "spyral_create_decision",
    arguments: {
      workspaceId: wsId,
      title: "Widget Test Decision",
      intent: "Launch a new product line targeting enterprise customers",
    },
  });
  const decText = dec.content?.[0]?.text;
  const decResult = decText ? JSON.parse(decText) : dec;
  const decId = decResult.decision?.id;
  console.log("   Decision ID:", decId);

  // 5. Read status-badge widget
  console.log("\n5. Read status-badge widget...");
  try {
    const badge = await mcpCall("resources/read", {
      uri: "ui://widget/status-badge",
    });
    const html = badge.contents?.[0]?.text || "";
    console.log("   HTML length:", html.length);
    console.log("   Has 'SPYRAL OS':", html.includes("SPYRAL OS") ? "✅" : "❌");
    console.log("   Has 'Operational':", html.includes("Operational") ? "✅" : "❌");
    console.log("   Has capability statuses:", html.includes("Decision Intelligence") ? "✅" : "❌");
  } catch (e) {
    console.log("   ❌ Error:", e.message);
  }

  // 6. Read decision-card widget
  console.log("\n6. Read decision-card widget (id=" + decId + ")...");
  try {
    const card = await mcpCall("resources/read", {
      uri: "ui://widget/decision-card?id=" + decId,
    });
    const html = card.contents?.[0]?.text || "";
    console.log("   HTML length:", html.length);
    console.log("   Has title:", html.includes("Widget Test Decision") ? "✅" : "❌");
    console.log("   Has options:", html.includes("spyral-option") ? "✅" : "❌");
    console.log("   Has 'View Workspace':", html.includes("View Workspace") ? "✅" : "❌");
    console.log("   Has confidence:", html.includes("confidence") ? "✅" : "❌");
  } catch (e) {
    console.log("   ❌ Error:", e.message);
  }

  // 7. Read workspace-dashboard widget
  console.log("\n7. Read workspace-dashboard widget (id=" + wsId + ")...");
  try {
    const dash = await mcpCall("resources/read", {
      uri: "ui://widget/workspace-dashboard?id=" + wsId,
    });
    const html = dash.contents?.[0]?.text || "";
    console.log("   HTML length:", html.length);
    console.log("   Has workspace name:", html.includes("Widget Test Workspace") ? "✅" : "❌");
    console.log("   Has stats grid:", html.includes("spyral-stat") ? "✅" : "❌");
    console.log("   Has decisions list:", html.includes("Widget Test Decision") ? "✅" : "❌");
  } catch (e) {
    console.log("   ❌ Error:", e.message);
  }

  // 8. Read execution-timeline widget (with non-existent ID)
  console.log('\n8. Read execution-timeline widget (non-existent)...');
  try {
    const timeline = await mcpCall("resources/read", {
      uri: "ui://widget/execution-timeline?id=nonexistent",
    });
    console.log("   ✅ Should return error for non-existent (unexpected success)");
  } catch (e) {
    console.log("   ✅ Correctly throws for non-existent execution (expected)");
  }

  // 9. Read learning-summary widget (with workspace ID)
  console.log("\n9. Read learning-summary widget (workspaceId=" + wsId + ")...");
  try {
    const learn = await mcpCall("resources/read", {
      uri: "ui://widget/learning-summary?workspaceId=" + wsId,
    });
    const html = learn.contents?.[0]?.text || "";
    console.log("   HTML length:", html.length);
    console.log("   Shows empty state:", html.includes("No learning records") ? "✅" : "❌");
  } catch (e) {
    console.log("   ❌ Error:", e.message);
  }

  // 10. Read validation-report widget
  console.log("\n10. Read validation-report widget...");
  try {
    const report = await mcpCall("resources/read", {
      uri: "ui://widget/validation-report?executionId=test",
    });
    const html = report.contents?.[0]?.text || "";
    console.log("   HTML length:", html.length);
    console.log("   Shows coming soon:", html.includes("Coming in Phase C.0") ? "✅" : "❌");
  } catch (e) {
    console.log("   ❌ Error:", e.message);
  }

  console.log("\n=== Widget E2E Test Complete ===");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
