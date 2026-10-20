import { kioskKeyDelta } from "../lib/kiosk-keys";

function expect(label: string, got: number, want: number) {
  if (got !== want) {
    console.error(`FAIL ${label}: got ${got}, want ${want}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ok ${label}`);
}

expect("ArrowLeft", kioskKeyDelta({ key: "ArrowLeft", code: "ArrowLeft" }), -1);
expect("ArrowRight", kioskKeyDelta({ key: "ArrowRight", code: "ArrowRight" }), 1);
expect("PageUp", kioskKeyDelta({ key: "PageUp", code: "PageUp" }), -1);
expect("PageDown", kioskKeyDelta({ key: "PageDown", code: "PageDown" }), 1);
expect("Space", kioskKeyDelta({ key: " ", code: "Space" }), 1);
expect("BracketLeft", kioskKeyDelta({ key: "[", code: "BracketLeft" }), -1);
expect("other", kioskKeyDelta({ key: "a", code: "KeyA" }), 0);

if (process.exitCode) {
  console.error("kiosk key checks failed");
  process.exit(1);
}
console.log("kiosk key checks passed");
