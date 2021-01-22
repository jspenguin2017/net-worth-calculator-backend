const https = require('https');

const CurrencyManager = class {
    #data = null;
    #expiryTime = 0;
    #waitQueue = [];
    #busy = false;

    async _refreshData() {
        this.#busy = true;

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

            this.#data = JSON.parse(data);
            this.#expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
        } finally {
            this.#busy = false;

            while (this.#waitQueue.length > 0) {
                const resolver = this.#waitQueue.pop();
                resolver();
            }
        }
    }

    async _convert(from, to) {
        if (this.#expiryTime < Date.now()) {
            console.log('Updating currency rates...');

            if (this.#busy) {
                await new Promise((resolve) => {
                    this.#waitQueue.push(resolve);
                });
            } else {
                await this._refreshData();
            }
        }

        return this.#data.rates[to] / this.#data.rates[from];
    }

    async convert(from, to) {
        try {
            return this._convert(from, to);
        } catch (err) {
            console.log("Error when converting currency:");
            console.log(err);
            return 1;
        }
    }
};

module.exports = new CurrencyManager();
