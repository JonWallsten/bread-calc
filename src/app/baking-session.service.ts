import { Injectable, inject, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { CalcInputs, CalcResult } from "./calc.service";

export interface BakingSessionSummary {
  id: number;
  recipe_name: string | null;
  notes: string | null;
  rating: number | null;
  baked_at: string;
  created_at: string;
  thumbnail: string | null;
}

export interface BakingSessionDetail extends BakingSessionSummary {
  recipe_id: number | null;
  inputs_snapshot: CalcInputs;
  results_snapshot: CalcResult;
  photos: SessionPhoto[];
}

export interface SessionPhoto {
  id: number;
  filename: string;
  original_name: string;
  sort_order: number;
}

export interface SessionPage {
  sessions: BakingSessionSummary[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: "root" })
export class BakingSessionService {
  private readonly api = inject(ApiService);

  readonly sessions = signal<BakingSessionSummary[]>([]);
  readonly totalPages = signal(0);
  readonly currentPage = signal(1);
  readonly loading = signal(false);

  async loadSessions(page = 1): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.api.get<SessionPage>(`/sessions?page=${page}`);
      this.sessions.set(data.sessions);
      this.totalPages.set(data.pages);
      this.currentPage.set(data.page);
    } catch {
      this.sessions.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async getSession(id: number): Promise<BakingSessionDetail | null> {
    try {
      return await this.api.get<BakingSessionDetail>(`/sessions/${id}`);
    } catch {
      return null;
    }
  }

  async createSession(
    inputsSnapshot: CalcInputs,
    resultsSnapshot: CalcResult,
    options?: { recipeId?: number; notes?: string; rating?: number },
  ): Promise<BakingSessionDetail | null> {
    try {
      const body: Record<string, unknown> = {
        inputs_snapshot: inputsSnapshot,
        results_snapshot: resultsSnapshot,
      };
      if (options?.recipeId) body["recipe_id"] = options.recipeId;
      if (options?.notes) body["notes"] = options.notes;
      if (options?.rating) body["rating"] = options.rating;
      const res = await this.api.post<{ id: number }>("/sessions", body);
      if (res.id) {
        return this.getSession(res.id);
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateSession(
    id: number,
    data: { notes?: string; rating?: number },
  ): Promise<boolean> {
    try {
      await this.api.put(`/sessions/${id}`, data);
      return true;
    } catch {
      return false;
    }
  }

  async deleteSession(id: number): Promise<boolean> {
    try {
      await this.api.delete(`/sessions/${id}`);
      this.sessions.update((list) => list.filter((s) => s.id !== id));
      return true;
    } catch {
      return false;
    }
  }

  async uploadPhoto(sessionId: number, file: File): Promise<boolean> {
    try {
      const compressed = await this.compressImage(file);
      const formData = new FormData();
      formData.append("photo", compressed, compressed.name);
      await this.api.upload(`/sessions/${sessionId}/photos`, formData);
      return true;
    } catch {
      return false;
    }
  }

  async deletePhoto(sessionId: number, photoId: number): Promise<boolean> {
    try {
      await this.api.delete(`/sessions/${sessionId}/photos/${photoId}`);
      return true;
    } catch {
      return false;
    }
  }

  photoUrl(filename: string): string {
    const base =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "/api"
        : "/bread-calc/api";
    return `${base}/uploads/${filename}`;
  }

  private async compressImage(file: File): Promise<File> {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_DIM = 1920;

    if (file.size <= MAX_SIZE && file.type === "image/webp") return file;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = MAX_DIM / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        const useWebP =
          typeof canvas.toBlob === "function" &&
          canvas.toDataURL("image/webp").startsWith("data:image/webp");

        const mime = useWebP ? "image/webp" : "image/jpeg";
        const ext = useWebP ? ".webp" : ".jpg";
        let quality = 0.85;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              if (blob.size > MAX_SIZE && quality > 0.3) {
                quality -= 0.1;
                tryCompress();
                return;
              }
              const name = file.name.replace(/\.[^.]+$/, ext);
              resolve(new File([blob], name, { type: mime }));
            },
            mime,
            quality,
          );
        };
        tryCompress();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }
}
