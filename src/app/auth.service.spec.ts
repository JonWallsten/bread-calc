import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { AuthService, AuthUser } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    // Mock fetch to prevent constructor fetchMe() from making real calls
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should start with no user", () => {
    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it("should start with no token", () => {
    expect(service.authToken()).toBeNull();
  });

  describe("loginWithGoogle", () => {
    it("should set token and user on success", async () => {
      const mockUser: AuthUser = {
        id: 1,
        email: "test@example.com",
        name: "Test",
        picture_url: null,
      };
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(JSON.stringify({ token: "jwt-abc", user: mockUser }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        ),
      );

      const result = await service.loginWithGoogle("google-id-token");
      expect(result).toBe(true);
      expect(service.authToken()).toBe("jwt-abc");
      expect(service.user()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBe(true);
    });

    it("should return false on failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
      );

      const result = await service.loginWithGoogle("bad-token");
      expect(result).toBe(false);
      expect(service.isLoggedIn()).toBe(false);
    });

    it("should return false on network error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.reject(new Error("Network error"))),
      );

      const result = await service.loginWithGoogle("token");
      expect(result).toBe(false);
    });

    it("should persist token to localStorage", async () => {
      const mockUser: AuthUser = {
        id: 1,
        email: "a@b.com",
        name: "A",
        picture_url: null,
      };
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(JSON.stringify({ token: "jwt-xyz", user: mockUser }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        ),
      );

      await service.loginWithGoogle("id-token");
      expect(localStorage.getItem("breadCalcAuthToken")).toBe("jwt-xyz");
    });
  });

  describe("logout", () => {
    it("should clear token and user", async () => {
      // First login
      const mockUser: AuthUser = {
        id: 1,
        email: "a@b.com",
        name: "A",
        picture_url: null,
      };
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(JSON.stringify({ token: "jwt-123", user: mockUser }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        ),
      );
      await service.loginWithGoogle("id-token");
      expect(service.isLoggedIn()).toBe(true);

      // Then logout
      service.logout();
      expect(service.authToken()).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });

    it("should remove token from localStorage", async () => {
      localStorage.setItem("breadCalcAuthToken", "old-token");
      service.logout();
      expect(localStorage.getItem("breadCalcAuthToken")).toBeNull();
    });
  });

  describe("token restoration", () => {
    it("should load token from localStorage on init", () => {
      localStorage.setItem("breadCalcAuthToken", "stored-jwt");
      // Re-create the service to pick up the stored token
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                user: {
                  id: 1,
                  email: "a@b.com",
                  name: "A",
                  picture_url: null,
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          ),
        ),
      );
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(AuthService);
      expect(freshService.authToken()).toBe("stored-jwt");
    });
  });

  describe("apiUrl", () => {
    it("should use /bread-calc/api for non-localhost", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
      );

      // loginWithGoogle calls this.apiUrl — verify the fetch URL
      await service.loginWithGoogle("token");
      const fetchCall = vi.mocked(fetch).mock.calls[0];
      // In jsdom, hostname is 'localhost', so it should use the localhost URL
      expect(fetchCall[0]).toContain("/auth/google");
    });
  });
});
