import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { BakingSessionComponent } from "./baking-session";

describe("BakingSessionComponent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );

    TestBed.configureTestingModule({
      imports: [BakingSessionComponent],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should create the component", () => {
    const fixture = TestBed.createComponent(BakingSessionComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it("should start with save form hidden", () => {
    const fixture = TestBed.createComponent(BakingSessionComponent);
    const component = fixture.componentInstance;
    expect(component.showSaveForm()).toBe(false);
  });

  it("should start with empty notes", () => {
    const fixture = TestBed.createComponent(BakingSessionComponent);
    const component = fixture.componentInstance;
    expect(component.saveNotes()).toBe("");
  });

  it("should inject i18n service", () => {
    const fixture = TestBed.createComponent(BakingSessionComponent);
    const component = fixture.componentInstance;
    expect(component.i18n).toBeTruthy();
  });

  it("should inject auth service", () => {
    const fixture = TestBed.createComponent(BakingSessionComponent);
    const component = fixture.componentInstance;
    expect(component.auth).toBeTruthy();
  });
});
