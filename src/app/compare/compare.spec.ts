import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { CompareComponent } from "./compare";

describe("CompareComponent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );

    TestBed.configureTestingModule({
      imports: [CompareComponent],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should create the component", () => {
    const fixture = TestBed.createComponent(CompareComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it("should start with no recipe selected", () => {
    const fixture = TestBed.createComponent(CompareComponent);
    const component = fixture.componentInstance;
    expect(component.recipeIdA()).toBe("");
  });

  it("should inject i18n service", () => {
    const fixture = TestBed.createComponent(CompareComponent);
    const component = fixture.componentInstance;
    expect(component.i18n).toBeTruthy();
  });

  it("should have access to all recipes", () => {
    const fixture = TestBed.createComponent(CompareComponent);
    const component = fixture.componentInstance;
    expect(component.recipes.allRecipes().length).toBeGreaterThan(0);
  });
});
