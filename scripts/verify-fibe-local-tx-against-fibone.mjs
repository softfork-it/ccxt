import assert from 'node:assert/strict';

import fibe from '../js/src/fibe.js';

// Live verifier for the local Solana transaction builder.
//
// Required:
//   FIBE_USER=... FIBE_PRIVATE_KEY=... node scripts/verify-fibe-local-tx-against-fibone.mjs
//
// Optional:
//   FIBE_SPOT_SYMBOL=ETH/USDC
//   FIBE_PERP_SYMBOL=ETH/USDC:USDC
//   FIBE_SPOT_CANCEL_ORDER_ID=...   # enables spot cancelOrder parity when no open order is discoverable
//   FIBE_PERP_CANCEL_ORDER_ID=...   # enables perp cancelOrder parity when no open order is discoverable
//   FIBE_SUBMIT_LIVE=1              # submits one small resting spot order and cancels it
//
// The comparison ignores signatures and recent blockhash, and requires the compiled
// unsigned message to match Fibone's build endpoint otherwise.

const nativeSolMint = 'So11111111111111111111111111111111111111112';
const defaultRpcUrl = 'https://api.devnet.solana.com';

function env (name, fallback = undefined) {
    const value = process.env[name];
    if (value === undefined || value === '') {
        return fallback;
    }
    return value;
}

function requiredEnv (name) {
    const value = env (name);
    assert.ok (value, `missing ${name}`);
    return value;
}

function boolEnv (name, fallback = false) {
    const value = env (name);
    if (value === undefined) {
        return fallback;
    }
    return value === '1' || value.toLowerCase () === 'true';
}

function numberEnv (name, fallback = undefined) {
    const value = env (name);
    if (value === undefined) {
        return fallback;
    }
    const result = Number (value);
    assert.ok (Number.isFinite (result), `${name} must be numeric`);
    return result;
}

function compact (value) {
    const result = {};
    for (const [ key, entry ] of Object.entries (value)) {
        if (entry !== undefined) {
            result[key] = entry;
        }
    }
    return result;
}

function sleep (ms) {
    return new Promise ((resolve) => setTimeout (resolve, ms));
}

let orderIdCounter = 0;
function nextOrderId () {
    const configured = env ('FIBE_ORDER_ID');
    if (configured !== undefined) {
        orderIdCounter += 1;
        if (orderIdCounter === 1) {
            return configured;
        }
    }
    orderIdCounter += 1;
    return String ((Date.now () * 1000) + (orderIdCounter % 1000));
}

function orderMatchesId (order, orderId) {
    return order.id === orderId || order.clientOrderId === orderId || order.info?.oid === orderId;
}

function sideToFibe (side) {
    return side === 'buy' ? 'B' : 'A';
}

function timeInForceToFibe (timeInForce) {
    const value = String (timeInForce ?? 'GTC').toUpperCase ();
    const mapping = {
        GTC: 'GTC',
        IOC: 'IOC',
        FOK: 'FOK',
        PO: 'ALO',
        ALO: 'ALO',
    };
    const result = mapping[value];
    assert.ok (result, `unsupported timeInForce ${timeInForce}`);
    return result;
}

function marginModeToFibone (marginMode) {
    const value = String (marginMode ?? 'cross').toLowerCase ();
    if (value === 'cross') {
        return 'cross';
    }
    if (value === 'isolated') {
        return 'isolated';
    }
    throw new Error (`unsupported marginMode ${marginMode}`);
}

function isSwapSymbol (exchange, symbol) {
    return Boolean (exchange.market (symbol).swap);
}

function readShortVec (bytes, cursor) {
    let value = 0;
    let shift = 0;
    for (;;) {
        const byte = bytes[cursor.offset];
        cursor.offset += 1;
        value |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) {
            return value;
        }
        shift += 7;
    }
}

