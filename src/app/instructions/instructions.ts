import { Component, inject, input, signal, computed, OnDestroy } from '@angular/core';
import { CalcResult, CalcService } from '../calc.service';
import { I18nService } from '../i18n.service';

interface InstructionStep {
    title: string;
    time: string;
    body: string;
    minutes: number;
    tip?: string;
}

@Component({
    selector: 'app-instructions',
    templateUrl: './instructions.html',
    styleUrl: './instructions.scss',
})
export class InstructionsComponent implements OnDestroy {
    private readonly calc = inject(CalcService);
    readonly i18n = inject(I18nService);
    readonly data = input.required<CalcResult>();
    protected readonly instructionsCopied = signal(false);

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
    private activeTimerTitle = '';
    private timerInterval: ReturnType<typeof setInterval> | null = null;

    protected readonly timerDisplays = signal<Record<number, string>>({});
    protected readonly completedSteps = signal<Record<number, boolean>>({});
    protected readonly customMinutes = signal<Record<number, number>>({});

    private formatDuration(minutes: number): string {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }

    formatDurationPublic(minutes: number): string {
        return this.formatDuration(minutes);
    }

    /** Join parts with commas and a final "and" word: ['a', 'b', 'c'] → 'a, b and c' */
    private joinWithAnd(parts: string[], andWord: string): string {
        if (parts.length === 0) return '';
        if (parts.length === 1) return parts[0];
        return parts.slice(0, -1).join(', ') + ` ${andWord} ` + parts[parts.length - 1];
    }

