import {
  Component,
  inject,
  input,
  signal,
  computed,
  OnDestroy,
} from "@angular/core";
import { CalcResult, CalcService } from "../calc.service";
import { I18nService } from "../i18n.service";

interface InstructionStep {
  title: string;
  time: string;
  body: string;
  minutes: number;
}

@Component({
  selector: "app-instructions",
  templateUrl: "./instructions.html",
  styleUrl: "./instructions.css",
})
export class InstructionsComponent implements OnDestroy {
  private readonly calc = inject(CalcService);
  readonly i18n = inject(I18nService);
  readonly data = input.required<CalcResult>();

  private yeastLabel(yeastType: string): string {
    const t = this.i18n.t();
    const labels: Record<string, string> = {
      fresh: t.freshYeast,
      swedishDry: t.swedishDryYeast,
      activeDry: t.activeDryYeast,
      instant: t.instantYeast,
    };
    return labels[yeastType] ?? yeastType;
  }

  protected readonly showFlourBlendNote = computed(() => {
    return this.data().flourBlendAdjustment > 1.5;
  });

  // Timer state
  protected activeTimerIndex = signal<number | null>(null);
  protected activeTimerPaused = signal(false);
  protected activeTimerRemaining = signal(0);
  private activeTimerTitle = "";
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly timerDisplays = signal<Record<number, string>>({});
  protected readonly completedSteps = signal<Record<number, boolean>>({});

