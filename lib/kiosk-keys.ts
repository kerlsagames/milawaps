/** Map a keyboard event to kiosk playlist step. Classroom remotes often send PageUp/Down. */
export function kioskKeyDelta(event: { key: string; code: string }): 1 | -1 | 0 {
  const { key, code } = event;
  if (
    key === "ArrowLeft" ||
    key === "Left" ||
    key === "PageUp" ||
    code === "ArrowLeft" ||
    code === "PageUp" ||
    code === "MediaTrackPrevious" ||
    key === "[" ||
    code === "BracketLeft" ||
    key === "j" ||
    key === "J"
  ) {
    return -1;
  }
  if (
    key === "ArrowRight" ||
    key === "Right" ||
    key === "PageDown" ||
    code === "ArrowRight" ||
    code === "PageDown" ||
    code === "MediaTrackNext" ||
    key === "]" ||
    code === "BracketRight" ||
    key === "k" ||
    key === "K" ||
    key === " " ||
    code === "Space"
  ) {
    return 1;
  }
  return 0;
}
