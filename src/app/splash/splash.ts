import { Component, inject, output } from "@angular/core";
import { I18nService } from "../i18n.service";

const STORAGE_KEY = "breadCalcSplashSeen";

@Component({
  selector: "app-splash",
  templateUrl: "./splash.html",
  styleUrl: "./splash.css",
})
export class SplashComponent {
  readonly i18n = inject(I18nService);
  readonly dismissed = output<void>();

  dismiss(): void {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    this.dismissed.emit();
  }

  static shouldShow(): boolean {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  }
}
