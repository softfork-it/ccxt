//  ---------------------------------------------------------------------------

import fibeRest from '../fibe.js';
import { ExchangeError } from '../base/errors.js';
import Client from '../base/ws/Client.js';
import { ArrayCache, ArrayCacheByTimestamp } from '../base/ws/Cache.js';
import type { Balances, Bool, Dict, Int, MarketInterface, OHLCV, Order, OrderBook, Position, Str, Strings, Ticker, Trade } from '../base/types.js';

//  ---------------------------------------------------------------------------

export default class fibe extends fibeRest {
    override describe (): any {
        return this.deepExtend (super.describe (), {
            'has': {
                'ws': true,
                'watchBalance': true,
                'watchMyTrades': true,
                'watchOHLCV': true,
                'watchOrderBook': true,
                'watchOrders': true,
                'watchPositions': true,
                'watchTicker': true,
                'watchTrades': true,
            },
            'urls': {
                'api': {
                    'ws': {
                        'public': 'wss://api.devnet.fibe.trade/v1',
                    },
                },
            },
            'options': {
                'tradesLimit': 1000,
                'OHLCVLimit': 1000,
            },
            'streaming': {
                'keepAlive': 50000,
                'ping': this.ping,
            },
        });
    }

    fibeWsSubscription (type: string, market: MarketInterface): Dict {
        const info = this.safeDict (market, 'info', {});
        return {
            'type': type,
            'mi': this.safeString (info, 'mi'),
            'mt': this.safeString (info, 'mt'),
        };
    }

    fibeWsMarket (data: Dict): MarketInterface {
        const mi = this.safeString (data, 'mi');
        const mt = this.safeString (data, 'mt');
        let prefix = 'spot:';
        if (mt === 'P') {
            prefix = 'perp:';
        }
        return this.market (prefix + mi);
    }

    async fibeWsAccountSubscription (methodName: string, type: string, params: Dict = {}): Promise<[Dict, Dict]> {
        const accountIdResponse = await this.fibeAccountId (methodName, params);
        const accountId = this.safeString (accountIdResponse, 0);
        const requestParams = this.safeDict (accountIdResponse, 1, {});
        return [ {
            'type': type,
            'aid': accountId,
        }, requestParams ];
    }

    fibeWsAccountHash (type: string, entry: Dict): string {
        return type + ':' + this.safeString (entry, 'aid');
    }

    fibeWsOrderBookHash (symbol: string, entry: Dict): string {
        const nSigFigs = this.safeInteger (entry, 'nSigFigs');
        let mantissa = this.safeInteger (entry, 'mantissa');
        // Fibone normalizes omitted mantissa to 1 when nSigFigs is 5, and echoes that on the book.
        if ((nSigFigs === 5) && (mantissa === undefined)) {
            mantissa = 1;
        }
        const nSigFigsHash = (nSigFigs === undefined) ? 'none' : this.numberToString (nSigFigs);
        const mantissaHash = (mantissa === undefined) ? 'none' : this.numberToString (mantissa);
        return 'orderbook:' + symbol + ':' + nSigFigsHash + ':' + mantissaHash;
    }

    /**
     * @method
     * @name fibe#watchTicker
     * @description watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/?id=ticker-structure}
     */
    override async watchTicker (symbol: string, params: Dict = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const symbolValue: string = market['symbol'];
        const messageHash = 'ticker:' + symbolValue;
        const url = this.urls['api']['ws']['public'];
        const request: Dict = {
            'method': 'subscribe',
            'subscription': this.fibeWsSubscription ('activeAssetCtx', market),
        };
        return await this.watch (url, messageHash, this.extend (request, params), messageHash);
    }

    handleTicker (client: Client, message: Dict) {
        const data = this.safeDict (message, 'data', {});
        const market = this.fibeWsMarket (data);
        const ticker = this.parseTicker (data, market);
        const symbol = market['symbol'];
        this.tickers[symbol] = ticker;
        client.resolve (ticker, 'ticker:' + symbol);
    }

