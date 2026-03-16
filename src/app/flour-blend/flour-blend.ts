import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FlourBlendService } from "../flour-blend.service";
import { I18nService } from "../i18n.service";
import { TooltipDirective } from "../tooltip.directive";
import {
  FLOUR_DEFINITIONS,
  BUILT_IN_PRESETS,
  getFlourDefinitionById,
} from "../flour.config";

@Component({
  selector: "app-flour-blend",
  imports: [FormsModule, TooltipDirective],
  templateUrl: "./flour-blend.html",
  styleUrl: "./flour-blend.scss",
})
export class FlourBlendComponent {
  readonly blend = inject(FlourBlendService);
  readonly i18n = inject(I18nService);
  readonly flourDefs = FLOUR_DEFINITIONS;
  readonly builtInPresets = BUILT_IN_PRESETS;

  protected showSaveDialog = signal(false);
  protected savePresetName = signal("");
  protected savePresetNotes = signal("");
  protected saveNameError = signal(false);

  flourName(flourId: string): string {
    const def = getFlourDefinitionById(flourId);
    if (!def) return flourId;
    return this.i18n.currentLang() === "sv" ? def.nameSv : def.nameEn;
  }

  presetDisplayName(id: string): string {
    return this.blend.getPresetName(id, this.i18n.currentLang());
  }

  onPresetChange(presetId: string): void {
    if (presetId) {
      this.blend.loadPreset(presetId);
    }
  }

  onNewPreset(): void {
    this.blend.selectedPresetId.set(null);
  }

  onSaveAs(): void {
    this.savePresetName.set("");
    this.savePresetNotes.set("");
    this.saveNameError.set(false);
    this.showSaveDialog.set(true);
  }

  confirmSave(): void {
    const name = this.savePresetName().trim();
    if (!name) {
      this.saveNameError.set(true);
      return;
    }
    this.blend.saveAsNewPreset(name, this.savePresetNotes());
    this.showSaveDialog.set(false);
  }

  cancelSave(): void {
    this.showSaveDialog.set(false);
  }

  onUpdate(): void {
    this.blend.updatePreset();
  }

  onDelete(): void {
    const id = this.blend.selectedPresetId();
    if (!id || this.blend.isBuiltinPreset()) return;
    this.blend.deletePreset(id);
  }

  onFlourChange(index: number, flourId: string): void {
    this.blend.updateRowFlour(index, flourId);
  }

  onPercentChange(index: number, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.blend.updateRowPercent(index, Math.max(0, Math.min(100, val)));
  }

  onCustomAdjustmentChange(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.blend.customHydrationAdjustment.set(Math.round(val * 10) / 10);
  }
}
