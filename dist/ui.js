export class UI {
    input;
    statusContainer;
    resultsContainer;
    modalOverlay;
    modalBody;
    modalClose;
    constructor() {
        this.input = document.getElementById('search-input');
        this.statusContainer = document.getElementById('status-container');
        this.resultsContainer = document.getElementById('results-container');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalBody = document.getElementById('modal-body');
        this.modalClose = document.getElementById('modal-close');
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay)
                this.closeModal();
        });
    }
    onSearch(callback) {
        this.input.addEventListener('input', (e) => {
            const target = e.target;
            callback(target.value);
        });
    }
    showLoading() {
        this.clearResults();
        this.setStatus('loading', 'Загрузка...');
    }
    showEmpty() {
        this.clearResults();
        this.setStatus('empty', 'Ничего не найдено');
    }
    showError(error, onRetry) {
        this.clearResults();
        // Отсекаем aborted (он не должен сюда попадать, но TS требует)
        // Отсекаем aborted и empty (они не должны сюда попадать, но TS требует)
        if (error.kind === 'aborted' || error.kind === 'empty')
            return;
        let message = 'Произошла ошибка';
        if (error.kind === 'timeout')
            message = 'Превышено время ожидания';
        if (error.kind === 'error')
            message = error.message;
        this.setStatus('error', message);
        // Теперь TS знает, что error.kind либо 'timeout', либо 'error', у которых есть retryable
        if (error.retryable) {
            const btn = document.createElement('button');
            btn.textContent = 'Повторить';
            btn.addEventListener('click', onRetry);
            this.statusContainer.appendChild(btn);
        }
    }
    renderResults(countries) {
        this.setStatus(null); // Скрываем статус
        this.clearResults();
        countries.forEach((country) => {
            const card = document.createElement('div');
            card.className = 'card';
            if (country.flag) {
                const img = document.createElement('img');
                img.src = country.flag;
                img.alt = `Флаг ${country.name}`;
                card.appendChild(img);
            }
            const title = document.createElement('h3');
            title.textContent = country.name;
            card.appendChild(title);
            const capital = document.createElement('p');
            capital.textContent = `Столица: ${country.capital}`;
            card.appendChild(capital);
            const region = document.createElement('p');
            region.textContent = `Регион: ${country.region}`;
            card.appendChild(region);
            const population = document.createElement('p');
            population.textContent = `Население: ${country.population.toLocaleString('ru-RU')}`;
            card.appendChild(population);
            card.addEventListener('click', () => this.openModal(country));
            this.resultsContainer.appendChild(card);
        });
    }
    openModal(country) {
        this.modalBody.textContent = ''; // Очищаем
        const title = document.createElement('h2');
        title.textContent = country.name;
        this.modalBody.appendChild(title);
        const details = [
            `Столица: ${country.capital}`,
            `Регион: ${country.region}`,
            `Население: ${country.population.toLocaleString('ru-RU')}`,
            `Языки: ${country.languages.join(', ') || 'Нет данных'}`,
        ];
        details.forEach((text) => {
            const p = document.createElement('p');
            p.textContent = text;
            this.modalBody.appendChild(p);
        });
        this.modalOverlay.classList.remove('hidden');
    }
    closeModal() {
        this.modalOverlay.classList.add('hidden');
    }
    setStatus(type, message = '') {
        this.statusContainer.className = 'status-container';
        this.statusContainer.textContent = '';
        if (!type) {
            this.statusContainer.classList.add('hidden');
            return;
        }
        this.statusContainer.classList.remove('hidden');
        this.statusContainer.classList.add(`status-${type}`);
        this.statusContainer.textContent = message;
    }
    clearResults() {
        this.resultsContainer.textContent = '';
    }
}
//# sourceMappingURL=ui.js.map