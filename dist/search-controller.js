import { searchCountries } from './api.js';
import { debounce } from './debounce.js';
import { classifyError } from './errors.js';
export class SearchController {
    onSuccess;
    onError;
    timeoutMs;
    abortController = null;
    debouncedSearch;
    constructor(onSuccess, onError, debounceDelay = 300, timeoutMs = 5000) {
        this.onSuccess = onSuccess;
        this.onError = onError;
        this.timeoutMs = timeoutMs;
        this.debouncedSearch = debounce((query) => {
            this.executeSearch(query);
        }, debounceDelay);
    }
    search(query) {
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
    async executeSearch(query) {
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
        }
        catch (error) {
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
//# sourceMappingURL=search-controller.js.map