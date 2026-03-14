import {
  Component,
  inject,
  signal,
  computed,
  viewChild,
  OnInit,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CalcService,
  CalcInputs,
  CalcResult,
  CalcOutput,
  DEFAULT_INPUTS,
  YEAST_LABELS,
} from './calc.service';
import { StorageService } from './storage.service';
import { StepperComponent } from './stepper/stepper';
import { ResultsComponent } from './results/results';
import { InstructionsComponent } from './instructions/instructions';
import { TooltipDirective } from './tooltip.directive';

const INFO_MESSAGES: Record<string, string> = {
  dough:
    'Enter how many breads you want and the target weight per ball. Final weight per ball is approximate because the final dough weight depends on rounding.',
  yeast:
    'Choose the yeast type. The calculator estimates the amount from total time until oven, room temperature, starter amount, and starter hydration.',
  percentages:
    'Hydration is total liquid divided by total flour, including the flour and water inside the starter. Salt is required. Sugar and oil are optional. Milk replaces part of the added water.',
  starter:
    'Starter total weight is the full starter amount in grams. Starter hydration is the water-to-flour ratio inside the starter. For example, 100% hydration means equal parts water and flour by weight.',
  proofing:
    'Enter the total time until the dough should go into the oven and the room temperature. The calculator splits this into mixing, bulk fermentation, shaping, final proof, and preheating.',
};

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    StepperComponent,
    ResultsComponent,
    InstructionsComponent,
    TooltipDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly calc = inject(CalcService);
  private readonly storage = inject(StorageService);
  private readonly instructionsRef = viewChild(InstructionsComponent);

  readonly INFO = INFO_MESSAGES;

  // Input signals
  readonly breadCount = signal(DEFAULT_INPUTS.breadCount);
  readonly targetBallWeight = signal(DEFAULT_INPUTS.targetBallWeight);
  readonly yeastType = signal<CalcInputs['yeastType']>(DEFAULT_INPUTS.yeastType);
  readonly hydrationPct = signal(DEFAULT_INPUTS.hydrationPct);
  readonly saltPct = signal(DEFAULT_INPUTS.saltPct);
  readonly sugarPct = signal(DEFAULT_INPUTS.sugarPct);
  readonly oilPct = signal(DEFAULT_INPUTS.oilPct);
  readonly milkPctOfWater = signal(DEFAULT_INPUTS.milkPctOfWater);
  readonly starterWeight = signal(DEFAULT_INPUTS.starterWeight);
  readonly starterHydrationPct = signal(DEFAULT_INPUTS.starterHydrationPct);
  readonly totalHours = signal(DEFAULT_INPUTS.totalHours);
  readonly roomTemp = signal(DEFAULT_INPUTS.roomTemp);

  // UI state
  readonly advancedOpen = signal(false);
  readonly resultsVisible = signal(false);
  readonly validationError = signal<string | null>(null);
  readonly result = signal<CalcResult | null>(null);
  readonly showScrollTop = signal(false);

  // Yeast recommendation text
  readonly yeastRecommendation = computed(() => {
    const r = this.result();
    if (!r) return 'Estimated yeast will appear after calculate.';
    const pct = r.chosenYeastPct * 100;
    return `${r.yeastTypeLabel}: ${this.calc.round1(r.yeastToAdd)} g (${this.calc.round1(pct)}% of total flour).`;
  });

  readonly yeastOptions = [
    { value: 'fresh', label: YEAST_LABELS['fresh'] },
    { value: 'activeDry', label: YEAST_LABELS['activeDry'] },
    { value: 'instant', label: YEAST_LABELS['instant'] },
  ];

  ngOnInit(): void {
    const saved = this.storage.load();
    this.breadCount.set(saved.breadCount);
    this.targetBallWeight.set(saved.targetBallWeight);
    this.yeastType.set(saved.yeastType);
    this.hydrationPct.set(saved.hydrationPct);
    this.saltPct.set(saved.saltPct);
    this.sugarPct.set(saved.sugarPct);
    this.oilPct.set(saved.oilPct);
    this.milkPctOfWater.set(saved.milkPctOfWater);
    this.starterWeight.set(saved.starterWeight);
    this.starterHydrationPct.set(saved.starterHydrationPct);
    this.totalHours.set(saved.totalHours);
    this.roomTemp.set(saved.roomTemp);
    this.runCalculation();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.showScrollTop.set(window.scrollY > 300);
  }

  private getInputs(): CalcInputs {
    return {
      breadCount: this.breadCount(),
      targetBallWeight: this.targetBallWeight(),
      yeastType: this.yeastType(),
      hydrationPct: this.hydrationPct(),
      saltPct: this.saltPct(),
      sugarPct: this.sugarPct(),
      oilPct: this.oilPct(),
      milkPctOfWater: this.milkPctOfWater(),
      starterWeight: this.starterWeight(),
      starterHydrationPct: this.starterHydrationPct(),
      totalHours: this.totalHours(),
      roomTemp: this.roomTemp(),
    };
  }

  private saveInputs(): void {
    this.storage.save(this.getInputs());
  }

  runCalculation(): void {
    this.validationError.set(null);
    this.saveInputs();
    const output: CalcOutput = this.calc.calculate(this.getInputs());
    if ('error' in output) {
      this.validationError.set(output.error);
      this.resultsVisible.set(false);
      this.result.set(null);
      return;
    }
    this.result.set(output);
    this.resultsVisible.set(true);
  }

  onYeastTypeChange(value: string): void {
    this.yeastType.set(value as CalcInputs['yeastType']);
    this.saveInputs();
    if (this.resultsVisible()) {
      this.runCalculation();
    }
  }

  onStepperChange(): void {
    this.saveInputs();
  }

  toggleAdvanced(): void {
    this.advancedOpen.update((v) => !v);
  }

  reset(): void {
    const inst = this.instructionsRef();
    if (inst) inst.stopActiveTimer(false);

    this.breadCount.set(DEFAULT_INPUTS.breadCount);
    this.targetBallWeight.set(DEFAULT_INPUTS.targetBallWeight);
    this.yeastType.set(DEFAULT_INPUTS.yeastType);
    this.hydrationPct.set(DEFAULT_INPUTS.hydrationPct);
    this.saltPct.set(DEFAULT_INPUTS.saltPct);
    this.sugarPct.set(DEFAULT_INPUTS.sugarPct);
    this.oilPct.set(DEFAULT_INPUTS.oilPct);
    this.milkPctOfWater.set(DEFAULT_INPUTS.milkPctOfWater);
    this.starterWeight.set(DEFAULT_INPUTS.starterWeight);
    this.starterHydrationPct.set(DEFAULT_INPUTS.starterHydrationPct);
    this.totalHours.set(DEFAULT_INPUTS.totalHours);
    this.roomTemp.set(DEFAULT_INPUTS.roomTemp);

    this.validationError.set(null);
    this.resultsVisible.set(false);
    this.result.set(null);
    this.storage.clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