function normalizeTransaction (transaction) {
    const bytes = Buffer.from (transaction, 'base64');
    const cursor = { offset: 0 };
    const signatureCount = readShortVec (bytes, cursor);
    assert.ok (signatureCount > 0, 'transaction should include signature slots');
    const signatureOffset = cursor.offset;
    const signatures = [];
    for (let i = 0; i < signatureCount; i++) {
        signatures.push (bytes.subarray (cursor.offset, cursor.offset + 64).toString ('hex'));
        cursor.offset += 64;
    }
    const version = bytes[cursor.offset];
    cursor.offset += 1;
    assert.equal (version, 0x80, 'expected a v0 Solana transaction message');
    cursor.offset += 3; // message header
    const accountCount = readShortVec (bytes, cursor);
    cursor.offset += accountCount * 32;
    const blockhashOffset = cursor.offset;
    assert.ok ((blockhashOffset + 32) <= bytes.length, 'transaction is missing a recent blockhash');
    bytes.fill (0, signatureOffset, signatureOffset + (signatureCount * 64));
    bytes.fill (0, blockhashOffset, blockhashOffset + 32);
    return {
        signatures,
        bytes,
        accountCount,
    };
}

function assertTransactionsMatch (localTransaction, fiboneTransaction, name) {
    const local = normalizeTransaction (localTransaction);
    const fibone = normalizeTransaction (fiboneTransaction);
    assert.ok (local.signatures.some ((signature) => signature !== '00'.repeat (64)), `${name} local transaction should be signed`);
    assert.ok (fibone.signatures.every ((signature) => signature === '00'.repeat (64)), `${name} Fibone transaction should be unsigned`);
    assert.equal (local.accountCount, fibone.accountCount, `${name} account count differs from Fibone`);
    assert.equal (local.bytes.length, fibone.bytes.length, `${name} transaction length differs from Fibone`);
    assert.deepEqual (local.bytes, fibone.bytes, `${name} must match Fibone except signatures and recent blockhash`);
    return {
        accountCount: local.accountCount,
        transactionBytes: local.bytes.length,
    };
}

async function postJson (url, body) {
    const response = await fetch (url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify (body),
    });
    const text = await response.text ();
    if (!response.ok) {
        throw new Error (`${url} returned ${response.status}: ${text}`);
    }
    return JSON.parse (text);
}

async function withSendCapture (exchange, callback) {
    const originalRpc = exchange.solanaRpc.bind (exchange);
    const sendTransactions = [];
    exchange.solanaRpc = async (url, method, params) => {
        if (method === 'sendTransaction') {
            sendTransactions.push (params[0]);
            return 'verify-local-not-sent';
        }
        return originalRpc (url, method, params);
    };
    try {
        const value = await callback ();
        assert.equal (sendTransactions.length, 1, 'expected exactly one local sendTransaction call');
        return { value, transaction: sendTransactions[0] };
    } finally {
        exchange.solanaRpc = originalRpc;
    }
}

function selectDefaultSymbol (markets, wantSwap) {
    for (const market of Object.values (markets)) {
        const info = market.info ?? {};
        if (Boolean (market.swap) !== wantSwap) {
            continue;
        }
        if (info.baseMint === nativeSolMint || info.quoteMint === nativeSolMint) {
            continue;
        }
        return market.symbol;
    }
    throw new Error (`could not find a ${wantSwap ? 'perp' : 'spot'} market without native SOL`);
}

async function chooseReferencePrice (exchange, symbol) {
    const configured = numberEnv ('FIBE_PRICE');
    if (configured !== undefined) {
        return configured;
    }
    const ticker = await exchange.fetchTicker (symbol);
    const reference = ticker.bid ?? ticker.ask ?? ticker.last ?? ticker.close;
    assert.ok (typeof reference === 'number' && Number.isFinite (reference) && reference > 0, `could not derive price for ${symbol}`);
    return Number (exchange.priceToPrecision (symbol, reference));
}