    protected readonly steps = computed<InstructionStep[]>(() => {
        const d = this.data();
        const fmtW = (v: number) => this.calc.formatWeight(v);
        const fmtY = (v: number) => this.calc.formatWeight(v, true);
        const fmt = (m: number) => this.formatDuration(m);
        const t = this.i18n.t();
        const yeastInLiquid = d.yeastType === 'fresh' || d.yeastType === 'activeDry';
        const yeastName = this.yeastLabel(d.yeastType).toLowerCase();

        // Build liquid ingredient list (for manual mix-liquids step)
        const liquidParts: string[] = [];
        if (d.starterWeight > 0)
            liquidParts.push(`${fmtW(d.starterWeight)} g ${t.starter.toLowerCase()}`);
        liquidParts.push(`${fmtW(d.waterToAdd)} g ${t.water}`);
        if (d.milkToAdd > 0) liquidParts.push(`${fmtW(d.milkToAdd)} g ${t.milk}`);
        if (yeastInLiquid && d.yeastToAdd > 0)
            liquidParts.push(`${fmtY(d.yeastToAdd)} g ${yeastName}`);
        const liquidsList = this.joinWithAnd(liquidParts, t.and);

        // Build flour ingredient list (for manual add-flour step)
        const flourParts: string[] = [];
        flourParts.push(`${fmtW(d.flourToAdd)} g ${t.flour}`);
        if (!yeastInLiquid && d.yeastToAdd > 0)
            flourParts.push(`${fmtY(d.yeastToAdd)} g ${yeastName}`);
        const flourIngredients = this.joinWithAnd(flourParts, t.and);

        // Build machine liquid ingredient list (without flour)
        const machineLiquidParts: string[] = [];
        if (d.starterWeight > 0)
            machineLiquidParts.push(`${fmtW(d.starterWeight)} g ${t.starter.toLowerCase()}`);
        machineLiquidParts.push(`${fmtW(d.waterToAdd)} g ${t.water}`);
        if (d.milkToAdd > 0) machineLiquidParts.push(`${fmtW(d.milkToAdd)} g ${t.milk}`);
        if (d.yeastToAdd > 0) machineLiquidParts.push(`${fmtY(d.yeastToAdd)} g ${yeastName}`);
        const machineLiquids = this.joinWithAnd(machineLiquidParts, t.and);

        // Machine flour list
        const machineFlourList = `${fmtW(d.flourToAdd)} g ${t.flour}`;

        // Starter-aware helpers
        const hasStarter = d.starterWeight > 0;
        const yeastPhrase = d.yeastToAdd > 0 ? `${fmtY(d.yeastToAdd)} g ${yeastName}` : '';

        // Base liquids without yeast (for starter disperse steps)
        const baseLiquidParts: string[] = [];
        if (hasStarter)
            baseLiquidParts.push(`${fmtW(d.starterWeight)} g ${t.starter.toLowerCase()}`);
        baseLiquidParts.push(`${fmtW(d.waterToAdd)} g ${t.water}`);
        if (d.milkToAdd > 0) baseLiquidParts.push(`${fmtW(d.milkToAdd)} g ${t.milk}`);
        const baseLiquids = this.joinWithAnd(baseLiquidParts, t.and);

        // Build speed phrases: "speed label (your mixer: value)"
        const speedPhraseLow = `${t.mixerSpeedLow.toLowerCase()} (${t.yourMixer}: ${d.mixerSpeedLow})`;
        const speedPhraseLowMedium = `${t.mixerSpeedLowMedium.toLowerCase()} (${t.yourMixer}: ${d.mixerSpeedLowMedium})`;
        const speedPhraseMedium = `${t.mixerSpeedMedium.toLowerCase()} (${t.yourMixer}: ${d.mixerSpeedMedium})`;

        // Build salt & extras list
        const saltParts: string[] = [];
        saltParts.push(`${fmtW(d.saltToAdd)} g ${t.saltIngredient.toLowerCase()}`);
        if (d.sugarToAdd > 0)
            saltParts.push(`${fmtW(d.sugarToAdd)} g ${t.sugarIngredient.toLowerCase()}`);
        if (d.oilToAdd > 0)
            saltParts.push(`${fmtW(d.oilToAdd)} g ${t.oilIngredient.toLowerCase()}`);
        const saltExtras = this.joinWithAnd(saltParts, t.and);

        // Shared steps after mixing
        const sharedSteps: InstructionStep[] = [
            {
                title: t.stepBulk,
                time: fmt(d.bulkMinutes),
                body: t.bodyBulk(d.roomTemp, fmt(d.bulkMinutes), fmt(d.fold1), fmt(d.fold2)),
                minutes: d.bulkMinutes,
            },
            {
                title: t.stepDivide,
                time: fmt(d.divideAndShapeMinutes),
                body: t.bodyDivide(d.breadCount, Math.round(d.actualPerBall)),
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
                time: '10 min',
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
                body: t.bodyPreheat(fmt(d.preheatMinutes), d.ovenTempLow, d.ovenTempHigh),
                minutes: d.preheatMinutes,
                tip: t.ovenTempGuide,
            },
            {
                title: t.stepBake,
                time: fmt(d.bakeMinutes),
                body: t.bodyBake(fmt(d.bakeMinutes)),
                minutes: d.bakeMinutes,
            },
        ];

        let mixingSteps: InstructionStep[];

        if (d.mixingMethod === 'machine') {
            const machineInitSteps: InstructionStep[] = [];

            if (hasStarter) {
                // Disperse starter step — fresh yeast goes with liquids, others separate
                const disperseLiquids =
                    d.yeastType === 'fresh' && d.yeastToAdd > 0
                        ? this.joinWithAnd([...baseLiquidParts, yeastPhrase], t.and)
                        : baseLiquids;
                let disperseBody = t.bodyDisperseStarterMachine(disperseLiquids, speedPhraseLow);
                if (d.yeastType === 'activeDry' && d.yeastToAdd > 0)
                    disperseBody += t.bodyHydrateDryYeastMachine(yeastPhrase);

                machineInitSteps.push({
                    title: t.stepMixLiquids,
                    time: fmt(d.initialMixMinutes),
                    body: disperseBody,
                    minutes: d.initialMixMinutes,
                });

                // Flour step — instant/swedishDry yeast mixed into flour
                let flourBody: string;
                if (d.yeastType === 'instant' && d.yeastToAdd > 0)
                    flourBody = t.bodyAddFlourWithDryYeastMachine(
                        machineFlourList,
                        yeastPhrase,
                        speedPhraseLow,
                    );
                else if (d.yeastType === 'swedishDry' && d.yeastToAdd > 0)
                    flourBody = t.bodyAddFlourWithSwedishYeastMachine(
                        machineFlourList,
                        yeastPhrase,
                        speedPhraseLow,
                    );
                else flourBody = t.bodyAddFlourMachine(machineFlourList, speedPhraseLow);

                machineInitSteps.push({
                    title: t.stepAddFlour,
                    time: fmt(d.initialMixMinutes),
                    body: flourBody,
                    minutes: d.initialMixMinutes,
                });
            } else {
                // No starter — single initial mix step
                machineInitSteps.push({
                    title: t.stepInitialMix,
                    time: fmt(d.initialMixMinutes),
                    body: t.bodyInitialMix(machineLiquids, machineFlourList, speedPhraseLow),
                    minutes: d.initialMixMinutes,
                });
            }

            mixingSteps = [
                ...machineInitSteps,
                {
                    title: t.stepMachineRest,
                    time: fmt(d.autolyseMinutes),
                    body: t.bodyMachineRest(fmt(d.autolyseMinutes)),
                    minutes: d.autolyseMinutes,
                },
                {
                    title: t.stepIncorporate,
                    time: fmt(d.incorporationMinutes),
                    body: t.bodyIncorporate(saltExtras, speedPhraseLowMedium),
                    minutes: d.incorporationMinutes,
                },
                {
                    title: t.stepDevelopMachine,
                    time: fmt(d.developmentMinutes),
                    body: t.bodyDevelopMachine(fmt(d.developmentMinutes), speedPhraseMedium),
                    minutes: d.developmentMinutes,
                },
            ];
        } else {
            // Manual: build step 1 body (liquids)
            let liquidsBody: string;
            if (hasStarter) {
                if (d.yeastType === 'activeDry' && d.yeastToAdd > 0) {
                    // Active dry hydrated separately — use base liquids (no yeast)
                    liquidsBody =
                        t.bodyDisperseStarter(baseLiquids) + t.bodyHydrateDryYeast(yeastPhrase);
                } else {
                    // Fresh yeast in liquidsList; instant/swedishDry not in liquids
                    liquidsBody = t.bodyDisperseStarter(liquidsList);
                }
            } else {
                liquidsBody = t.bodyMixLiquids(liquidsList);
            }

            // Manual: build step 2 body (flour)
            let flourBody: string;
            if (hasStarter && d.yeastType === 'instant' && d.yeastToAdd > 0) {
                flourBody = t.bodyAddFlourWithDryYeast(machineFlourList, yeastPhrase);
            } else if (hasStarter && d.yeastType === 'swedishDry' && d.yeastToAdd > 0) {
                flourBody = t.bodyAddFlourWithSwedishYeast(machineFlourList, yeastPhrase);
            } else {
                flourBody = t.bodyAddFlour(flourIngredients);
            }

            mixingSteps = [
                {
                    title: t.stepMixLiquids,
                    time: fmt(d.initialMixMinutes),
                    body: liquidsBody,
                    minutes: d.initialMixMinutes,
                },
                {
                    title: t.stepAddFlour,
                    time: fmt(d.initialMixMinutes),
                    body: flourBody,
                    minutes: d.initialMixMinutes,
                },
                {
                    title: t.stepRest,
                    time: fmt(d.autolyseMinutes),
                    body: t.bodyRest(fmt(d.autolyseMinutes)),
                    minutes: d.autolyseMinutes,
                },
                {
                    title: t.stepAddSaltEtc,
                    time: '2 min',
                    body: t.bodyAddSaltEtc(saltExtras),
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
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
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
                oscillator.type = 'square';
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
        this.activeTimerTitle = '';
        this.completedSteps.update((c) => ({ ...c, [stepIndex]: true }));
        this.playAlarm();
        if ('Notification' in window && Notification.permission === 'granted') {
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
            this.setDisplay(stepIndex, `${this.i18n.t().running}: ${this.formatTime(remaining)}`);
            this.activeTimerRemaining.update((r) => r - 1);
        };
        tick();
        this.timerInterval = setInterval(tick, 1000);
    }

    getStepMinutes(stepIndex: number, defaultMinutes: number): number {
        return this.customMinutes()[stepIndex] ?? defaultMinutes;
    }

    getStepSize(stepIndex: number, defaultMinutes: number): number {
        return this.getStepMinutes(stepIndex, defaultMinutes) >= 15 ? 5 : 1;
    }

    adjustStepMinutes(stepIndex: number, defaultMinutes: number, delta: number): void {
        const current = this.getStepMinutes(stepIndex, defaultMinutes);
        const next = Math.max(1, current + delta);
        this.customMinutes.update((c) => ({ ...c, [stepIndex]: next }));
    }

    extendTimer(minutes: number): void {
        const idx = this.activeTimerIndex();
        if (idx === null) return;
        this.activeTimerRemaining.update((r) => r + minutes * 60);
        if (this.activeTimerPaused()) {
            const remaining = this.activeTimerRemaining();
            this.setDisplay(idx, `${this.i18n.t().paused}: ${this.formatTime(remaining)}`);
        }
    }

    startTimer(stepIndex: number, minutes: number, title: string): void {
        this.stopActiveTimer(true);
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const effectiveMinutes = this.getStepMinutes(stepIndex, minutes);
        this.activeTimerIndex.set(stepIndex);
        this.activeTimerPaused.set(false);
        this.activeTimerRemaining.set(effectiveMinutes * 60);
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
            this.activeTimerTitle = '';
        }
        this.setDisplay(stepIndex, '');
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
        this.activeTimerTitle = '';
    }

    async copyInstructions(): Promise<void> {
        const lines = this.steps().map((step) => `${step.title} (${step.time})\n${step.body}`);
        await navigator.clipboard.writeText(lines.join('\n\n'));
        this.instructionsCopied.set(true);
        setTimeout(() => this.instructionsCopied.set(false), 2000);
    }
}
