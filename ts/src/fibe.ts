
//  ---------------------------------------------------------------------------

import Exchange from './abstract/fibe.js';
import { TICK_SIZE } from './base/functions/number.js';
import { Precise } from './base/Precise.js';
import type { Dict, Market, OrderBook, Int, int } from './base/types.js';

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
                'fetchTicker': false,
                'fetchTickers': false,
                'fetchOrderBook': true,
                'fetchTrades': false,
                'fetchOHLCV': false,
                'fetchBalance': false,
                'fetchOpenOrders': false,
                'fetchOrders': false,
                'fetchTradingFees': false,
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
