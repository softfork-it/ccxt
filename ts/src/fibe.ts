
//  ---------------------------------------------------------------------------

import Exchange from './abstract/fibe.js';
import { ArgumentsRequired } from './base/errors.js';
import { TICK_SIZE } from './base/functions/number.js';
import { Precise } from './base/Precise.js';
import type { Balances, Dict, Market, OHLCV, Order, OrderBook, Strings, Ticker, Tickers, Trade, TradingFeeInterface, TradingFees, Str, Int, int } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class fibe
 * @augments Exchange
 * Fibe — Solana on-chain orderbook DEX (spot + perp).
 */
export default class fibe extends Exchange {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'id': 'fibe',
            'name': 'Fibe',
            'countries': [ ],
            // 500ms (conservative) until fibone_rate_limit weights are confirmed
            'rateLimit': 500,
            'version': 'v1',
            'dex': true,
            'has': {
                'spot': true,
                'swap': false,
                'margin': false,
                'future': false,
                'option': false,
                'fetchMarkets': true,
                'fetchCurrencies': false,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchOrderBook': true,
                'fetchTrades': true,
                'fetchOHLCV': true,
                'fetchBalance': true,
                'fetchOpenOrders': true,
                'fetchOrders': true,
                'fetchTradingFee': true,
                'fetchTradingFees': true,
                'createOrder': false,
                'cancelOrder': false,
            },
            'features': {},
            'timeframes': {
                '1m': '1m',
                '3m': '3m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '2h': '2h',
                '4h': '4h',
                '8h': '8h',
                '12h': '12h',
                '1d': '1d',
                '3d': '3d',
                '1w': '1w',
                '1M': '1M',
            },
            'urls': {
                'logo': '',
                'api': {
                    'rest': 'https://fb-4b8448ac.alephium.org/api/v1',
                },
                'www': 'https://fibe.exchange',
                'doc': 'https://fibe.exchange/docs',
            },
            'api': {
                'public': {
                    'get': {
                        'markets': 1,
                        'market': 1,
                        'all-mids': 1,
                        'market-stats': 1,
                        'spot-asset-ctx': 1,
                        'l2book': 1,
                        'recent-market-trades': 1,
                        'candles': 1,
                        'open-orders': 1,
                        'historical-orders': 1,
                        'spot-state': 1,
                        'clearinghouse-state': 1,
                        'all-clearinghouse-state': 1,
                        'user-fees': 1,
                        'user-funding-history': 1,
                    },
                },
            },
            'requiredCredentials': {
                'apiKey': false,
                'secret': false,
                'walletAddress': false,
                'privateKey': false,
            },
            'precisionMode': TICK_SIZE,
            'exceptions': {
                'exact': {},
                'broad': {},
            },
        });
    }

    async fetchMarkets (params = {}): Promise<Market[]> {
        /**
         * @method
         * @name fibe#fetchMarkets
         * @description retrieves data on all markets for fibe
         * @see https://fb-4b8448ac.alephium.org/api/v1/markets
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} an array of objects representing market data
         */
        const response = await this.publicGetMarkets (params);
        //
        //     [
        //         {
        //             "baseDecimals": 9,
        //             "baseMint": "So11111111111111111111111111111111111111112",
        //             "symbol": "SOL/USDC",
        //             "lookupTable": "...",
        //             "lotSizeInBaseBaseUnits": 1000000,
        //             "marketPubkey": "...",
        //             "marketIndex": "0",
        //             "quoteDecimals": 6,
        //             "quoteMint": "EPjFW...TDt1v",
        //             "tickSizeInQuoteBaseUnits": 100,
        //             "marketType": "S"                // "S" spot | "P" perp
        //         }
        //     ]
        //
        // keep spot markets only (drop perps; 'S' spot, 'P' perp, absent = spot)
        const spotMarkets = [];
        for (let i = 0; i < response.length; i++) {
            const entry = response[i];
            const marketType = this.safeString (entry, 'marketType');
            if (marketType === 'P') {
                continue;
            }
            spotMarkets.push (entry);
        }
        return this.parseMarkets (spotMarkets);
    }

    parseMarket (market: Dict): Market {
        // spot symbols are "BASE/USDC", perp symbols are "BASE-USDC"
        const marketSymbol = this.safeString (market, 'symbol');
        let separator = '/';
        if (marketSymbol.indexOf ('/') < 0) {
            separator = '-';
        }
        const parts = marketSymbol.split (separator);
        const baseId = this.safeString (market, 'baseMint');
        const quoteId = this.safeString (market, 'quoteMint');
        const base = this.safeCurrencyCode (this.safeString (parts, 0));
        const quote = this.safeCurrencyCode (this.safeString (parts, 1));
        const marketTypeRaw = this.safeString (market, 'marketType');
        const isPerp = (marketTypeRaw === 'P');
        const marketIndex = this.safeString (market, 'marketIndex');
        const idPrefix = isPerp ? 'perp:' : 'spot:';
        const id = idPrefix + marketIndex;
        let symbol = base + '/' + quote;
        let settle = undefined;
        let settleId = undefined;
        let type = 'spot';
        if (isPerp) {
            settle = quote;
            settleId = quoteId;
            symbol = symbol + ':' + settle;
            type = 'swap';
        }
        const baseDecimals = this.safeInteger (market, 'baseDecimals');
        const quoteDecimals = this.safeInteger (market, 'quoteDecimals');
        // TICK_SIZE wants human decimal units: raw on-chain units * 10**-decimals
        const amountPrecision = this.parseNumber (Precise.stringMul (this.safeString (market, 'lotSizeInBaseBaseUnits'), this.parsePrecision (this.numberToString (baseDecimals))));
        const pricePrecision = this.parseNumber (Precise.stringMul (this.safeString (market, 'tickSizeInQuoteBaseUnits'), this.parsePrecision (this.numberToString (quoteDecimals))));
        const contract = isPerp;
        return this.safeMarketStructure ({
            'id': id,
            'symbol': symbol,
            'base': base,
            'quote': quote,
            'settle': settle,
            'baseId': baseId,
            'quoteId': quoteId,
            'settleId': settleId,
            'type': type,
            'spot': !isPerp,
            'margin': false,
            'swap': isPerp,
            'future': false,
            'option': false,
            'active': true,
            'contract': contract,
            'linear': isPerp ? true : undefined,
            'inverse': isPerp ? false : undefined,
            'contractSize': isPerp ? this.parseNumber ('1') : undefined,
            // loadMarkets() asserts taker/maker are present; real fees come from /user-fees
            'taker': this.parseNumber ('0'),
            'maker': this.parseNumber ('0'),
            'percentage': undefined,
            'tierBased': undefined,
            'expiry': undefined,
            'expiryDatetime': undefined,
            'strike': undefined,
            'optionType': undefined,
            'precision': {
                'amount': amountPrecision,
                'price': pricePrecision,
            },
            'limits': {
                'leverage': { 'min': undefined, 'max': undefined },
                'amount': { 'min': amountPrecision, 'max': undefined },
                'price': { 'min': pricePrecision, 'max': undefined },
                'cost': { 'min': undefined, 'max': undefined },
            },
            'created': undefined,
            'info': market,
        });
    }

    async fetchBalance (params = {}): Promise<Balances> {
        /**
         * @method
         * @name fibe#fetchBalance
         * @description query spot balances for a user
         * @see https://fb-4b8448ac.alephium.org/api/v1/spot-state
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.user] user address, will default to this.walletAddress if not provided
         * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
         */
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchBalance', params);
        const request: Dict = {
            'user': userAddress,
        };
        const response = await this.publicGetSpotState (this.extend (request, params));
        //
        //     {
        //         "user": "11111111111111111111111111111111",
        //         "balances": [
        //             { "symbol": "USDC", "hold": "1.2", "entryNtl": "3.4" }
        //         ]
        //     }
        //
        const balances = this.safeList (response, 'balances', []);
        const result: Dict = { 'info': response };
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            const currencyId = this.safeString (balance, 'symbol');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['used'] = this.safeString (balance, 'hold');
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async fetchTradingFees (params = {}): Promise<TradingFees> {
        /**
         * @method
         * @name fibe#fetchTradingFees
         * @description fetch the user trading fees for all loaded spot markets
         * @see https://fb-4b8448ac.alephium.org/api/v1/user-fees
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.user] user address, will default to this.walletAddress if not provided
         * @returns {object} a dictionary of [fee structures]{@link https://docs.ccxt.com/#/?id=fee-structure} indexed by market symbols
         */
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchTradingFees', params);
        await this.loadMarkets ();
        const result: Dict = {};
        for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];
            result[symbol] = await this.fetchTradingFee (symbol, this.extend ({ 'user': userAddress }, params));
        }
        return result;
    }

    async fetchTradingFee (symbol: string, params = {}): Promise<TradingFeeInterface> {
        /**
         * @method
         * @name fibe#fetchTradingFee
         * @description fetch the user trading fees for one spot market
         * @see https://fb-4b8448ac.alephium.org/api/v1/user-fees
         * @param {string} symbol unified market symbol
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.user] user address, will default to this.walletAddress if not provided
         * @returns {object} a [fee structure]{@link https://docs.ccxt.com/#/?id=fee-structure}
         */
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchTradingFee', params);
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const request: Dict = {
            'user': userAddress,
            'marketIndex': this.safeString (info, 'marketIndex'),
            'marketType': this.safeString (info, 'marketType', 'S'),
        };
        const response = await this.publicGetUserFees (this.extend (request, params));
        return {
            'info': response,
            'symbol': symbol,
            'maker': this.safeNumber (response, 'userAddRate'),
            'taker': this.safeNumber (response, 'userCrossRate'),
            'percentage': true,
            'tierBased': true,
        };
    }

    async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        /**
         * @method
         * @name fibe#fetchTicker
         * @description fetches a price ticker, 24h volume, and 24h change for a spot market
         * @see https://fb-4b8448ac.alephium.org/api/v1/spot-asset-ctx
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const request: Dict = {
            'marketIndex': this.safeString (info, 'marketIndex'),
        };
        const response = await this.publicGetSpotAssetCtx (this.extend (request, params));
        return this.parseTicker (response, market);
    }

    async fetchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        /**
         * @method
         * @name fibe#fetchTickers
         * @description fetches price tickers for multiple spot markets
         * @see https://fb-4b8448ac.alephium.org/api/v1/spot-asset-ctx
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch tickers for, all market tickers are returned if not assigned
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols);
        if (symbols === undefined) {
            symbols = Object.keys (this.markets);
        }
        const result: Tickers = {};
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            result[symbol] = await this.fetchTicker (symbol, params);
        }
        return result;
    }

    parseTicker (ticker: Dict, market: Market = undefined): Ticker {
        //
        //     {
        //         "midPx": "8.4557",
        //         "bidPx": "8.4556",
        //         "bidSz": "12.3",
        //         "askPx": "8.4558",
        //         "askSz": "45.6",
        //         "midPx24hAgo": "8.8097",
        //         "bv24h": "95734.1",
        //         "qv24h": "809774.565507"
        //     }
        //
        const last = this.safeString (ticker, 'midPx');
        const open = this.safeString (ticker, 'midPx24hAgo');
        let change = undefined;
        let percentage = undefined;
        if ((last !== undefined) && (open !== undefined)) {
            change = Precise.stringSub (last, open);
            percentage = Precise.stringMul (Precise.stringDiv (change, open), '100');
        }
        return this.safeTicker ({
            'symbol': this.safeSymbol (undefined, market),
            'timestamp': undefined,
            'datetime': undefined,
            'high': undefined,
            'low': undefined,
            'bid': this.safeString (ticker, 'bidPx'),
            'bidVolume': this.safeString (ticker, 'bidSz'),
            'ask': this.safeString (ticker, 'askPx'),
            'askVolume': this.safeString (ticker, 'askSz'),
            'vwap': undefined,
            'open': open,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': change,
            'percentage': percentage,
            'average': undefined,
            'baseVolume': this.safeString (ticker, 'bv24h'),
            'quoteVolume': this.safeString (ticker, 'qv24h'),
            'info': ticker,
        }, market);
    }

    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        /**
         * @method
         * @name fibe#fetchOrderBook
         * @description fetches L2 order book for a market
         * @see https://fb-4b8448ac.alephium.org/api/v1/l2book
         * @param {string} symbol unified market symbol
         * @param {int} [limit] the maximum number of order book levels to return per side (applied client-side)
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.priceStep] price aggregation step (defaults to the market tick size)
         * @returns {object} an order book structure
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        let priceStep = undefined;
        [ priceStep, params ] = this.handleOptionAndParams (params, 'fetchOrderBook', 'priceStep');
        if (priceStep === undefined) {
            // priceStep is in human price units; the server scales it by 10**quoteDecimals.
            // the market tick (precision.price) is the finest valid step.
            priceStep = this.numberToString (market['precision']['price']);
        }
        const request: Dict = {
            'marketIndex': this.safeString (info, 'marketIndex'),
            'marketType': market['spot'] ? 'S' : 'P',
            'priceStep': priceStep,
        };
        const response = await this.publicGetL2book (this.extend (request, params));
        //
        //     {
        //         "marketIndex": "1",
        //         "marketType": "S",
        //         "ps": "100000",
        //         "bids": [ { "px": "123.40", "sz": "15.2" }, ... ],
        //         "asks": [ { "px": "123.50", "sz": "10.5" }, ... ]
        //     }
        //
        let book = response;
        if (Array.isArray (response)) {
            book = this.safeDict (response, 0, {});
        }
        const orderbook = this.parseOrderBook (book, symbol, undefined, 'bids', 'asks', 'px', 'sz');
        if (limit !== undefined) {
            orderbook['bids'] = this.arraySlice (orderbook['bids'], 0, limit);
            orderbook['asks'] = this.arraySlice (orderbook['asks'], 0, limit);
        }
        return orderbook;
    }

    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name fibe#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @see https://fb-4b8448ac.alephium.org/api/v1/recent-market-trades
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const request: Dict = {
            'marketIndex': this.safeString (info, 'marketIndex'),
            'marketType': market['spot'] ? 'S' : 'P',
        };
        const response = await this.publicGetRecentMarketTrades (this.extend (request, params));
        return this.parseTrades (response, market, since, limit);
    }

    parseTrade (trade: Dict, market: Market = undefined): Trade {
        //
        //     {
        //         "marketIndex": "1",
        //         "marketType": "S",
        //         "px": "1789.6",
        //         "side": "A",
        //         "sz": "0.00001",
        //         "oid": "284572983127444820",
        //         "time": 1781672971,
        //         "txId": "3QNbQR27r5fgxbFLAX4nMuvMvV6KRHQcPHYFrzoh3RdKzUcBejatrJBfpf1FYyQzGcVhee1DqgEaGzCngMxXaoRq"
        //     }
        //
        const timestamp = this.safeTimestamp (trade, 'time');
        const side = this.parseSide (this.safeString (trade, 'side'));
        return this.safeTrade ({
            'info': trade,
            'id': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': this.safeSymbol (undefined, market),
            'order': this.safeString (trade, 'oid'),
            'type': undefined,
            'side': side,
            'takerOrMaker': undefined,
            'price': this.safeString (trade, 'px'),
            'amount': this.safeString (trade, 'sz'),
            'cost': undefined,
            'fee': undefined,
        }, market);
    }

    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        /**
         * @method
         * @name fibe#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @see https://fb-4b8448ac.alephium.org/api/v1/candles
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {int} [params.until] timestamp in ms of the latest candle to fetch
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const duration = this.parseTimeframe (timeframe);
        const requestLimit = (limit === undefined) ? 100 : limit;
        let until: Int = undefined;
        [ until, params ] = this.handleOptionAndParams (params, 'fetchOHLCV', 'until');
        let endTimestamp = (until === undefined) ? this.seconds () : this.parseToInt (until / 1000);
        let startTimestamp = endTimestamp - (requestLimit * duration);
        if (since !== undefined) {
            startTimestamp = this.parseToInt (since / 1000);
            if (until === undefined) {
                endTimestamp = Math.min (startTimestamp + (requestLimit * duration), this.seconds ());
            }
        }
        const request: Dict = {
            'marketIndex': this.safeString (info, 'marketIndex'),
            'marketType': market['spot'] ? 'S' : 'P',
            'startTimestamp': startTimestamp,
            'endTimestamp': endTimestamp,
            'interval': this.safeString (this.timeframes, timeframe, timeframe),
        };
        const response = await this.publicGetCandles (this.extend (request, params));
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    parseOHLCV (ohlcv, market: Market = undefined): OHLCV {
        //
        //     {
        //         "marketIndex": "1",
        //         "marketType": "S",
        //         "t": 1781670900,
        //         "T": 1781670959,
        //         "o": "1793.6",
        //         "c": "1790.7",
        //         "l": "1790.7",
        //         "h": "1793.6",
        //         "bv": "0.21866999999999998",
        //         "qv": "392.00005",
        //         "n": 9
        //     }
        //
        return [
            this.safeTimestamp (ohlcv, 't'),
            this.safeNumber (ohlcv, 'o'),
            this.safeNumber (ohlcv, 'h'),
            this.safeNumber (ohlcv, 'l'),
            this.safeNumber (ohlcv, 'c'),
            this.safeNumber (ohlcv, 'bv'),
        ];
    }

    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name fibe#fetchOpenOrders
         * @description fetch all unfilled currently open orders
         * @see https://fb-4b8448ac.alephium.org/api/v1/open-orders
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch open orders for
         * @param {int} [limit] the maximum number of open orders structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.user] user address, will default to this.walletAddress if not provided
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchOpenOrders', params);
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const request: Dict = {
            'user': userAddress,
        };
        const response = await this.publicGetOpenOrders (this.extend (request, params));
        return this.parseOrders (response, market, since, limit);
    }

    async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name fibe#fetchOrders
         * @description fetch historical orders
         * @see https://fb-4b8448ac.alephium.org/api/v1/historical-orders
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.user] user address, will default to this.walletAddress if not provided
         * @param {int} [params.page] page number, default is 1
         * @param {int} [params.pageSize] page size, default is limit when provided
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchOrders', params);
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        let page = undefined;
        [ page, params ] = this.handleOptionAndParams (params, 'fetchOrders', 'page');
        let pageSize = undefined;
        [ pageSize, params ] = this.handleOptionAndParams (params, 'fetchOrders', 'pageSize', limit);
        const request: Dict = {
            'user': userAddress,
        };
        if (page !== undefined) {
            request['page'] = page;
        }
        if (pageSize !== undefined) {
            request['pageSize'] = pageSize;
        }
        const response = await this.publicGetHistoricalOrders (this.extend (request, params));
        return this.parseOrders (response, market, since, limit);
    }

    parseOrder (order: Dict, market: Market = undefined): Order {
        //
        //     {
        //         "marketIndex": "1",
        //         "marketType": "S",
        //         "oid": "1",
        //         "type": "L",
        //         "timeInForce": "PostOnly",
        //         "px": "1",
        //         "side": "B",
        //         "origSz": "1",
        //         "sz": "1",
        //         "status": "O",
        //         "txId": "3WF7T6Hmyrpdo1MMUghDnv1LaVwmKuEM1duJ3VaU5fCUhSfudqtu4JCP3kCTnjqDUqBb1hcTtk5cNF4BYkCQv2mH",
        //         "createdAt": 1,
        //         "updatedAt": 1
        //     }
        //
        const marketIndex = this.safeString (order, 'marketIndex');
        const marketType = this.safeString (order, 'marketType');
        let marketId = undefined;
        if (marketIndex !== undefined) {
            const idPrefix = (marketType === 'P') ? 'perp:' : 'spot:';
            marketId = idPrefix + marketIndex;
        }
        market = this.safeMarket (marketId, market);
        const timestamp = this.parseOrderTimestamp (order, 'createdAt');
        const lastUpdateTimestamp = this.parseOrderTimestamp (order, 'updatedAt');
        const amount = this.safeString (order, 'origSz');
        const remaining = this.safeString (order, 'sz');
        let filled = undefined;
        if ((amount !== undefined) && (remaining !== undefined)) {
            filled = Precise.stringSub (amount, remaining);
        }
        const timeInForce = this.parseOrderTimeInForce (this.safeString (order, 'timeInForce'));
        let postOnly = undefined;
        if (timeInForce === 'PO') {
            postOnly = true;
        }
        return this.safeOrder ({
            'info': order,
            'id': this.safeString (order, 'oid'),
            'clientOrderId': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'lastUpdateTimestamp': lastUpdateTimestamp,
            'symbol': market['symbol'],
            'type': this.parseOrderType (this.safeString (order, 'type')),
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'reduceOnly': undefined,
            'side': this.parseSide (this.safeString (order, 'side')),
            'price': this.safeString (order, 'px'),
            'triggerPrice': undefined,
            'amount': amount,
            'cost': undefined,
            'average': undefined,
            'filled': filled,
            'remaining': remaining,
            'status': this.parseOrderStatus (this.safeString (order, 'status')),
            'fee': undefined,
            'trades': undefined,
        }, market);
    }

    parseOrderStatus (status: Str): Str {
        const statuses: Dict = {
            'O': 'open',
            'F': 'closed',
            'C': 'canceled',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrderType (type: Str): Str {
        const types: Dict = {
            'L': 'limit',
            'M': 'market',
        };
        return this.safeString (types, type, type);
    }

    parseOrderTimeInForce (timeInForce: Str): Str {
        const timeInForces: Dict = {
            'Gtc': 'GTC',
            'Ioc': 'IOC',
            'Fok': 'FOK',
            'PostOnly': 'PO',
        };
        return this.safeString (timeInForces, timeInForce, timeInForce);
    }

    parseSide (side: Str): Str {
        const sides: Dict = {
            'B': 'buy',
            'A': 'sell',
        };
        return this.safeString (sides, side, side);
    }

    parseOrderTimestamp (order: Dict, key: string): Int {
        const timestamp = this.safeInteger (order, key);
        if (timestamp === undefined) {
            return undefined;
        }
        return timestamp * 1000;
    }

    handlePublicAddress (methodName: string, params: Dict) {
        let user = undefined;
        [ user, params ] = this.handleOptionAndParams2 (params, methodName, 'user', 'address');
        if ((user !== undefined) && (user !== '')) {
            return [ user, params ];
        }
        if ((this.walletAddress !== undefined) && (this.walletAddress !== '')) {
            return [ this.walletAddress, params ];
        }
        throw new ArgumentsRequired (this.id + ' ' + methodName + '() requires a user parameter inside \'params\' or the wallet address set');
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api']['rest'] + '/' + path;
        const query = this.urlencode (params);
        if (method === 'GET') {
            if (query.length) {
                url += '?' + query;
            }
        } else {
            headers = {
                'Content-Type': 'application/json',
            };
            body = this.json (params);
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return undefined;
        }
        // map Fibe error bodies to ccxt exceptions here
        return undefined;
    }
}
