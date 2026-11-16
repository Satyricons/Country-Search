import { describe, it, expect } from 'vitest';
import { classifyError } from './errors';
import { HttpError } from './api';

describe('classifyError', () => {
  it('возвращает "aborted" для AbortError', () => {
    const error = new DOMException('The operation was aborted.', 'AbortError');
    expect(classifyError(error)).toEqual({ kind: 'aborted' });
  });

  it('возвращает "timeout" для TimeoutError', () => {
    const error = new DOMException('The operation timed out.', 'TimeoutError');
    expect(classifyError(error)).toEqual({ kind: 'timeout', retryable: true });
  });

  it('возвращает "empty" для HttpError со статусом 404', () => {
    const error = new HttpError(404);
    expect(classifyError(error)).toEqual({ kind: 'empty' });
  });

  it('возвращает "error" с возможностью повтора для HttpError 500', () => {
    const error = new HttpError(500);
    expect(classifyError(error)).toEqual({
      kind: 'error',
      retryable: true,
      message: 'Ошибка сервера (HTTP 500)',
    });
  });

  it('возвращает "error" для сетевого сбоя (TypeError)', () => {
    const error = new TypeError('Failed to fetch');
    expect(classifyError(error)).toEqual({
      kind: 'error',
      retryable: true,
      message: 'Проблема с сетью',
    });
  });

  it('возвращает "error" для неизвестной ошибки', () => {
    const error = new Error('Something went wrong');
    expect(classifyError(error)).toEqual({
      kind: 'error',
      retryable: true,
      message: 'Произошла неизвестная ошибка',
    });
  });
});
