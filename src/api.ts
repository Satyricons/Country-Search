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
