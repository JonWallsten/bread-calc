import { Component, inject, input, signal, computed, OnDestroy } from '@angular/core';
import { CalcResult, CalcService } from '../calc.service';

interface InstructionStep {
  title: string;
  time: string;
  body: string;
  minutes: number;
}

@Component({
  selector: 'app-instructions',
  templateUrl: './instructions.html',
  styleUrl: './instructions.css',
})
export class InstructionsComponent implements OnDestroy {
  private readonly calc = inject(CalcService);
  readonly data = input.required<CalcResult>();

  // Timer state
  protected activeTimerIndex = signal<number | null>(null);
  protected activeTimerPaused = signal(false);
  protected activeTimerRemaining = signal(0);
  private activeTimerTitle = '';
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly timerDisplays = signal<Record<number, string>>({});

  protected readonly steps = computed<InstructionStep[]>(() => {
    const d = this.data();
    const roundG = (v: number) => Math.round(v);
    const round1 = this.calc.round1;

    return [
      {
        title: '1. Mix',
        time: `${d.mixMinutes} min`,
        body: `Mix ${roundG(d.starterWeight)} g starter, ${roundG(d.waterToAdd)} g water${d.milkToAdd > 0 ? `, ${roundG(d.milkToAdd)} g milk` : ''}${d.yeastToAdd > 0 ? `, and ${round1(d.yeastToAdd)} g ${d.yeastTypeLabel.toLowerCase()}` : ''}. Add ${roundG(d.flourToAdd)} g flour and mix until no dry flour remains. Rest about 20 minutes, then add ${round1(d.saltToAdd)} g salt${d.sugarToAdd > 0 ? `, ${round1(d.sugarToAdd)} g sugar` : ''}${d.oilToAdd > 0 ? `, and ${round1(d.oilToAdd)} g oil` : ''}. Mix until smooth, elastic, and slightly tacky.`,
        minutes: d.mixMinutes,
      },
      {
        title: '2. Bulk fermentation',
        time: `${d.bulkMinutes} min`,
        body: `Ferment around ${d.roomTemp}°C for about ${d.bulkMinutes} minutes. Give one fold at about ${d.fold1} minutes and another at about ${d.fold2} minutes. Dough should feel lighter and puffier by the end.`,
        minutes: d.bulkMinutes,
      },
      {
        title: '3. Divide and pre-shape',
        time: `${d.divideAndShapeMinutes} min`,
        body: `Divide into ${d.breadCount} pieces. Actual dough weight per piece is about ${roundG(d.actualPerBall)} g. Pre-shape gently.`,
        minutes: d.divideAndShapeMinutes,
      },
      {
        title: '4. Bench rest',
        time: `${d.benchRestMinutes} min`,
        body: `Rest covered for ${d.benchRestMinutes} minutes so the dough relaxes before final shaping.`,
        minutes: d.benchRestMinutes,
      },
      {
        title: '5. Final shape',
        time: '10 min',
        body: 'Shape into rolls or rustic squares. Build enough surface tension for height without squeezing out too much gas.',
        minutes: 10,
      },
      {
        title: '6. Final proof',
        time: `${d.finalProofMinutes} min`,
        body: `Proof at about ${d.roomTemp}°C for around ${d.finalProofMinutes} minutes. A fingertip dent should spring back slowly, not immediately.`,
        minutes: d.finalProofMinutes,
      },
      {
        title: '7. Preheat oven',
        time: `${d.preheatMinutes} min`,
        body: `Preheat during the last ${d.preheatMinutes} minutes of final proof. For rolls, 230–240°C is a strong starting point.`,
        minutes: d.preheatMinutes,
      },
      {
        title: '8. Bake',
        time: `${d.bakeMinutes} min`,
        body: `Bake with steam if possible. Start hot, then reduce slightly if needed. Bake about ${d.bakeMinutes} minutes until golden and set.`,
        minutes: d.bakeMinutes,
      },
    ];
  });

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private formatTime(seconds: number): string {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  private setDisplay(index: number, text: string): void {
    this.timerDisplays.update((d) => ({ ...d, [index]: text }));
  }

  private onTimerFinished(stepIndex: number, title: string): void {
    this.clearTimer();
    this.setDisplay(stepIndex, `${title} finished.`);
    this.activeTimerIndex.set(null);
    this.activeTimerPaused.set(false);
    this.activeTimerRemaining.set(0);
    this.activeTimerTitle = '';
    try {
      alert(`${title} finished.`);
    } catch {
      /* noop */
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`${title} finished.`);
      } catch {
        /* noop */
      }
    }
  }

  private startTicking(stepIndex: number, title: string): void {
    const tick = () => {
      const remaining = this.activeTimerRemaining();
      if (remaining <= 0) {
        this.onTimerFinished(stepIndex, title);
        return;
      }
      this.setDisplay(stepIndex, `Running: ${this.formatTime(remaining)}`);
      this.activeTimerRemaining.update((r) => r - 1);
    };
    tick();
    this.timerInterval = setInterval(tick, 1000);
  }

  startTimer(stepIndex: number, minutes: number, title: string): void {
    this.stopActiveTimer(true);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    this.activeTimerIndex.set(stepIndex);
    this.activeTimerPaused.set(false);
    this.activeTimerRemaining.set(minutes * 60);
    this.activeTimerTitle = title;
    this.startTicking(stepIndex, title);
  }

  pauseTimer(): void {
    if (this.activeTimerIndex() === null || this.activeTimerPaused()) return;
    this.clearTimer();
    this.activeTimerPaused.set(true);
    const remaining = this.activeTimerRemaining();
    this.setDisplay(this.activeTimerIndex()!, `Paused: ${this.formatTime(remaining)}`);
  }

  resumeTimer(): void {
    if (this.activeTimerIndex() === null || !this.activeTimerPaused()) return;
    this.activeTimerPaused.set(false);
    this.startTicking(this.activeTimerIndex()!, this.activeTimerTitle);
  }

  togglePause(): void {
    if (this.activeTimerPaused()) {
      this.resumeTimer();
    } else {
      this.pauseTimer();
    }
  }

  resetTimer(stepIndex: number): void {
    if (this.activeTimerIndex() === stepIndex) {
      this.clearTimer();
      this.activeTimerIndex.set(null);
      this.activeTimerPaused.set(false);
      this.activeTimerRemaining.set(0);
      this.activeTimerTitle = '';
    }
    this.setDisplay(stepIndex, '');
  }

  stopActiveTimer(showStopped: boolean): void {
    const idx = this.activeTimerIndex();
    this.clearTimer();
    if (idx !== null) {
      if (showStopped) {
        this.setDisplay(idx, 'Stopped.');
      }
    }
    this.activeTimerIndex.set(null);
    this.activeTimerPaused.set(false);
    this.activeTimerRemaining.set(0);
    this.activeTimerTitle = '';
  }
}
