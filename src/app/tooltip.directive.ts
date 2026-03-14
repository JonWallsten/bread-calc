import { Directive, ElementRef, HostListener, input, inject, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective implements OnDestroy {
  readonly appTooltip = input.required<string>();

  private readonly el = inject(ElementRef);
  private tooltipEl: HTMLElement | null = null;

  @HostListener('click')
  toggle(): void {
    this.tooltipEl ? this.hide() : this.show();
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (
      this.tooltipEl &&
      target instanceof Node &&
      !this.el.nativeElement.contains(target) &&
      !this.tooltipEl.contains(target)
    ) {
      this.hide();
    }
  }

  private show(): void {
    this.hide();
    const tip = document.createElement('div');
    tip.className = 'app-tooltip';
    tip.textContent = this.appTooltip();
    document.body.appendChild(tip);
    this.tooltipEl = tip;
    this.position();
  }

  private position(): void {
    const tip = this.tooltipEl;
    if (!tip) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));

    let top = rect.bottom + 8;
    if (top + tipRect.height > window.innerHeight) {
      top = rect.top - tipRect.height - 8;
    }

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.opacity = '1';
  }

  private hide(): void {
    this.tooltipEl?.remove();
    this.tooltipEl = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
