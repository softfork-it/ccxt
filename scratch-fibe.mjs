// scratch runner for the `fibe` exchange.
//
// Build first (fast inner loop, JS only):
//     cd ccxt
//     npm install            # once
//     npm run tsBuild        # tsc -> js/   (re-run after each edit to ts/src/fibe.ts)
//     node scratch-fibe.mjs
//
// If `js/ccxt.js` doesn't exist yet, run a full `npm run build` once.

import ccxt from './js/ccxt.js';

const fibe = new ccxt.fibe ({});

function assert (condition, message) {
    if (!condition) {
        throw new Error (message);
    }
}

async function main () {
    // loadMarkets() calls fetchMarkets() and indexes them, so fibe.market() works.
    const markets = await fibe.loadMarkets ();
    const symbols = Object.keys (markets);
    assert (symbols.length > 0, 'expected at least one market');
    console.log ('fetched', symbols.length, 'markets\n');
    for (let i = 0; i < Math.min (5, symbols.length); i++) {
        const m = markets[symbols[i]];
        console.log ({
            id: m['id'],
            symbol: m['symbol'],
            type: m['type'],
            base: m['base'],
            quote: m['quote'],
            spot: m['spot'],
            swap: m['swap'],
            precision: m['precision'],
        });
    }

    const sym = symbols[0];
    console.log ('\nmarket(' + sym + ').id =', fibe.market (sym)['id']);

    const ob = await fibe.fetchOrderBook (sym, 1);
    assert (ob['bids'].length <= 1, 'order book bid limit failed');
    assert (ob['asks'].length <= 1, 'order book ask limit failed');
    console.log ('\norder book for', sym);
    console.log ('  bids[0..2]:', ob['bids'].slice (0, 3));
    console.log ('  asks[0..2]:', ob['asks'].slice (0, 3));

    const trades = await fibe.fetchTrades (sym, undefined, 3);
    assert (trades.length > 0, 'expected recent trades');
    assert (trades.length <= 3, 'trade limit failed');
    assert (trades[0]['symbol'] === sym, 'trade symbol mismatch');
    console.log ('\ntrades:', trades);

    // ponytail: candles are sparse, use a wider live window and let CCXT trim to 3.
    const until = Date.now ();
    const since = until - 24 * 60 * 60 * 1000;
    const ohlcv = await fibe.fetchOHLCV (sym, '1m', since, 3, { until });
    assert (ohlcv.length > 0, 'expected candles');
    assert (ohlcv.length <= 3, 'OHLCV limit failed');
    console.log ('\nohlcv:', ohlcv);

    const user = process.env.FIBE_USER || '11111111111111111111111111111111';
    const balance = await fibe.fetchBalance ({ user });
    assert (balance['info']['user'] === user, 'balance user mismatch');
    console.log ('\nbalance:');
    console.dir (balance, { depth: null });

    const openOrders = await fibe.fetchOpenOrders (undefined, undefined, 2, { user });
    assert (Array.isArray (openOrders), 'expected open orders array');
    assert (openOrders.length <= 2, 'open orders limit failed');
    console.log ('\nopen orders:', openOrders);

    const orders = await fibe.fetchOrders (undefined, undefined, 2, { user });
    assert (Array.isArray (orders), 'expected historical orders array');
    assert (orders.length <= 2, 'historical orders limit failed');
    console.log ('\nhistorical orders:', orders);
}

main ().catch ((e) => { console.error (e); process.exit (1); });
