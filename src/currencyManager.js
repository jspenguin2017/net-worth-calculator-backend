const https = require('https');

const CurrencyManager = class {
    _data = null;
    _expiryTime = 0;
    _waitQueue = [];
    _busy = false;

    async _refreshData() {
        this._busy = true;

        try {
            const data = await new Promise((resolve, reject) => {
                const req = https.request('https://api.exchangeratesapi.io/latest');

                let data = '';

                req.on('response', (res) => {
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        resolve(data);
                    });
                    res.on('error', reject);
                });

                req.on('error', reject);

                req.end();
            });

            this._data = JSON.parse(data);
            this._expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
        } finally {
            this._busy = false;

            while (this._waitQueue.length > 0) {
                const resolver = this._waitQueue.pop();
                resolver();
            }
        }
    }

    async _convert(from, to) {
        if (this._expiryTime < Date.now()) {
            console.log('Updating currency rates...');

            if (this._busy) {
                await new Promise((resolve) => {
                    this._waitQueue.push(resolve);
                });
            } else {
                await this._refreshData();
            }
        }

        return this._data.rates[to] / this._data.rates[from];
    }

    async convert(from, to) {
        try {
            return await this._convert(from, to);
        } catch (err) {
            console.log("Error when converting currency:");
            console.log(err);
            return 1;
        }
    }
};

module.exports = new CurrencyManager();
