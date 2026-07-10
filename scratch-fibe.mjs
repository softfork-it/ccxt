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
//     node scratch-fibe.mjs fetchFundingRate
//     node scratch-fibe.mjs fetchFundingRates
//     node scratch-fibe.mjs fetchTradingFee
//     FIBE_USER=... node scratch-fibe.mjs fetchPositions
//     FIBE_USER=... node scratch-fibe.mjs fetchFundingHistory
//     FIBE_USER=... FIBE_SINCE='2026-07-08T21:00:00Z' FIBE_UNTIL='2026-07-08T22:00:00Z' node scratch-fibe.mjs fetchMyTrades
//     FIBE_USER=... FIBE_SYMBOL=ETH/USDC FIBE_ORDER_ID=... node scratch-fibe.mjs fetchOrder
//     FIBE_USER=... FIBE_SYMBOL=ETH/USDC node scratch-fibe.mjs fetchClosedOrders
//     FIBE_USER=... FIBE_SYMBOL=ETH/USDC node scratch-fibe.mjs fetchCanceledOrders
//     FIBE_ENABLE_TRADING=1 FIBE_PRIVATE_KEY=... FIBE_SYMBOL=ETH/USDC FIBE_SIDE=buy FIBE_AMOUNT=0.01 FIBE_PRICE=1000 node scratch-fibe.mjs createOrder
//     FIBE_ENABLE_TRADING=1 FIBE_PRIVATE_KEY=... FIBE_SYMBOL=ETH/USDC FIBE_ORDER_ID=... node scratch-fibe.mjs cancelOrder
//     FIBE_ENABLE_TRADING=1 FIBE_PRIVATE_KEY=... FIBE_SYMBOL=ETH/USDC FIBE_ORDER_IDS=1,2 node scratch-fibe.mjs cancelOrders
//     FIBE_ENABLE_TRADING=1 FIBE_PRIVATE_KEY=... FIBE_SYMBOL=ETH/USDC node scratch-fibe.mjs cancelAllOrders
//     FIBE_USER=... FIBE_PRIVATE_KEY=... FIBE_SYMBOL=ETH/USDC node scratch-fibe.mjs inspectLocalOrderTx
//     FIBE_ENABLE_TRADING=1 FIBE_USER=... FIBE_PRIVATE_KEY=... FIBE_SYMBOL=ETH/USDC node scratch-fibe.mjs liveCreateCancelOrder
//     FIBE_ENABLE_TRADING=1 FIBE_USER=... FIBE_PRIVATE_KEY=... FIBE_SYMBOL=ETH/USDC node scratch-fibe.mjs liveFailureChecks
//
// If `js/ccxt.js` doesn't exist yet, run a full `npm run build` once.

import ccxt from './js/ccxt.js';

const fibe = new ccxt.fibe ({
    timeout: 20000,
    walletAddress: process.env.FIBE_USER,
    privateKey: process.env.FIBE_PRIVATE_KEY,
    options: {
        rpcUrl: process.env.FIBE_RPC_URL || 'https://api.devnet.solana.com',
    },
});
const available = [
    'fetchMarkets',
    'market',
    'fetchTicker',
    'fetchTickers',
    'fetchOrderBook',
    'fetchTrades',
    'fetchMyTrades',
    'fetchOHLCV',
    'fetchBalance',
    'fetchPositions',
    'fetchFundingRate',
    'fetchFundingRates',
    'fetchFundingHistory',
    'fetchTradingFee',
    'fetchOrder',
    'fetchOpenOrders',
    'fetchOrders',
    'fetchClosedOrders',
    'fetchCanceledOrders',
    'createOrder',
    'cancelOrder',
    'cancelOrders',
    'cancelAllOrders',
    'inspectLocalOrderTx',
    'liveCreateCancelOrder',
    'liveFailureChecks',
];
const defaultTargets = new Set ([
    'fetchMarkets',
    'market',
    'fetchTicker',
    'fetchTickers',
    'fetchOrderBook',
    'fetchTrades',
    'fetchMyTrades',
    'fetchOHLCV',
    'fetchBalance',
    'fetchPositions',
    'fetchFundingRate',
    'fetchFundingRates',
    'fetchFundingHistory',
    'fetchTradingFee',
    'fetchOpenOrders',
    'fetchOrders',
]);
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
    if (selected.size === 0) {
        return defaultTargets.has (name);
    }
    return selected.has (name);
}

