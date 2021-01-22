const currencyManager = require("./currencyManager");

const StateManager = class {
    static _ALL_KEYS = ['cashAndInvestments', 'longTermAssets', 'shortTermLiabilities', 'longTermDebt'];

    _currentData = null;

    async _recalculate() {
        const sums = {};
        for (const key of StateManager._ALL_KEYS)
            sums[key] = this._currentData[key].map(x => x[1]).reduce((acc, curr) => acc + curr);

        const totalAssets = sums.cashAndInvestments + sums.longTermAssets;
        const totalLiabilities = sums.shortTermLiabilities + sums.longTermDebt;

        return {
            netWorth: totalAssets - totalLiabilities,
            totalAssets,
            totalLiabilities,
            exchangeRate: await currencyManager.convert('CAD', this._currentData.currency),
        };
    }

    async _changeCurrency(oldCurrency) {
        const exchangeRate = await currencyManager.convert(oldCurrency, this._currentData.currency);

        for (const key of StateManager._ALL_KEYS) {
            this._currentData[key] = this._currentData[key].map(entry => {
                entry[1] *= exchangeRate;
                return entry;
            });
        }
    }

    async setData(newData) {
        if (this._currentData === null) {
            this._currentData = newData;
            return {
                model: this._currentData,
                data: this._recalculate(),
            };
        }

        const oldCurrency = this._currentData.currency;

        this._currentData = newData;

        if (oldCurrency && oldCurrency !== newData.currency)
            await this._changeCurrency(oldCurrency);

        return {
            model: this._currentData,
            data: await this._recalculate(),
        };
    }

    async getData(defaultData) {
        if (this._currentData === null)
            this._currentData = defaultData;

        return this._currentData;
    }
};

module.exports = new StateManager();
