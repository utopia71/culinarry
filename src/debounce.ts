export function debounce<T extends unknown[]>(
  callback: (...args: T) => void,
  delayMs: number,
): (...args: T) => void {
  let timeoutId: number | undefined;

  return (...args: T): void => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => callback(...args), delayMs);
  };
}