async function chooseRestingPrice (exchange, symbol, side, bpsAway) {
    const configured = numberEnv ('FIBE_PRICE');
    if (configured !== undefined) {
        return configured;
    }
    const orderBook = await exchange.fetchOrderBook (symbol, 1);
    const ticker = await exchange.fetchTicker (symbol);
    const bestBid = orderBook.bids[0]?.[0];
    const bestAsk = orderBook.asks[0]?.[0];
    let reference = undefined;
    if (side === 'buy') {
        reference = bestBid ?? bestAsk ?? ticker.last ?? ticker.close;
    } else {
        reference = bestAsk ?? bestBid ?? ticker.last ?? ticker.close;
    }
    assert.ok (typeof reference === 'number' && Number.isFinite (reference) && reference > 0, `could not derive resting price for ${symbol}`);
    const multiplier = side === 'buy' ? (1 - (bpsAway / 10000)) : (1 + (bpsAway / 10000));
    return Number (exchange.priceToPrecision (symbol, reference * multiplier));
}

function chooseAmount (market) {
    const configured = numberEnv ('FIBE_AMOUNT');
    if (configured !== undefined) {
        return configured;
    }
    return market.limits?.amount?.min ?? 0.00001;
}

function createOrderScenarios (spotSymbol, perpSymbol) {
    const slippage = numberEnv ('FIBE_SLIPPAGE', 0.05);
    const subAccountIndex = numberEnv ('FIBE_SUB_ACCOUNT_INDEX', 0);
    const initialLeverage = numberEnv ('FIBE_INITIAL_LEVERAGE', 5);
    return [
        {
            name: 'spot limit buy GTC',
            symbol: spotSymbol,
            orderType: 'limit',
            side: 'buy',
            timeInForce: 'GTC',
            priceMode: 'resting',
            computeUnitLimit: 300000,
            computeUnitPriceMicroLamports: 1000,
        },
        {
            name: 'spot market buy IOC',
            symbol: spotSymbol,
            orderType: 'market',
            side: 'buy',
            timeInForce: 'IOC',
            priceMode: 'reference',
            slippage,
            computeUnitLimit: 300000,
            computeUnitPriceMicroLamports: 1000,
        },
        {
            name: 'spot market sell IOC',
            symbol: spotSymbol,
            orderType: 'market',
            side: 'sell',
            timeInForce: 'IOC',
            priceMode: 'reference',
            slippage,
            computeUnitLimit: 300000,
            computeUnitPriceMicroLamports: 1000,
        },
        {
            name: 'perp limit sell FOK isolated',
            symbol: perpSymbol,
            orderType: 'limit',
            side: 'sell',
            timeInForce: 'FOK',
            priceMode: 'resting',
            subAccountIndex,
            marginMode: env ('FIBE_MARGIN_MODE', 'isolated'),
            initialLeverage,
            autoTopUpCollateralFromWallet: boolEnv ('FIBE_AUTO_TOP_UP_COLLATERAL', true),
            computeUnitLimit: 400000,
        },
    ];
}

async function scenarioPrice (exchange, scenario) {
    if (scenario.price !== undefined) {
        return scenario.price;
    }
    if (scenario.priceMode === 'reference') {
        return chooseReferencePrice (exchange, scenario.symbol);
    }
    if (scenario.priceMode === 'resting') {
        const bpsAway = numberEnv ('FIBE_PRICE_AWAY_BPS', 1000);
        return chooseRestingPrice (exchange, scenario.symbol, scenario.side, bpsAway);
    }
    return undefined;
}

