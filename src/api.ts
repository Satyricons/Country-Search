export interface RawCountry {
  name: string;
  capital?: string;
  region?: string;
  population?: number;
  flags?: { svg?: string };
  languages?: Array<{ name: string }>;
}

export interface CountryCard {
  name: string;
  capital: string;
  region: string;
  population: number;
  flag: string;
  languages: string[];
}

export function mapCountryResponse(raw: RawCountry[]): CountryCard[] {
  return raw.map((country) => ({
    name: country.name,
    capital: country.capital ?? 'Нет данных',
    region: country.region ?? 'Нет данных',
    population: country.population ?? 0,
    flag: country.flags?.svg ?? '',
    languages: country.languages?.map((lang) => lang.name) ?? [],
  }));
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message?: string,
  ) {
    super(message ?? `HTTP Error ${status}`);
    this.name = 'HttpError';
    // Обязательно для корректной работы instanceof при компиляции в ES5/ES2015
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export async function searchCountries(query: string, signal: AbortSignal): Promise<CountryCard[]> {
  const url = `https://countries.dev/name/${encodeURIComponent(query)}`;

  const response = await fetch(url, { signal });

  // ВАЖНО: 404 - это не ошибка, а отсутствие совпадений
  if (response.status === 404) {
    return [];
  }

  // Проверяем response.ok для других статусов (500, 400, 403 и т.д.)
  if (!response.ok) {
    throw new HttpError(response.status);
  }

  const rawData = await response.json();
  return mapCountryResponse(rawData);
}
