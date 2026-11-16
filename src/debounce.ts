export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  return function (this: unknown, ...args: TArgs) {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