async function assertCreateOrderMatchesFibone (exchange, fiboneUrl, scenario) {
    const symbol = scenario.symbol;
    const market = exchange.market (symbol);
    const side = env ('FIBE_SIDE', scenario.side);
    assert.ok (side === 'buy' || side === 'sell', 'FIBE_SIDE must be buy or sell');
    const amount = scenario.amount ?? chooseAmount (market);
    const price = await scenarioPrice (exchange, { ...scenario, side });
    const orderId = scenario.orderId ?? nextOrderId ();
    const orderType = scenario.orderType;
    const timeInForce = env ('FIBE_TIME_IN_FORCE', scenario.timeInForce);
    const slippage = scenario.slippage;
    const subAccountIndex = scenario.subAccountIndex ?? numberEnv ('FIBE_SUB_ACCOUNT_INDEX', 0);
    const marginMode = scenario.marginMode ?? env ('FIBE_MARGIN_MODE', 'cross');
    const initialLeverage = scenario.initialLeverage;
    const autoTopUpCollateralFromWallet = scenario.autoTopUpCollateralFromWallet ?? boolEnv ('FIBE_AUTO_TOP_UP_COLLATERAL', true);
    const computeUnitLimit = numberEnv ('FIBE_COMPUTE_UNIT_LIMIT', scenario.computeUnitLimit);
    const computeUnitPriceMicroLamports = numberEnv ('FIBE_COMPUTE_UNIT_PRICE_MICRO_LAMPORTS', scenario.computeUnitPriceMicroLamports);
    const localParams = compact ({
        rpcUrl: exchange.options.rpcUrl,
        orderId,
        timeInForce,
        slippage,
        subAccountIndex: market.swap ? subAccountIndex : undefined,
        marginMode: market.swap ? marginMode : undefined,
        initialLeverage: market.swap ? initialLeverage : undefined,
        autoTopUpCollateralFromWallet: market.swap ? autoTopUpCollateralFromWallet : undefined,
        computeUnitLimit,
        computeUnitPriceMicroLamports,
    });
    const { transaction: localTransaction } = await withSendCapture (exchange, () => exchange.createOrder (
        symbol,
        orderType,
        side,
        amount,
        price,
        localParams,
    ));
    const request = compact ({
        owner: exchange.walletAddress,
        mt: market.info.mt,
        mi: market.info.mi,
        orderId,
        side: sideToFibe (side),
        price,
        slippage,
        baseQuantity: amount,
        timeInForce: timeInForceToFibe (timeInForce),
        subAccountIndex: market.swap ? subAccountIndex : undefined,
        marginMode: market.swap ? marginModeToFibone (marginMode) : undefined,
        autoTopUpCollateralFromWallet: market.swap ? autoTopUpCollateralFromWallet : undefined,
        initialLeverage: market.swap ? initialLeverage : undefined,
        computeUnitLimit,
        computeUnitPriceMicroLamports,
    });
    const built = await postJson (`${fiboneUrl}/build-create-order-tx`, request);
    assert.equal (built.encoding, 'base64');
    assert.equal (built.orderId, orderId);
    const comparison = assertTransactionsMatch (localTransaction, built.transaction, scenario.name);
    console.log (`ok ${scenario.name}`, {
        request,
        comparison,
    });
}

function configuredCancelOrderId (market) {
    const marketSpecific = env (market.swap ? 'FIBE_PERP_CANCEL_ORDER_ID' : 'FIBE_SPOT_CANCEL_ORDER_ID');
    return marketSpecific ?? env ('FIBE_CANCEL_ORDER_ID');
}

async function findCancelOrderInput (exchange, symbol, options = {}) {
    const market = exchange.market (symbol);
    const configuredOrderId = options.orderId ?? configuredCancelOrderId (market);
    if (configuredOrderId !== undefined) {
        return {
            orderId: configuredOrderId,
            symbol,
        };
    }
    const openOrders = await exchange.fetchOpenOrders (symbol, undefined, 20, { user: exchange.walletAddress });
    if (openOrders.length === 0) {
        return undefined;
    }
    return {
        orderId: openOrders[0].id,
        symbol: openOrders[0].symbol ?? symbol,
    };
}

