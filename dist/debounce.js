export function debounce(fn, delay) {
    let timerId;
    return function (...args) {
        if (timerId !== undefined) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}
//# sourceMappingURL=debounce.js.map