    /**
     * @method
     * @name fibe#watchOrderBook
     * @description watches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
     * @param {string} symbol unified symbol of the market to fetch the order book for
     * @param {int} [limit] the maximum amount of order book entries to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.nSigFigs] the number of significant figures to aggregate the order book to
     * @param {int} [params.mantissa] the aggregation mantissa
     * @returns {object} an [order book structure]{@link https://docs.ccxt.com/?id=order-book-structure}
     */
    override async watchOrderBook (symbol: string, limit: Int = undefined, params: Dict = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        let requestParams = params;
        const market = this.market (symbol);
        const symbolValue: string = market['symbol'];
        let nSigFigs = undefined;
        [ nSigFigs, requestParams ] = this.handleOptionAndParams (requestParams, 'watchOrderBook', 'nSigFigs');
        let mantissa = undefined;
        [ mantissa, requestParams ] = this.handleOptionAndParams (requestParams, 'watchOrderBook', 'mantissa');
        const subscription = this.fibeWsSubscription ('l2Book', market);
        if (nSigFigs !== undefined) {
            subscription['nSigFigs'] = nSigFigs;
        }
        if (mantissa !== undefined) {
            subscription['mantissa'] = mantissa;
        }
        const messageHash = this.fibeWsOrderBookHash (symbolValue, subscription);
        const request: Dict = {
            'method': 'subscribe',
            'subscription': subscription,
        };
        const clientSubscription: Dict = {
            'limit': limit,
        };
        const url = this.urls['api']['ws']['public'];
        const orderbook = await this.watch (url, messageHash, this.extend (request, requestParams), messageHash, clientSubscription);
        return orderbook.limit ();
    }

    handleOrderBook (client: Client, message: Dict) {
        const data = this.safeDict (message, 'data', {});
        const market = this.fibeWsMarket (data);
        const symbol = market['symbol'];
        const snapshot = this.parseOrderBook (data, symbol, undefined, 'bids', 'asks', 'px', 'sz');
        const messageHash = this.fibeWsOrderBookHash (symbol, data);
        if (!(messageHash in this.orderbooks)) {
            const subscription = this.safeDict (client.subscriptions, messageHash, {});
            const limit = this.safeInteger (subscription, 'limit');
            this.orderbooks[messageHash] = this.orderBook ({}, limit);
        }
        const orderbook = this.orderbooks[messageHash];
        orderbook.reset (snapshot);
        client.resolve (orderbook, messageHash);
    }

