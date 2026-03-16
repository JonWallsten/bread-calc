/**
 * API integration tests.
 *
 * Requires:
 *   - PHP dev server:  npm run start:api   (localhost:8080)
 *   - Local DB accessible via .credentials.env / .credentials.local.env
 *
 * Run with:  npm run test:api
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import mysql from "mysql2/promise";
import { loadAppCredentials, PROJECT_ROOT } from "../lib/credentials.mjs";

// ── Config ────────────────────────────────────────────────

const BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

// ── JWT helper (mirrors PHP auth.php logic) ───────────────

function b64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function makeJwt(userId, email, secret) {
  const header = b64url(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    Buffer.from(
      JSON.stringify({ user_id: userId, email, iat: now, exp: now + 3600 }),
    ),
  );
  const sig = b64url(
    createHmac("sha256", secret).update(`${header}.${payload}`).digest(),
  );
  return `${header}.${payload}.${sig}`;
}

// ── HTTP helpers ──────────────────────────────────────────

async function api(method, path, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
}

// ── Test state ────────────────────────────────────────────

let db;
let creds;
let testUserId;
let jwt;

const TEST_GOOGLE_ID = "test-integration-user-99999";
const TEST_EMAIL = "test-integration@breadcalc.test";
const TEST_NAME = "Integration Test User";

// ── Setup / Teardown ──────────────────────────────────────

beforeAll(async () => {
  creds = loadAppCredentials();

  db = await mysql.createConnection({
    host: creds.DB_HOST,
    user: creds.DB_USER,
    password: creds.DB_PASS,
    database: creds.DB_NAME,
    charset: "utf8mb4",
  });

  // Clean up any leftover test user from a previous run
  await db.query("DELETE FROM users WHERE google_id = ?", [TEST_GOOGLE_ID]);

  // Insert a fresh test user
  const [result] = await db.query(
    "INSERT INTO users (google_id, email, name) VALUES (?, ?, ?)",
    [TEST_GOOGLE_ID, TEST_EMAIL, TEST_NAME],
  );
  testUserId = result.insertId;

  jwt = makeJwt(testUserId, TEST_EMAIL, creds.JWT_SECRET);
});

afterAll(async () => {
  if (db) {
    // Cascade: baking_sessions and recipes reference user_id
    await db.query("DELETE FROM users WHERE id = ?", [testUserId]);
    await db.end();
  }
});

// ── Public routes ─────────────────────────────────────────

describe("GET /auth/config", () => {
  it("returns 200 with google_client_id", async () => {
    const { status, data } = await api("GET", "/auth/config");
    expect(status).toBe(200);
    expect(typeof data.google_client_id).toBe("string");
    expect(data.google_client_id.length).toBeGreaterThan(0);
  });
});

describe("POST /auth/google with invalid token", () => {
  it("returns 401", async () => {
    const { status } = await api("POST", "/auth/google", {
      body: { token: "not-a-real-google-token" },
    });
    expect(status).toBe(401);
  });

  it("returns 400 when token is missing", async () => {
    const { status } = await api("POST", "/auth/google", { body: {} });
    expect(status).toBe(400);
  });
});

// ── Auth guard ─────────────────────────────────────────────

describe("Auth required — no token", () => {
  it("GET /recipes → 401", async () => {
    const { status } = await api("GET", "/recipes");
    expect(status).toBe(401);
  });

  it("GET /flour-blends → 401", async () => {
    const { status } = await api("GET", "/flour-blends");
    expect(status).toBe(401);
  });

  it("GET /sessions → 401", async () => {
    const { status } = await api("GET", "/sessions");
    expect(status).toBe(401);
  });
});

// ── GET /auth/me ───────────────────────────────────────────

describe("GET /auth/me", () => {
  it("returns the authenticated user", async () => {
    const { status, data } = await api("GET", "/auth/me", { token: jwt });
    expect(status).toBe(200);
    expect(data.user.id).toBe(testUserId);
    expect(data.user.email).toBe(TEST_EMAIL);
  });

  it("returns 401 with no token", async () => {
    const { status } = await api("GET", "/auth/me");
    expect(status).toBe(401);
  });
});

// ── Recipes CRUD ──────────────────────────────────────────

describe("Recipes", () => {
  let recipeId;

  const testInputs = {
    breadCount: 2,
    targetBallWeight: 270,
    yeastType: "instant",
    hydrationPct: 65,
    saltPct: 2,
    sugarPct: 0,
    oilPct: 0,
    milkPctOfWater: 0,
    starterWeight: 0,
    starterHydrationPct: 100,
    totalHours: 24,
    roomTemp: 22,
    flourBlendAdjustment: 0,
    customHydrationAdjustment: 0,
  };

  it("POST /recipes — creates a recipe", async () => {
    const { status, data } = await api("POST", "/recipes", {
      token: jwt,
      body: { name: "Test Neapolitan", inputs: testInputs },
    });
    expect(status).toBe(201);
    expect(data.recipe.id).toBeGreaterThan(0);
    expect(data.recipe.name).toBe("Test Neapolitan");
    recipeId = data.recipe.id;
  });

  it("POST /recipes — 400 when name is missing", async () => {
    const { status } = await api("POST", "/recipes", {
      token: jwt,
      body: { inputs: testInputs },
    });
    expect(status).toBe(400);
  });

  it("GET /recipes — lists recipes including the new one", async () => {
    const { status, data } = await api("GET", "/recipes", { token: jwt });
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((r) => r.id === recipeId)).toBe(true);
  });

  it("PUT /recipes/:id — updates name", async () => {
    const { status } = await api("PUT", `/recipes/${recipeId}`, {
      token: jwt,
      body: { name: "Test Neapolitan Updated" },
    });
    expect(status).toBe(200);
  });

  it("PUT /recipes/:id — 404 for another user's recipe", async () => {
    const otherJwt = makeJwt(999999, "other@test.com", creds.JWT_SECRET);
    const { status } = await api("PUT", `/recipes/${recipeId}`, {
      token: otherJwt,
      body: { name: "Hacked" },
    });
    expect(status).toBe(404);
  });

  it("DELETE /recipes/:id — deletes the recipe", async () => {
    const { status } = await api("DELETE", `/recipes/${recipeId}`, {
      token: jwt,
    });
    expect(status).toBe(200);
  });

  it("GET /recipes — recipe no longer listed after delete", async () => {
    const { data } = await api("GET", "/recipes", { token: jwt });
    expect(data.some((r) => r.id === recipeId)).toBe(false);
  });
});

// ── Flour Blends CRUD ─────────────────────────────────────

describe("Flour Blends", () => {
  let blendId;

  const testFlours = [
    { key: "all_purpose", pct: 70 },
    { key: "whole_wheat", pct: 30 },
  ];

  it("POST /flour-blends — creates a blend", async () => {
    const { status, data } = await api("POST", "/flour-blends", {
      token: jwt,
      body: {
        name: "Test Blend",
        flours: testFlours,
        notes: "Test note",
        custom_hydration_adjustment: 2,
      },
    });
    expect(status).toBe(201);
    expect(data.id).toBeGreaterThan(0);
    expect(data.name).toBe("Test Blend");
    blendId = data.id;
  });

  it("POST /flour-blends — 400 when flours is missing", async () => {
    const { status } = await api("POST", "/flour-blends", {
      token: jwt,
      body: { name: "Bad Blend" },
    });
    expect(status).toBe(400);
  });

  it("GET /flour-blends — lists blends including the new one", async () => {
    const { status, data } = await api("GET", "/flour-blends", { token: jwt });
    expect(status).toBe(200);
    expect(data.some((b) => b.id === blendId)).toBe(true);
  });

  it("PUT /flour-blends/:id — updates notes", async () => {
    const { status } = await api("PUT", `/flour-blends/${blendId}`, {
      token: jwt,
      body: { notes: "Updated note" },
    });
    expect(status).toBe(200);
  });

  it("DELETE /flour-blends/:id — deletes the blend", async () => {
    const { status } = await api("DELETE", `/flour-blends/${blendId}`, {
      token: jwt,
    });
    expect(status).toBe(200);
  });
});

// ── Baking Sessions CRUD ──────────────────────────────────

describe("Baking Sessions", () => {
  let sessionId;

  it("POST /sessions — creates a session", async () => {
    const { status, data } = await api("POST", "/sessions", {
      token: jwt,
      body: {
        notes: "Great crumb structure",
        rating: 4,
        baked_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        inputs_snapshot: { breadCount: 2, hydrationPct: 65 },
        results_snapshot: { totalFlour: 500, totalWater: 325 },
      },
    });
    expect(status).toBe(201);
    expect(data.id).toBeGreaterThan(0);
    sessionId = data.id;
  });

  it("GET /sessions — lists sessions", async () => {
    const { status, data } = await api("GET", "/sessions", { token: jwt });
    expect(status).toBe(200);
    expect(data).toHaveProperty("sessions");
    expect(data.sessions.some((s) => s.id === sessionId)).toBe(true);
  });

  it("GET /sessions/:id — returns session detail", async () => {
    const { status, data } = await api("GET", `/sessions/${sessionId}`, {
      token: jwt,
    });
    expect(status).toBe(200);
    expect(data.id).toBe(sessionId);
    expect(data.notes).toBe("Great crumb structure");
    expect(data.rating).toBe(4);
  });

  it("PUT /sessions/:id — updates rating", async () => {
    const { status } = await api("PUT", `/sessions/${sessionId}`, {
      token: jwt,
      body: { rating: 5 },
    });
    expect(status).toBe(200);
  });

  it("GET /sessions/:id — 404 for another user's session", async () => {
    const otherJwt = makeJwt(999999, "other@test.com", creds.JWT_SECRET);
    const { status } = await api("GET", `/sessions/${sessionId}`, {
      token: otherJwt,
    });
    expect(status).toBe(404);
  });

  it("DELETE /sessions/:id — deletes the session", async () => {
    const { status } = await api("DELETE", `/sessions/${sessionId}`, {
      token: jwt,
    });
    expect(status).toBe(200);
  });
});
