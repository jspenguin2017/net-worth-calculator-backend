const currencyManager = require("./currencyManager");

const StateManager = class {
    static #ALL_KEYS = ['cashAndInvestments', 'longTermAssets', 'shortTermLiabilities', 'longTermDebt'];

    #currentData = null;

    _recalculate() {
        const value = {};
        for (const key of StateManager.#ALL_KEYS)
            value[key] = this.#currentData[key].map(x => x[1]).reduce((acc, curr) => acc + curr);
        value.currency = this.#currentData.currency;
        return value;
    }

    async _changeCurrency(oldCurrency) {
        const exchangeRate = await currencyManager.convert(oldCurrency, this.#currentData.currency);

        for (const key of StateManager.#ALL_KEYS) {
            this.#currentData[key] = this.#currentData[key].map(entry => {
                entry[1] *= exchangeRate;
                return entry;
            });
        }
    }

    async setData(newData) {
        if (this.#currentData === null) {
            this.#currentData = newData;
            return this._recalculate();
        }

        const oldCurrency = this.#currentData.currency;

        this.#currentData = newData;

        if (oldCurrency && oldCurrency !== newData.currency)
            await this._changeCurrency(oldCurrency);

        return this._recalculate();
    }

    async getData(defaultData) {
        if (this.#currentData === null)
            this.#currentData = defaultData;

        return this.#currentData;
    }
};

module.exports = new StateManager();
