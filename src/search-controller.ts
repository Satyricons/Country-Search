import { searchCountries, type CountryCard } from './api';
import { debounce } from './debounce';

export type SearchCallback = (results: CountryCard[]) => void;
export type ErrorCallback = (error: unknown) => void;

export class SearchController {
  private abortController: AbortController | null = null;
  private debouncedSearch: ReturnType<typeof debounce>;

  constructor(
    private onSuccess: SearchCallback,
    private onError: ErrorCallback,
    debounceDelay: number = 300,
  ) {
    this.debouncedSearch = debounce((query: string) => {
      this.executeSearch(query);
    }, debounceDelay);
  }

  public search(query: string) {
    // 1. Отменяем предыдущий запрос СРАЗУ (до debounce)
    if (this.abortController) {
      this.abortController.abort();
    }

    // 2. Очищаем ввод
    if (!query.trim()) {
      this.onSuccess([]); // Очищаем список
      return;
    }

    // 3. Запускаем debounce
    this.debouncedSearch(query);
  }

  private async executeSearch(query: string) {
    // Создаем новый контроллер для этого запроса
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      const results = await searchCountries(query, signal);

      // Если запрос не был отменен, пока мы ждали ответ, отдаем результат
      if (!signal.aborted) {
        this.onSuccess(results);
      }
    } catch (error) {
      // Если это AbortError (наш собственный), мы его игнорируем
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      // Иначе это настоящая ошибка
      if (!signal.aborted) {
        this.onError(error);
      }
    }
  }
}