async function assertCancelOrderMatchesFibone (exchange, fiboneUrl, symbol, options = {}) {
    const cancelInput = await findCancelOrderInput (exchange, symbol, options);
    if (cancelInput === undefined) {
        console.log (`skip cancelOrder ${symbol}: no open order found; set FIBE_SPOT_CANCEL_ORDER_ID/FIBE_PERP_CANCEL_ORDER_ID to force this check`);
        return;
    }
    const market = exchange.market (cancelInput.symbol);
    const subAccountIndex = options.subAccountIndex ?? numberEnv ('FIBE_SUB_ACCOUNT_INDEX', 0);
    const computeUnitLimit = options.computeUnitLimit ?? numberEnv ('FIBE_COMPUTE_UNIT_LIMIT');
    const computeUnitPriceMicroLamports = options.computeUnitPriceMicroLamports ?? numberEnv ('FIBE_COMPUTE_UNIT_PRICE_MICRO_LAMPORTS');
    const localParams = compact ({
        rpcUrl: exchange.options.rpcUrl,
        subAccountIndex: market.swap ? subAccountIndex : undefined,
        computeUnitLimit,
        computeUnitPriceMicroLamports,
    });
    const { transaction: localTransaction } = await withSendCapture (exchange, () => exchange.cancelOrder (
        cancelInput.orderId,
        cancelInput.symbol,
        localParams,
    ));
    const request = compact ({
        owner: exchange.walletAddress,
        mt: market.info.mt,
        mi: market.info.mi,
        orderId: cancelInput.orderId,
        subAccountIndex: market.swap ? subAccountIndex : undefined,
        computeUnitLimit,
        computeUnitPriceMicroLamports,
    });
    const built = await postJson (`${fiboneUrl}/build-cancel-order-tx`, request);
    assert.equal (built.encoding, 'base64');
    assert.equal (built.orderId, cancelInput.orderId);
    const comparison = assertTransactionsMatch (localTransaction, built.transaction, `cancelOrder ${cancelInput.symbol}`);
    console.log (`ok cancelOrder ${cancelInput.symbol}`, {
        request,
        comparison,
    });
    return cancelInput;
}

async function waitForSignature (exchange, signature) {
    const deadline = Date.now () + numberEnv ('FIBE_SIGNATURE_TIMEOUT_MS', 60000);
    while (Date.now () < deadline) {
        const status = await exchange.solanaRpc (exchange.options.rpcUrl, 'getSignatureStatuses', [
            [ signature ],
            { searchTransactionHistory: true },
        ]);
        const value = status.value?.[0];
        if (value !== null && value !== undefined) {
            if (value.err !== null) {
                throw new Error (`transaction failed: ${JSON.stringify (value.err)}`);
            }
            if (value.confirmationStatus === 'confirmed' || value.confirmationStatus === 'finalized') {
                return value;
            }
        }
        await sleep (2000);
    }
    throw new Error (`signature was not confirmed before timeout: ${signature}`);
}

async function waitForOrderPresence (exchange, symbol, user, orderId, expectedPresent) {
    const deadline = Date.now () + numberEnv ('FIBE_INDEXER_TIMEOUT_MS', 90000);
    let lastOpenOrders = [];
    while (Date.now () < deadline) {
        lastOpenOrders = await exchange.fetchOpenOrders (symbol, undefined, 50, { user });
        const found = lastOpenOrders.some ((order) => orderMatchesId (order, orderId));
        if (found === expectedPresent) {
            return lastOpenOrders;
        }
        await sleep (3000);
    }
    throw new Error (`order ${orderId}${expectedPresent ? ' did not appear in open orders' : ' stayed in open orders'}`);
}

