//  ---------------------------------------------------------------------------

import fibeRest from '../fibe.js';
import { ExchangeError } from '../base/errors.js';
import Client from '../base/ws/Client.js';
import { ArrayCache, ArrayCacheByTimestamp } from '../base/ws/Cache.js';
import type { Bool, Dict, Int, Market, OHLCV, OrderBook, Ticker, Trade } from '../base/types.js';

//  ---------------------------------------------------------------------------

export default class fibe extends fibeRest {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'has': {
                'ws': true,
                'watchOHLCV': true,
                'watchOrderBook': true,
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
            'l2Book': this.handleOrderBook,
            'pong': this.handlePong,
            'trades': this.handleTrades,
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
