const http = require('http');
const app = require('../app');
const currencyManager = require('../src/currencyManager');
const stateManager = require('../src/stateManager');

let server;

beforeAll(async () => {
    console.log = jest.fn();

    server = http.createServer(app);
    server.listen(3002);
    await new Promise((resolve) => {
        server.on('listening', resolve);
    });
});

afterAll(async () => {
    await new Promise((resolve) => {
        server.close(resolve);
    });
});

const createPayload = (options) => {
    options = Object.assign({
        currency: 'CAD',
        multiplier: 1,
    }, options);

    return {
        cashAndInvestments: [
            ['Checking', 450000 * options.multiplier],
            ['Savings for Taxes', 500 * options.multiplier],
            ['Rainy Day Fund', 600 * options.multiplier]
        ],
        longTermAssets: [
            ['Primary Home', 4000 * options.multiplier],
            ['Secondary Home', 5000 * options.multiplier],
            ['Other', 0 * options.multiplier]
        ],
        shortTermLiabilities: [
            ['Credit Card 1', 3333 * options.multiplier],
            ['Credit Card 2', 2222 * options.multiplier]
        ],
        longTermDebt: [
            ['Mortgage 1', 55555 * options.multiplier],
            ['Mortgage 2', 44444 * options.multiplier],
        ],
        currency: options.currency,
    }
};

const request = async (path, payload) => {
    const options = {
        method: 'POST',
        hostname: 'localhost',
        port: 3002,
        path: `/api${path}`,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const body = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            res.setEncoding('utf-8');

            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });

            res.on('error', reject);
        });

        req.on('error', reject);

        req.end(JSON.stringify(payload));
    });

    return JSON.parse(body);
};

it('redirects to the React app', async () => {
    const code = await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3002/', (res) => {
            res.resume();
            resolve(res.statusCode);
        });
        req.on('error', reject);
        req.end();
    });
    expect(code).toBe(302);
});

it('sets current state and returns the same object', async () => {
    const payload = createPayload();
    const response = await request('/get', payload);
    expect(response).toEqual(payload);
});

it('does not break when multiple requests are received at the same time', async () => {
    currencyManager._expiryTime = 0;
    const payload = createPayload();
    const responses = await Promise.all([
        request('/set', payload),
        request('/set', payload),
        request('/set', payload),
    ]);
    const expected = {
        model: payload,
        data: {
            exchangeRate: 1,
            netWorth: 354546,
            totalAssets: 460100,
            totalLiabilities: 105554,
        },
    };
    for (const response of responses)
        expect(response).toEqual(expected);
});

it('gets current state including calculation of net worth', async () => {
    const payload = createPayload();
    const response = await request('/set', payload);
    expect(response).toEqual({
        model: payload,
        data: {
            exchangeRate: 1,
            netWorth: 354546,
            totalAssets: 460100,
            totalLiabilities: 105554,
        },
    });
});

it('defaults to 1 when exchange rate is not working', async () => {
    const previousData = currencyManager._data;
    currencyManager._data = null;
    expect(await currencyManager.convert()).toBe(1);
    expect(console.log).toBeCalled();
    currencyManager._data = previousData;
});

it('gets previous data', async () => {
    const payload = createPayload();
    const payloadNew = createPayload({ currency: 'HKD' });
    const response = await request('/get', payloadNew);
    expect(response).toEqual(payload);
});

it('calculates currency change properly', async () => {
    const previousRateCAD = currencyManager._data.rates.CAD;
    const previousRateHKD = currencyManager._data.rates.HKD;
    currencyManager._data.rates.CAD = 1;
    currencyManager._data.rates.HKD = 5;
    const payload = createPayload({ currency: 'HKD' });
    const response = await request('/set', payload);
    expect(response).toEqual({
        model: createPayload({ currency: 'HKD', multiplier: 5 }),
        data: {
            exchangeRate: 1 * 5,
            netWorth: 354546 * 5,
            totalAssets: 460100 * 5,
            totalLiabilities: 105554 * 5,
        },
    });
    currencyManager._data.rates.CAD = previousRateCAD;
    currencyManager._data.rates.HKD = previousRateHKD;
});

it('does not break if set is called before get', async () => {
    stateManager._currentData = null;
    const payload = createPayload();
    const response = await request('/set', payload);
    expect(response).toEqual({
        model: payload,
        data: {
            exchangeRate: 1,
            netWorth: 354546,
            totalAssets: 460100,
            totalLiabilities: 105554,
        },
    });
});