function print (name, value) {
    console.log ('\n' + name + ':');
    console.dir (value, { depth: null });
}

function env (name) {
    const value = process.env[name];
    assert (value !== undefined && value !== '', 'missing ' + name);
    return value;
}

function optionalTimestampEnv (name) {
    const value = process.env[name];
    if (value === undefined || value === '') {
        return undefined;
    }
    const timestamp = /^\d+$/.test (value) ? Number (value) : Date.parse (value);
    assert (Number.isFinite (timestamp), name + ' must be an ISO timestamp or millisecond timestamp');
    return timestamp;
}

function requireTradingEnabled () {
    assert (process.env.FIBE_ENABLE_TRADING === '1', 'set FIBE_ENABLE_TRADING=1 to run trading functions');
}

function requirePrivateKey () {
    assert (process.env.FIBE_PRIVATE_KEY !== undefined && process.env.FIBE_PRIVATE_KEY !== '', 'missing FIBE_PRIVATE_KEY');
}

function requireWalletAddress () {
    assert (process.env.FIBE_USER !== undefined && process.env.FIBE_USER !== '', 'missing FIBE_USER');
}

function sleep (ms) {
    return new Promise ((resolve) => setTimeout (resolve, ms));
}

function decimalPlacesFromPrecision (precision) {
    if (typeof precision !== 'number') {
        return 5;
    }
    const text = precision.toString ();
    const dot = text.indexOf ('.');
    if (dot < 0) {
        return 0;
    }
    return text.length - dot - 1;
}

function defaultOrderAmount (market) {
    const amountPrecision = market['precision']?.['amount'];
    const decimals = decimalPlacesFromPrecision (amountPrecision);
    return Number ((1 / Math.pow (10, decimals)).toFixed (decimals));
}

function nextOrderId () {
    return process.env.FIBE_ORDER_ID || String ((Date.now () * 1000) + Math.floor (Math.random () * 1000));
}

function orderMatchesId (order, orderId) {
    return order['id'] === orderId || order['clientOrderId'] === orderId || order['info']?.['oid'] === orderId;
}

function rpcSummary (requests) {
    const counts = {};
    const multipleAccountBatchSizes = [];
    for (const request of requests) {
        counts[request.method] = (counts[request.method] || 0) + 1;
        if (request.method === 'getMultipleAccounts') {
            multipleAccountBatchSizes.push (request.params[0].length);
        }
    }
    return {
        counts,
        multipleAccountBatchSizes,
    };
}

async function withRpcCapture (exchange, interceptSend, callback) {
    const originalRpc = exchange.solanaRpc.bind (exchange);
    const requests = [];
    exchange.solanaRpc = async (url, method, params) => {
        requests.push ({ url, method, params });
        if (interceptSend && method === 'sendTransaction') {
            return 'inspect-only-not-sent';
        }
        return originalRpc (url, method, params);
    };
    try {
        const value = await callback ();
        return { value, requests };
    } finally {
        exchange.solanaRpc = originalRpc;
    }
}

async function chooseRestingOrderInput (exchange, markets, symbol) {
    const market = markets[symbol];
    assert (market !== undefined, 'unknown symbol ' + symbol);
    const side = process.env.FIBE_SIDE || 'buy';
    assert (side === 'buy' || side === 'sell', 'FIBE_SIDE must be buy or sell');
    const amount = Number (process.env.FIBE_AMOUNT || defaultOrderAmount (market));
    assert (Number.isFinite (amount) && amount > 0, 'invalid order amount');
    if (process.env.FIBE_PRICE !== undefined) {
        return {
            symbol,
            side,
            amount,
            price: Number (process.env.FIBE_PRICE),
        };
    }
    const bpsAway = Number (process.env.FIBE_PRICE_AWAY_BPS || 1000);
    const orderBook = await exchange.fetchOrderBook (symbol, 1);
    const ticker = await exchange.fetchTicker (symbol);
    const bestBid = orderBook['bids'][0]?.[0];
    const bestAsk = orderBook['asks'][0]?.[0];
    let reference = undefined;
    if (side === 'buy') {
        reference = bestBid || bestAsk || ticker['last'] || ticker['close'];
    } else {
        reference = bestAsk || bestBid || ticker['last'] || ticker['close'];
    }
    assert (typeof reference === 'number' && Number.isFinite (reference) && reference > 0, 'could not derive reference price');
    const multiplier = (side === 'buy') ? (1 - (bpsAway / 10000)) : (1 + (bpsAway / 10000));
    const precisePrice = exchange.priceToPrecision (symbol, reference * multiplier);
    const price = Number (precisePrice);
    assert (Number.isFinite (price) && price > 0, 'derived invalid order price');
    return {
        symbol,
        side,
        amount,
        price,
        reference,
        bestBid,
        bestAsk,
        bpsAway,
    };
}

