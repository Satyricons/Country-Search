import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from './api';

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
