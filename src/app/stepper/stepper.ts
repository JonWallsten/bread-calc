import {
  Component,
  inject,
  input,
  model,
  computed,
  signal,
} from "@angular/core";
import { I18nService } from "../i18n.service";

@Component({
  selector: "app-stepper",
  templateUrl: "./stepper.html",
  styleUrl: "./stepper.css",
})
export class StepperComponent {
  readonly i18n = inject(I18nService);
  readonly value = model.required<number>();
  readonly step = input(1);
  readonly min = input(0);
  readonly suffix = input("");

  protected editingValue = signal<string | null>(null);

  protected readonly displayNumber = computed(() => {
    const v = this.value();
    const s = this.step();
    return s % 1 !== 0 ? String(Math.round(v * 10) / 10) : String(v);
  });

  protected onFocus(event: FocusEvent): void {
    this.editingValue.set(this.displayNumber());
    (event.target as HTMLInputElement).select();
  }

  protected onInput(event: Event): void {
    this.editingValue.set((event.target as HTMLInputElement).value);
  }

  protected onBlur(): void {
    this.commit();
  }

  protected onEnter(event: Event): void {
    (event.target as HTMLInputElement).blur();
  }

  private commit(): void {
    const raw = this.editingValue();
    if (raw !== null) {
      const parsed = parseFloat(raw.replace(",", "."));
      if (!isNaN(parsed)) {
        const s = this.step();
        let v = Math.max(this.min(), parsed);
        v = s % 1 !== 0 ? Math.round(v * 10) / 10 : Math.round(v);
        this.value.set(v);
      }
    }
    this.editingValue.set(null);
  }

  decrement(): void {
    const next = Math.round((this.value() - this.step()) * 10) / 10;
    this.value.set(Math.max(this.min(), next));
  }

  increment(): void {
    const next = Math.round((this.value() + this.step()) * 10) / 10;
    this.value.set(next);
  }
}
