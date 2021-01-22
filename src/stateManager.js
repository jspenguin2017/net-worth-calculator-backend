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

    async changeCurrency(newCurrency) {
        if (this.#currentData === null)
            return null;

        const exchangeRate = await currencyManager.convert(this.#currentData.currency, newCurrency);

        this.#currentData.currency = newCurrency;
        for (const key of StateManager.#ALL_KEYS) {
            this.#currentData[key] = this.#currentData[key].map(entry => {
                entry[1] *= exchangeRate;
                return entry;
            });
        }

        return this._recalculate();
    }

    setData(newData) {
        this.#currentData = newData;
        return this._recalculate();
    }

    getData(defaultData) {
        if (this.#currentData === null)
            this.setData(defaultData);

        return this.#currentData;
    }
};

module.exports = new StateManager();
