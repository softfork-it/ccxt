//  ---------------------------------------------------------------------------

import fibeRest from '../fibe.js';
import { ArgumentsRequired, ExchangeError } from '../base/errors.js';
import Client from '../base/ws/Client.js';
import { ArrayCache, ArrayCacheByTimestamp } from '../base/ws/Cache.js';
import type { Balances, Bool, Dict, Int, Market, OHLCV, Order, OrderBook, Position, Str, Strings, Ticker, Trade } from '../base/types.js';

//  ---------------------------------------------------------------------------

export default class fibe extends fibeRest {
    describe (): any {
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
                        'public': 'wss://fb-4b8448ac.alephium.org/v1',
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

    fibeWsSubscription (type: string, market: Market): Dict {
        const info = this.safeDict (market, 'info', {});
        return {
            'type': type,
            'mi': this.safeString (info, 'mi'),
            'mt': this.safeString (info, 'mt'),
        };
    }

    fibeWsMarket (data: Dict): Market {
        const mi = this.safeString (data, 'mi');
        const mt = this.safeString (data, 'mt');
        let prefix = 'spot:';
        if (mt === 'P') {
            prefix = 'perp:';
        }
        return this.market (prefix + mi);
    }

    fibeWsClearinghouseSubscription (methodName: string, userAddress: string, params = {}) {
        let subAccountIndex = undefined;
        [ subAccountIndex, params ] = this.handleOptionAndParams (params, methodName, 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param (methodName, 'subAccountIndex', subAccountIndex);
        let quoteMint = undefined;
        [ quoteMint, params ] = this.handleOptionAndParams (params, methodName, 'quoteMint');
        if (quoteMint === undefined) {
            throw new ArgumentsRequired (this.id + ' ' + methodName + '() requires a quoteMint parameter in params or exchange.options');
        }
        return [ {
            'type': 'clearinghouseState',
            'user': userAddress,
            'subAccountIndex': subAccountIndex,
            'quoteMint': quoteMint,
        }, params ];
    }

    fibeWsClearinghouseHash (entry: Dict): string {
        return 'clearinghouseState:' + this.safeString (entry, 'user') + ':' + this.safeString (entry, 'subAccountIndex') + ':' + this.safeString (entry, 'quoteMint');
    }

    /**
     * @method
     * @name fibe#watchTicker
     * @description watches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/?id=ticker-structure}
     */
    async watchTicker (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        symbol = market['symbol'];
        const messageHash = 'ticker:' + symbol;
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
     * @returns {object} an [order book structure]{@link https://docs.ccxt.com/?id=order-book-structure}
     */
    async watchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        symbol = market['symbol'];
        const messageHash = 'orderbook:' + symbol;
        const request: Dict = {
            'method': 'subscribe',
            'subscription': this.fibeWsSubscription ('l2Book', market),
        };
        const clientSubscription: Dict = {
            'limit': limit,
        };
        const url = this.urls['api']['ws']['public'];
        const orderbook = await this.watch (url, messageHash, this.extend (request, params), messageHash, clientSubscription);
        return orderbook.limit ();
    }

    handleOrderBook (client: Client, message: Dict) {
        const data = this.safeDict (message, 'data', {});
        const market = this.fibeWsMarket (data);
        const symbol = market['symbol'];
        const snapshot = this.parseOrderBook (data, symbol, undefined, 'bids', 'asks', 'px', 'sz');
        const messageHash = 'orderbook:' + symbol;
        if (!(symbol in this.orderbooks)) {
            const subscription = this.safeDict (client.subscriptions, messageHash, {});
            const limit = this.safeInteger (subscription, 'limit');
            this.orderbooks[symbol] = this.orderBook ({}, limit);
        }
        const orderbook = this.orderbooks[symbol];
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
    async watchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        symbol = market['symbol'];
        const messageHash = 'trade:' + symbol;
        const request: Dict = {
            'method': 'subscribe',
            'subscription': this.fibeWsSubscription ('trades', market),
        };
        const url = this.urls['api']['ws']['public'];
        const trades = await this.watch (url, messageHash, this.extend (request, params), messageHash);
        if (this.newUpdates) {
            limit = trades.getLimit (symbol, limit);
        }
        return this.filterBySinceLimit (trades, since, limit, 'timestamp', true);
    }

    handleTrades (client: Client, message: Dict) {
        const data = this.safeList (message, 'data', []);
        if (data.length === 0) {
            return;
        }
        const first = this.safeDict (data, 0, {});
        const market = this.fibeWsMarket (first);
        const symbol = market['symbol'];
        if (!(symbol in this.trades)) {
            const limit = this.safeInteger (this.options, 'tradesLimit', 1000);
            this.trades[symbol] = new ArrayCache (limit);
        }
        const trades = this.trades[symbol];
        const parsed = this.parseTrades (data, market);
        for (let i = 0; i < parsed.length; i++) {
            trades.append (parsed[i]);
        }
        client.resolve (trades, 'trade:' + symbol);
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
    async watchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('watchOrders', params);
        await this.loadMarkets ();
        let messageHash = 'orders';
        if (symbol !== undefined) {
            symbol = this.symbol (symbol);
            messageHash += ':' + symbol;
        }
        const url = this.urls['api']['ws']['public'];
        const request: Dict = {
            'method': 'subscribe',
            'subscription': {
                'type': 'orderUpdates',
                'user': userAddress,
            },
        };
        const orders = await this.watch (url, messageHash, this.extend (request, params), 'orderUpdates:' + userAddress);
        if (this.newUpdates) {
            limit = orders.getLimit (symbol, limit);
        }
        return this.filterBySymbolSinceLimit (orders, symbol, since, limit, true);
    }

    handleOrders (client: Client, message: Dict) {
        const entry = this.safeDict (message, 'data', {});
        const data = this.safeList (entry, 'orders', []);
        if (data.length === 0) {
            return;
        }
        if (this.orders === undefined) {
            const limit = this.safeInteger (this.options, 'ordersLimit', 1000);
            // MFMM slot indexes are published as reusable order ids.
            this.orders = new ArrayCache (limit);
        }
        const symbols: Dict = {};
        for (let i = 0; i < data.length; i++) {
            const order = this.parseOrder (data[i]);
            const symbol = order['symbol'];
            symbols[symbol] = true;
            this.orders.append (order);
        }
        const symbolKeys = Object.keys (symbols);
        for (let i = 0; i < symbolKeys.length; i++) {
            client.resolve (this.orders, 'orders:' + symbolKeys[i]);
        }
        client.resolve (this.orders, 'orders');
    }

    /**
     * @method
     * @name fibe#watchMyTrades
     * @description watches fills for a wallet
     * @param {string} [symbol] unified market symbol
     * @param {int} [since] unused because the stream does not include fill timestamps
     * @param {int} [limit] the maximum number of trades to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, defaults to walletAddress
     * @returns {object[]} a list of [trade structures]{@link https://docs.ccxt.com/?id=trade-structure}
     */
    async watchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('watchMyTrades', params);
        await this.loadMarkets ();
        let messageHash = 'myTrades';
        if (symbol !== undefined) {
            symbol = this.symbol (symbol);
            messageHash += ':' + symbol;
        }
        const url = this.urls['api']['ws']['public'];
        const request: Dict = {
            'method': 'subscribe',
            'subscription': {
                'type': 'userFills',
                'user': userAddress,
            },
        };
        const trades = await this.watch (url, messageHash, this.extend (request, params), 'userFills:' + userAddress);
        if (this.newUpdates) {
            limit = trades.getLimit (symbol, limit);
        }
        return this.filterBySymbolSinceLimit (trades, symbol, undefined, limit, true);
    }

    handleMyTrades (client: Client, message: Dict) {
        const entry = this.safeDict (message, 'data', {});
        const data = this.safeList (entry, 'fills', []);
        if (data.length === 0) {
            return;
        }
        if (this.myTrades === undefined) {
            const limit = this.safeInteger (this.options, 'tradesLimit', 1000);
            this.myTrades = new ArrayCache (limit);
        }
        const symbols: Dict = {};
        for (let i = 0; i < data.length; i++) {
            const trade = this.parseTrade (data[i]);
            const symbol = trade['symbol'];
            symbols[symbol] = true;
            this.myTrades.append (trade);
        }
        const symbolKeys = Object.keys (symbols);
        for (let i = 0; i < symbolKeys.length; i++) {
            client.resolve (this.myTrades, 'myTrades:' + symbolKeys[i]);
        }
        client.resolve (this.myTrades, 'myTrades');
    }

    /**
     * @method
     * @name fibe#watchBalance
     * @description watches spot or perpetual account balances for a wallet
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, defaults to walletAddress
     * @param {string} [params.type] spot or swap, defaults to spot
     * @param {int} [params.subAccountIndex] perpetual subaccount index, defaults to 0
     * @param {string} [params.quoteMint] perpetual quote mint, required when params.type is swap
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/?id=balance-structure}
     */
    async watchBalance (params = {}): Promise<Balances> {
        await this.loadMarkets ();
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('watchBalance', params);
        let type = undefined;
        [ type, params ] = this.handleMarketTypeAndParams ('watchBalance', undefined, params);
        let subscription = undefined;
        let subscribeHash = undefined;
        let messageHash = undefined;
        if (type === 'spot') {
            subscription = {
                'type': 'spotState',
                'user': userAddress,
            };
            subscribeHash = 'spotState:' + userAddress;
            messageHash = subscribeHash + '::balance';
        } else if (type === 'swap') {
            [ subscription, params ] = this.fibeWsClearinghouseSubscription ('watchBalance', userAddress, params);
            subscribeHash = this.fibeWsClearinghouseHash (subscription);
            messageHash = subscribeHash + '::balance';
        } else {
            throw new ExchangeError (this.id + ' watchBalance() supports spot or swap accounts');
        }
        const request: Dict = {
            'method': 'subscribe',
            'subscription': subscription,
        };
        const url = this.urls['api']['ws']['public'];
        return await this.watch (url, messageHash, this.extend (request, params), subscribeHash);
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
                result[code] = account;
            }
        } else if (channel === 'clearinghouseState') {
            type = 'swap';
            const state = this.safeDict (data, 'clearinghouseState', {});
            const marginSummary = this.safeDict (state, 'marginSummary', {});
            const account = this.account ();
            account['free'] = this.safeString (state, 'withdrawable');
            account['used'] = this.safeString (marginSummary, 'totalMarginUsed');
            account['total'] = this.safeString (marginSummary, 'accountValue');
            const code = this.safeCurrencyCode (this.safeString (data, 'quoteMint'));
            result[code] = account;
            this.handlePositions (client, message);
        }
        if (type !== undefined) {
            if (this.balance === undefined) {
                this.balance = {};
            }
            const balance = this.safeBalance (result);
            this.balance[type] = balance;
            let messageHash = 'spotState:' + this.safeString (data, 'user') + '::balance';
            if (type === 'swap') {
                messageHash = this.fibeWsClearinghouseHash (data) + '::balance';
            }
            client.resolve (balance, messageHash);
        }
    }