    /**
     * @method
     * @name fibe#watchTrades
     * @description watches information on multiple trades made in a market
     * @param {string} symbol unified symbol of the market trades were made in
     * @param {int} [since] the earliest time in ms to fetch trades for
     * @param {int} [limit] the maximum number of trade structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/?id=trade-structure}
     */
    override async watchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const symbolValue: string = market['symbol'];
        const messageHash = 'trade:' + symbolValue;
        const request: Dict = {
            'method': 'subscribe',
            'subscription': this.fibeWsSubscription ('trades', market),
        };
        const url = this.urls['api']['ws']['public'];
        const clientSubscription: Dict = {
            'symbol': symbolValue,
            'snapshotPending': true,
        };
        const trades = await this.watch (url, messageHash, this.extend (request, params), messageHash, clientSubscription);
        let resultLimit = limit;
        if (this.newUpdates) {
            resultLimit = trades.getLimit (symbolValue, resultLimit);
        }
        return this.filterBySinceLimit (trades, since, resultLimit, 'timestamp', true);
    }

    handleTrades (client: Client, message: Dict) {
        const data = this.safeList (message, 'data', []);
        const isSnapshot = this.safeBool (message, 'isSnapshot', false);
        let symbol = undefined;
        let parsed: Trade[] = [];
        if (this.isEmpty (data)) {
            if (!isSnapshot) {
                return;
            }
            // An empty snapshot has no market. One waiting watch is the only case that can be attributed.
            const pendingHashes = [];
            const messageHashes = this.findMessageHashes (client, 'trade:');
            for (let i = 0; i < messageHashes.length; i++) {
                const pendingHash = messageHashes[i];
                const pendingSubscription = this.safeDict (client.subscriptions, pendingHash, {});
                if (this.safeBool (pendingSubscription, 'snapshotPending', false)) {
                    pendingHashes.push (pendingHash);
                }
            }
            if (pendingHashes.length !== 1) {
                return;
            }
            const pendingSubscription = this.safeDict (client.subscriptions, pendingHashes[0], {});
            symbol = this.safeString (pendingSubscription, 'symbol');
            if (symbol === undefined) {
                return;
            }
        } else {
            const market = this.fibeWsMarket (this.safeDict (data, 0, {}));
            symbol = market['symbol'];
            parsed = this.parseTrades (data, market);
        }
        const messageHash = 'trade:' + symbol;
        const subscription = this.safeDict (client.subscriptions, messageHash, {});
        // Trades before the snapshot are dropped. The snapshot is the baseline.
        if (!isSnapshot && this.safeBool (subscription, 'snapshotPending', false)) {
            return;
        }
        if (isSnapshot || !(symbol in this.trades)) {
            const limit = this.safeInteger (this.options, 'tradesLimit', 1000);
            this.trades[symbol] = new ArrayCache (limit);
            subscription['snapshotPending'] = false;
            client.subscriptions[messageHash] = subscription;
        }
        const trades = this.trades[symbol];
        for (let i = 0; i < parsed.length; i++) {
            trades.append (parsed[i]);
        }
        client.resolve (trades, messageHash);
    }

    /**
     * @method
     * @name fibe#watchOrders
     * @description watches order updates for a wallet
     * @param {string} [symbol] unified market symbol
     * @param {int} [since] the earliest time in ms to return orders for
     * @param {int} [limit] the maximum number of orders to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, defaults to walletAddress
     * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/?id=order-structure}
     */
    override async watchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<Order[]> {
        const [ subscription, requestParams ] = await this.fibeWsAccountSubscription ('watchOrders', 'orderUpdates', params);
        await this.loadMarkets ();
        let symbolValue = symbol;
        const accountId = this.safeString (subscription, 'aid');
        let messageHash = 'orders:' + accountId;
        if (symbolValue !== undefined) {
            symbolValue = this.symbol (symbolValue);
            messageHash += ':' + symbolValue;
        }
        const url = this.urls['api']['ws']['public'];
        const request: Dict = {
            'method': 'subscribe',
            'subscription': subscription,
        };
        const subscribeHash = this.fibeWsAccountHash ('orderUpdates', subscription);
        const orders = await this.watch (url, messageHash, this.extend (request, requestParams), subscribeHash, {});
        let resultLimit = limit;
        if (this.newUpdates) {
            resultLimit = orders.getLimit (symbolValue, resultLimit);
        }
        return this.filterBySymbolSinceLimit (orders, symbolValue, since, resultLimit, true);
    }

    handleOrders (client: Client, message: Dict) {
        const entry = this.safeDict (message, 'data', {});
        const data = this.safeList (entry, 'orders', []);
        if (this.isEmpty (data)) {
            return;
        }
        const subscribeHash = this.fibeWsAccountHash ('orderUpdates', entry);
        const subscription = this.safeDict (client.subscriptions, subscribeHash, {});
        let orders = this.safeValue (subscription, 'orders');
        if (orders === undefined) {
            const limit = this.safeInteger (this.options, 'ordersLimit', 1000);
            // MFMM slot indexes are published as reusable order ids.
            orders = new ArrayCache (limit);
            subscription['orders'] = orders;
            client.subscriptions[subscribeHash] = subscription;
        }
        const symbols: Dict = {};
        for (let i = 0; i < data.length; i++) {
            const order = this.parseOrder (data[i]);
            const symbol = order['symbol'];
            if (symbol !== undefined) {
                symbols[symbol] = true;
            }
            orders.append (order);
        }
        const baseMessageHash = 'orders:' + this.safeString (entry, 'aid');
        const symbolKeys = Object.keys (symbols);
        for (let i = 0; i < symbolKeys.length; i++) {
            client.resolve (orders, baseMessageHash + ':' + symbolKeys[i]);
        }
        client.resolve (orders, baseMessageHash);
    }

    /**
     * @method
     * @name fibe#watchMyTrades
     * @description watches fills for a wallet
     * @param {string} [symbol] unified market symbol
     * @param {int} [since] the earliest time in ms to return trades for
     * @param {int} [limit] the maximum number of trades to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, defaults to walletAddress
     * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/?id=trade-structure}
     */
    override async watchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<Trade[]> {
        const [ subscription, requestParams ] = await this.fibeWsAccountSubscription ('watchMyTrades', 'userFills', params);
        await this.loadMarkets ();
        let symbolValue = symbol;
        const accountId = this.safeString (subscription, 'aid');
        let messageHash = 'myTrades:' + accountId;
        if (symbolValue !== undefined) {
            symbolValue = this.symbol (symbolValue);
            messageHash += ':' + symbolValue;
        }
        const url = this.urls['api']['ws']['public'];
        const request: Dict = {
            'method': 'subscribe',
            'subscription': subscription,
        };
        const subscribeHash = this.fibeWsAccountHash ('userFills', subscription);
        const clientSubscription: Dict = {
            'snapshotPending': true,
        };
        const trades = await this.watch (url, messageHash, this.extend (request, requestParams), subscribeHash, clientSubscription);
        let resultLimit = limit;
        if (this.newUpdates) {
            resultLimit = trades.getLimit (symbolValue, resultLimit);
        }
        return this.filterBySymbolSinceLimit (trades, symbolValue, since, resultLimit, true);
    }

    handleMyTrades (client: Client, message: Dict) {
        const entry = this.safeDict (message, 'data', {});
        const data = this.safeList (entry, 'fills', []);
        const isSnapshot = this.safeBool (entry, 'isSnapshot', false);
        if (this.isEmpty (data) && !isSnapshot) {
            return;
        }
        const subscribeHash = this.fibeWsAccountHash ('userFills', entry);
        const subscription = this.safeDict (client.subscriptions, subscribeHash, {});
        // Fills before the snapshot are dropped. The snapshot is the baseline.
        if (!isSnapshot && this.safeBool (subscription, 'snapshotPending', false)) {
            return;
        }
        let trades = this.safeValue (subscription, 'trades');
        if (isSnapshot || (trades === undefined)) {
            const limit = this.safeInteger (this.options, 'tradesLimit', 1000);
            trades = new ArrayCache (limit);
            subscription['trades'] = trades;
            subscription['snapshotPending'] = false;
            client.subscriptions[subscribeHash] = subscription;
        }
        const parsed = this.parseTrades (data);
        const symbols: Dict = {};
        for (let i = 0; i < parsed.length; i++) {
            const trade = parsed[i];
            const symbol = trade['symbol'];
            if (symbol !== undefined) {
                symbols[symbol] = true;
            }
            trades.append (trade);
        }
        const symbolKeys = Object.keys (symbols);
        const accountId = this.safeString (entry, 'aid');
        const baseMessageHash = 'myTrades:' + accountId;
        for (let i = 0; i < symbolKeys.length; i++) {
            client.resolve (trades, baseMessageHash + ':' + symbolKeys[i]);
        }
        if (isSnapshot) {
            const messageHashes = this.findMessageHashes (client, baseMessageHash);
            for (let i = 0; i < messageHashes.length; i++) {
                client.resolve (trades, messageHashes[i]);
            }
        } else {
            client.resolve (trades, baseMessageHash);
        }
    }

    /**
     * @method
     * @name fibe#watchBalance
     * @description watches spot or perpetual account balances for a wallet
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, defaults to walletAddress
     * @param {string} [params.type] spot or swap, defaults to spot
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/?id=balance-structure}
     */
    override async watchBalance (params: Dict = {}): Promise<Balances> {
        await this.loadMarkets ();
        let requestParams = params;
        let type = undefined;
        [ type, requestParams ] = this.handleMarketTypeAndParams ('watchBalance', undefined, requestParams);
        let subscription = undefined;
        let subscribeHash = undefined;
        let messageHash = undefined;
        if (type === 'spot') {
            [ subscription, requestParams ] = await this.fibeWsAccountSubscription ('watchBalance', 'spotState', requestParams);
            subscribeHash = this.fibeWsAccountHash ('spotState', subscription);
            messageHash = subscribeHash + '::balance';
        } else if (type === 'swap') {
            [ subscription, requestParams ] = await this.fibeWsAccountSubscription ('watchBalance', 'allClearinghouseState', requestParams);
            subscribeHash = this.fibeWsAccountHash ('allClearinghouseState', subscription);
            messageHash = subscribeHash + '::balance';
        } else {
            throw new ExchangeError (this.id + ' watchBalance() supports spot or swap accounts');
        }
        const request: Dict = {
            'method': 'subscribe',
            'subscription': subscription,
        };
        const url = this.urls['api']['ws']['public'];
        return await this.watch (url, messageHash, this.extend (request, requestParams), subscribeHash);
    }

    handleBalance (client: Client, message: Dict) {
        const channel = this.safeString (message, 'channel');
        const data = this.safeDict (message, 'data', {});
        const result: Dict = {
            'info': data,
        };
        let type = undefined;
        if (channel === 'spotState') {
            type = 'spot';
            const balances = this.safeList (data, 'balances', []);
            for (let i = 0; i < balances.length; i++) {
                const rawBalance = balances[i];
                const code = this.safeCurrencyCode (this.safeString (rawBalance, 'symbol'));
                const account = this.account ();
                account['used'] = this.safeString (rawBalance, 'hold');
                if (code !== undefined) {
                    result[code] = account;
                }
            }
        } else if (channel === 'allClearinghouseState') {
            type = 'swap';
            const states = this.safeList (data, 'states', []);
            for (let i = 0; i < states.length; i++) {
                const entry = states[i];
                const state = this.safeDict (entry, 'clearinghouseState', {});
                const marginSummary = this.safeDict (state, 'marginSummary', {});
                const account = this.account ();
                account['free'] = this.safeString (state, 'withdrawable');
                account['used'] = this.safeString (marginSummary, 'totalMarginUsed');
                account['total'] = this.safeString (marginSummary, 'accountValue');
                const quoteTokenIndex = this.safeInteger (entry, 'qti');
                let code = undefined;
                const marketValues = Object.values (this.markets);
                for (let j = 0; j < marketValues.length; j++) {
                    const market = marketValues[j];
                    if ((market['swap'] === true) && (this.safeInteger (market['info'], 'qti') === quoteTokenIndex)) {
                        code = market['settle'];
                        break;
                    }
                }
                if (code !== undefined) {
                    result[code] = account;
                }
            }
            this.handlePositions (client, message);
        }
        if (type !== undefined) {
            if (this.balance === undefined) {
                this.balance = {};
            }
            const balance = this.safeBalance (result);
            this.balance[type] = balance;
            let messageHash = this.fibeWsAccountHash ('spotState', data) + '::balance';
            if (type === 'swap') {
                messageHash = this.fibeWsAccountHash ('allClearinghouseState', data) + '::balance';
            }
            client.resolve (balance, messageHash);
        }
    }

    /**
     * @method
     * @name fibe#watchPositions
     * @description watches perpetual positions for one account
     * @param {string[]} [symbols] unified perpetual market symbols
     * @param {int} [since] unused because the stream does not include position timestamps
     * @param {int} [limit] the maximum number of positions to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, defaults to walletAddress
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/?id=position-structure}
     */
    override async watchPositions (symbols: Strings = undefined, since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<Position[]> {
        await this.loadMarkets ();
        const symbolValues = this.marketSymbols (symbols, 'swap');
        const [ subscription, requestParams ] = await this.fibeWsAccountSubscription ('watchPositions', 'allClearinghouseState', params);
        const subscribeHash = this.fibeWsAccountHash ('allClearinghouseState', subscription);
        let messageHash = subscribeHash + '::positions';
        if ((symbolValues !== undefined) && !this.isEmpty (symbolValues)) {
            messageHash += '::' + symbolValues.join (',');
        }
        const request: Dict = {
            'method': 'subscribe',
            'subscription': subscription,
        };
        const url = this.urls['api']['ws']['public'];
        const positions = await this.watch (url, messageHash, this.extend (request, requestParams), subscribeHash);
        if (this.newUpdates) {
            return positions;
        }
        return this.filterBySymbolsSinceLimit (positions, symbolValues, undefined, limit, true);
    }

    handlePositions (client: Client, message: Dict) {
        const data = this.safeDict (message, 'data', {});
        const states = this.safeList (data, 'states', []);
        const positions = [];
        for (let i = 0; i < states.length; i++) {
            const entry = states[i];
            const state = this.safeDict (entry, 'clearinghouseState', {});
            const rawPositions = this.safeList (state, 'assetPositions', []);
            for (let j = 0; j < rawPositions.length; j++) {
                const rawPosition = this.extend ({
                    'accountId': this.safeString (entry, 'aid'),
                    'quoteTokenIndex': this.safeValue (entry, 'qti'),
                }, rawPositions[j]);
                const position = this.parsePosition (rawPosition);
                positions.push (position);
            }
        }
        const baseMessageHash = this.fibeWsAccountHash ('allClearinghouseState', data) + '::positions';
        const messageHashes = this.findMessageHashes (client, baseMessageHash);
        for (let i = 0; i < messageHashes.length; i++) {
            const messageHash = messageHashes[i];
            const parts = messageHash.split ('::');
            const symbolsString = this.safeString (parts, 2);
            let filtered = positions;
            if (symbolsString !== undefined) {
                filtered = this.filterByArray (positions, 'symbol', symbolsString.split (','), false);
            }
            client.resolve (filtered, messageHash);
        }
    }

    /**
     * @method
     * @name fibe#watchOHLCV
     * @description watches historical candlestick data containing the open, high, low, close price, and the volume of a market
     * @param {string} symbol unified symbol of the market to fetch OHLCV data for
     * @param {string} timeframe the length of time each candle represents
     * @param {int} [since] timestamp in ms of the earliest candle to fetch
     * @param {int} [limit] the maximum amount of candles to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {int[][]} a list of candles ordered as timestamp, open, high, low, close, volume
     */
    override async watchOHLCV (symbol: string, timeframe: string = '1m', since: Int = undefined, limit: Int = undefined, params: Dict = {}): Promise<OHLCV[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const symbolValue: string = market['symbol'];
        const interval = this.safeString (this.timeframes, timeframe, timeframe);
        const wsSubscription = this.fibeWsSubscription ('candle', market);
        wsSubscription['interval'] = interval;
        const request: Dict = {
            'method': 'subscribe',
            'subscription': wsSubscription,
        };
        const messageHash = 'candles:' + timeframe + ':' + symbolValue;
        const url = this.urls['api']['ws']['public'];
        const ohlcv = await this.watch (url, messageHash, this.extend (request, params), messageHash);
        let resultLimit = limit;
        if (this.newUpdates) {
            resultLimit = ohlcv.getLimit (symbolValue, resultLimit);
        }
        return this.filterBySinceLimit (ohlcv, since, resultLimit, 0, true);
    }

    handleOHLCV (client: Client, message: Dict) {
        const data = this.safeDict (message, 'data', {});
        const market = this.fibeWsMarket (data);
        const symbol = market['symbol'];
        const start = this.safeInteger (data, 't', 0);
        const end = this.safeInteger (data, 'T', 0);
        const duration = end - start + 1;
        let timeframe = undefined;
        const timeframes = Object.keys (this.timeframes);
        for (let i = 0; i < timeframes.length; i++) {
            const candidate = timeframes[i];
            if (duration === this.parseTimeframe (candidate)) {
                timeframe = candidate;
                break;
            }
        }
        if (timeframe === undefined) {
            return;
        }
        if (!(symbol in this.ohlcvs)) {
            this.ohlcvs[symbol] = {};
        }
        if (!(timeframe in this.ohlcvs[symbol])) {
            const limit = this.safeInteger (this.options, 'OHLCVLimit', 1000);
            this.ohlcvs[symbol][timeframe] = new ArrayCacheByTimestamp (limit);
        }
        const ohlcv = this.ohlcvs[symbol][timeframe];
        ohlcv.append (this.parseOHLCV (data, market));
        client.resolve (ohlcv, 'candles:' + timeframe + ':' + symbol);
    }

    handleErrorMessage (client: Client, message: Dict): Bool {
        const channel = this.safeString (message, 'channel');
        let detail = this.safeString (message, 'detail');
        if (detail === undefined) {
            detail = this.safeString (message, 'error');
        }
        if ((channel === 'error') || (detail !== undefined)) {
            const feedback = (detail === undefined) ? this.json (message) : detail;
            const error = new ExchangeError (this.id + ' ' + feedback);
            client.reject (error);
            return true;
        }
        return false;
    }

    override handleMessage (client: Client, message: Dict) {
        if (this.handleErrorMessage (client, message) === true) {
            return;
        }
        const channel = this.safeString (message, 'channel', '');
        const methods: Dict = {
            'activeAssetCtx': this.handleTicker,
            'allClearinghouseState': this.handleBalance,
            'candle': this.handleOHLCV,
            'l2Book': this.handleOrderBook,
            'orderUpdates': this.handleOrders,
            'pong': this.handlePong,
            'spotState': this.handleBalance,
            'trades': this.handleTrades,
            'userFills': this.handleMyTrades,
        };
        const method = this.safeValue (methods, channel);
        if (method !== undefined) {
            method.call (this, client, message);
        }
    }

    override ping (client: Client): Dict {
        return {
            'method': 'ping',
        };
    }

    handlePong (client: Client, message: Dict) {
        client.lastPong = this.safeInteger (message, 'pong', this.milliseconds ());
        return message;
    }
}