  private formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  protected readonly steps = computed<InstructionStep[]>(() => {
    const d = this.data();
    const roundG = (v: number) => Math.round(v);
    const round1 = this.calc.round1;
    const fmt = (m: number) => this.formatDuration(m);
    const t = this.i18n.t();

    const milkPart =
      d.milkToAdd > 0 ? `, ${roundG(d.milkToAdd)} g ${t.milk}` : "";

    // Yeast goes into liquid (fresh, activeDry) or flour (instant, swedishDry)
    const yeastStr =
      d.yeastToAdd > 0
        ? `, ${t.and} ${round1(d.yeastToAdd)} g ${this.yeastLabel(d.yeastType).toLowerCase()}`
        : "";
    const yeastInLiquid =
      d.yeastType === "fresh" || d.yeastType === "activeDry";
    const yeastLiquidPart = yeastInLiquid ? yeastStr : "";
    const yeastFlourPart = yeastInLiquid ? "" : yeastStr;
    const sugarPart =
      d.sugarToAdd > 0
        ? `, ${round1(d.sugarToAdd)} g ${t.sugarIngredient.toLowerCase()}`
        : "";
    const oilPart =
      d.oilToAdd > 0
        ? `, ${t.and} ${round1(d.oilToAdd)} g ${t.oilIngredient.toLowerCase()}`
        : "";

    // Shared steps after mixing
    const sharedSteps: InstructionStep[] = [
      {
        title: t.stepBulk,
        time: fmt(d.bulkMinutes),
        body: t.bodyBulk(
          d.roomTemp,
          fmt(d.bulkMinutes),
          fmt(d.fold1),
          fmt(d.fold2),
        ),
        minutes: d.bulkMinutes,
      },
      {
        title: t.stepDivide,
        time: fmt(d.divideAndShapeMinutes),
        body: t.bodyDivide(d.breadCount, roundG(d.actualPerBall)),
        minutes: d.divideAndShapeMinutes,
      },
      {
        title: t.stepBenchRest,
        time: fmt(d.benchRestMinutes),
        body: t.bodyBenchRest(fmt(d.benchRestMinutes)),
        minutes: d.benchRestMinutes,
      },
      {
        title: t.stepFinalShape,
        time: "10 min",
        body: t.bodyFinalShape,
        minutes: 10,
      },
      {
        title: t.stepFinalProof,
        time: fmt(d.finalProofMinutes),
        body: t.bodyFinalProof(d.roomTemp, fmt(d.finalProofMinutes)),
        minutes: d.finalProofMinutes,
      },
      {
        title: t.stepPreheat,
        time: fmt(d.preheatMinutes),
        body: t.bodyPreheat(fmt(d.preheatMinutes)),
        minutes: d.preheatMinutes,
      },
      {
        title: t.stepBake,
        time: fmt(d.bakeMinutes),
        body: t.bodyBake(fmt(d.bakeMinutes)),
        minutes: d.bakeMinutes,
      },
    ];

    let mixingSteps: InstructionStep[];

    if (d.mixingMethod === "machine") {
      mixingSteps = [
        {
          title: t.stepInitialMix,
          time: fmt(d.initialMixMinutes),
          body: t.bodyInitialMix(
            roundG(d.starterWeight),
            roundG(d.waterToAdd),
            milkPart,
            yeastStr,
            roundG(d.flourToAdd),
            d.mixerSpeedLow,
          ),
          minutes: d.initialMixMinutes,
        },
        {
          title: t.stepMachineAutolyse,
          time: fmt(d.autolyseMinutes),
          body: t.bodyMachineAutolyse(fmt(d.autolyseMinutes)),
          minutes: d.autolyseMinutes,
        },
        {
          title: t.stepIncorporate,
          time: fmt(d.incorporationMinutes),
          body: t.bodyIncorporate(
            round1(d.saltToAdd),
            sugarPart,
            oilPart,
            d.mixerSpeedLowMedium,
          ),
          minutes: d.incorporationMinutes,
        },
        {
          title: t.stepDevelopMachine,
          time: fmt(d.developmentMinutes),
          body: t.bodyDevelopMachine(
            fmt(d.developmentMinutes),
            d.mixerSpeedMedium,
          ),
          minutes: d.developmentMinutes,
        },
      ];
    } else {
      mixingSteps = [
        {
          title: t.stepMixLiquids,
          time: fmt(d.initialMixMinutes),
          body: t.bodyMixLiquids(
            roundG(d.starterWeight),
            roundG(d.waterToAdd),
            milkPart,
            yeastLiquidPart,
          ),
          minutes: d.initialMixMinutes,
        },
        {
          title: t.stepAddFlour,
          time: fmt(d.initialMixMinutes),
          body: t.bodyAddFlour(roundG(d.flourToAdd), yeastFlourPart),
          minutes: d.initialMixMinutes,
        },
        {
          title: t.stepAutolyse,
          time: fmt(d.autolyseMinutes),
          body: t.bodyAutolyse(fmt(d.autolyseMinutes)),
          minutes: d.autolyseMinutes,
        },
        {
          title: t.stepAddSaltEtc,
          time: "2 min",
          body: t.bodyAddSaltEtc(round1(d.saltToAdd), sugarPart, oilPart),
          minutes: 2,
        },
        {
          title: t.stepDevelopByHand,
          time: fmt(d.developmentMinutes),
          body: t.bodyDevelopByHand(fmt(d.developmentMinutes)),
          minutes: d.developmentMinutes,
        },
      ];
    }

    // Number the steps
    const allSteps = [...mixingSteps, ...sharedSteps];
    return allSteps.map((step, i) => ({
      ...step,
      title: `${i + 1}. ${step.title}`,
    }));
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
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  private setDisplay(index: number, text: string): void {
    this.timerDisplays.update((d) => ({ ...d, [index]: text }));
  }

  private playAlarm(): void {
    try {
      const ctx = new AudioContext();
      const beepCount = 5;
      for (let i = 0; i < beepCount; i++) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.type = "square";
        oscillator.frequency.value = 880;
        gain.gain.value = 0.3;
        const start = ctx.currentTime + i * 0.4;
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      }
    } catch {
      /* Web Audio API not available */
    }
  }

  toggleCompleted(index: number): void {
    this.completedSteps.update((c) => ({ ...c, [index]: !c[index] }));
  }

  private onTimerFinished(stepIndex: number, title: string): void {
    const t = this.i18n.t();
    this.clearTimer();
    this.setDisplay(stepIndex, `${title} ${t.finished}`);
    this.activeTimerIndex.set(null);
    this.activeTimerPaused.set(false);
    this.activeTimerRemaining.set(0);
    this.activeTimerTitle = "";
    this.completedSteps.update((c) => ({ ...c, [stepIndex]: true }));
    this.playAlarm();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`${title} ${t.finished}`);
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
      this.setDisplay(
        stepIndex,
        `${this.i18n.t().running}: ${this.formatTime(remaining)}`,
      );
      this.activeTimerRemaining.update((r) => r - 1);
    };
    tick();
    this.timerInterval = setInterval(tick, 1000);
  }

  startTimer(stepIndex: number, minutes: number, title: string): void {
    this.stopActiveTimer(true);
    if ("Notification" in window && Notification.permission === "default") {
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
    this.setDisplay(
      this.activeTimerIndex()!,
      `${this.i18n.t().paused}: ${this.formatTime(remaining)}`,
    );
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
      this.activeTimerTitle = "";
    }
    this.setDisplay(stepIndex, "");
  }

  stopActiveTimer(showStopped: boolean): void {
    const idx = this.activeTimerIndex();
    this.clearTimer();
    if (idx !== null) {
      if (showStopped) {
        this.setDisplay(idx, this.i18n.t().stopped);
      }
    }
    this.activeTimerIndex.set(null);
    this.activeTimerPaused.set(false);
    this.activeTimerRemaining.set(0);
    this.activeTimerTitle = "";
  }
}
