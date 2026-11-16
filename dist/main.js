import { UI } from './ui.js';
import { SearchController } from './search-controller.js';
const ui = new UI();
// Переменная для хранения последнего запроса (нужна для кнопки "Повторить")
let lastQuery = '';
const controller = new SearchController((results) => {
    if (results.length === 0) {
        ui.showEmpty();
    }
    else {
        ui.renderResults(results);
    }
}, (error) => {
    ui.showError(error, () => {
        // При нажатии на "Повторить" отправляем тот же запрос, минуя debounce
        if (lastQuery)
            controller.search(lastQuery);
    });
}, 300, 5000);
ui.onSearch((query) => {
    lastQuery = query;
    if (!query.trim()) {
        ui.renderResults([]); // Очищаем экран
        return;
    }
    ui.showLoading();
    controller.search(query);
});
//# sourceMappingURL=main.js.map