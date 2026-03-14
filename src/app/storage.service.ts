import { Injectable } from "@angular/core";
import { CalcInputs } from "./calc.service";
import { DEFAULT_INPUTS } from "./config";

const STORAGE_KEY = "breadCalcInputs";

@Injectable({ providedIn: "root" })
export class StorageService {
  save(inputs: CalcInputs): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      /* storage full or unavailable */
    }
  }

  load(): CalcInputs {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_INPUTS };
      const data = JSON.parse(raw);
      return { ...DEFAULT_INPUTS, ...data };
    } catch {
      return { ...DEFAULT_INPUTS };
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}
