import { Injectable, inject } from "@angular/core";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly auth = inject(AuthService);

  private apiUrl(path: string): string {
    const base =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "/api"
        : "/bread-calc/api";
    return `${base}${path}`;
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const token = this.auth.authToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(this.apiUrl(path), { headers: this.headers() });
    if (res.status === 401) {
      this.auth.logout();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.apiUrl(path), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      this.auth.logout();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.apiUrl(path), {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      this.auth.logout();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(this.apiUrl(path), {
      method: "DELETE",
      headers: this.headers(),
    });
    if (res.status === 401) {
      this.auth.logout();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
  }

  async upload(path: string, formData: FormData): Promise<unknown> {
    const h: Record<string, string> = {};
    const token = this.auth.authToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
    const res = await fetch(this.apiUrl(path), {
      method: "POST",
      headers: h,
      body: formData,
    });
    if (res.status === 401) {
      this.auth.logout();
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
}
