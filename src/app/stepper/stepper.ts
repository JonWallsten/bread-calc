import { Component, input, model, computed } from '@angular/core';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.html',
  styleUrl: './stepper.css',
})
export class StepperComponent {
  readonly value = model.required<number>();
  readonly step = input(1);
  readonly min = input(0);
  readonly suffix = input('');

  protected readonly displayValue = computed(() => {
    const v = this.value();
    const s = this.step();
    if (s % 1 !== 0) {
      return `${Math.round(v * 10) / 10}${this.suffix()}`;
    }
    return `${v}${this.suffix()}`;
  });

  decrement(): void {
    const next = Math.round((this.value() - this.step()) * 10) / 10;
    this.value.set(Math.max(this.min(), next));
  }

  increment(): void {
    const next = Math.round((this.value() + this.step()) * 10) / 10;
    this.value.set(next);
  }
}