function localOrderParams (orderId, extra = {}) {
    const params = {
        orderId,
        timeInForce: process.env.FIBE_TIME_IN_FORCE || 'GTC',
        subAccountIndex: process.env.FIBE_SUB_ACCOUNT_INDEX === undefined ? undefined : Number (process.env.FIBE_SUB_ACCOUNT_INDEX),
        marginAccountKind: process.env.FIBE_MARGIN_ACCOUNT_KIND,
        initialLeverage: process.env.FIBE_INITIAL_LEVERAGE === undefined ? undefined : Number (process.env.FIBE_INITIAL_LEVERAGE),
        autoTopUpCollateralFromWallet: process.env.FIBE_AUTO_TOP_UP_COLLATERAL === '1',
        maxRetries: process.env.FIBE_MAX_RETRIES === undefined ? undefined : Number (process.env.FIBE_MAX_RETRIES),
        computeUnitLimit: process.env.FIBE_COMPUTE_UNIT_LIMIT === undefined ? undefined : Number (process.env.FIBE_COMPUTE_UNIT_LIMIT),
        computeUnitPriceMicroLamports: process.env.FIBE_COMPUTE_UNIT_PRICE_MICRO_LAMPORTS,
        ...extra,
    };
    if (process.env.FIBE_CREATE_ATA !== undefined) {
        params.createAssociatedTokenAccount = process.env.FIBE_CREATE_ATA !== '0';
    }
    return compactParams (params);
}

function localCancelParams (createdOrderInfo = {}, extra = {}) {
    return compactParams ({
        priceInTicks: createdOrderInfo['priceInTicks'],
        tickArray: createdOrderInfo['tickArray'],
        subAccountIndex: process.env.FIBE_SUB_ACCOUNT_INDEX === undefined ? undefined : Number (process.env.FIBE_SUB_ACCOUNT_INDEX),
        maxRetries: process.env.FIBE_MAX_RETRIES === undefined ? undefined : Number (process.env.FIBE_MAX_RETRIES),
        computeUnitLimit: process.env.FIBE_COMPUTE_UNIT_LIMIT === undefined ? undefined : Number (process.env.FIBE_COMPUTE_UNIT_LIMIT),
        computeUnitPriceMicroLamports: process.env.FIBE_COMPUTE_UNIT_PRICE_MICRO_LAMPORTS,
        ...extra,
    });
}

