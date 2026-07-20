# SPYRAL OS API Reference

> **Document Version:** v1.0.0  
> **Last Updated:** 2026-07-20  
> **Base URL:** `http://localhost:3001`

---

## Table of Contents

1. [HTTP Endpoints](#http-endpoints)
2. [MCP Tools](#mcp-tools)
3. [Authentication](#authentication)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)

---

## HTTP Endpoints

### Health Check

```
GET /health
```

Returns the liveness status of the server.

**Rate Limited:** No

**Response `200`:**

```json
{
  "status": "healthy",
  "timestamp": "2026-07-20T10:30:00.000Z",
  "uptime": 1234,
  "version": "1.0.0"
}
```

---

### Readiness Check

```
GET /ready
```

Returns whether the server is ready to accept requests (includes database connectivity check).

**Rate Limited:** No

**Response `200`:**

```json
{
  "status": "ready",
  "timestamp": "2026-07-20T10:30:00.000Z",
  "uptime": 1234,
  "version": "1.0.0",
  "database": "connected"
}
```

**Response `503` (not ready):**

```json
{
  "status": "not_ready",
  "timestamp": "2026-07-20T10:30:00.000Z",
  "uptime": 5,
  "version": "1.0.0",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

---

### System Status

```
GET /status
```

Returns comprehensive system status including all subsystems.

**Rate Limited:** Yes

**Response `200`:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 1234,
  "timestamp": "2026-07-20T10:30:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "lastChecked": "2026-07-20T10:30:00.000Z"
    },
    "mcp": {
      "status": "healthy",
      "activeSessions": 0
    }
  },
  "metrics": {
    "totalRequests": 150,
    "averageDurationMs": 12.5
  }
}
```

---

### Metrics

```
GET /metrics
```

Returns request metrics summary.

**Rate Limited:** No

**Response `200`:**

```json
{
  "totalRequests": 150,
  "requestsByMethod": {
    "GET": 100,
    "POST": 50
  },
  "requestsByRoute": {
    "/health": 20,
    "/status": 30,
    "/sse": 50,
    "/messages": 50
  },
  "averageDurationMs": 12.5,
  "errorCount": 2
}
```

---

### MCP SSE Transport

```
POST /sse
```

Establishes an MCP Server-Sent Events connection.

**Headers:** `Content-Type: application/json`

**Rate Limited:** Yes

**Request Body:**

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "mcp-client",
      "version": "1.0.0"
    }
  }
}
```

**Response:** SSE stream with MCP protocol messages.

---

### MCP Message Transport

```
POST /messages
```

Sends MCP protocol messages.

**Headers:** `Content-Type: application/json`

**Rate Limited:** Yes

**Request Body:**

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/call",
  "params": {
    "name": "spyral_get_status",
    "arguments": {}
  }
}
```

**Response `200`:**

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"healthy\",\"version\":\"1.0.0\",\"uptime\":1234}"
      }
    ]
  }
}
```

---

## MCP Tools

### spyral_get_status

Get the current system status and version information.

**Method:** `spyral_get_status`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

**Example Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 1234,
  "timestamp": "2026-07-20T10:30:00.000Z",
  "services": {
    "database": { "status": "healthy" },
    "mcp": { "status": "healthy", "activeSessions": 0 }
  }
}
```

---

### spyral_create_decision

Create a new autonomous decision.

**Method:** `spyral_create_decision`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Decision title"
    },
    "description": {
      "type": "string",
      "description": "Decision description"
    },
    "context": {
      "type": "object",
      "description": "Decision context data"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "description": "Decision priority"
    }
  },
  "required": ["title", "description"]
}
```

**Example Request:**

```json
{
  "title": "Deploy to production",
  "description": "Evaluate readiness and deploy latest build to production",
  "context": {
    "branch": "main",
    "commit": "abc123",
    "environment": "production"
  },
  "priority": "high"
}
```

**Example Response:**

```json
{
  "id": "dec_001",
  "title": "Deploy to production",
  "description": "Evaluate readiness and deploy latest build to production",
  "status": "pending",
  "priority": "high",
  "createdAt": "2026-07-20T10:30:00.000Z",
  "context": {
    "branch": "main",
    "commit": "abc123",
    "environment": "production"
  }
}
```

---

### spyral_get_decision

Retrieve a specific decision by ID.

**Method:** `spyral_get_decision`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Decision ID"
    }
  },
  "required": ["id"]
}
```

**Example Response:**

```json
{
  "id": "dec_001",
  "title": "Deploy to production",
  "description": "Evaluate readiness and deploy latest build to production",
  "status": "approved",
  "priority": "high",
  "createdAt": "2026-07-20T10:30:00.000Z",
  "resolvedAt": "2026-07-20T10:35:00.000Z"
}
```

**Error Response (not found):**

```json
{
  "error": "Decision not found",
  "code": "NOT_FOUND"
}
```

---

### spyral_list_decisions

List decisions with optional filtering.

