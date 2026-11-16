import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('вызывает функцию только один раз после серии вызовов', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('сбрасывает таймер при повторном вызове до истечения задержки', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);

    debounced();
    vi.advanceTimersByTime(50);

    // Прошло 100мс с первого вызова, но только 50мс со второго.
    // Функция не должна была вызваться.
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    // Теперь прошло 100мс со второго вызова.
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('передаёт последние аргументы в отложенную функцию', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('сохраняет контекст вызова (this)', () => {
    const obj = {
      value: 42,
      method: vi.fn(),
    };

    // Оборачиваем метод
    const debouncedMethod = debounce(obj.method, 100);

    debouncedMethod.call(obj);
    vi.advanceTimersByTime(100);

    expect(obj.method).toHaveBeenCalledTimes(1);
    expect(obj.method.mock.contexts[0]).toBe(obj);
  });
});