    /**
     * @method
     * @name fibe#watchPositions
     * @description watches perpetual positions for one wallet subaccount and quote mint
     * @param {string[]} [symbols] unified perpetual market symbols
     * @param {int} [since] unused because the stream does not include position timestamps
     * @param {int} [limit] the maximum number of positions to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, defaults to walletAddress
     * @param {int} [params.subAccountIndex] perpetual subaccount index, defaults to 0
     * @param {string} params.quoteMint perpetual quote mint
     * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/?id=position-structure}
     */
    async watchPositions (symbols: Strings = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Position[]> {
        await this.loadMarkets ();
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('watchPositions', params);
        symbols = this.marketSymbols (symbols, 'swap');
        let subscription = undefined;
        [ subscription, params ] = this.fibeWsClearinghouseSubscription ('watchPositions', userAddress, params);
        const subscribeHash = this.fibeWsClearinghouseHash (subscription);
        let messageHash = subscribeHash + '::positions';
        if ((symbols !== undefined) && (symbols.length > 0)) {
            messageHash += '::' + symbols.join (',');
        }
        const request: Dict = {
            'method': 'subscribe',
            'subscription': subscription,
        };
        const url = this.urls['api']['ws']['public'];
        const positions = await this.watch (url, messageHash, this.extend (request, params), subscribeHash);
        if (this.newUpdates) {
            return positions;
        }
        return this.filterBySymbolsSinceLimit (positions, symbols, undefined, limit, true);
    }

    handlePositions (client: Client, message: Dict) {
        const data = this.safeDict (message, 'data', {});
        const state = this.safeDict (data, 'clearinghouseState', {});
        const rawPositions = this.safeList (state, 'assetPositions', []);
        const positions = [];
        for (let i = 0; i < rawPositions.length; i++) {
            const rawPosition = this.extend ({
                'user': this.safeString (data, 'user'),
                'subAccountIndex': this.safeInteger (data, 'subAccountIndex'),
                'quoteMint': this.safeString (data, 'quoteMint'),
            }, rawPositions[i]);
            const position = this.parsePosition (rawPosition);
            positions.push (position);
        }
        const baseMessageHash = this.fibeWsClearinghouseHash (data) + '::positions';
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
    async watchOHLCV (symbol: string, timeframe: string = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        symbol = market['symbol'];
        const interval = this.safeString (this.timeframes, timeframe, timeframe);
        const wsSubscription = this.fibeWsSubscription ('candle', market);
        wsSubscription['interval'] = interval;
        const request: Dict = {
            'method': 'subscribe',
            'subscription': wsSubscription,
        };
        const messageHash = 'candles:' + timeframe + ':' + symbol;
        const url = this.urls['api']['ws']['public'];
        const ohlcv = await this.watch (url, messageHash, this.extend (request, params), messageHash);
        if (this.newUpdates) {
            limit = ohlcv.getLimit (symbol, limit);
        }
        return this.filterBySinceLimit (ohlcv, since, limit, 0, true);
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

    handleMessage (client: Client, message: Dict) {
        if (this.handleErrorMessage (client, message)) {
            return;
        }
        const channel = this.safeString (message, 'channel', '');
        const methods: Dict = {
            'activeAssetCtx': this.handleTicker,
            'candle': this.handleOHLCV,
            'clearinghouseState': this.handleBalance,
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

    ping (client: Client) {
        return {
            'method': 'ping',
        };
    }

    handlePong (client: Client, message: Dict) {
        client.lastPong = this.safeInteger (message, 'pong', this.milliseconds ());
        return message;
    }
}
