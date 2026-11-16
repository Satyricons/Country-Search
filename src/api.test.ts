import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapCountryResponse, searchCountries, HttpError } from './api';

describe('mapCountryResponse', () => {
  it('преобразует сырой ответ API в объект для карточки', () => {
    const raw = [
      {
        name: 'France',
        capital: 'Paris',
        region: 'Europe',
        population: 67391582,
        flags: { svg: 'https://flagcdn.com/fr.svg' },
        languages: [{ name: 'French' }],
      },
    ];

    const result = mapCountryResponse(raw);

    expect(result).toEqual([
      {
        name: 'France',
        capital: 'Paris',
        region: 'Europe',
        population: 67391582,
        flag: 'https://flagcdn.com/fr.svg',
        languages: ['French'],
      },
    ]);
  });

  it('корректно обрабатывает отсутствующие поля', () => {
    const raw = [
      {
        name: 'Unknown',
      },
    ];

    const result = mapCountryResponse(raw);

    expect(result).toEqual([
      {
        name: 'Unknown',
        capital: 'Нет данных',
        region: 'Нет данных',
        population: 0,
        flag: '',
        languages: [],
      },
    ]);
  });

  it('возвращает пустой массив, если на вход передан пустой массив', () => {
    expect(mapCountryResponse([])).toEqual([]);
  });
});

describe('searchCountries', () => {
  beforeEach(() => {
    // Мокаем глобальный fetch
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('возвращает пустой массив при статусе 404 (нет совпадений)', async () => {
    const mockResponse = { ok: false, status: 404 };
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const controller = new AbortController();
    const result = await searchCountries('nonexistent', controller.signal);

    expect(result).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(
      'https://countries.dev/name/nonexistent',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('бросает HttpError при других неуспешных статусах (например, 500)', async () => {
    const mockResponse = { ok: false, status: 500 };
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const controller = new AbortController();

    // Проверка, что бросается именно HttpError
    await expect(searchCountries('france', controller.signal)).rejects.toThrow(HttpError);

    // Проверка, что ошибка хранит статус
    try {
      await searchCountries('france', controller.signal);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(500);
    }
  });

  it('возвращает массив отформатированных стран при успешном запросе', async () => {
    const rawData = [
      {
        name: 'Spain',
        capital: 'Madrid',
        population: 47351567,
        flags: { svg: 'https://flagcdn.com/es.svg' },
        languages: [{ name: 'Spanish' }],
      },
    ];
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => rawData,
    };
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const controller = new AbortController();
    const result = await searchCountries('spain', controller.signal);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Spain');
    expect(result[0].capital).toBe('Madrid');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
