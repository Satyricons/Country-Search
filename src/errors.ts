import { HttpError } from './api.js';

export type ErrorState =
  | { kind: 'aborted' }
  | { kind: 'empty' }
  | { kind: 'timeout'; retryable: true }
  | { kind: 'error'; retryable: true; message: string };

export function classifyError(error: unknown): ErrorState {
  // 1. Отмена своего запроса
  if (error instanceof DOMException && error.name === 'AbortError') {
    return { kind: 'aborted' };
  }

  // 2. Таймаут
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { kind: 'timeout', retryable: true };
  }

  // 3. HTTP ошибки
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return { kind: 'empty' };
    }
    return {
      kind: 'error',
      retryable: true,
      message: `Ошибка сервера (HTTP ${error.status})`,
    };
  }

  // 4. Сетевые сбои (fetch бросает TypeError)
  if (error instanceof TypeError) {
    return { kind: 'error', retryable: true, message: 'Проблема с сетью' };
  }

  // 5. Всё остальное
  return {
    kind: 'error',
    retryable: true,
    message: 'Произошла неизвестная ошибка',
  };
}