function compactParams (params) {
    const result = {};
    for (const [ key, value ] of Object.entries (params)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}

async function waitForSignature (exchange, signature) {
    if (signature === undefined || signature === 'inspect-only-not-sent') {
        return undefined;
    }
    const deadline = Date.now () + Number (process.env.FIBE_SIGNATURE_TIMEOUT_MS || 60000);
    while (Date.now () < deadline) {
        const status = await exchange.solanaRpc (exchange.options['rpcUrl'], 'getSignatureStatuses', [
            [ signature ],
            { searchTransactionHistory: true },
        ]);
        const value = status['value']?.[0];
        if (value !== null && value !== undefined) {
            if (value['err'] !== null) {
                throw new Error ('transaction failed: ' + JSON.stringify (value['err']));
            }
            if (value['confirmationStatus'] === 'confirmed' || value['confirmationStatus'] === 'finalized') {
                return value;
            }
        }
        await sleep (2000);
    }
    throw new Error ('signature was not confirmed before timeout: ' + signature);
}

async function waitForOrderPresence (exchange, symbol, user, orderId, expectedPresent) {
    const deadline = Date.now () + Number (process.env.FIBE_INDEXER_TIMEOUT_MS || 90000);
    let lastOpenOrders = [];
    while (Date.now () < deadline) {
        lastOpenOrders = await exchange.fetchOpenOrders (symbol, undefined, 50, { user });
        const found = lastOpenOrders.some ((order) => orderMatchesId (order, orderId));
        if (found === expectedPresent) {
            return lastOpenOrders;
        }
        await sleep (3000);
    }
    throw new Error ('order ' + orderId + (expectedPresent ? ' did not appear in open orders' : ' stayed in open orders'));
}

async function expectFailure (name, callback) {
    try {
        await callback ();
    } catch (e) {
        print (name, {
            ok: true,
            message: e.message,
        });
        return;
    }
    throw new Error (name + ' unexpectedly succeeded');
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

    if (shouldRun ('fetchFundingRate')) {
        const swapSymbols = symbols.filter ((symbol) => markets[symbol]['swap']);
        const fundingSym = process.env.FIBE_SYMBOL || swapSymbols[0];
        assert (fundingSym !== undefined, 'expected at least one swap market');
        assert (markets[fundingSym] !== undefined, 'unknown symbol ' + fundingSym);
        assert (markets[fundingSym]['swap'], 'funding rate symbol must be a swap market');
        const fundingRate = await fibe.fetchFundingRate (fundingSym);
        assert (fundingRate['symbol'] === fundingSym, 'funding rate symbol mismatch');
        assert (typeof fundingRate['fundingRate'] === 'number', 'expected numeric funding rate');
        print ('fetchFundingRate', fundingRate);
    }

    if (shouldRun ('fetchFundingRates')) {
        const swapSymbols = symbols.filter ((symbol) => markets[symbol]['swap']);
        const fundingSymbols = (process.env.FIBE_SYMBOL === undefined) ? undefined : [ process.env.FIBE_SYMBOL ];
        const expectedSymbols = fundingSymbols || swapSymbols;
        const fundingRates = await fibe.fetchFundingRates (fundingSymbols);
        assert (Object.keys (fundingRates).length === expectedSymbols.length, 'funding rates count mismatch');
        assert (expectedSymbols.every ((symbol) => fundingRates[symbol] !== undefined), 'missing funding rate symbol');
        assert (expectedSymbols.every ((symbol) => typeof fundingRates[symbol]['fundingRate'] === 'number'), 'expected numeric funding rates');
        print ('fetchFundingRates', fundingRates);
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

    // Live candles can be sparse, so use a wider window and let CCXT trim to 3.
    const until = Date.now ();
    const since = until - 24 * 60 * 60 * 1000;
    if (shouldRun ('fetchOHLCV')) {
        const ohlcv = await fibe.fetchOHLCV (sym, '1m', since, 3, { until });
        assert (ohlcv.length > 0, 'expected candles');
        assert (ohlcv.length <= 3, 'OHLCV limit failed');
        print ('fetchOHLCV', ohlcv);
    }

    const user = process.env.FIBE_USER || '11111111111111111111111111111111';
    if (shouldRun ('fetchMyTrades')) {
        const myTradesSince = optionalTimestampEnv ('FIBE_SINCE');
        const myTradesUntil = optionalTimestampEnv ('FIBE_UNTIL');
        const myTradesLimit = process.env.FIBE_LIMIT === undefined ? 3 : Number (process.env.FIBE_LIMIT);
        assert (Number.isInteger (myTradesLimit) && myTradesLimit > 0, 'FIBE_LIMIT must be a positive integer');
        const myTrades = await fibe.fetchMyTrades (process.env.FIBE_SYMBOL, myTradesSince, myTradesLimit, { user, until: myTradesUntil });
        assert (Array.isArray (myTrades), 'expected my trades array');
        assert (myTrades.length <= myTradesLimit, 'my trades limit failed');
        if (process.env.FIBE_SYMBOL !== undefined) {
            assert (myTrades.every ((trade) => trade['symbol'] === sym), 'my trade symbol mismatch');
        }
        assert (myTrades.every ((trade) => (trade['takerOrMaker'] === undefined) || (trade['takerOrMaker'] === 'taker') || (trade['takerOrMaker'] === 'maker')), 'unexpected takerOrMaker value');
        print ('fetchMyTrades', myTrades);
    }

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

    if (shouldRun ('fetchOrder')) {
        const fetchOrderSymbol = process.env.FIBE_SYMBOL || sym;
        assert (markets[fetchOrderSymbol] !== undefined, 'unknown symbol ' + fetchOrderSymbol);
        const order = await fibe.fetchOrder (env ('FIBE_ORDER_ID'), fetchOrderSymbol, { user });
        assert (order['id'] === process.env.FIBE_ORDER_ID, 'fetchOrder id mismatch');
        print ('fetchOrder', order);
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

    if (shouldRun ('fetchClosedOrders')) {
        const orders = await fibe.fetchClosedOrders (process.env.FIBE_SYMBOL, undefined, 2, { user });
        assert (Array.isArray (orders), 'expected closed orders array');
        assert (orders.length <= 2, 'closed orders limit failed');
        assert (orders.every ((order) => order['status'] === 'closed'), 'closed order status mismatch');
        print ('fetchClosedOrders', orders);
    }

    if (shouldRun ('fetchCanceledOrders')) {
        const orders = await fibe.fetchCanceledOrders (process.env.FIBE_SYMBOL, undefined, 2, { user });
        assert (Array.isArray (orders), 'expected canceled orders array');
        assert (orders.length <= 2, 'canceled orders limit failed');
        assert (orders.every ((order) => order['status'] === 'canceled'), 'canceled order status mismatch');
        print ('fetchCanceledOrders', orders);
    }

    if (shouldRun ('createOrder')) {
        requireTradingEnabled ();
        const tradingSymbol = process.env.FIBE_SYMBOL || sym;
        assert (markets[tradingSymbol] !== undefined, 'unknown symbol ' + tradingSymbol);
        const order = await fibe.createOrder (
            tradingSymbol,
            'limit',
            process.env.FIBE_SIDE || 'buy',
            Number (env ('FIBE_AMOUNT')),
            Number (env ('FIBE_PRICE')),
            {
                orderId: process.env.FIBE_ORDER_ID,
                timeInForce: process.env.FIBE_TIME_IN_FORCE || 'GTC',
            }
        );
        print ('createOrder', order);
    }

    if (shouldRun ('cancelOrder')) {
        requireTradingEnabled ();
        const tradingSymbol = process.env.FIBE_SYMBOL || sym;
        assert (markets[tradingSymbol] !== undefined, 'unknown symbol ' + tradingSymbol);
        const order = await fibe.cancelOrder (env ('FIBE_ORDER_ID'), tradingSymbol);
        print ('cancelOrder', order);
    }

    if (shouldRun ('cancelOrders')) {
        requireTradingEnabled ();
        const tradingSymbol = process.env.FIBE_SYMBOL || sym;
        assert (markets[tradingSymbol] !== undefined, 'unknown symbol ' + tradingSymbol);
        const orderIds = env ('FIBE_ORDER_IDS').split (',').map ((id) => id.trim ()).filter ((id) => id.length > 0);
        assert (orderIds.length > 0, 'expected FIBE_ORDER_IDS');
        const orders = await fibe.cancelOrders (orderIds, tradingSymbol);
        print ('cancelOrders', orders);
    }

    if (shouldRun ('cancelAllOrders')) {
        requireTradingEnabled ();
        const tradingSymbol = process.env.FIBE_SYMBOL || sym;
        assert (markets[tradingSymbol] !== undefined, 'unknown symbol ' + tradingSymbol);
        const orders = await fibe.cancelAllOrders (tradingSymbol);
        print ('cancelAllOrders', orders);
    }

    if (shouldRun ('inspectLocalOrderTx')) {
        requireWalletAddress ();
        requirePrivateKey ();
        const tradingSymbol = process.env.FIBE_SYMBOL || symbols.find ((symbol) => markets[symbol]['spot']) || sym;
        const input = await chooseRestingOrderInput (fibe, markets, tradingSymbol);
        const orderId = nextOrderId ();
        const { value: order, requests } = await withRpcCapture (fibe, true, () => fibe.createOrder (
            input.symbol,
            'limit',
            input.side,
            input.amount,
            input.price,
            localOrderParams (orderId)
        ));
        const info = order['info'];
        print ('inspectLocalOrderTx', {
            orderInput: input,
            orderId,
            priceInTicks: info['priceInTicks'],
            orderPda: info['orderPda'],
            tickArray: info['tickArray'],
            tickArrays: info['tickArrays'],
            transactionBytes: Buffer.from (info['transaction'], 'base64').length,
            rpc: rpcSummary (requests),
            interceptedSignature: info['signature'],
        });
    }

    if (shouldRun ('liveCreateCancelOrder')) {
        requireTradingEnabled ();
        requireWalletAddress ();
        requirePrivateKey ();
        const tradingSymbol = process.env.FIBE_SYMBOL || symbols.find ((symbol) => markets[symbol]['spot']) || sym;
        const userAddress = env ('FIBE_USER');
        const input = await chooseRestingOrderInput (fibe, markets, tradingSymbol);
        const orderId = nextOrderId ();
        const createOrder = await fibe.createOrder (
            input.symbol,
            'limit',
            input.side,
            input.amount,
            input.price,
            localOrderParams (orderId)
        );
        print ('liveCreateCancelOrder.createOrder', createOrder);
        const createStatus = await waitForSignature (fibe, createOrder['info']['signature']);
        print ('liveCreateCancelOrder.createSignatureStatus', createStatus);
        const openOrdersAfterCreate = await waitForOrderPresence (fibe, input.symbol, userAddress, orderId, true);
        print ('liveCreateCancelOrder.openOrdersAfterCreate', openOrdersAfterCreate.filter ((order) => orderMatchesId (order, orderId)));

        const cancelOrder = await fibe.cancelOrder (
            orderId,
            input.symbol,
            localCancelParams (createOrder['info'])
        );
        print ('liveCreateCancelOrder.cancelOrder', cancelOrder);
        const cancelStatus = await waitForSignature (fibe, cancelOrder['info']['signature']);
        print ('liveCreateCancelOrder.cancelSignatureStatus', cancelStatus);
        const openOrdersAfterCancel = await waitForOrderPresence (fibe, input.symbol, userAddress, orderId, false);
        print ('liveCreateCancelOrder.openOrdersAfterCancel', openOrdersAfterCancel.filter ((order) => orderMatchesId (order, orderId)));
        const canceledOrders = await fibe.fetchCanceledOrders (input.symbol, undefined, 50, { user: userAddress });
        const canceledOrder = canceledOrders.find ((order) => orderMatchesId (order, orderId));
        assert (canceledOrder !== undefined, 'canceled order missing from fetchCanceledOrders');
        assert (canceledOrder['status'] === 'canceled', 'fetchCanceledOrders status mismatch');
        print ('liveCreateCancelOrder.fetchCanceledOrders', [ canceledOrder ]);
        const fetchedOrder = await fibe.fetchOrder (orderId, input.symbol, { user: userAddress });
        assert (fetchedOrder['status'] === 'canceled', 'fetchOrder canceled status mismatch');
        print ('liveCreateCancelOrder.fetchOrderAfterCancel', fetchedOrder);
        const historicalOrders = await fibe.fetchOrders (input.symbol, undefined, 10, { user: userAddress });
        const historicalOrder = historicalOrders.find ((order) => orderMatchesId (order, orderId));
        assert (historicalOrder !== undefined, 'canceled order missing from fetchOrders');
        assert (historicalOrder['status'] === 'canceled', 'fetchOrders canceled status mismatch');
        print ('liveCreateCancelOrder.historicalOrder', [ historicalOrder ]);
    }

    if (shouldRun ('liveFailureChecks')) {
        requireTradingEnabled ();
        requireWalletAddress ();
        requirePrivateKey ();
        const tradingSymbol = process.env.FIBE_SYMBOL || symbols.find ((symbol) => markets[symbol]['spot']) || sym;
        const input = await chooseRestingOrderInput (fibe, markets, tradingSymbol);
        await expectFailure ('liveFailureChecks.badRpcUrl', () => fibe.createOrder (
            input.symbol,
            'limit',
            input.side,
            input.amount,
            input.price,
            localOrderParams (nextOrderId (), { rpcUrl: 'http://127.0.0.1:9' })
        ));
        await expectFailure ('liveFailureChecks.badPrivateKey', () => fibe.createOrder (
            input.symbol,
            'limit',
            input.side,
            input.amount,
            input.price,
            localOrderParams (nextOrderId (), { privateKey: '0x' + '01'.repeat (32) })
        ));
        await expectFailure ('liveFailureChecks.staleBlockhash', () => fibe.createOrder (
            input.symbol,
            'limit',
            input.side,
            input.amount,
            input.price,
            localOrderParams (nextOrderId (), { blockhash: '11111111111111111111111111111111' })
        ));
        await expectFailure ('liveFailureChecks.badTickArray', () => fibe.createOrder (
            input.symbol,
            'limit',
            input.side,
            input.amount,
            input.price,
            localOrderParams (nextOrderId (), { tickArrays: [ '11111111111111111111111111111111' ] })
        ));
    }
}

main ().catch ((e) => { console.error (e); process.exit (1); });
