// scratch runner for the `fibe` exchange.
//
// Build first (fast inner loop, JS only):
//     cd ccxt
//     npm install            # once
//     npm run tsBuild        # tsc -> js/   (re-run after each edit to ts/src/fibe.ts)
//     node scratch-fibe.mjs
//     node scratch-fibe.mjs fetchTicker
//     node scratch-fibe.mjs fetchTickers
//     FIBE_SYMBOL='ETH/USDC:USDC' node scratch-fibe.mjs fetchTicker
//     node scratch-fibe.mjs fetchTradingFee
//     FIBE_USER=... node scratch-fibe.mjs fetchPositions
//     FIBE_USER=... node scratch-fibe.mjs fetchFundingHistory
//
// If `js/ccxt.js` doesn't exist yet, run a full `npm run build` once.

import ccxt from './js/ccxt.js';

const fibe = new ccxt.fibe ({ timeout: 20000 });
const available = [
    'fetchMarkets',
    'market',
    'fetchTicker',
    'fetchTickers',
    'fetchOrderBook',
    'fetchTrades',
    'fetchOHLCV',
    'fetchBalance',
    'fetchPositions',
    'fetchFundingHistory',
    'fetchTradingFee',
    'fetchOpenOrders',
    'fetchOrders',
];
const selected = new Set (process.argv.slice (2));
const unknown = [ ...selected ].filter ((name) => !available.includes (name));
if (unknown.length > 0) {
    console.error ('Unknown target(s): ' + unknown.join (', '));
    console.error ('Available targets:\n  ' + available.join ('\n  '));
    process.exit (1);
}

function assert (condition, message) {
    if (!condition) {
        throw new Error (message);
    }
}

function shouldRun (name) {
    return selected.size === 0 || selected.has (name);
}

function print (name, value) {
    console.log ('\n' + name + ':');
    console.dir (value, { depth: null });
}

async function main () {
    // loadMarkets() calls fetchMarkets() and indexes them, so fibe.market() works.
    const markets = await fibe.loadMarkets ();
    const symbols = Object.keys (markets);
    assert (symbols.length > 0, 'expected at least one market');
    if (shouldRun ('fetchMarkets')) {
        print ('fetchMarkets', symbols.slice (0, 5).map ((symbol) => {
            const m = markets[symbol];
            return {
            id: m['id'],
            symbol: m['symbol'],
            type: m['type'],
            base: m['base'],
            quote: m['quote'],
            spot: m['spot'],
            swap: m['swap'],
            precision: m['precision'],
            };
        }));
    }

    const sym = process.env.FIBE_SYMBOL || symbols[0];
    assert (markets[sym] !== undefined, 'unknown symbol ' + sym);
    if (shouldRun ('market')) {
        print ('market', { symbol: sym, id: fibe.market (sym)['id'] });
    }

    if (shouldRun ('fetchTicker')) {
        const ticker = await fibe.fetchTicker (sym);
        assert (ticker['symbol'] === sym, 'ticker symbol mismatch');
        print ('fetchTicker', ticker);
    }

    if (shouldRun ('fetchTickers')) {
        const tickers = await fibe.fetchTickers ();
        assert (tickers[sym] !== undefined, 'expected ticker for selected symbol');
        assert (tickers[sym]['symbol'] === sym, 'tickers symbol mismatch');
        assert (Object.keys (tickers).length === symbols.length, 'expected tickers for all markets');
        print ('fetchTickers', tickers);
    }

    if (shouldRun ('fetchOrderBook')) {
        const ob = await fibe.fetchOrderBook (sym, 1);
        assert (ob['bids'].length <= 1, 'order book bid limit failed');
        assert (ob['asks'].length <= 1, 'order book ask limit failed');
        print ('fetchOrderBook', ob);
    }

    if (shouldRun ('fetchTrades')) {
        const trades = await fibe.fetchTrades (sym, undefined, 3);
        assert (trades.length > 0, 'expected recent trades');
        assert (trades.length <= 3, 'trade limit failed');
        assert (trades[0]['symbol'] === sym, 'trade symbol mismatch');
        print ('fetchTrades', trades);
    }

    // ponytail: candles are sparse, use a wider live window and let CCXT trim to 3.
    const until = Date.now ();
    const since = until - 24 * 60 * 60 * 1000;
    if (shouldRun ('fetchOHLCV')) {
        const ohlcv = await fibe.fetchOHLCV (sym, '1m', since, 3, { until });
        assert (ohlcv.length > 0, 'expected candles');
        assert (ohlcv.length <= 3, 'OHLCV limit failed');
        print ('fetchOHLCV', ohlcv);
    }

    const user = process.env.FIBE_USER || '11111111111111111111111111111111';
    if (shouldRun ('fetchBalance')) {
        const balance = await fibe.fetchBalance ({ user });
        assert (balance['info']['user'] === user, 'balance user mismatch');
        print ('fetchBalance', balance);
    }

    if (shouldRun ('fetchPositions')) {
        const positionSymbols = (process.env.FIBE_SYMBOL === undefined) ? undefined : [ sym ];
        const positions = await fibe.fetchPositions (positionSymbols, { user });
        assert (Array.isArray (positions), 'expected positions array');
        if (positionSymbols !== undefined) {
            assert (positions.every ((position) => position['symbol'] === sym), 'position symbol mismatch');
        }
        print ('fetchPositions', positions);
    }

    if (shouldRun ('fetchFundingHistory')) {
        const fundingSymbol = (process.env.FIBE_SYMBOL === undefined) ? undefined : sym;
        const fundingSince = Date.now () - 7 * 24 * 60 * 60 * 1000;
        const fundingHistory = await fibe.fetchFundingHistory (fundingSymbol, fundingSince, 3, { user });
        assert (Array.isArray (fundingHistory), 'expected funding history array');
        assert (fundingHistory.length <= 3, 'funding history limit failed');
        assert (fundingHistory.every ((funding) => funding['rate'] === undefined), 'funding history rate should not be set');
        assert (fundingHistory.every ((funding) => !Object.prototype.hasOwnProperty.call (funding['info'], 'fundingRate')), 'funding history info should not include fundingRate');
        if (fundingSymbol !== undefined) {
            assert (fundingHistory.every ((funding) => funding['symbol'] === sym), 'funding history symbol mismatch');
        }
        print ('fetchFundingHistory', fundingHistory);
    }

    if (shouldRun ('fetchTradingFee')) {
        const tradingFee = await fibe.fetchTradingFee (sym, { user });
        assert (tradingFee['symbol'] === sym, 'trading fee symbol mismatch');
        print ('fetchTradingFee', tradingFee);
    }

    if (shouldRun ('fetchOpenOrders')) {
        const openOrders = await fibe.fetchOpenOrders (process.env.FIBE_SYMBOL, undefined, 2, { user });
        assert (Array.isArray (openOrders), 'expected open orders array');
        assert (openOrders.length <= 2, 'open orders limit failed');
        print ('fetchOpenOrders', openOrders);
    }

    if (shouldRun ('fetchOrders')) {
        const orders = await fibe.fetchOrders (process.env.FIBE_SYMBOL, undefined, 2, { user });
        assert (Array.isArray (orders), 'expected historical orders array');
        assert (orders.length <= 2, 'historical orders limit failed');
        print ('fetchOrders', orders);
    }
}

main ().catch ((e) => { console.error (e); process.exit (1); });
