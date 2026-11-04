import { describe, expect, it } from "vitest";
import { fitCanvas } from "./layout";

function fakeElement() {
  return {
    style: {
      left: "",
      top: "",
      webkitTransform: "",
      transform: ""
    }
  } as unknown as HTMLElement;
}

describe("fitCanvas", () => {
  it("scales 1920x1080 to a 3840x2160 viewport", () => {
    const element = fakeElement();
    fitCanvas(element, 3840, 2160);
    expect(element.style.transform).toBe("scale(2)");
    expect(element.style.left).toBe("0px");
    expect(element.style.top).toBe("0px");
  });

  it("letterboxes and centers the canvas", () => {
    const element = fakeElement();
    fitCanvas(element, 1000, 1000);
    expect(element.style.transform).toBe("scale(0.5208333333333334)");
    expect(element.style.left).toBe("0px");
    expect(element.style.top).toBe("219px");
  });

  it("falls back to scale 1 for invalid viewports", () => {
    const element = fakeElement();
    fitCanvas(element, 0, 0);
    expect(element.style.transform).toBe("scale(1)");
  });
});
