export const measureTextWidth = (
  text: string,
  element?: HTMLElement | null,
) => {
  const measureEl = document.createElement("span");
  measureEl.style.visibility = "hidden";
  measureEl.style.position = "absolute";
  measureEl.style.whiteSpace = "nowrap";

  if (element) {
    const styles = window.getComputedStyle(element);
    measureEl.style.fontSize = styles.fontSize;
    measureEl.style.fontFamily = styles.fontFamily;
    measureEl.style.fontWeight = styles.fontWeight;
    measureEl.style.letterSpacing = styles.letterSpacing;
  }

  measureEl.textContent = text;
  document.body.appendChild(measureEl);
  const width = measureEl.getBoundingClientRect().width;
  document.body.removeChild(measureEl);
  return width;
};
