import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchController } from './search-controller';

// Вспомогательная функция для создания контролируемого мока fetch
function createFetchMock() {
  const pendingResolvers: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];
  const pendingSignals: AbortSignal[] = [];

  const mockFetch = vi.fn((url: string, init: RequestInit) => {
    return new Promise((resolve, reject) => {
      const signal = init.signal as AbortSignal;

      // Слушаем отмену запроса
      signal.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });

      pendingResolvers.push({ resolve, reject });
      pendingSignals.push(signal);
    });
  });

  return {
    mockFetch,
    pendingResolvers,
    pendingSignals,
    // Метод для ручного завершения конкретного запроса
    resolveAt: (index: number, data: unknown) => {
      const response = {
        ok: true,
        status: 200,
        json: async () => data,
      };
      pendingResolvers[index].resolve(response);
    },
    rejectAt: (index: number, error: unknown) => {
      pendingResolvers[index].reject(error);
    },
  };
}

describe('SearchController (Race Condition)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('отменяет предыдущий запрос и не рендерит устаревший результат (гонка запросов)', async () => {
    const { mockFetch, resolveAt, pendingSignals } = createFetchMock();
    vi.stubGlobal('fetch', mockFetch);

    const onSuccess = vi.fn();
    const onError = vi.fn();

    const controller = new SearchController(onSuccess, onError, 300);

    // 1. Пользователь вводит "sp"
    controller.search('sp');
    await vi.advanceTimersByTimeAsync(300); // срабатывает debounce, уходит запрос №0

    // 2. Пользователь быстро вводит "spain"
    controller.search('spain');
    await vi.advanceTimersByTimeAsync(300); // срабатывает debounce, уходит запрос №1

    // В этот момент запрос "sp" должен быть отменен (aborted)
    expect(pendingSignals[0].aborted).toBe(true);
    expect(pendingSignals[1].aborted).toBe(false);

    // 3. Имитируем ситуацию, когда запрос на "spain" (№1) приходит ПЕРВЫМ
    resolveAt(1, [{ name: 'Spain' }]);

    // Даем микрозадачам прокрутиться
    await vi.advanceTimersByTimeAsync(0);

    // Проверяем, что отрисовался результат для "spain"
    expect(onSuccess).toHaveBeenCalledTimes(1);

    expect(onSuccess).toHaveBeenCalledWith([
      {
        name: 'Spain',
        capital: 'Нет данных',
        region: 'Нет данных',
        population: 0,
        flag: '',
        languages: [],
      },
    ]);

    // 4. Имитируем ситуацию, когда запрос на "sp" (№0) приходит ВТОРЫМ
    try {
      resolveAt(0, [{ name: 'Spain' }]);
    } catch {
      // Промис уже отклонен через abort, resolve ничего не делает
    }

    await vi.advanceTimersByTimeAsync(0);

    // КЛЮЧЕВАЯ ПРОВЕРКА: onSuccess должен быть вызван только ОДИН раз.
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
});