async function assertLiveCreateCancel (exchange, fiboneUrl, symbol) {
    const market = exchange.market (symbol);
    assert.equal (market.spot, true, 'live submit check only submits spot orders');
    const side = env ('FIBE_LIVE_SIDE', 'buy');
    assert.ok (side === 'buy' || side === 'sell', 'FIBE_LIVE_SIDE must be buy or sell');
    const orderId = nextOrderId ();
    const amount = numberEnv ('FIBE_LIVE_AMOUNT', chooseAmount (market));
    const price = numberEnv ('FIBE_LIVE_PRICE') ?? await chooseRestingPrice (exchange, symbol, side, numberEnv ('FIBE_LIVE_PRICE_AWAY_BPS', 1000));
    const scenario = {
        name: 'live spot limit create parity before submit',
        symbol,
        orderType: 'limit',
        side,
        timeInForce: 'GTC',
        amount,
        price,
        orderId,
        computeUnitLimit: numberEnv ('FIBE_LIVE_COMPUTE_UNIT_LIMIT', 300000),
        computeUnitPriceMicroLamports: numberEnv ('FIBE_LIVE_COMPUTE_UNIT_PRICE_MICRO_LAMPORTS', 1000),
    };
    await assertCreateOrderMatchesFibone (exchange, fiboneUrl, scenario);
    const params = compact ({
        rpcUrl: exchange.options.rpcUrl,
        orderId,
        timeInForce: 'GTC',
        computeUnitLimit: scenario.computeUnitLimit,
        computeUnitPriceMicroLamports: scenario.computeUnitPriceMicroLamports,
    });
    const createOrder = await exchange.createOrder (symbol, 'limit', side, amount, price, params);
    await waitForSignature (exchange, createOrder.info.signature);
    const openOrdersAfterCreate = await waitForOrderPresence (exchange, symbol, exchange.walletAddress, orderId, true);
    const createdOrders = openOrdersAfterCreate.filter ((order) => orderMatchesId (order, orderId));
    assert.ok (createdOrders.length > 0, 'created order not found after confirmation');
    await assertCancelOrderMatchesFibone (exchange, fiboneUrl, symbol, {
        orderId,
        computeUnitLimit: scenario.computeUnitLimit,
        computeUnitPriceMicroLamports: scenario.computeUnitPriceMicroLamports,
    });
    const cancelOrder = await exchange.cancelOrder (orderId, symbol, {
        rpcUrl: exchange.options.rpcUrl,
        computeUnitLimit: scenario.computeUnitLimit,
        computeUnitPriceMicroLamports: scenario.computeUnitPriceMicroLamports,
    });
    await waitForSignature (exchange, cancelOrder.info.signature);
    await waitForOrderPresence (exchange, symbol, exchange.walletAddress, orderId, false);
    console.log ('ok live create/cancel submit', {
        symbol,
        orderId,
        side,
        amount,
        price,
        createSignature: createOrder.info.signature,
        cancelSignature: cancelOrder.info.signature,
    });
}

async function main () {
    const walletAddress = requiredEnv ('FIBE_USER');
    const privateKey = requiredEnv ('FIBE_PRIVATE_KEY');
    const exchange = new fibe ({
        timeout: Number (env ('FIBE_TIMEOUT_MS', '30000')),
        walletAddress,
        privateKey,
        options: {
            rpcUrl: env ('FIBE_RPC_URL', defaultRpcUrl),
        },
    });
    const markets = await exchange.loadMarkets ();
    const fiboneUrl = env ('FIBE_FIBONE_URL', exchange.urls.api.rest).replace (/\/$/, '');
    const spotSymbol = env ('FIBE_SPOT_SYMBOL', env ('FIBE_SYMBOL', selectDefaultSymbol (markets, false)));
    const perpSymbol = env ('FIBE_PERP_SYMBOL', selectDefaultSymbol (markets, true));
    assert.ok (markets[spotSymbol] !== undefined && !isSwapSymbol (exchange, spotSymbol), `unknown spot symbol ${spotSymbol}`);
    assert.ok (markets[perpSymbol] !== undefined && isSwapSymbol (exchange, perpSymbol), `unknown perp symbol ${perpSymbol}`);
    const scenarios = createOrderScenarios (spotSymbol, perpSymbol);
    for (const scenario of scenarios) {
        await assertCreateOrderMatchesFibone (exchange, fiboneUrl, scenario);
    }
    await assertCancelOrderMatchesFibone (exchange, fiboneUrl, spotSymbol, {
        computeUnitLimit: 300000,
        computeUnitPriceMicroLamports: 1000,
    });
    await assertCancelOrderMatchesFibone (exchange, fiboneUrl, perpSymbol, {
        subAccountIndex: numberEnv ('FIBE_SUB_ACCOUNT_INDEX', 0),
        computeUnitLimit: 400000,
    });
    if (boolEnv ('FIBE_SUBMIT_LIVE')) {
        await assertLiveCreateCancel (exchange, fiboneUrl, spotSymbol);
    } else {
        console.log ('skip live create/cancel submit: set FIBE_SUBMIT_LIVE=1 to send one real order and cancel it');
    }
}

await main ();