**Method:** `spyral_list_decisions`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["pending", "approved", "rejected", "executing", "completed", "failed"],
      "description": "Filter by status"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "description": "Filter by priority"
    },
    "limit": {
      "type": "number",
      "description": "Maximum results to return",
      "default": 50
    },
    "offset": {
      "type": "number",
      "description": "Result offset for pagination",
      "default": 0
    }
  },
  "required": []
}
```

**Example Response:**

```json
{
  "decisions": [
    {
      "id": "dec_001",
      "title": "Deploy to production",
      "status": "approved",
      "priority": "high",
      "createdAt": "2026-07-20T10:30:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### spyral_create_workspace

Create a new workspace.

**Method:** `spyral_create_workspace`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Workspace name"
    },
    "description": {
      "type": "string",
      "description": "Workspace description"
    },
    "config": {
      "type": "object",
      "description": "Workspace configuration"
    }
  },
  "required": ["name"]
}
```

**Example Response:**

```json
{
  "id": "ws_001",
  "name": "My Workspace",
  "description": "My first workspace",
  "status": "active",
  "createdAt": "2026-07-20T10:30:00.000Z"
}
```

---

### spyral_get_workspace

Get workspace details.

**Method:** `spyral_get_workspace`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Workspace ID"
    }
  },
  "required": ["id"]
}
```

---

### spyral_register

Register a new user account.

**Method:** `spyral_register`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "description": "Unique username"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Email address"
    },
    "password": {
      "type": "string",
      "description": "Password (min 8 characters)"
    }
  },
  "required": ["username", "email", "password"]
}
```

**Example Response:**

```json
{
  "id": "usr_001",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2026-07-20T10:30:00.000Z"
}
```

---

### spyral_login

Authenticate and create a session.

**Method:** `spyral_login`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "description": "Username"
    },
    "password": {
      "type": "string",
      "description": "Password"
    }
  },
  "required": ["username", "password"]
}
```

**Example Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_001",
    "username": "johndoe"
  },
  "expiresAt": "2026-07-20T11:30:00.000Z"
}
```

---

### spyral_get_profile

Get the authenticated user's profile.

**Method:** `spyral_get_profile`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "token": {
      "type": "string",
      "description": "Session token"
    }
  },
  "required": ["token"]
}
```

---

### spyral_logout

End the current user session.

**Method:** `spyral_logout`

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "token": {
      "type": "string",
      "description": "Session token to invalidate"
    }
  },
  "required": ["token"]
}
```

**Example Response:**

```json
{
  "message": "Logged out successfully"
}
```

---

## Authentication

### Token-Based Auth

Authentication uses JWT-based tokens:

```
Authorization: Bearer <token>
```

### Token Lifetime

- Tokens expire after 1 hour by default
- Configure via `auth.sessionTimeout` in config

### Session Management

- Users register via `spyral_register`
- Login via `spyral_login` returns a token
- Token is validated on each authenticated request
- Logout via `spyral_logout` invalidates the token

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "correlationId": "x-correlation-id-value",
  "details": {}
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad request (invalid input) |
| `401` | Unauthorized (missing/invalid auth) |
| `404` | Not found |
| `429` | Too many requests (rate limited) |
| `500` | Internal server error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `RATE_LIMITED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Rate Limiting

### Default Limits

| Window | Max Requests |
|--------|-------------|
| 1 minute | 100 |

### Excluded Routes

The following routes are not rate limited:
- `GET /health`
- `GET /ready`
- `GET /metrics`

### Response Headers

Rate-limited responses include:

```
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1626789000
```

---

## Examples

### cURL Examples

```bash
# Health check
curl http://localhost:3001/health

# Readiness check
curl http://localhost:3001/ready

# System status
curl http://localhost:3001/status

# Metrics
curl http://localhost:3001/metrics

# Create a decision (via MCP)
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call",
    "params": {
      "name": "spyral_create_decision",
      "arguments": {
        "title": "Test Decision",
        "description": "A test decision"
      }
    }
  }'

# List decisions
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tools/call",
    "params": {
      "name": "spyral_list_decisions",
      "arguments": {}
    }
  }'

# Register a user
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "3",
    "method": "tools/call",
    "params": {
      "name": "spyral_register",
      "arguments": {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
      }
    }
  }'
```

### PowerShell Examples

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:3001/health

# Readiness check
Invoke-RestMethod -Uri http://localhost:3001/ready

# Create decision (via MCP)
$body = @{
    jsonrpc = "2.0"
    id = "1"
    method = "tools/call"
    params = @{
        name = "spyral_create_decision"
        arguments = @{
            title = "Test Decision"
            description = "A test decision"
        }
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3001/messages `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Node.js Client Example

```javascript
const http = require('http');

async function callMcpTool(name, args = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method: 'tools/call',
      params: { name, arguments: args }
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Usage
async function main() {
  const status = await callMcpTool('spyral_get_status');
  console.log('Status:', status);

  const decision = await callMcpTool('spyral_create_decision', {
    title: 'Hello World',
    description: 'My first decision'
  });
  console.log('Decision:', decision);
}

main().catch(console.error);
```

---

*For questions or issues, please open an issue on GitHub.*
