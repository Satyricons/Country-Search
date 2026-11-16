import { searchCountries, type CountryCard } from './api';
import { debounce } from './debounce';
import { classifyError, type ErrorState } from './errors';

export type SearchCallback = (results: CountryCard[]) => void;
export type ErrorCallback = (error: ErrorState) => void;

export class SearchController {
  private abortController: AbortController | null = null;
  private debouncedSearch: ReturnType<typeof debounce>;

  constructor(
    private onSuccess: SearchCallback,
    private onError: ErrorCallback,
    debounceDelay: number = 300,
    private timeoutMs: number = 5000,
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
    const userSignal = this.abortController.signal;

    // Композируем сигналы: отмена пользователем ИЛИ таймаут
    const signal = AbortSignal.any([userSignal, AbortSignal.timeout(this.timeoutMs)]);

    try {
      const results = await searchCountries(query, signal);

      // Если запрос не был отменен, пока мы ждали ответ, отдаем результат
      if (!signal.aborted) {
        this.onSuccess(results);
      }
    } catch (error) {
      const classified = classifyError(error);

      // Если это AbortError (наш собственный), мы его игнорируем
      if (classified.kind === 'aborted') {
        return;
      }

      // Если это TimeoutError или другая ошибка, отдаем в коллбэк.
      // Важно: проверяем, что userSignal не был отменен,
      // чтобы не показать ошибку для неактуального запроса.
      if (!userSignal.aborted) {
        this.onError(classified);
      }
    }
  }
}
