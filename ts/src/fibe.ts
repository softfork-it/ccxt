
//  ---------------------------------------------------------------------------

import Exchange from './abstract/fibe.js';
import { ArgumentsRequired, AuthenticationError, BadRequest, ExchangeError, InvalidOrder, OrderNotFound, RateLimitExceeded } from './base/errors.js';
import { TICK_SIZE } from './base/functions/number.js';
import { eddsa } from './base/functions/crypto.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';
import { ed25519 } from './static_dependencies/noble-curves/ed25519.js';
import { Precise } from './base/Precise.js';
import type { Balances, Dict, FundingHistory, FundingRate, FundingRates, Market, Num, OHLCV, Order, OrderBook, OrderSide, OrderType, Position, Strings, Ticker, Tickers, Trade, TradingFeeInterface, TradingFees, Str, Int, int } from './base/types.js';

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
            'certified': false,
            // The API budget is 1200 weighted units/minute; standard endpoints cost 7 units.
            'rateLimit': 500,
            'version': 'v1',
            'dex': true,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': true,
                'future': false,
                'option': false,
                'cancelAllOrders': true,
                'cancelAllOrdersAfter': false,
                'cancelOrder': true,
                'cancelOrders': true,
                'closeAllPositions': false,
                'closePosition': false,
                'createMarketBuyOrderWithCost': false,
                'createMarketOrderWithCost': false,
                'createMarketSellOrderWithCost': false,
                'createOrder': true,
                'createOrders': false,
                'createPostOnlyOrder': true,
                'createReduceOnlyOrder': false,
                'createStopOrder': false,
                'editOrder': false,
                'fetchBalance': true,
                'fetchBidsAsks': 'emulated',
                'fetchCanceledOrders': true,
                'fetchClosedOrders': true,
                'fetchCurrencies': false,
                'fetchFundingHistory': true,
                'fetchFundingRate': true,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': true,
                'fetchMarkets': true,
                'fetchMarkPrice': 'emulated',
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenInterest': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrderBooks': false,
                'fetchOrders': true,
                'fetchPosition': true,
                'fetchPositions': true,
                'fetchStatus': false,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTime': false,
                'fetchTrades': true,
                'fetchTradingFee': true,
                'fetchTradingFees': true,
                'sandbox': false,
                'setLeverage': false,
                'setMarginMode': false,
                'setPositionMode': false,
            },
            'features': {
                'default': {
                    'sandbox': false,
                    'createOrder': {
                        'marginMode': false,
                        'triggerPrice': false,
                        'triggerPriceType': undefined,
                        'stopLossPrice': false,
                        'takeProfitPrice': false,
                        'attachedStopLossTakeProfit': undefined,
                        'timeInForce': {
                            'IOC': true,
                            'FOK': true,
                            'PO': true,
                            'GTD': false,
                        },
                        'hedged': false,
                        'trailing': false,
                        'leverage': false,
                        'marketBuyByCost': false,
                        'marketBuyRequiresPrice': false,
                        'selfTradePrevention': false,
                        'iceberg': false,
                    },
                    'createOrders': undefined,
                    'fetchMyTrades': {
                        'marginMode': false,
                        'limit': 1000,
                        'daysBack': undefined,
                        'untilDays': undefined,
                        'symbolRequired': false,
                    },
                    'fetchOrder': {
                        'marginMode': false,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': true,
                    },
                    'fetchOpenOrders': {
                        'marginMode': false,
                        'limit': undefined,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': false,
                    },
                    'fetchOrders': {
                        'marginMode': false,
                        'limit': undefined,
                        'daysBack': undefined,
                        'untilDays': undefined,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': false,
                    },
                    'fetchClosedOrders': {
                        'marginMode': false,
                        'limit': undefined,
                        'daysBack': undefined,
                        'daysBackCanceled': undefined,
                        'untilDays': undefined,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': false,
                    },
                    'fetchOHLCV': {
                        'limit': 5000,
                    },
                },
                'forPerps': {
                    'extends': 'default',
                    'createOrder': {
                        'marginMode': true,
                        'leverage': true,
                    },
                },
                'spot': {
                    'extends': 'default',
                },
                'swap': {
                    'linear': {
                        'extends': 'forPerps',
                    },
                    'inverse': undefined,
                },
            },
            'options': {
                'rpcUrl': 'https://api.devnet.solana.com',
            },
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
                'logo': 'https://avatars.githubusercontent.com/u/222646239?v=4',
                'api': {
                    'rest': 'https://fb-4b8448ac.alephium.org/api/v1',
                },
                'www': 'https://fibe.exchange',
                'doc': 'https://fb-4b8448ac.alephium.org/swagger-ui/',
            },
            'api': {
                'public': {
                    'get': {
                        'markets': 1,
                        'market': 1,
                        'all-mids': 1,
                        'spot-asset-ctx': 1,
                        'perp-asset-ctx': 1,
                        'l2book': 1,
                        'recent-market-trades': 1,
                        'candles': 1,
                        'order': 1,
                        'open-orders': 1,
                        'historical-orders': 1,
                        'spot-state': 1,
                        'clearinghouse-state': 1,
                        'all-clearinghouse-state': 1,
                        'user-fees': 1,
                        'user-funding-history': 1,
                        'user-trades': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    // Devnet markets currently use FeeStructure::default(); user-specific rates come from fetchTradingFees().
                    'tierBased': true,
                    'percentage': true,
                    'taker': this.parseNumber ('0'),
                    'maker': this.parseNumber ('0'),
                },
            },
            'requiredCredentials': {
                'apiKey': false,
                'secret': false,
                'walletAddress': true,
                'privateKey': true,
            },
            'precisionMode': TICK_SIZE,
            'exceptions': {
                'exact': {
                    '400': BadRequest,
                    '404': OrderNotFound,
                    '429': RateLimitExceeded,
                    '500': ExchangeError,
                },
                'broad': {
                    'Rate limit exceeded': RateLimitExceeded,
                    'invalid user': BadRequest,
                    'order not found': OrderNotFound,
                },
            },
        });
    }

    /**
     * @method
     * @name fibe#fetchMarkets
     * @description retrieves data on all markets for fibe
     * @see https://fb-4b8448ac.alephium.org/api/v1/markets
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} an array of objects representing market data
     */
    async fetchMarkets (params = {}): Promise<Market[]> {
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
        //             "mi": "0",
        //             "quoteDecimals": 6,
        //             "quoteMint": "EPjFW...TDt1v",
        //             "tickSizeInQuoteBaseUnits": 100,
        //             "mt": "S"                // "S" spot | "P" perp
        //         }
        //     ]
        //
        return this.parseMarkets (response);
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
        const mt = this.safeString (market, 'mt');
        const isPerp = (mt === 'P');
        const mi = this.safeString (market, 'mi');
        let idPrefix = 'spot:';
        if (isPerp) {
            idPrefix = 'perp:';
        }
        const id = idPrefix + mi;
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
        let linear = undefined;
        let inverse = undefined;
        let contractSize = undefined;
        if (isPerp) {
            linear = true;
            inverse = false;
            contractSize = this.parseNumber ('1');
        }
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
            'linear': linear,
            'inverse': inverse,
            'contractSize': contractSize,
            'taker': this.fees['trading']['taker'],
            'maker': this.fees['trading']['maker'],
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
                'leverage': { 'min': undefined, 'max': this.safeNumber (market, 'maxLeverage') },
                'amount': { 'min': amountPrecision, 'max': undefined },
                'price': { 'min': pricePrecision, 'max': undefined },
                'cost': { 'min': undefined, 'max': undefined },
            },
            'created': undefined,
            'info': this.extend (market, {
                'mi': mi,
                'mt': mt,
            }),
        });
    }

    /**
     * @method
     * @name fibe#fetchBalance
     * @description query spot funds held by open orders for a user, free and total wallet balances are not exposed by this endpoint
     * @see https://fb-4b8448ac.alephium.org/api/v1/spot-state
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
     */
    async fetchBalance (params = {}): Promise<Balances> {
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

    /**
     * @method
     * @name fibe#fetchPositions
     * @description fetch open perp positions for a user
     * @see https://fb-4b8448ac.alephium.org/api/v1/all-clearinghouse-state
     * @param {string[]|undefined} symbols list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    async fetchPositions (symbols: Strings = undefined, params = {}): Promise<Position[]> {
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchPositions', params);
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols, 'swap');
        const request: Dict = {
            'user': userAddress,
        };
        const response = await this.publicGetAllClearinghouseState (this.extend (request, params));
        //
        //     {
        //         "user": "11111111111111111111111111111111",
        //         "states": [
        //             {
        //                 "user": "11111111111111111111111111111111",
        //                 "subAccountIndex": 2,
        //                 "quoteMint": "11111111111111111111111111111111",
        //                 "clearinghouseState": {
        //                     "assetPositions": [
        //                         {
        //                             "mi": "1",
        //                             "entryPx": "1.2",
        //                             "leverage": { "type": "cross", "value": 3 },
        //                             "liquidationPx": "4.5",
        //                             "marginUsed": "6.7",
        //                             "positionValue": "8.9",
        //                             "returnOnEquity": "1.1",
        //                             "szi": "2.3",
        //                             "unrealizedPnl": "-4.5"
        //                         }
        //                     ]
        //                 }
        //             }
        //         ]
        //     }
        //
        const states = this.safeList (response, 'states', []);
        const result = [];
        for (let i = 0; i < states.length; i++) {
            const state = states[i];
            const clearinghouseState = this.safeDict (state, 'clearinghouseState', {});
            const positions = this.safeList (clearinghouseState, 'assetPositions', []);
            for (let j = 0; j < positions.length; j++) {
                const position = this.extend ({
                    'user': this.safeString (state, 'user'),
                    'subAccountIndex': this.safeInteger (state, 'subAccountIndex'),
                    'quoteMint': this.safeString (state, 'quoteMint'),
                }, positions[j]);
                result.push (this.parsePosition (position));
            }
        }
        return this.filterByArrayPositions (result, 'symbol', symbols, false);
    }

    /**
     * @method
     * @name fibe#fetchPosition
     * @description fetch an open perp position for a market
     * @see https://fb-4b8448ac.alephium.org/api/v1/all-clearinghouse-state
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {object} a [position structure]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    async fetchPosition (symbol: string, params = {}): Promise<Position> {
        const positions = await this.fetchPositions ([ symbol ], params);
        return this.safeDict (positions, 0, {}) as Position;
    }

    parsePosition (position: Dict, market: Market = undefined): Position {
        //
        //     {
        //         "user": "11111111111111111111111111111111",
        //         "subAccountIndex": 2,
        //         "quoteMint": "11111111111111111111111111111111",
        //         "mi": "1",
        //         "entryPx": "1.2",
        //         "leverage": { "type": "cross", "value": 3 },
        //         "liquidationPx": "4.5",
        //         "markPx": "5.6",
        //         "marginUsed": "6.7",
        //         "maintenanceMargin": "7.8",
        //         "positionValue": "8.9",
        //         "returnOnEquity": "1.1",
        //         "szi": "2.3",
        //         "unrealizedPnl": "-4.5",
        //         "maxLeverage": 10
        //     }
        //
        const mi = this.safeString (position, 'mi');
        let marketId = undefined;
        if (mi !== undefined) {
            marketId = 'perp:' + mi;
        }
        market = this.safeMarket (marketId, market);
        const leverage = this.safeDict (position, 'leverage', {});
        const marginMode = this.safeString (leverage, 'type');
        const size = this.safeString (position, 'szi');
        let side = undefined;
        if (Precise.stringGt (size, '0')) {
            side = 'long';
        } else if (Precise.stringLt (size, '0')) {
            side = 'short';
        }
        const marginUsed = this.safeString (position, 'marginUsed');
        const returnOnEquity = this.safeString (position, 'returnOnEquity');
        let percentage = undefined;
        if (returnOnEquity !== undefined) {
            percentage = Precise.stringMul (returnOnEquity, '100');
        }
        return this.safePosition ({
            'info': position,
            'id': undefined,
            'symbol': market['symbol'],
            'timestamp': undefined,
            'datetime': undefined,
            'contracts': this.parseNumber (Precise.stringAbs (size)),
            'contractSize': this.safeNumber (market, 'contractSize'),
            'side': side,
            'notional': this.safeNumber (position, 'positionValue'),
            'leverage': this.safeNumber (leverage, 'value'),
            'unrealizedPnl': this.safeNumber (position, 'unrealizedPnl'),
            'realizedPnl': undefined,
            'collateral': this.parseNumber (marginUsed),
            'entryPrice': this.safeNumber (position, 'entryPx'),
            'markPrice': this.safeNumber (position, 'markPx'),
            'liquidationPrice': this.safeNumber (position, 'liquidationPx'),
            'marginMode': marginMode,
            'hedged': undefined,
            'maintenanceMargin': this.safeNumber (position, 'maintenanceMargin'),
            'maintenanceMarginPercentage': undefined,
            'initialMargin': this.parseNumber (marginUsed),
            'initialMarginPercentage': undefined,
            'marginRatio': undefined,
            'lastUpdateTimestamp': undefined,
            'lastPrice': undefined,
            'stopLossPrice': undefined,
            'takeProfitPrice': undefined,
            'percentage': this.parseNumber (percentage),
        });
    }

    /**
     * @method
     * @name fibe#fetchFundingHistory
     * @description fetch the history of funding payments paid and received on this account
     * @see https://fb-4b8448ac.alephium.org/api/v1/user-funding-history
     * @param {string} [symbol] unified market symbol
     * @param {int} [since] the earliest time in ms to fetch funding history for
     * @param {int} [limit] the maximum number of funding history structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.until] the latest time in ms to fetch funding history for
     * @returns {object[]} a list of [funding history structures]{@link https://docs.ccxt.com/#/?id=funding-history-structure}
     */
    async fetchFundingHistory (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<FundingHistory[]> {
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchFundingHistory', params);
        let until: Int = undefined;
        [ until, params ] = this.handleOptionAndParams (params, 'fetchFundingHistory', 'until');
        let startTime = 0;
        if (since !== undefined) {
            startTime = this.parseToInt (since / 1000);
        }
        const request: Dict = {
            'user': userAddress,
            'startTime': startTime,
        };
        if (until !== undefined) {
            request['endTime'] = this.parseToInt (until / 1000);
        }
        const response = await this.publicGetUserFundingHistory (this.extend (request, params));
        return this.parseIncomes (response, market, since, limit) as FundingHistory[];
    }

    parseIncome (income, market: Market = undefined) {
        //
        //     {
        //         "time": 1781672400,
        //         "mi": "1",
        //         "mt": "P",
        //         "usdc": "2.3",
        //         "szi": "4.5",
        //         "fundingRate": "6.7" // funding index delta, omitted from parsed output
        //     }
        //
        const mi = this.safeString (income, 'mi');
        const mt = this.safeString (income, 'mt');
        let marketId = undefined;
        if (mi !== undefined) {
            let idPrefix = 'spot:';
            if (mt === 'P') {
                idPrefix = 'perp:';
            }
            marketId = idPrefix + mi;
        }
        market = this.safeMarket (marketId, market);
        const timestamp = this.safeTimestamp (income, 'time');
        return {
            'info': income,
            'symbol': market['symbol'],
            'code': this.safeString (market, 'settle', 'USDC'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'id': undefined,
            'amount': this.safeNumber (income, 'usdc'),
        };
    }

    /**
     * @method
     * @name fibe#fetchTradingFees
     * @description fetch the user trading fees for all loaded markets
     * @see https://fb-4b8448ac.alephium.org/api/v1/user-fees
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {object} a dictionary of [fee structures]{@link https://docs.ccxt.com/#/?id=fee-structure} indexed by market symbols
     */
    async fetchTradingFees (params = {}): Promise<TradingFees> {
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

    /**
     * @method
     * @name fibe#fetchTradingFee
     * @description fetch the user trading fees for one market
     * @see https://fb-4b8448ac.alephium.org/api/v1/user-fees
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {object} a [fee structure]{@link https://docs.ccxt.com/#/?id=fee-structure}
     */
    async fetchTradingFee (symbol: string, params = {}): Promise<TradingFeeInterface> {
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchTradingFee', params);
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const request: Dict = {
            'user': userAddress,
            'mi': this.safeString (info, 'mi'),
            'mt': this.safeString (info, 'mt', 'S'),
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

    /**
     * @method
     * @name fibe#fetchTicker
     * @description fetches a midpoint-based price ticker, 24h volume, and 24h change for a market
     * @see https://fb-4b8448ac.alephium.org/api/v1/spot-asset-ctx
     * @see https://fb-4b8448ac.alephium.org/api/v1/perp-asset-ctx
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
        };
        let response = undefined;
        if (market['spot']) {
            response = await this.publicGetSpotAssetCtx (this.extend (request, params));
        } else {
            response = await this.publicGetPerpAssetCtx (this.extend (request, params));
        }
        return this.parseTicker (response, market);
    }

    /**
     * @method
     * @name fibe#fetchTickers
     * @description fetches price tickers for multiple markets
     * @see https://fb-4b8448ac.alephium.org/api/v1/spot-asset-ctx
     * @see https://fb-4b8448ac.alephium.org/api/v1/perp-asset-ctx
     * @param {string[]|undefined} symbols unified symbols of the markets to fetch tickers for, all market tickers are returned if not assigned
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async fetchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols);
        if (symbols === undefined) {
            symbols = Object.keys (this.markets);
        }
        const result = {};
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            result[symbol] = await this.fetchTicker (symbol, params);
        }
        return result;
    }

    /**
     * @method
     * @name fibe#fetchBidsAsks
     * @description fetches the bid and ask price and volume for multiple markets
     * @param {string[]|undefined} symbols unified symbols of the markets to fetch bids and asks for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async fetchBidsAsks (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        return await this.fetchTickers (symbols, params);
    }

    /**
     * @method
     * @name fibe#fetchMarkPrice
     * @description fetches the current mark price for a perpetual market
     * @see https://fb-4b8448ac.alephium.org/api/v1/perp-asset-ctx
     * @param {string} symbol unified symbol of the market
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async fetchMarkPrice (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (!market['swap']) {
            throw new ExchangeError (this.id + ' fetchMarkPrice() is only valid for swap markets');
        }
        return await this.fetchTicker (symbol, params);
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
        //         "qv24h": "809774.565507",
        //         "markPx": "8.4542",
        //         "oraclePx": "8.4585"
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
            'indexPrice': this.safeString (ticker, 'oraclePx'),
            'markPrice': this.safeString (ticker, 'markPx'),
        }, market);
    }

    /**
     * @method
     * @name fibe#fetchOpenInterest
     * @description retrieves the current open interest for a perpetual market
     * @see https://fb-4b8448ac.alephium.org/api/v1/perp-asset-ctx
     * @param {string} symbol unified symbol of the market
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} an [open interest structure]{@link https://docs.ccxt.com/#/?id=open-interest-structure}
     */
    async fetchOpenInterest (symbol: string, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (!market['swap']) {
            throw new ExchangeError (this.id + ' fetchOpenInterest() is only valid for swap markets');
        }
        const info = market['info'];
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
        };
        const response = await this.publicGetPerpAssetCtx (this.extend (request, params));
        return this.parseOpenInterest (response, market);
    }

    parseOpenInterest (interest, market: Market = undefined) {
        const openInterest = this.safeString (interest, 'openInterest');
        const markPrice = this.safeString (interest, 'markPx');
        let openInterestValue = undefined;
        if ((openInterest !== undefined) && (markPrice !== undefined)) {
            openInterestValue = Precise.stringMul (openInterest, markPrice);
        }
        return this.safeOpenInterest ({
            'symbol': this.safeSymbol (undefined, market),
            'openInterestAmount': openInterest,
            'openInterestValue': openInterestValue,
            'timestamp': undefined,
            'datetime': undefined,
            'info': interest,
        }, market);
    }

    /**
     * @method
     * @name fibe#fetchFundingRate
     * @description fetch the current funding rate
     * @see https://fb-4b8448ac.alephium.org/api/v1/perp-asset-ctx
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [funding rate structure]{@link https://docs.ccxt.com/#/?id=funding-rate-structure}
     */
    async fetchFundingRate (symbol: string, params = {}): Promise<FundingRate> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (!market['swap']) {
            throw new ExchangeError (this.id + ' fetchFundingRate() is only valid for swap markets');
        }
        const info = market['info'];
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
        };
        const response = await this.publicGetPerpAssetCtx (this.extend (request, params));
        return this.parseFundingRate (response, market);
    }

    /**
     * @method
     * @name fibe#fetchFundingRates
     * @description fetches the current funding rates for multiple swap markets
     * @see https://fb-4b8448ac.alephium.org/api/v1/perp-asset-ctx
     * @param {string[]} [symbols] unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary of [funding rates structures]{@link https://docs.ccxt.com/#/?id=funding-rates-structure}
     */
    async fetchFundingRates (symbols: Strings = undefined, params = {}): Promise<FundingRates> {
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols, 'swap');
        if (symbols === undefined) {
            symbols = [];
            const marketSymbols = Object.keys (this.markets);
            for (let i = 0; i < marketSymbols.length; i++) {
                const symbol = marketSymbols[i];
                if (this.markets[symbol]['swap']) {
                    symbols.push (symbol);
                }
            }
        }
        const result = {};
        for (let i = 0; i < symbols.length; i++) {
            const fundingRate = await this.fetchFundingRate (symbols[i], params);
            result[symbols[i]] = fundingRate;
        }
        return result;
    }

    parseFundingRate (contract: any, market: Market = undefined): FundingRate {
        //
        //     {
        //         "midPx": "1730",
        //         "markPx": "1730.4",
        //         "oraclePx": "1730.1",
        //         "funding": "0.000012",
        //         "premium": "0.000337"
        //     }
        //
        return {
            'info': contract,
            'symbol': this.safeSymbol (undefined, market),
            'markPrice': this.safeNumber (contract, 'markPx'),
            'indexPrice': this.safeNumber (contract, 'oraclePx'),
            'interestRate': undefined,
            'estimatedSettlePrice': undefined,
            'timestamp': undefined,
            'datetime': undefined,
            'fundingRate': this.safeNumber (contract, 'funding'),
            'fundingTimestamp': undefined,
            'fundingDatetime': undefined,
            'nextFundingRate': undefined,
            'nextFundingTimestamp': undefined,
            'nextFundingDatetime': undefined,
            'previousFundingRate': undefined,
            'previousFundingTimestamp': undefined,
            'previousFundingDatetime': undefined,
            'interval': '1h',
        } as FundingRate;
    }

    /**
     * @method
     * @name fibe#fetchOrderBook
     * @description fetches L2 order book for a market
     * @see https://fb-4b8448ac.alephium.org/api/v1/l2book
     * @param {string} symbol unified market symbol
     * @param {int} [limit] the maximum number of order book levels to return per side (applied client-side)
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.nSigFigs] price aggregation significant figures, valid values are 2, 3, 4, or 5
     * @param {int} [params.mantissa] price aggregation mantissa, valid values are 1, 2, or 5 and require nSigFigs to be 5
     * @returns {object} an order book structure
     */
    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        let mt = 'P';
        if (market['spot']) {
            mt = 'S';
        }
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
            'mt': mt,
        };
        const response = await this.publicGetL2book (this.extend (request, params));
        //
        //     {
        //         "mi": "1",
        //         "mt": "S",
        //         "nSigFigs": 5,
        //         "mantissa": 2,
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
    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        let mt = 'P';
        if (market['spot']) {
            mt = 'S';
        }
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
            'mt': mt,
        };
        const response = await this.publicGetRecentMarketTrades (this.extend (request, params));
        return this.parseTrades (response, market, since, limit);
    }

    /**
     * @method
     * @name fibe#fetchMyTrades
     * @description fetch all trades made by the user
     * @see https://fb-4b8448ac.alephium.org/api/v1/user-trades
     * @param {string} [symbol] unified market symbol
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum amount of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.until] timestamp in ms of the latest trade to fetch
     * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
     */
    async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchMyTrades', params);
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {
            'user': userAddress,
        };
        if (symbol !== undefined) {
            market = this.market (symbol);
            const info = market['info'];
            request['mi'] = this.safeString (info, 'mi');
            request['mt'] = this.safeString (info, 'mt', 'S');
        }
        if (since !== undefined) {
            request['startTime'] = this.parseToInt (since / 1000);
        }
        let until: Int = undefined;
        [ until, params ] = this.handleOptionAndParams (params, 'fetchMyTrades', 'until');
        if (until !== undefined) {
            request['endTime'] = this.parseToInt (Math.ceil (until / 1000));
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.publicGetUserTrades (this.extend (request, params));
        let trades = this.parseTrades (response, market, since, undefined);
        if (until !== undefined) {
            const filtered = [];
            for (let i = 0; i < trades.length; i++) {
                const trade = trades[i];
                const timestamp = this.safeInteger (trade, 'timestamp');
                if ((timestamp !== undefined) && (timestamp <= until)) {
                    filtered.push (trade);
                }
            }
            trades = filtered;
        }
        return this.filterBySinceLimit (trades, since, limit) as Trade[];
    }

    parseTrade (trade: Dict, market: Market = undefined): Trade {
        //
        //     {
        //         "mi": "1",
        //         "mt": "S",
        //         "px": "1789.6",
        //         "side": "A",
        //         "sz": "0.00001",
        //         "oid": "284572983127444820",
        //         "time": 1781672971,
        //         "txId": "3QNbQR27r5fgxbFLAX4nMuvMvV6KRHQcPHYFrzoh3RdKzUcBejatrJBfpf1FYyQzGcVhee1DqgEaGzCngMxXaoRq"
        //     }
        //
        const mi = this.safeString (trade, 'mi');
        const mt = this.safeString (trade, 'mt');
        let marketId = undefined;
        if (mi !== undefined) {
            let idPrefix = 'spot:';
            if (mt === 'P') {
                idPrefix = 'perp:';
            }
            marketId = idPrefix + mi;
        }
        market = this.safeMarket (marketId, market);
        const timestamp = this.safeTimestamp (trade, 'time');
        const side = this.parseSide (this.safeString (trade, 'side'));
        const takerOrMaker = this.safeString (trade, 'takerOrMaker');
        return this.safeTrade ({
            'info': trade,
            'id': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'order': this.safeString (trade, 'oid'),
            'type': undefined,
            'side': side,
            'takerOrMaker': takerOrMaker,
            'price': this.safeString (trade, 'px'),
            'amount': this.safeString (trade, 'sz'),
            'cost': undefined,
            'fee': undefined,
        }, market);
    }

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
    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const duration = this.parseTimeframe (timeframe);
        let requestLimit = limit;
        if (requestLimit === undefined) {
            requestLimit = 100;
        }
        let until: Int = undefined;
        [ until, params ] = this.handleOptionAndParams (params, 'fetchOHLCV', 'until');
        let endTimestamp = this.seconds ();
        if (until !== undefined) {
            endTimestamp = this.parseToInt (until / 1000);
        }
        let startTimestamp = endTimestamp - (requestLimit * duration);
        if (since !== undefined) {
            startTimestamp = this.parseToInt (since / 1000);
            if (until === undefined) {
                endTimestamp = Math.min (this.sum (startTimestamp, requestLimit * duration), this.seconds ());
            }
        }
        let mt = 'P';
        if (market['spot']) {
            mt = 'S';
        }
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
            'mt': mt,
            'startTimestamp': startTimestamp,
            'endTimestamp': endTimestamp,
            'interval': this.safeString (this.timeframes, timeframe, timeframe),
        };
        const response = await this.publicGetCandles (this.extend (request, params));
        return this.parseOHLCVs (response, market, timeframe, since, requestLimit);
    }

    parseOHLCV (ohlcv, market: Market = undefined): OHLCV {
        //
        //     {
        //         "mi": "1",
        //         "mt": "S",
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

    /**
     * @method
     * @name fibe#fetchOrder
     * @description fetches information on an order made by the user
     * @see https://fb-4b8448ac.alephium.org/api/v1/order
     * @param {string} id order id
     * @param {string} symbol unified market symbol of the order
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.subAccountIndex] perp subaccount index, defaults to 0
     * @returns {Order} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrder() requires a symbol');
        }
        id = this.fibeValidateUnsignedIntegerParam ('fetchOrder', 'id', id);
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress ('fetchOrder', params);
        await this.loadMarkets ();
        const market = this.market (symbol);
        let subAccountIndex = undefined;
        [ subAccountIndex, params ] = this.handleOptionAndParams (params, 'fetchOrder', 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param ('fetchOrder', 'subAccountIndex', subAccountIndex);
        const info = market['info'];
        const request: Dict = {
            'user': userAddress,
            'orderId': id,
            'mi': this.safeString (info, 'mi'),
            'mt': this.safeString (info, 'mt', 'S'),
            'subAccountIndex': subAccountIndex,
        };
        const response = await this.publicGetOrder (this.extend (request, params));
        return this.parseOrder (response, market);
    }

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
    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
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
        if (market !== undefined) {
            const info = market['info'];
            request['mi'] = this.safeString (info, 'mi');
            request['mt'] = this.safeString (info, 'mt');
        }
        const response = await this.publicGetOpenOrders (this.extend (request, params));
        const orders = this.parseOrders (response, undefined, since, undefined);
        return this.filterBySymbolSinceLimit (orders, symbol, since, limit) as Order[];
    }

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
     * @param {string} [params.status] raw status filter, "F" for closed/filled orders or "C" for canceled orders
     * @param {int} [params.page] page number, default is 1
     * @param {int} [params.pageSize] page size, defaults to limit when provided
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
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
        const defaultPageSize = limit;
        [ pageSize, params ] = this.handleOptionAndParams (params, 'fetchOrders', 'pageSize', defaultPageSize);
        const request: Dict = {
            'user': userAddress,
        };
        if (market !== undefined) {
            const info = market['info'];
            request['mi'] = this.safeString (info, 'mi');
            request['mt'] = this.safeString (info, 'mt');
        }
        if (page !== undefined) {
            request['page'] = page;
        }
        if (pageSize !== undefined) {
            request['pageSize'] = pageSize;
        }
        const response = await this.publicGetHistoricalOrders (this.extend (request, params));
        const orders = this.parseOrders (response, undefined, since, undefined);
        return this.filterBySymbolSinceLimit (orders, symbol, since, limit) as Order[];
    }

    /**
     * @method
     * @name fibe#fetchClosedOrders
     * @description fetch all closed orders
     * @see https://fb-4b8448ac.alephium.org/api/v1/historical-orders
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch closed orders for
     * @param {int} [limit] the maximum number of closed order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.page] page number, default is 1
     * @param {int} [params.pageSize] page size
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchClosedOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        params = this.extend (params, { 'status': 'F' });
        return await this.fetchOrders (symbol, since, limit, params);
    }

    /**
     * @method
     * @name fibe#fetchCanceledOrders
     * @description fetch all canceled orders
     * @see https://fb-4b8448ac.alephium.org/api/v1/historical-orders
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch canceled orders for
     * @param {int} [limit] the maximum number of canceled order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.page] page number, default is 1
     * @param {int} [params.pageSize] page size
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchCanceledOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        params = this.extend (params, { 'status': 'C' });
        return await this.fetchOrders (symbol, since, limit, params);
    }

    async fetchCreateOrderMarketReferencePrice (market: Market): Promise<string> {
        /**
         * @method
         * @ignore
         */
        const allMids = await this.publicGetAllMids ();
        const marketInfo = market['info'];
        const mi = this.safeString (marketInfo, 'mi');
        const mt = this.safeString (marketInfo, 'mt');
        for (let i = 0; i < allMids.length; i++) {
            const mid = allMids[i];
            if ((this.safeString (mid, 'mi') === mi) && (this.safeString (mid, 'mt') === mt)) {
                const referencePrice = this.safeString (mid, 'mid');
                if (referencePrice !== undefined) {
                    return referencePrice;
                }
            }
        }
        throw new ExchangeError (this.id + ' createOrder() could not find a mid price for market ' + market['symbol']);
    }

    /**
     * @method
     * @name fibe#createOrder
     * @description creates a locally-signed Solana transaction and submits it through Solana RPC
     * @param {string} symbol unified market symbol
     * @param {string} type order type, "limit" or "market"
     * @param {string} side "buy" or "sell"
     * @param {float} amount amount of base currency
     * @param {float} [price] price in quote currency, required for limit orders; optional reference price for market orders
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.privateKey] 64-byte Solana secret key, base58/hex/json-array encoded
     * @param {string} [params.user] user address, must match privateKey public key if provided
     * @param {string} [params.rpcUrl] Solana RPC endpoint
     * @param {string} [params.orderId] on-chain client order id
     * @param {string} [params.timeInForce] GTC, IOC, PO, or FOK; market orders always use IOC
     * @param {number} [params.slippage] market-order slippage fraction, defaults to 0.05
     * @param {boolean} [params.postOnly] equivalent to timeInForce PO
     * @param {string} [params.commitment] Solana commitment for account/blockhash RPC calls, defaults to confirmed
     * @param {string} [params.preflightCommitment] Solana sendTransaction preflight commitment
     * @param {boolean} [params.skipPreflight] Solana sendTransaction skipPreflight option
     * @param {int} [params.maxRetries] Solana sendTransaction maxRetries option
     * @param {int} [params.minContextSlot] Solana sendTransaction minContextSlot option
     * @param {int} [params.computeUnitLimit] optional Solana compute budget unit limit
     * @param {string|int} [params.computeUnitPriceMicroLamports] optional Solana compute unit price in micro-lamports
     * @param {int} [params.subAccountIndex] perp subaccount index, defaults to 0
     * @param {string} [params.marginMode] perp margin mode, defaults to cross
     * @param {int} [params.initialLeverage] optional perp initial leverage
     * @param {boolean} [params.autoTopUpCollateralFromWallet] optional perp collateral top-up flag, defaults to true
     * @returns {Order} an order structure
     */
    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}): Promise<Order> {
        const orderType = type.toLowerCase ();
        const isLimitOrder = (orderType === 'limit');
        const isMarketOrder = (orderType === 'market');
        if (!isLimitOrder && !isMarketOrder) {
            throw new InvalidOrder (this.id + ' createOrder() local transaction construction only supports limit and market orders');
        }
        if (isLimitOrder && (price === undefined)) {
            throw new InvalidOrder (this.id + ' createOrder() requires a price for limit orders');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const orderSide = side.toLowerCase ();
        const isBuy = (orderSide === 'buy');
        if (!isBuy && (orderSide !== 'sell')) {
            throw new InvalidOrder (this.id + ' createOrder() side must be buy or sell');
        }
        let privateKey = undefined;
        [ privateKey, params ] = this.handleOptionAndParams (params, 'createOrder', 'privateKey', this.privateKey);
        if (privateKey !== undefined) {
            privateKey = privateKey.trim ();
        }
        if ((privateKey === undefined) || (privateKey === '')) {
            throw new ArgumentsRequired (this.id + ' createOrder() requires a privateKey parameter or exchange.privateKey');
        }
        let user = undefined;
        [ user, params ] = this.handlePublicAddress ('createOrder', params);
        let rpcUrl = undefined;
        [ rpcUrl, params ] = this.handleOptionAndParams (params, 'createOrder', 'rpcUrl', this.safeString (this.options, 'rpcUrl'));
        let orderId = undefined;
        [ orderId, params ] = this.handleOptionAndParams2 (params, 'createOrder', 'orderId', 'clientOrderId');
        if (orderId === undefined) {
            orderId = this.fibeNewOrderId ();
        }
        orderId = this.fibeValidateUnsignedIntegerParam ('createOrder', 'orderId', orderId);
        let postOnly = undefined;
        [ postOnly, params ] = this.handlePostOnly (false, false, params);
        params = this.omit (params, 'postOnly');
        let timeInForce = undefined;
        [ timeInForce, params ] = this.handleOptionAndParams (params, 'createOrder', 'timeInForce');
        if (isMarketOrder) {
            if (postOnly) {
                throw new InvalidOrder (this.id + ' createOrder() market orders cannot be postOnly');
            }
            let upperTimeInForce = undefined;
            if (timeInForce !== undefined) {
                upperTimeInForce = timeInForce.toUpperCase ();
            }
            if ((upperTimeInForce !== undefined) && (upperTimeInForce !== 'IOC')) {
                throw new InvalidOrder (this.id + ' createOrder() market orders require timeInForce IOC');
            }
            timeInForce = 'IOC';
        }
        const fibeTimeInForce = this.encodeCreateOrderTimeInForce (timeInForce, postOnly);
        let slippage = undefined;
        [ slippage, params ] = this.handleOptionAndParams (params, 'createOrder', 'slippage');
        if (isLimitOrder && (slippage !== undefined)) {
            throw new InvalidOrder (this.id + ' createOrder() slippage is only supported for market orders');
        }
        if (isMarketOrder) {
            if (slippage === undefined) {
                slippage = 0.05;
            }
            slippage = this.parseNumber (this.numberToString (slippage));
            if ((slippage === undefined) || !(slippage >= 0) || (slippage >= 1)) {
                throw new InvalidOrder (this.id + ' createOrder() slippage must be >= 0 and < 1');
            }
        }
        let subAccountIndex = undefined;
        [ subAccountIndex, params ] = this.handleOptionAndParams (params, 'createOrder', 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param ('createOrder', 'subAccountIndex', subAccountIndex);
        let marginMode = undefined;
        [ marginMode, params ] = this.handleOptionAndParams (params, 'createOrder', 'marginMode', 'cross');
        marginMode = this.fibeNormalizeMarginMode ('createOrder', marginMode);
        let initialLeverage = undefined;
        [ initialLeverage, params ] = this.handleOptionAndParams (params, 'createOrder', 'initialLeverage');
        if (initialLeverage !== undefined) {
            initialLeverage = this.fibeValidateU8Param ('createOrder', 'initialLeverage', initialLeverage, 1);
        }
        let autoTopUpCollateralFromWallet = undefined;
        [ autoTopUpCollateralFromWallet, params ] = this.handleOptionAndParams (params, 'createOrder', 'autoTopUpCollateralFromWallet', true);
        let commitment = undefined;
        [ commitment, params ] = this.handleOptionAndParams (params, 'createOrder', 'commitment', this.safeString (this.options, 'commitment', 'confirmed'));
        let preflightCommitment = undefined;
        [ preflightCommitment, params ] = this.handleOptionAndParams (params, 'createOrder', 'preflightCommitment');
        let skipPreflight = undefined;
        [ skipPreflight, params ] = this.handleOptionAndParams (params, 'createOrder', 'skipPreflight');
        let maxRetries = undefined;
        [ maxRetries, params ] = this.handleOptionAndParams (params, 'createOrder', 'maxRetries');
        let minContextSlot = undefined;
        [ minContextSlot, params ] = this.handleOptionAndParams (params, 'createOrder', 'minContextSlot');
        let computeUnitLimit = undefined;
        [ computeUnitLimit, params ] = this.handleOptionAndParams (params, 'createOrder', 'computeUnitLimit');
        if (computeUnitLimit !== undefined) {
            computeUnitLimit = this.fibeValidateU32Param ('createOrder', 'computeUnitLimit', computeUnitLimit);
        }
        let computeUnitPriceMicroLamports = undefined;
        [ computeUnitPriceMicroLamports, params ] = this.handleOptionAndParams (params, 'createOrder', 'computeUnitPriceMicroLamports');
        if (computeUnitPriceMicroLamports !== undefined) {
            computeUnitPriceMicroLamports = this.fibeValidateUnsignedIntegerParam ('createOrder', 'computeUnitPriceMicroLamports', computeUnitPriceMicroLamports);
        }
        if (!this.isEmpty (params)) {
            throw new ExchangeError (this.id + ' createOrder() local transaction construction does not support extra params');
        }
        const amountString = this.amountToPrecision (symbol, amount);
        if (!Precise.stringGt (amountString, '0')) {
            throw new InvalidOrder (this.id + ' createOrder() amount must be greater than zero');
        }
        let priceString = undefined;
        if (price !== undefined) {
            priceString = this.numberToString (price);
        } else if (isMarketOrder) {
            priceString = await this.fetchCreateOrderMarketReferencePrice (market);
        }
        if (!Precise.stringGt (priceString, '0')) {
            throw new InvalidOrder (this.id + ' createOrder() price must be greater than zero');
        }
        let fibeSide = 'A';
        if (isBuy) {
            fibeSide = 'B';
        }
        const result = await this.fibeLocalTxCreateOrder ({
            'rpcUrl': rpcUrl,
            'market': market,
            'user': user,
            'privateKey': privateKey,
            'orderId': orderId,
            'side': fibeSide,
            'amount': amountString,
            'price': priceString,
            'slippage': slippage,
            'timeInForce': fibeTimeInForce,
            'commitment': commitment,
            'preflightCommitment': preflightCommitment,
            'skipPreflight': skipPreflight,
            'maxRetries': maxRetries,
            'minContextSlot': minContextSlot,
            'computeUnitLimit': computeUnitLimit,
            'computeUnitPriceMicroLamports': computeUnitPriceMicroLamports,
            'subAccountIndex': subAccountIndex,
            'marginMode': marginMode,
            'initialLeverage': initialLeverage,
            'autoTopUpCollateralFromWallet': autoTopUpCollateralFromWallet,
        });
        let orderPrice = undefined;
        if (isLimitOrder) {
            const marketInfo = market['info'];
            orderPrice = this.fibeTicksToPrice (this.safeString (result, 'priceInTicks'), this.safeInteger (marketInfo, 'quoteDecimals'), this.safeString (marketInfo, 'tickSizeInQuoteBaseUnits'));
        }
        return this.safeOrder ({
            'info': result,
            'id': orderId,
            'clientOrderId': orderId,
            'timestamp': undefined,
            'datetime': undefined,
            'lastTradeTimestamp': undefined,
            'lastUpdateTimestamp': undefined,
            'symbol': symbol,
            'type': orderType,
            'timeInForce': this.parseOrderTimeInForce (fibeTimeInForce),
            'postOnly': (fibeTimeInForce === 'ALO'),
            'reduceOnly': undefined,
            'side': orderSide,
            'price': orderPrice,
            'triggerPrice': undefined,
            'amount': amountString,
            'cost': undefined,
            'average': undefined,
            'filled': undefined,
            'remaining': undefined,
            'status': undefined,
            'fee': undefined,
            'trades': undefined,
        }, market);
    }

    /**
     * @method
     * @name fibe#cancelOrder
     * @description creates a locally-signed Solana cancellation transaction and submits it through Solana RPC
     * @param {string} id order id
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.privateKey] 64-byte Solana secret key, base58/hex/json-array encoded
     * @param {string} [params.user] user address, must match privateKey public key if provided
     * @param {string} [params.rpcUrl] Solana RPC endpoint
     * @param {string} [params.commitment] Solana commitment for account/blockhash RPC calls, defaults to confirmed
     * @param {string} [params.preflightCommitment] Solana sendTransaction preflight commitment
     * @param {boolean} [params.skipPreflight] Solana sendTransaction skipPreflight option
     * @param {int} [params.maxRetries] Solana sendTransaction maxRetries option
     * @param {int} [params.minContextSlot] Solana sendTransaction minContextSlot option
     * @param {int} [params.computeUnitLimit] optional Solana compute budget unit limit
     * @param {string|int} [params.computeUnitPriceMicroLamports] optional Solana compute unit price in micro-lamports
     * @param {int} [params.subAccountIndex] perp subaccount index, defaults to 0
     * @returns {Order} an order structure
     */
    async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelOrder() requires a symbol for local tx construction');
        }
        id = this.fibeValidateUnsignedIntegerParam ('cancelOrder', 'id', id);
        await this.loadMarkets ();
        const market = this.market (symbol);
        let privateKey = undefined;
        [ privateKey, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'privateKey', this.privateKey);
        if (privateKey !== undefined) {
            privateKey = privateKey.trim ();
        }
        if ((privateKey === undefined) || (privateKey === '')) {
            throw new ArgumentsRequired (this.id + ' cancelOrder() requires a privateKey parameter or exchange.privateKey');
        }
        let user = undefined;
        [ user, params ] = this.handlePublicAddress ('cancelOrder', params);
        let rpcUrl = undefined;
        [ rpcUrl, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'rpcUrl', this.safeString (this.options, 'rpcUrl'));
        let subAccountIndex = undefined;
        [ subAccountIndex, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param ('cancelOrder', 'subAccountIndex', subAccountIndex);
        let commitment = undefined;
        [ commitment, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'commitment', this.safeString (this.options, 'commitment', 'confirmed'));
        let preflightCommitment = undefined;
        [ preflightCommitment, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'preflightCommitment');
        let skipPreflight = undefined;
        [ skipPreflight, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'skipPreflight');
        let maxRetries = undefined;
        [ maxRetries, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'maxRetries');
        let minContextSlot = undefined;
        [ minContextSlot, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'minContextSlot');
        let computeUnitLimit = undefined;
        [ computeUnitLimit, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'computeUnitLimit');
        if (computeUnitLimit !== undefined) {
            computeUnitLimit = this.fibeValidateU32Param ('cancelOrder', 'computeUnitLimit', computeUnitLimit);
        }
        let computeUnitPriceMicroLamports = undefined;
        [ computeUnitPriceMicroLamports, params ] = this.handleOptionAndParams (params, 'cancelOrder', 'computeUnitPriceMicroLamports');
        if (computeUnitPriceMicroLamports !== undefined) {
            computeUnitPriceMicroLamports = this.fibeValidateUnsignedIntegerParam ('cancelOrder', 'computeUnitPriceMicroLamports', computeUnitPriceMicroLamports);
        }
        if (!this.isEmpty (params)) {
            throw new ExchangeError (this.id + ' cancelOrder() local transaction construction does not support extra params');
        }
        const result = await this.fibeLocalTxCancelOrder ({
            'rpcUrl': rpcUrl,
            'market': market,
            'user': user,
            'privateKey': privateKey,
            'orderId': id,
            'subAccountIndex': subAccountIndex,
            'commitment': commitment,
            'preflightCommitment': preflightCommitment,
            'skipPreflight': skipPreflight,
            'maxRetries': maxRetries,
            'minContextSlot': minContextSlot,
            'computeUnitLimit': computeUnitLimit,
            'computeUnitPriceMicroLamports': computeUnitPriceMicroLamports,
        });
        return this.safeOrder ({
            'info': result,
            'id': id,
            'clientOrderId': id,
            'timestamp': undefined,
            'datetime': undefined,
            'lastTradeTimestamp': undefined,
            'lastUpdateTimestamp': undefined,
            'symbol': symbol,
            'type': undefined,
            'timeInForce': undefined,
            'postOnly': undefined,
            'reduceOnly': undefined,
            'side': undefined,
            'price': undefined,
            'triggerPrice': undefined,
            'amount': undefined,
            'cost': undefined,
            'average': undefined,
            'filled': undefined,
            'remaining': undefined,
            'status': 'canceled',
            'fee': undefined,
            'trades': undefined,
        }, market);
    }

    /**
     * @method
     * @name fibe#cancelOrders
     * @description cancels multiple normal-user resting orders by submitting one local Solana cancellation transaction per id
     * @param {string[]} ids order ids
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint, same as cancelOrder()
     * @returns {Order[]} a list of order structures
     */
    async cancelOrders (ids: string[], symbol: Str = undefined, params = {}): Promise<Order[]> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelOrders() requires a symbol for local tx construction');
        }
        const orders = [];
        for (let i = 0; i < ids.length; i++) {
            const order = await this.cancelOrder (ids[i], symbol, this.extend ({}, params));
            orders.push (order);
        }
        return orders;
    }

    /**
     * @method
     * @name fibe#cancelAllOrders
     * @description cancels all normal-user open orders for one market by fetching open orders, then submitting one local Solana cancellation transaction per order
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint, same as cancelOrder()
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {Order[]} a list of order structures
     */
    async cancelAllOrders (symbol: Str = undefined, params = {}): Promise<Order[]> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelAllOrders() requires a symbol for local tx construction');
        }
        const fetchOpenOrdersParams: Dict = {};
        const user = this.safeString2 (params, 'user', 'address');
        if (user !== undefined) {
            fetchOpenOrdersParams['user'] = user;
        }
        const openOrders = await this.fetchOpenOrders (symbol, undefined, undefined, fetchOpenOrdersParams);
        const ids = [];
        for (let i = 0; i < openOrders.length; i++) {
            const id = this.safeString (openOrders[i], 'id');
            if (id === undefined) {
                throw new ExchangeError (this.id + ' cancelAllOrders() cannot cancel an open order without an id');
            }
            ids.push (id);
        }
        return await this.cancelOrders (ids, symbol, params);
    }

    parseOrder (order: Dict, market: Market = undefined): Order {
        //
        //     {
        //         "mi": "1",
        //         "mt": "S",
        //         "oid": "1",
        //         "type": "L",
        //         "timeInForce": "ALO",
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
        const mi = this.safeString (order, 'mi');
        const mt = this.safeString (order, 'mt');
        let marketId = undefined;
        if (mi !== undefined) {
            let idPrefix = 'spot:';
            if (mt === 'P') {
                idPrefix = 'perp:';
            }
            marketId = idPrefix + mi;
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

    fibeProgramId () {
        return '4XD7tip3WpoAZsRwa1yMqpuLU8fnDbD4v2X2BiLFcApY';
    }

    solanaSystemProgramId () {
        return '11111111111111111111111111111111';
    }

    solanaAssociatedTokenProgramId () {
        return 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
    }

    solanaComputeBudgetProgramId () {
        return 'ComputeBudget111111111111111111111111111111';
    }

    solanaNativeMint () {
        return 'So11111111111111111111111111111111111111112';
    }

    solanaHexAlphabet () {
        return '0123456789abcdef';
    }

    solanaHexNibble (value) {
        const lower = this.solanaHexAlphabet ();
        const upper = '0123456789ABCDEF';
        for (let i = 0; i < 16; i++) {
            if ((value === lower[i]) || (value === upper[i])) {
                return i;
            }
        }
        throw new ExchangeError (this.id + ' invalid hex character ' + value);
    }

    solanaHexByte (hex, index): number {
        const hi = this.solanaHexNibble (hex[index]);
        const lo = this.solanaHexNibble (hex[index + 1]);
        return this.sum (hi * 16, lo);
    }

    fibeIsUnsignedIntegerString (value) {
        if ((value === undefined) || (value === null)) {
            return false;
        }
        const stringValue: string = this.numberToString (value);
        if (stringValue === '') {
            return false;
        }
        const characters = this.stringToCharsArray (stringValue);
        const digits = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ];
        for (let i = 0; i < characters.length; i++) {
            const character = characters[i];
            if (!this.inArray (character, digits)) {
                return false;
            }
        }
        return true;
    }

    fibeValidateUnsignedIntegerParam (method, field, value) {
        const stringValue = this.numberToString (value);
        if (!this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new InvalidOrder (this.id + ' ' + method + '() ' + field + ' must be an unsigned integer');
        }
        return stringValue;
    }

    fibeValidateU8Param (method, field, value, min = 0) {
        const stringValue = this.fibeValidateUnsignedIntegerParam (method, field, value);
        const numeric = parseInt (stringValue);
        if ((numeric < min) || (numeric > 255)) {
            throw new InvalidOrder (this.id + ' ' + method + '() ' + field + ' must be between ' + this.numberToString (min) + ' and 255');
        }
        return numeric;
    }

    fibeValidateU32Param (method, field, value) {
        const stringValue = this.fibeValidateUnsignedIntegerParam (method, field, value);
        const numeric = parseInt (stringValue);
        if (numeric > 4294967295) {
            throw new InvalidOrder (this.id + ' ' + method + '() ' + field + ' must be between 0 and 4294967295');
        }
        return numeric;
    }

    fibeNormalizeMarginMode (method, marginMode) {
        const normalized = marginMode.toLowerCase ();
        if ((normalized !== 'cross') && (normalized !== 'isolated')) {
            throw new InvalidOrder (this.id + ' ' + method + '() marginMode must be cross or isolated');
        }
        return normalized;
    }

    solanaU8Hex (value) {
        const stringValue = this.numberToString (value);
        if (!this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new ExchangeError (this.id + ' invalid u8 value ' + stringValue);
        }
        const numeric = parseInt (stringValue);
        if (numeric > 255) {
            throw new ExchangeError (this.id + ' u8 overflow');
        }
        const alphabet = this.solanaHexAlphabet ();
        const hi = this.parseToInt (numeric / 16);
        const lo = numeric - (hi * 16);
        return alphabet[hi] + alphabet[lo];
    }

    solanaU16leHex (value) {
        const numeric = this.parseToInt (value);
        const lo = numeric % 256;
        const hi = this.parseToInt (numeric / 256);
        return this.solanaU8Hex (lo) + this.solanaU8Hex (hi);
    }

    solanaU32leHex (value) {
        const stringValue = this.numberToString (value);
        if (!this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new ExchangeError (this.id + ' invalid u32 value ' + stringValue);
        }
        let remaining = parseInt (stringValue);
        let result = '';
        for (let i = 0; i < 4; i++) {
            const byteValue = remaining % 256;
            result += this.solanaU8Hex (byteValue);
            remaining = this.parseToInt (remaining / 256);
        }
        if (remaining !== 0) {
            throw new ExchangeError (this.id + ' u32 overflow');
        }
        return result;
    }

    solanaBytesHex (values) {
        let result = '';
        for (let i = 0; i < values.length; i++) {
            result += this.solanaU8Hex (values[i]);
        }
        return result;
    }

    solanaStringHex (value) {
        return this.remove0xPrefix (this.stringToBase16 (value));
    }

    solanaPubkeyHex (pubkey) {
        const decoded = this.base58ToBinary (pubkey);
        const result = this.binaryToBase16 (decoded);
        if (result.length !== 64) {
            throw new ExchangeError (this.id + ' invalid Solana address ' + pubkey);
        }
        return result;
    }

    fibeDecimalStringDivInteger (value, divisor, roundUp = false) {
        const divisorString = this.numberToString (divisor);
        let quotient = Precise.stringDiv (value, divisorString, 0);
        if (roundUp && Precise.stringGt (Precise.stringMod (value, divisorString), '0')) {
            quotient = Precise.stringAdd (quotient, '1');
        }
        return quotient;
    }

    fibeDecimalToUnits (value, decimals) {
        return Precise.stringDiv (value.trim (), this.parsePrecision (this.numberToString (decimals)), 0);
    }

    fibeNewOrderId () {
        const randomHex = this.randomBytes (8);
        let result = '0';
        let i = 0;
        while (i < randomHex.length) {
            const byteValue = this.solanaHexByte (randomHex, i);
            result = Precise.stringAdd (Precise.stringMul (result, '256'), this.numberToString (byteValue));
            i = i + 2;
        }
        return result;
    }

    fibeNormalizeQuantity (quantity, lotSize) {
        return Precise.stringSub (quantity, Precise.stringMod (quantity, lotSize));
    }

    solanaU64leHex (value) {
        const stringValue = this.numberToString (value);
        if (!this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new ExchangeError (this.id + ' invalid u64 value ' + stringValue);
        }
        let remaining = Precise.stringAdd (stringValue, '0');
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += this.solanaU8Hex (parseInt (Precise.stringMod (remaining, '256')));
            remaining = Precise.stringDiv (remaining, '256', 0);
        }
        if (remaining !== '0') {
            throw new ExchangeError (this.id + ' u64 overflow');
        }
        return result;
    }

    solanaLeHexToDecimalString (hex) {
        let result = '0';
        let i = hex.length - 2;
        while (i >= 0) {
            const byteValue = this.solanaHexByte (hex, i);
            result = Precise.stringAdd (Precise.stringMul (result, '256'), this.numberToString (byteValue));
            i = i - 2;
        }
        return result;
    }

    solanaOptionU8Hex (value) {
        if (value === undefined) {
            return this.solanaU8Hex (0);
        }
        return this.solanaU8Hex (1) + this.solanaU8Hex (value);
    }

    solanaOptionU16Hex (value) {
        if (value === undefined) {
            return this.solanaU8Hex (0);
        }
        return this.solanaU8Hex (1) + this.solanaU16leHex (value);
    }

    solanaOptionU64Hex (value) {
        if (value === undefined) {
            return this.solanaU8Hex (0);
        }
        return this.solanaU8Hex (1) + this.solanaU64leHex (value);
    }

    solanaShortVecHex (value) {
        let result = '';
        let remaining = value;
        while (remaining >= 128) {
            const elem = (remaining % 128) + 128;
            remaining = this.parseToInt (remaining / 128);
            result += this.solanaU8Hex (elem);
        }
        return result + this.solanaU8Hex (remaining);
    }

    fibeSideIndex (side) {
        if (side === 'B') {
            return 0;
        }
        return 1;
    }

    fibeTimeInForceIndex (timeInForce) {
        const values = {
            'GTC': 0,
            'IOC': 1,
            'ALO': 2,
            'FOK': 3,
        };
        return this.safeInteger (values, timeInForce);
    }

    fibeGetTickArrayStartTick (priceInTicks) {
        const numeric = parseInt (priceInTicks);
        const tickSizeInArray = this.fibeTickSizeInArray ();
        return this.numberToString (numeric - (numeric % tickSizeInArray));
    }

    fibePriceToTicks (price, quoteDecimals, tickSizeInQuoteBaseUnits, side = undefined, slippage = undefined) {
        let adjustedPrice = this.numberToString (price);
        if (slippage !== undefined) {
            let factor = Precise.stringSub ('1', this.numberToString (slippage));
            if (side === 'B') {
                factor = Precise.stringAdd ('1', this.numberToString (slippage));
            }
            adjustedPrice = Precise.stringMul (adjustedPrice, factor);
        }
        let scale = '1';
        for (let i = 0; i < quoteDecimals; i++) {
            scale += '0';
        }
        const scaled = Precise.stringMul (adjustedPrice, scale);
        return this.fibeDecimalStringDivInteger (scaled, tickSizeInQuoteBaseUnits, side !== 'B');
    }

    fibeTicksToPrice (priceInTicks, quoteDecimals, tickSizeInQuoteBaseUnits) {
        const rawPrice = Precise.stringMul (this.numberToString (priceInTicks), this.numberToString (tickSizeInQuoteBaseUnits));
        return Precise.stringMul (rawPrice, this.parsePrecision (this.numberToString (quoteDecimals)));
    }

    solanaIsHexString (value) {
        if (value === '') {
            return false;
        }
        const characters = this.stringToCharsArray (value);
        const hexCharacters = this.stringToCharsArray (this.solanaHexAlphabet ());
        for (let i = 0; i < characters.length; i++) {
            const character = characters[i];
            if (!this.inArray (character.toLowerCase (), hexCharacters)) {
                return false;
            }
        }
        return true;
    }

    solanaPublicKeyFromSecretKeyHex (secretKeyHex) {
        if (secretKeyHex.length !== 128) {
            throw new ExchangeError (this.id + ' invalid Solana secret key length ' + this.numberToString (secretKeyHex.length / 2));
        }
        const publicKey = this.eddsaPublicKey (this.base16ToBinary (secretKeyHex.slice (0, 64)), ed25519);
        const publicKeyHex = this.binaryToBase16 (publicKey);
        if (publicKeyHex !== secretKeyHex.slice (64, 128)) {
            throw new AuthenticationError (this.id + ' invalid Solana secret key: public key does not match seed');
        }
        return this.binaryToBase58 (publicKey);
    }

    solanaParsePrivateKeyHex (privateKey, user = undefined) {
        if (privateKey === undefined) {
            throw new ArgumentsRequired (this.id + ' requires a 64-byte Solana secret key');
        }
        privateKey = privateKey.trim ();
        if (privateKey === '') {
            throw new ArgumentsRequired (this.id + ' requires a 64-byte Solana secret key');
        }
        let rawHex = undefined;
        if (privateKey.indexOf ('[') === 0) {
            const raw = this.parseJson (privateKey);
            if (!Array.isArray (raw)) {
                throw new ExchangeError (this.id + ' Solana secret key JSON must be an array of bytes');
            }
            for (let i = 0; i < raw.length; i++) {
                if (!this.fibeIsUnsignedIntegerString (raw[i])) {
                    throw new ExchangeError (this.id + ' invalid Solana private key byte at index ' + this.numberToString (i));
                }
                const byteValueString = this.numberToString (raw[i]);
                const byteValue = parseInt (byteValueString);
                if ((byteValue < 0) || (byteValue > 255)) {
                    throw new ExchangeError (this.id + ' invalid Solana private key byte at index ' + this.numberToString (i));
                }
            }
            rawHex = this.solanaBytesHex (raw);
        } else {
            let candidate = privateKey;
            if (privateKey.indexOf ('0x') === 0) {
                candidate = privateKey.slice (2);
            }
            if (this.solanaIsHexString (candidate)) {
                rawHex = candidate.toLowerCase ();
            } else {
                rawHex = this.binaryToBase16 (this.base58ToBinary (privateKey));
            }
        }
        if (rawHex.length !== 128) {
            throw new ExchangeError (this.id + ' invalid Solana secret key length ' + this.numberToString (rawHex.length / 2) + ', expected 64 bytes');
        }
        const publicKey = this.solanaPublicKeyFromSecretKeyHex (rawHex);
        if (user !== undefined) {
            if (publicKey !== user) {
                throw new AuthenticationError (this.id + ' credential does not match address ' + user);
            }
        }
        return rawHex.slice (0, 64);
    }

    solanaIsOnCurveHex (candidateHex) {
        if (candidateHex.length !== 64) {
            return false;
        }
        return this.eddsaPointIsValid (this.base16ToBinary (candidateHex), ed25519);
    }

    solanaFindProgramAddress (seeds, programId) {
        const programHex = this.solanaPubkeyHex (programId);
        const markerHex = this.solanaStringHex ('ProgramDerivedAddress');
        let seedHex = '';
        for (let i = 0; i < seeds.length; i++) {
            seedHex += seeds[i];
        }
        let bump = 255;
        while (bump >= 0) {
            const candidateBytes = this.base16ToBinary (seedHex + this.solanaU8Hex (bump) + programHex + markerHex);
            const hash = this.hash (candidateBytes, sha256, 'binary');
            const hashHex = this.binaryToBase16 (hash);
            if (!this.solanaIsOnCurveHex (hashHex)) {
                return this.binaryToBase58 (hash);
            }
            bump = bump - 1;
        }
        throw new ExchangeError (this.id + ' unable to find Solana program address');
    }

    fibePda (seeds, programId = undefined) {
        const program = (programId === undefined) ? this.fibeProgramId () : programId;
        return this.solanaFindProgramAddress (seeds, program);
    }

    fibeGetUserStatePda (user) {
        return this.fibePda ([ this.solanaStringHex ('user_state'), this.solanaPubkeyHex (user) ]);
    }

    fibeCalculateEncodedUserId (owner) {
        const ownerHex = this.solanaPubkeyHex (owner);
        let userIdHex = '';
        for (let i = 0; i < 8; i++) {
            let value = 0;
            for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
                const bitValue = Math.pow (2, bitIndex);
                let bitCount = 0;
                for (let j = 0; j < 4; j++) {
                    const byteValue = this.solanaHexByte (ownerHex, (j * 16) + (i * 2));
                    bitCount = this.sum (bitCount, Math.floor (byteValue / bitValue) % 2);
                }
                if ((bitCount % 2) === 1) {
                    value = this.sum (value, bitValue);
                }
            }
            userIdHex += this.solanaU8Hex (value);
        }
        return userIdHex;
    }

    fibeGetDexConfigPda () {
        return this.fibePda ([ this.solanaStringHex ('dex_config') ]);
    }

    fibeGetUserIdPda (owner) {
        return this.fibePda ([ this.solanaStringHex ('user_id'), this.fibeCalculateEncodedUserId (owner) ]);
    }

    fibeGetAccountLabelHex (owner, subAccountIndex) {
        return this.solanaU8Hex (subAccountIndex) + this.solanaPubkeyHex (owner).slice (2);
    }

    fibeGetAccountLabelPda (owner, subAccountIndex) {
        return this.fibePda ([ this.solanaStringHex ('account_label'), this.solanaPubkeyHex (owner), this.fibeGetAccountLabelHex (owner, subAccountIndex) ]);
    }

    fibeGetSubAccountStatePda (owner, subAccountIndex) {
        return this.fibePda ([ this.solanaStringHex ('sub_account_state'), this.solanaPubkeyHex (owner), this.solanaU8Hex (subAccountIndex) ]);
    }

    fibeGetUserMarginAccountPda (owner, subAccountIndex, quoteMint) {
        return this.fibePda ([ this.solanaStringHex ('user_margin_account'), this.solanaPubkeyHex (owner), this.solanaU8Hex (subAccountIndex), this.solanaPubkeyHex (quoteMint) ]);
    }

    fibeGetOpenOrdersPerMarketPda (mt, owner, subAccountIndex, mi) {
        const marketSeed = (mt === 'S') ? 'spot' : 'perp';
        return this.fibePda ([ this.solanaStringHex (marketSeed), this.solanaStringHex ('open_orders_per_market'), this.solanaPubkeyHex (owner), this.solanaU8Hex (subAccountIndex), this.solanaU64leHex (mi) ]);
    }

    fibeGetSpotMarketVaultPda (mi, tokenMint) {
        return this.fibePda ([ this.solanaStringHex ('spot_vault'), this.solanaU64leHex (mi), this.solanaPubkeyHex (tokenMint) ]);
    }

    fibeGetPerpMarketVaultPda (tokenMint) {
        return this.fibePda ([ this.solanaStringHex ('perp_vault'), this.solanaPubkeyHex (tokenMint) ]);
    }

    fibeGetVaultAuthorityPda () {
        return this.fibePda ([ this.solanaStringHex ('vault_authority') ]);
    }

    fibeGetHfmmRegistryPda (mt, mi) {
        const marketSeed = (mt === 'S') ? 'spot' : 'perp';
        return this.fibePda ([ this.solanaStringHex (marketSeed), this.solanaStringHex ('hfmm_market_registry'), this.solanaU64leHex (mi) ]);
    }

    fibeGetPerpControlParamsPda (quoteMint) {
        return this.fibePda ([ this.solanaStringHex ('perp_control_params'), this.solanaPubkeyHex (quoteMint) ]);
    }

    fibeGetHfmmMarginAccountsPda (quoteMint) {
        return this.fibePda ([ this.solanaStringHex ('hfmm_margin_accounts'), this.solanaPubkeyHex (quoteMint) ]);
    }

    fibeGetTickArrayPda (mt, mi, priceInTicks) {
        const marketSeed = (mt === 'S') ? 'spot' : 'perp';
        const arrayStartTick = this.fibeGetTickArrayStartTick (priceInTicks);
        return this.fibePda ([ this.solanaStringHex (marketSeed), this.solanaStringHex ('tick_array'), this.solanaU64leHex (mi), this.solanaU64leHex (arrayStartTick), this.solanaU64leHex (this.fibeTickSizeInArray ()) ]);
    }

    fibeMaxTick () {
        return 2457600;
    }

    fibeTickSizeInArray () {
        return 150;
    }

    fibeMarketTickArrayBitmapOffset () {
        return 312; // 8-byte discriminator + 304-byte market prefix
    }

    solanaReadU64FromHex (hex, offset) {
        const start = offset * 2;
        return this.solanaLeHexToDecimalString (hex.slice (start, start + 16));
    }

    solanaReadU32FromHex (hex, offset) {
        const start = offset * 2;
        return this.solanaLeHexToDecimalString (hex.slice (start, start + 8));
    }

    solanaReadU8FromHex (hex, offset): Int {
        return this.solanaHexByte (hex, offset * 2);
    }

    fibeDecodeTickArrayBitmap (marketData) {
        const hex = this.binaryToBase16 (marketData);
        const bitmapOffset = this.fibeMarketTickArrayBitmapOffset ();
        return {
            'askTickLowerBound': this.solanaReadU64FromHex (hex, bitmapOffset + 2048),
            'bidTickUpperBound': this.solanaReadU64FromHex (hex, bitmapOffset + 2056),
        };
    }

    fibeTickArrayStride (mt) {
        if (mt === 'S') {
            return 48;
        }
        return 64;
    }

    fibeTickArraySideBit (hex, tickIndex) {
        const bitmapByteIndex = Math.floor (tickIndex / 8);
        const bitIndex = tickIndex % 8;
        const bitValue = Math.pow (2, bitIndex);
        const bidByte = this.solanaReadU8FromHex (hex, 24 + bitmapByteIndex);
        if ((Math.floor (bidByte / bitValue) % 2) === 1) {
            return 1;
        }
        const askByte = this.solanaReadU8FromHex (hex, 48 + bitmapByteIndex);
        if ((Math.floor (askByte / bitValue) % 2) === 1) {
            return -1;
        }
        return 0;
    }

    fibeDecodeTickArrayState (mt, data) {
        const hex = this.binaryToBase16 (data);
        const startTick = parseInt (this.solanaReadU64FromHex (hex, 80));
        const tickStride = this.fibeTickArrayStride (mt);
        const ticks = [];
        for (let i = 0; i < this.fibeTickSizeInArray (); i++) {
            const offset = this.sum (88, i * tickStride);
            const filled = this.solanaReadU64FromHex (hex, offset);
            const total0 = this.solanaReadU64FromHex (hex, offset + 8);
            const total1 = this.solanaReadU64FromHex (hex, offset + 16);
            const total = Precise.stringAdd (total0, total1);
            let unfilled = '0';
            if (Precise.stringGe (total, filled)) {
                unfilled = Precise.stringSub (total, filled);
            }
            ticks.push ({
                'unfilledLots': unfilled,
                'sideBit': this.fibeTickArraySideBit (hex, i),
            });
        }
        return {
            'startTick': startTick,
            'ticks': ticks,
        };
    }

    async solanaGetMultipleAccountData (rpcUrl, pubkeys, commitment = 'confirmed') {
        const result = [];
        let offset = 0;
        while (offset < pubkeys.length) {
            const chunk = pubkeys.slice (offset, offset + 100);
            const response = await this.solanaRpc (rpcUrl, 'getMultipleAccounts', [
                chunk,
                { 'encoding': 'base64', 'commitment': commitment },
            ]);
            const values = this.safeList (response, 'value', []);
            for (let i = 0; i < values.length; i++) {
                const value = this.safeValue (values, i);
                if (value === undefined) {
                    result.push (undefined);
                } else {
                    const data = this.safeList (value, 'data', []);
                    if (data.length === 0) {
                        throw new ExchangeError (this.id + ' Solana account response is missing base64 data for ' + chunk[i]);
                    }
                    result.push (this.base64ToBinary (data[0]));
                }
            }
            offset = offset + 100;
        }
        return result;
    }

    async fibeGetTickArrayStates (rpcUrl, market, pubkeys, commitment = 'confirmed') {
        const states = [];
        const accounts = await this.solanaGetMultipleAccountData (rpcUrl, pubkeys, commitment);
        const mt = this.safeString (market, 'mt');
        for (let i = 0; i < accounts.length; i++) {
            const data = accounts[i];
            if (data !== undefined) {
                states.push (this.fibeDecodeTickArrayState (mt, data));
            }
        }
        return states;
    }

    fibeFillTickLots (tick, lots, side) {
        const sideBit = this.safeInteger (tick, 'sideBit');
        if (((side === 'B') && (sideBit !== -1)) || ((side === 'A') && (sideBit !== 1))) {
            return lots;
        }
        const unfilledLots = this.safeString (tick, 'unfilledLots', '0');
        if (Precise.stringGe (unfilledLots, lots)) {
            return '0';
        }
        return Precise.stringSub (lots, unfilledLots);
    }

    fibeFillTickArrayBid (state, priceInTicks, lots) {
        const startTick = this.safeInteger (state, 'startTick');
        const ticks = this.safeList (state, 'ticks', []);
        let remainingLots = lots;
        for (let i = 0; i < ticks.length; i++) {
            const tickIndex = this.sum (startTick, i);
            if (tickIndex > priceInTicks) {
                break;
            }
            remainingLots = this.fibeFillTickLots (ticks[i], remainingLots, 'B');
            if (remainingLots === '0') {
                break;
            }
        }
        return remainingLots;
    }

    fibeFillTickArrayAsk (state, priceInTicks, lots) {
        const startTick = this.safeInteger (state, 'startTick');
        const ticks = this.safeList (state, 'ticks', []);
        let remainingLots = lots;
        for (let revIndex = 0; revIndex < ticks.length; revIndex++) {
            const index = ticks.length - revIndex - 1;
            const tickIndex = this.sum (startTick, this.fibeTickSizeInArray ()) - revIndex - 1;
            if (tickIndex < priceInTicks) {
                break;
            }
            remainingLots = this.fibeFillTickLots (ticks[index], remainingLots, 'A');
            if (remainingLots === '0') {
                break;
            }
        }
        return remainingLots;
    }

    fibeFindTickArrayIndexesForOrder (states, priceInTicks, baseLots, side) {
        states = this.sortBy (states, 'startTick');
        const startTick = parseInt (this.fibeGetTickArrayStartTick (this.numberToString (priceInTicks)));
        const indexes = [];
        let remainingLots = baseLots;
        if (side === 'B') {
            for (let i = 0; i < states.length; i++) {
                const state = states[i];
                const stateStartTick = this.safeInteger (state, 'startTick');
                if (stateStartTick > startTick) {
                    break;
                }
                indexes.push (stateStartTick);
                remainingLots = this.fibeFillTickArrayBid (state, priceInTicks, remainingLots);
                if (remainingLots === '0') {
                    break;
                }
            }
        } else {
            let i = states.length - 1;
            while (i >= 0) {
                const state = states[i];
                const stateStartTick = this.safeInteger (state, 'startTick');
                if (stateStartTick < startTick) {
                    break;
                }
                indexes.push (stateStartTick);
                remainingLots = this.fibeFillTickArrayAsk (state, priceInTicks, remainingLots);
                if (remainingLots === '0') {
                    break;
                }
                i = i - 1;
            }
            indexes.reverse ();
        }
        return indexes;
    }

    fibeGetAllTickArrayIndexesForBid (priceInTicks, tickArrayIndexes) {
        let allIndexes = [];
        const currentIndex = parseInt (this.fibeGetTickArrayStartTick (this.numberToString (priceInTicks)));
        const toIndex = (tickArrayIndexes.length > 0) ? tickArrayIndexes[0] : currentIndex;
        const fromIndex = Math.max (toIndex - (this.fibeTickSizeInArray () * 2), 0);
        const tickSize = this.fibeTickSizeInArray ();
        let beforeCount = 0;
        if (fromIndex < toIndex) {
            beforeCount = Math.floor ((toIndex - fromIndex) / tickSize);
        }
        for (let i = 0; i < beforeCount; i++) {
            const index = this.sum (fromIndex, i * tickSize);
            allIndexes.push (index);
        }
        allIndexes = this.arrayConcat (allIndexes, tickArrayIndexes);
        let lastTickIndex = currentIndex;
        if (tickArrayIndexes.length > 0) {
            const lastIndex = tickArrayIndexes.length - 1;
            lastTickIndex = tickArrayIndexes[lastIndex];
        }
        const fromIndexAfter = this.sum (lastTickIndex, this.fibeTickSizeInArray ());
        const toIndexAfter = Math.min (this.sum (fromIndexAfter, this.fibeTickSizeInArray () * 2), currentIndex);
        let afterCount = 0;
        if (fromIndexAfter < toIndexAfter) {
            afterCount = Math.floor ((toIndexAfter - fromIndexAfter) / tickSize);
        }
        for (let i = 0; i < afterCount; i++) {
            const index = this.sum (fromIndexAfter, i * tickSize);
            allIndexes.push (index);
        }
        allIndexes.push (currentIndex);
        return allIndexes;
    }

    fibeGetAllTickArrayIndexesForAsk (priceInTicks, tickArrayIndexes) {
        const currentIndex = parseInt (this.fibeGetTickArrayStartTick (this.numberToString (priceInTicks)));
        let allIndexes = [ currentIndex ];
        const toIndex = (tickArrayIndexes.length > 0) ? tickArrayIndexes[0] : currentIndex;
        const fromIndex = Math.max (Math.max (toIndex - (this.fibeTickSizeInArray () * 2), 0), this.sum (currentIndex, this.fibeTickSizeInArray ()));
        const tickSize = this.fibeTickSizeInArray ();
        let beforeCount = 0;
        if (fromIndex < toIndex) {
            beforeCount = Math.floor ((toIndex - fromIndex) / tickSize);
        }
        for (let i = 0; i < beforeCount; i++) {
            const index = this.sum (fromIndex, i * tickSize);
            allIndexes.push (index);
        }
        allIndexes = this.arrayConcat (allIndexes, tickArrayIndexes);
        let lastTickIndex = currentIndex;
        if (tickArrayIndexes.length > 0) {
            const lastIndex = tickArrayIndexes.length - 1;
            lastTickIndex = tickArrayIndexes[lastIndex];
        }
        const fromIndexAfter = this.sum (lastTickIndex, this.fibeTickSizeInArray ());
        const toIndexAfter = Math.min (this.sum (fromIndexAfter, this.fibeTickSizeInArray () * 2), this.fibeMaxTick ());
        let afterCount = 0;
        if (fromIndexAfter < toIndexAfter) {
            afterCount = Math.floor ((toIndexAfter - fromIndexAfter) / tickSize);
        }
        for (let i = 0; i < afterCount; i++) {
            const index = this.sum (fromIndexAfter, i * tickSize);
            allIndexes.push (index);
        }
        return allIndexes;
    }

    async fibeGetTickArraysForOrder (rpcUrl, market, priceInTicks, sizeInBase, side, commitment) {
        const priceInTicksNumber = parseInt (priceInTicks);
        const mt = this.safeString (market, 'mt');
        const mi = this.safeString (market, 'mi');
        const marketData = await this.solanaGetAccountData (rpcUrl, this.safeString (market, 'marketPubkey'), commitment);
        const bitmap = this.fibeDecodeTickArrayBitmap (marketData);
        const baseLots = this.fibeDecimalStringDivInteger (sizeInBase, this.safeString (market, 'lotSizeInBaseBaseUnits'), true);
        const candidates = [];
        if (side === 'B') {
            const lowestAskStart = parseInt (this.safeString (bitmap, 'askTickLowerBound'));
            const endIndex = parseInt (this.fibeGetTickArrayStartTick (priceInTicks));
            const buyTickSize = this.fibeTickSizeInArray ();
            let buyCandidateCount = 0;
            if (lowestAskStart < endIndex) {
                buyCandidateCount = Math.floor ((endIndex - lowestAskStart) / buyTickSize);
            }
            for (let i = 0; i < buyCandidateCount; i++) {
                const index = this.sum (lowestAskStart, i * buyTickSize);
                candidates.push (this.fibeGetTickArrayPda (mt, mi, this.numberToString (index)));
            }
            const buyStates = await this.fibeGetTickArrayStates (rpcUrl, market, candidates, commitment);
            const buyIndexes = this.fibeFindTickArrayIndexesForOrder (buyStates, priceInTicksNumber, baseLots, side);
            const buyAllIndexes = this.fibeGetAllTickArrayIndexesForBid (priceInTicksNumber, buyIndexes);
            const buyResult = [];
            for (let i = 0; i < buyAllIndexes.length; i++) {
                buyResult.push (this.fibeGetTickArrayPda (mt, mi, this.numberToString (buyAllIndexes[i])));
            }
            return buyResult;
        }
        const highestBidStart = parseInt (this.safeString (bitmap, 'bidTickUpperBound'));
        const fromIndex = this.sum (parseInt (this.fibeGetTickArrayStartTick (priceInTicks)), this.fibeTickSizeInArray ());
        const sellTickSize = this.fibeTickSizeInArray ();
        let sellCandidateCount = 0;
        if (fromIndex <= highestBidStart) {
            sellCandidateCount = Math.floor ((highestBidStart - fromIndex) / sellTickSize) + 1;
        }
        for (let i = 0; i < sellCandidateCount; i++) {
            const index = this.sum (fromIndex, i * sellTickSize);
            candidates.push (this.fibeGetTickArrayPda (mt, mi, this.numberToString (index)));
        }
        const sellStates = await this.fibeGetTickArrayStates (rpcUrl, market, candidates, commitment);
        const sellIndexes = this.fibeFindTickArrayIndexesForOrder (sellStates, priceInTicksNumber, baseLots, side);
        const sellAllIndexes = this.fibeGetAllTickArrayIndexesForAsk (priceInTicksNumber, sellIndexes);
        const sellResult = [];
        for (let i = 0; i < sellAllIndexes.length; i++) {
            sellResult.push (this.fibeGetTickArrayPda (mt, mi, this.numberToString (sellAllIndexes[i])));
        }
        return sellResult;
    }

    solanaGetAssociatedTokenAddress (mint, owner, tokenProgram) {
        return this.fibePda ([ this.solanaPubkeyHex (owner), this.solanaPubkeyHex (tokenProgram), this.solanaPubkeyHex (mint) ], this.solanaAssociatedTokenProgramId ());
    }

    solanaAccount (pubkey, isWritable = false, isSigner = false) {
        return {
            'pubkey': pubkey,
            'isWritable': isWritable,
            'isSigner': isSigner,
        };
    }

    solanaCreateAssociatedTokenAccountIx (payer, ata, owner, mint, tokenProgram) {
        return {
            'programId': this.solanaAssociatedTokenProgramId (),
            'accounts': [
                this.solanaAccount (payer, true, true),
                this.solanaAccount (ata, true),
                this.solanaAccount (owner),
                this.solanaAccount (mint),
                this.solanaAccount (this.solanaSystemProgramId ()),
                this.solanaAccount (tokenProgram),
            ],
            // Deliberately match the production Rust and TypeScript SDK builders: check first, then use Create (0), not CreateIdempotent (1).
            'data': this.solanaU8Hex (0),
        };
    }

    async solanaCreateAssociatedTokenAccountIfNeeded (rpcUrl, payer, owner, mint, tokenProgram, commitment = 'confirmed') {
        const ata = this.solanaGetAssociatedTokenAddress (mint, owner, tokenProgram);
        const accountInfo = await this.solanaGetAccountInfo (rpcUrl, ata, commitment);
        if (accountInfo !== undefined) {
            return undefined;
        }
        return this.solanaCreateAssociatedTokenAccountIx (payer, ata, owner, mint, tokenProgram);
    }

    solanaSystemTransferIx (source, destination, lamports) {
        return {
            'programId': this.solanaSystemProgramId (),
            'accounts': [
                this.solanaAccount (source, true, true),
                this.solanaAccount (destination, true),
            ],
            'data': this.solanaU32leHex (2) + this.solanaU64leHex (lamports),
        };
    }

    solanaSyncNativeIx (account, tokenProgram) {
        return {
            'programId': tokenProgram,
            'accounts': [ this.solanaAccount (account, true) ],
            'data': this.solanaU8Hex (17),
        };
    }

    async solanaWrapNativeIfNeeded (rpcUrl, owner, tokenProgram, amount, commitment = 'confirmed') {
        const ata = this.solanaGetAssociatedTokenAddress (this.solanaNativeMint (), owner, tokenProgram);
        const accountInfo = await this.solanaGetAccountInfo (rpcUrl, ata, commitment);
        const instructions = [];
        let balance = '0';
        if (accountInfo === undefined) {
            instructions.push (this.solanaCreateAssociatedTokenAccountIx (owner, ata, owner, this.solanaNativeMint (), tokenProgram));
        } else {
            const response = await this.solanaRpc (rpcUrl, 'getTokenAccountBalance', [
                ata,
                { 'commitment': commitment },
            ]);
            const value = this.safeDict (response, 'value', {});
            balance = this.safeString (value, 'amount', '0');
        }
        if (Precise.stringLt (balance, amount)) {
            const required = Precise.stringSub (amount, balance);
            instructions.push (this.solanaSystemTransferIx (owner, ata, required));
            instructions.push (this.solanaSyncNativeIx (ata, tokenProgram));
        }
        return instructions;
    }

    solanaSetComputeUnitLimitIx (units) {
        return {
            'programId': this.solanaComputeBudgetProgramId (),
            'accounts': [],
            'data': this.solanaU8Hex (2) + this.solanaU32leHex (units),
        };
    }

    solanaSetComputeUnitPriceIx (microLamports) {
        return {
            'programId': this.solanaComputeBudgetProgramId (),
            'accounts': [],
            'data': this.solanaU8Hex (3) + this.solanaU64leHex (microLamports),
        };
    }

    solanaAddComputeBudgetIxs (instructions, params) {
        const computeUnitLimit = this.safeInteger (params, 'computeUnitLimit');
        const computeUnitPriceMicroLamports = this.safeString (params, 'computeUnitPriceMicroLamports');
        if ((computeUnitLimit === undefined) && (computeUnitPriceMicroLamports === undefined)) {
            return instructions;
        }
        const result = [];
        if (computeUnitLimit !== undefined) {
            result.push (this.solanaSetComputeUnitLimitIx (computeUnitLimit));
        }
        if (computeUnitPriceMicroLamports !== undefined) {
            result.push (this.solanaSetComputeUnitPriceIx (computeUnitPriceMicroLamports));
        }
        return this.arrayConcat (result, instructions);
    }

    fibeSpotPlaceOrderIx (input) {
        let data = this.solanaBytesHex ([ 56, 0, 0, 0, 0, 0, 0, 0 ]);
        data += this.solanaU64leHex (input['priceInTicks']);
        data += this.solanaU64leHex (input['orderId']);
        data += this.solanaU8Hex (this.fibeSideIndex (input['side']));
        data += this.solanaOptionU64Hex (input['sizeInBase']);
        data += this.solanaOptionU64Hex (undefined);
        data += this.solanaU8Hex (this.fibeTimeInForceIndex (input['timeInForce']));
        data += this.solanaOptionU16Hex (undefined);
        const accounts = [
            this.solanaAccount (this.solanaSystemProgramId ()),
            this.solanaAccount (input['owner'], true, true),
            this.solanaAccount (input['ownerSubAccountState'], true),
            this.solanaAccount (input['ownerState'], true),
            this.solanaAccount (input['openOrdersPerMarket'], true),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (input['ownerBaseTokenAccount'], true),
            this.solanaAccount (input['ownerQuoteTokenAccount'], true),
            this.solanaAccount (input['market'], true),
            this.solanaAccount (input['tokenVaultBase'], true),
            this.solanaAccount (input['tokenVaultQuote'], true),
            this.solanaAccount (input['vaultAuthority']),
            this.solanaAccount (input['hfmmRegistry'], true),
            this.solanaAccount (input['tokenMintBase']),
            this.solanaAccount (input['tokenMintQuote']),
            this.solanaAccount (input['tokenProgramBase']),
            this.solanaAccount (input['tokenProgramQuote']),
        ];
        const tickArrays = this.safeList (input, 'tickArrays', [ input['tickArray'] ]);
        for (let i = 0; i < tickArrays.length; i++) {
            accounts.push (this.solanaAccount (tickArrays[i], true));
        }
        return {
            'programId': this.fibeProgramId (),
            'accounts': accounts,
            'data': data,
        };
    }

    fibeInitUserIx (owner, subAccountIndex) {
        const accountLabel = this.fibeGetAccountLabelHex (owner, subAccountIndex);
        return {
            'programId': this.fibeProgramId (),
            'accounts': [
                this.solanaAccount (this.solanaSystemProgramId ()),
                this.solanaAccount (this.fibeGetDexConfigPda ()),
                this.solanaAccount (owner, true, true),
                this.solanaAccount (this.fibeGetUserIdPda (owner), true),
                this.solanaAccount (this.fibeGetUserStatePda (owner), true),
                this.solanaAccount (this.fibeGetAccountLabelPda (owner, subAccountIndex), true),
                this.solanaAccount (this.fibeGetSubAccountStatePda (owner, subAccountIndex), true),
                this.solanaAccount (this.fibeProgramId ()),
                this.solanaAccount (this.fibeProgramId ()),
            ],
            'data': this.solanaBytesHex ([ 16, 0, 0, 0, 0, 0, 0, 0 ]) + this.fibeCalculateEncodedUserId (owner) + this.solanaU8Hex (subAccountIndex) + this.solanaU8Hex (0) + accountLabel,
        };
    }

    async fibeInitUserIfNeeded (rpcUrl, owner, subAccountIndex, commitment = 'confirmed') {
        const subAccountState = this.fibeGetSubAccountStatePda (owner, subAccountIndex);
        const accountInfo = await this.solanaGetAccountInfo (rpcUrl, subAccountState, commitment);
        if (accountInfo !== undefined) {
            return undefined;
        }
        return this.fibeInitUserIx (owner, subAccountIndex);
    }

    fibeSpotCloseRestingOrderIx (input) {
        return {
            'programId': this.fibeProgramId (),
            'accounts': [
                this.solanaAccount (input['market'], true),
                this.solanaAccount (input['owner'], true, true),
                this.solanaAccount (input['ownerSubAccountState'], true),
                this.solanaAccount (input['ownerState'], true),
                this.solanaAccount (input['openOrdersPerMarket'], true),
                this.solanaAccount (input['tickArray'], true),
                this.solanaAccount (input['ownerBaseTokenAccount'], true),
                this.solanaAccount (input['ownerQuoteTokenAccount'], true),
                this.solanaAccount (input['tokenVaultBase'], true),
                this.solanaAccount (input['tokenVaultQuote'], true),
                this.solanaAccount (input['vaultAuthority']),
                this.solanaAccount (input['tokenMintBase']),
                this.solanaAccount (input['tokenMintQuote']),
                this.solanaAccount (input['tokenProgramBase']),
                this.solanaAccount (input['tokenProgramQuote']),
            ],
            'data': this.solanaBytesHex ([ 57, 0, 0, 0, 0, 0, 0, 0 ]) + this.solanaU64leHex (input['orderId']),
        };
    }

    fibePerpPlaceOrderIx (input) {
        const isCrossMargin = input['isCrossMargin'] ? 1 : 0;
        const autoTopUpCollateralFromWallet = input['autoTopUpCollateralFromWallet'] ? 1 : 0;
        let data = this.solanaBytesHex ([ 134, 0, 0, 0, 0, 0, 0, 0 ]);
        data += this.solanaU64leHex (input['priceInTicks']);
        data += this.solanaU64leHex (input['orderId']);
        data += this.solanaU8Hex (this.fibeSideIndex (input['side']));
        data += this.solanaU8Hex (isCrossMargin);
        data += this.solanaU8Hex (autoTopUpCollateralFromWallet);
        data += this.solanaOptionU8Hex (input['initialLeverage']);
        data += this.solanaOptionU64Hex (input['sizeInBase']);
        data += this.solanaOptionU64Hex (undefined);
        data += this.solanaU8Hex (this.fibeTimeInForceIndex (input['timeInForce']));
        data += this.solanaOptionU16Hex (undefined);
        let ownerOrDelegateQuoteTokenAccount = this.solanaAccount (this.fibeProgramId ());
        if (input['ownerOrDelegateQuoteTokenAccount'] !== undefined) {
            ownerOrDelegateQuoteTokenAccount = this.solanaAccount (input['ownerOrDelegateQuoteTokenAccount'], true);
        }
        const accounts = [
            this.solanaAccount (this.solanaSystemProgramId ()),
            this.solanaAccount (input['market'], true),
            this.solanaAccount (input['ownerSubAccountState'], true),
            this.solanaAccount (input['ownerOrDelegate'], true, true),
            this.solanaAccount (input['ownerState'], true),
            this.solanaAccount (input['ownerMarginAccount'], true),
            this.solanaAccount (input['openOrdersPerMarket'], true),
            ownerOrDelegateQuoteTokenAccount,
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (input['perpControlParams'], true),
            this.solanaAccount (input['hfmmMarginAccounts'], true),
            this.solanaAccount (input['tokenVaultQuote'], true),
            this.solanaAccount (input['vaultAuthority']),
            this.solanaAccount (input['hfmmRegistry'], true),
            this.solanaAccount (input['tokenMintQuote']),
            this.solanaAccount (input['tokenProgramQuote']),
        ];
        const tickArrays = this.safeList (input, 'tickArrays', [ input['tickArray'] ]);
        for (let i = 0; i < tickArrays.length; i++) {
            accounts.push (this.solanaAccount (tickArrays[i], true));
        }
        return {
            'programId': this.fibeProgramId (),
            'accounts': accounts,
            'data': data,
        };
    }

    fibePerpCloseRestingOrderIx (input) {
        return {
            'programId': this.fibeProgramId (),
            'accounts': [
                this.solanaAccount (input['market'], true),
                this.solanaAccount (input['ownerSubAccountState'], true),
                this.solanaAccount (input['ownerOrDelegate'], true, true),
                this.solanaAccount (input['ownerState'], true),
                this.solanaAccount (input['ownerMarginAccount'], true),
                this.solanaAccount (input['openOrdersPerMarket'], true),
                this.solanaAccount (input['perpControlParams']),
                this.solanaAccount (input['tokenVaultQuote'], true),
                this.solanaAccount (input['vaultAuthority']),
                this.solanaAccount (input['tickArray'], true),
            ],
            'data': this.solanaBytesHex ([ 135, 0, 0, 0, 0, 0, 0, 0 ]) + this.solanaU64leHex (input['orderId']) + this.solanaOptionU16Hex (undefined),
        };
    }

    solanaFindAccountIndex (accounts, pubkey) {
        for (let i = 0; i < accounts.length; i++) {
            if (this.safeString (accounts[i], 'pubkey') === pubkey) {
                return i;
            }
        }
        return -1;
    }

    solanaAddAccountMeta (accounts, meta) {
        const pubkey = this.safeString (meta, 'pubkey');
        const index = this.solanaFindAccountIndex (accounts, pubkey);
        if (index < 0) {
            accounts.push ({
                'pubkey': pubkey,
                'isSigner': this.safeBool (meta, 'isSigner', false),
                'isWritable': this.safeBool (meta, 'isWritable', false),
            });
        } else {
            const previous = accounts[index];
            previous['isSigner'] = this.safeBool (previous, 'isSigner', false) || this.safeBool (meta, 'isSigner', false);
            previous['isWritable'] = this.safeBool (previous, 'isWritable', false) || this.safeBool (meta, 'isWritable', false);
            accounts[index] = previous;
        }
        return accounts;
    }

    solanaCompileMessageHex (payer, blockhash, instructions) {
        let metas = [];
        metas = this.solanaAddAccountMeta (metas, this.solanaAccount (payer, true, true));
        for (let i = 0; i < instructions.length; i++) {
            const ix = instructions[i];
            metas = this.solanaAddAccountMeta (metas, this.solanaAccount (this.safeString (ix, 'programId')));
            const accounts = this.safeList (ix, 'accounts', []);
            for (let j = 0; j < accounts.length; j++) {
                metas = this.solanaAddAccountMeta (metas, accounts[j]);
            }
        }
        const payerIndex = this.solanaFindAccountIndex (metas, payer);
        metas[payerIndex]['isSigner'] = true;
        metas[payerIndex]['isWritable'] = true;
        const nonPayerMetas = [];
        for (let i = 0; i < metas.length; i++) {
            const meta = metas[i];
            if (this.safeString (meta, 'pubkey') !== payer) {
                meta['sortKey'] = this.solanaPubkeyHex (this.safeString (meta, 'pubkey'));
                nonPayerMetas.push (meta);
            }
        }
        const sortedMetas = this.sortBy (nonPayerMetas, 'sortKey');
        const ordered = [];
        ordered.push (metas[payerIndex]);
        for (let i = 0; i < sortedMetas.length; i++) {
            const meta = sortedMetas[i];
            if (this.safeBool (meta, 'isSigner') && this.safeBool (meta, 'isWritable')) {
                ordered.push (meta);
            }
        }
        for (let i = 0; i < sortedMetas.length; i++) {
            const meta = sortedMetas[i];
            if (this.safeBool (meta, 'isSigner') && !this.safeBool (meta, 'isWritable')) {
                ordered.push (meta);
            }
        }
        for (let i = 0; i < sortedMetas.length; i++) {
            const meta = sortedMetas[i];
            if (!this.safeBool (meta, 'isSigner') && this.safeBool (meta, 'isWritable')) {
                ordered.push (meta);
            }
        }
        for (let i = 0; i < sortedMetas.length; i++) {
            const meta = sortedMetas[i];
            if (!this.safeBool (meta, 'isSigner') && !this.safeBool (meta, 'isWritable')) {
                ordered.push (meta);
            }
        }
        let requiredSignatures = 0;
        let readonlySigners = 0;
        let readonlyUnsigned = 0;
        for (let i = 0; i < ordered.length; i++) {
            const meta = ordered[i];
            if (this.safeBool (meta, 'isSigner')) {
                requiredSignatures += 1;
                if (!this.safeBool (meta, 'isWritable')) {
                    readonlySigners += 1;
                }
            } else if (!this.safeBool (meta, 'isWritable')) {
                readonlyUnsigned += 1;
            }
        }
        let accountHex = '';
        const orderedLength = ordered.length;
        for (let i = 0; i < ordered.length; i++) {
            accountHex += this.solanaPubkeyHex (this.safeString (ordered[i], 'pubkey'));
        }
        let instructionsHex = '';
        const instructionsLength = instructions.length;
        for (let i = 0; i < instructions.length; i++) {
            const ix = instructions[i];
            const accounts = this.safeList (ix, 'accounts', []);
            let accountIndexesHex = '';
            const accountsLength = accounts.length;
            for (let j = 0; j < accounts.length; j++) {
                const accountPubkey = this.safeString (accounts[j], 'pubkey');
                accountIndexesHex += this.solanaU8Hex (this.solanaFindAccountIndex (ordered, accountPubkey));
            }
            const programIndex = this.solanaFindAccountIndex (ordered, this.safeString (ix, 'programId'));
            const data = this.safeString (ix, 'data', '');
            instructionsHex += this.solanaU8Hex (programIndex);
            instructionsHex += this.solanaShortVecHex (accountsLength);
            instructionsHex += accountIndexesHex;
            instructionsHex += this.solanaShortVecHex (this.parseToInt (data.length / 2));
            instructionsHex += data;
        }
        let messageHex = this.solanaU8Hex (128);
        messageHex += this.solanaU8Hex (requiredSignatures);
        messageHex += this.solanaU8Hex (readonlySigners);
        messageHex += this.solanaU8Hex (readonlyUnsigned);
        messageHex += this.solanaShortVecHex (orderedLength);
        messageHex += accountHex;
        messageHex += this.solanaPubkeyHex (blockhash);
        messageHex += this.solanaShortVecHex (instructionsLength);
        messageHex += instructionsHex;
        messageHex += this.solanaShortVecHex (0);
        return messageHex;
    }

    solanaSignTransaction (payer, privateKeyHex, blockhash, instructions) {
        const messageHex = this.solanaCompileMessageHex (payer, blockhash, instructions);
        const messageBytes = this.base16ToBinary (messageHex);
        const privateKeyBytes = this.base16ToBinary (privateKeyHex);
        const signatureBase64 = eddsa (messageBytes, privateKeyBytes, ed25519);
        const signature = this.base64ToBinary (signatureBase64);
        const signatureHex = this.binaryToBase16 (signature);
        const transactionHex = this.solanaShortVecHex (1) + signatureHex + messageHex;
        return {
            'signature': this.binaryToBase58 (signature),
            'transaction': this.binaryToBase64 (this.base16ToBinary (transactionHex)),
        };
    }

    fibeReadOpenOrderPriceInTicks (data, mt, orderId) {
        const hex = this.binaryToBase16 (data);
        const orderCount = parseInt (this.solanaReadU32FromHex (hex, 60));
        const orderSize = (mt === 'S') ? 144 : 160;
        let offset = 64;
        for (let i = 0; i < orderCount; i++) {
            const clientOrderId = this.solanaReadU64FromHex (hex, offset);
            if ((clientOrderId !== '0') && (clientOrderId === orderId)) {
                return this.solanaReadU64FromHex (hex, offset + 56);
            }
            offset = this.sum (offset, orderSize);
        }
        throw new ExchangeError (this.id + ' cancelOrder() could not find open order ' + orderId);
    }

    async fibeLocalTxCreateOrder (params): Promise<Dict> {
        const market = this.fibeTxParseMarket (params['market']);
        const mt = this.safeString (market, 'mt');
        if ((mt === 'S') && (market['quoteMint'] === this.solanaNativeMint ()) && (this.safeString (params, 'side') === 'B')) {
            throw new ExchangeError (this.id + ' local Fibe transaction construction does not support buying with native SOL quote');
        }
        const mi = this.safeString (market, 'mi');
        let marginMode = this.safeString (params, 'marginMode', 'cross');
        if (mt === 'P') {
            marginMode = this.fibeNormalizeMarginMode ('createOrder', marginMode);
        }
        const owner = this.safeString (params, 'user');
        const privateKeyHex = this.solanaParsePrivateKeyHex (this.safeString (params, 'privateKey'), owner);
        const orderId = this.safeString (params, 'orderId');
        const subAccountIndex = this.safeInteger (params, 'subAccountIndex', 0);
        const orderSubAccountIndex = (mt === 'S') ? 0 : subAccountIndex;
        const priceInTicks = this.fibePriceToTicks (this.safeString (params, 'price'), this.safeInteger (market, 'quoteDecimals'), this.safeString (market, 'tickSizeInQuoteBaseUnits'), this.safeString (params, 'side'), this.safeNumber (params, 'slippage'));
        if (!Precise.stringGt (priceInTicks, '0')) {
            throw new InvalidOrder (this.id + ' createOrder() price is too small for market tick size');
        }
        const sizeInBase = this.fibeNormalizeQuantity (
            this.fibeDecimalToUnits (this.safeString (params, 'amount'), this.safeInteger (market, 'baseDecimals')),
            this.safeString (market, 'lotSizeInBaseBaseUnits')
        );
        const orderTickArray = this.fibeGetTickArrayPda (mt, mi, priceInTicks);
        const openOrdersPerMarket = this.fibeGetOpenOrdersPerMarketPda (mt, owner, orderSubAccountIndex, mi);
        const rpcUrl = this.safeString (params, 'rpcUrl');
        const commitment = this.safeString (params, 'commitment', 'confirmed');
        const tickArrays = await this.fibeGetTickArraysForOrder (rpcUrl, market, priceInTicks, sizeInBase, this.safeString (params, 'side'), commitment);
        const tokenProgramQuote = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'quoteMint'), this.safeString (market, 'tokenProgramQuote'), commitment);
        let ixs = [];
        if (mt === 'S') {
            const tokenProgramBase = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'baseMint'), this.safeString (market, 'tokenProgramBase'), commitment);
            const ownerBaseTokenAccount = this.solanaGetAssociatedTokenAddress (this.safeString (market, 'baseMint'), owner, tokenProgramBase);
            const ownerQuoteTokenAccount = this.solanaGetAssociatedTokenAddress (this.safeString (market, 'quoteMint'), owner, tokenProgramQuote);
            if ((this.safeString (market, 'baseMint') === this.solanaNativeMint ()) && (this.safeString (params, 'side') === 'A')) {
                const wrapIxs = await this.solanaWrapNativeIfNeeded (rpcUrl, owner, tokenProgramBase, sizeInBase, commitment);
                ixs = this.arrayConcat (ixs, wrapIxs);
            }
            let ataMint = this.safeString (market, 'quoteMint');
            let ataTokenProgram = tokenProgramQuote;
            if (this.safeString (params, 'side') === 'B') {
                ataMint = this.safeString (market, 'baseMint');
                ataTokenProgram = tokenProgramBase;
            }
            const createAtaIx = await this.solanaCreateAssociatedTokenAccountIfNeeded (rpcUrl, owner, owner, ataMint, ataTokenProgram, commitment);
            if (createAtaIx !== undefined) {
                ixs.push (createAtaIx);
            }
            const initUserIx = await this.fibeInitUserIfNeeded (rpcUrl, owner, 0, commitment);
            if (initUserIx !== undefined) {
                ixs.push (initUserIx);
            }
            ixs.push (this.fibeSpotPlaceOrderIx ({
                'owner': owner,
                'ownerSubAccountState': this.fibeGetSubAccountStatePda (owner, 0),
                'ownerState': this.fibeGetUserStatePda (owner),
                'openOrdersPerMarket': openOrdersPerMarket,
                'ownerBaseTokenAccount': ownerBaseTokenAccount,
                'ownerQuoteTokenAccount': ownerQuoteTokenAccount,
                'market': this.safeString (market, 'marketPubkey'),
                'tokenVaultBase': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'baseMint')),
                'tokenVaultQuote': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'quoteMint')),
                'vaultAuthority': this.fibeGetVaultAuthorityPda (),
                'hfmmRegistry': this.fibeGetHfmmRegistryPda ('S', mi),
                'tokenMintBase': this.safeString (market, 'baseMint'),
                'tokenMintQuote': this.safeString (market, 'quoteMint'),
                'tokenProgramBase': tokenProgramBase,
                'tokenProgramQuote': tokenProgramQuote,
                'priceInTicks': priceInTicks,
                'orderId': orderId,
                'side': this.safeString (params, 'side'),
                'sizeInBase': sizeInBase,
                'timeInForce': this.safeString (params, 'timeInForce'),
                'tickArray': orderTickArray,
                'tickArrays': tickArrays,
            }));
        } else {
            const autoTopUp = this.safeBool (params, 'autoTopUpCollateralFromWallet', true);
            let ownerQuoteTokenAccount = undefined;
            if (autoTopUp) {
                ownerQuoteTokenAccount = this.solanaGetAssociatedTokenAddress (this.safeString (market, 'quoteMint'), owner, tokenProgramQuote);
            }
            if (ownerQuoteTokenAccount !== undefined) {
                const createAtaIx = await this.solanaCreateAssociatedTokenAccountIfNeeded (rpcUrl, owner, owner, this.safeString (market, 'quoteMint'), tokenProgramQuote, commitment);
                if (createAtaIx !== undefined) {
                    ixs.push (createAtaIx);
                }
            }
            const isCrossMargin = (marginMode === 'cross');
            ixs.push (this.fibePerpPlaceOrderIx ({
                'owner': owner,
                'ownerOrDelegate': owner,
                'ownerSubAccountState': this.fibeGetSubAccountStatePda (owner, subAccountIndex),
                'ownerState': this.fibeGetUserStatePda (owner),
                'ownerMarginAccount': this.fibeGetUserMarginAccountPda (owner, subAccountIndex, this.safeString (market, 'quoteMint')),
                'openOrdersPerMarket': openOrdersPerMarket,
                'ownerOrDelegateQuoteTokenAccount': ownerQuoteTokenAccount,
                'market': this.safeString (market, 'marketPubkey'),
                'perpControlParams': this.fibeGetPerpControlParamsPda (this.safeString (market, 'quoteMint')),
                'hfmmMarginAccounts': this.fibeGetHfmmMarginAccountsPda (this.safeString (market, 'quoteMint')),
                'tokenVaultQuote': this.fibeGetPerpMarketVaultPda (this.safeString (market, 'quoteMint')),
                'vaultAuthority': this.fibeGetVaultAuthorityPda (),
                'hfmmRegistry': this.fibeGetHfmmRegistryPda ('P', mi),
                'tokenMintQuote': this.safeString (market, 'quoteMint'),
                'tokenProgramQuote': tokenProgramQuote,
                'priceInTicks': priceInTicks,
                'orderId': orderId,
                'side': this.safeString (params, 'side'),
                'isCrossMargin': isCrossMargin,
                'autoTopUpCollateralFromWallet': autoTopUp,
                'initialLeverage': this.safeInteger (params, 'initialLeverage'),
                'sizeInBase': sizeInBase,
                'timeInForce': this.safeString (params, 'timeInForce'),
                'tickArray': orderTickArray,
                'tickArrays': tickArrays,
            }));
        }
        const result = await this.solanaSignAndSend (rpcUrl, owner, privateKeyHex, ixs, params);
        result['openOrdersPerMarket'] = openOrdersPerMarket;
        result['priceInTicks'] = priceInTicks;
        result['tickArray'] = orderTickArray;
        result['tickArrays'] = tickArrays;
        return result;
    }

    async fibeLocalTxCancelOrder (params): Promise<Dict> {
        const market = this.fibeTxParseMarket (params['market']);
        const mt = this.safeString (market, 'mt');
        const mi = this.safeString (market, 'mi');
        const owner = this.safeString (params, 'user');
        const privateKeyHex = this.solanaParsePrivateKeyHex (this.safeString (params, 'privateKey'), owner);
        const orderId = this.safeString (params, 'orderId');
        let subAccountIndex = this.safeInteger (params, 'subAccountIndex', 0);
        if (mt === 'S') {
            subAccountIndex = 0;
        }
        const openOrdersPerMarket = this.fibeGetOpenOrdersPerMarketPda (mt, owner, subAccountIndex, mi);
        const rpcUrl = this.safeString (params, 'rpcUrl');
        const commitment = this.safeString (params, 'commitment', 'confirmed');
        const openOrdersAccount = await this.solanaGetAccountData (rpcUrl, openOrdersPerMarket, commitment);
        const priceInTicks = this.fibeReadOpenOrderPriceInTicks (openOrdersAccount, mt, orderId);
        const tickArray = this.fibeGetTickArrayPda (mt, mi, priceInTicks);
        let ix = undefined;
        if (mt === 'S') {
            const tokenProgramBase = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'baseMint'), this.safeString (market, 'tokenProgramBase'), commitment);
            const tokenProgramQuote = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'quoteMint'), this.safeString (market, 'tokenProgramQuote'), commitment);
            ix = this.fibeSpotCloseRestingOrderIx ({
                'owner': owner,
                'ownerSubAccountState': this.fibeGetSubAccountStatePda (owner, 0),
                'ownerState': this.fibeGetUserStatePda (owner),
                'openOrdersPerMarket': openOrdersPerMarket,
                'tickArray': tickArray,
                'ownerBaseTokenAccount': this.solanaGetAssociatedTokenAddress (this.safeString (market, 'baseMint'), owner, tokenProgramBase),
                'ownerQuoteTokenAccount': this.solanaGetAssociatedTokenAddress (this.safeString (market, 'quoteMint'), owner, tokenProgramQuote),
                'market': this.safeString (market, 'marketPubkey'),
                'tokenVaultBase': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'baseMint')),
                'tokenVaultQuote': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'quoteMint')),
                'vaultAuthority': this.fibeGetVaultAuthorityPda (),
                'tokenMintBase': this.safeString (market, 'baseMint'),
                'tokenMintQuote': this.safeString (market, 'quoteMint'),
                'tokenProgramBase': tokenProgramBase,
                'tokenProgramQuote': tokenProgramQuote,
                'orderId': orderId,
            });
        } else {
            ix = this.fibePerpCloseRestingOrderIx ({
                'market': this.safeString (market, 'marketPubkey'),
                'ownerSubAccountState': this.fibeGetSubAccountStatePda (owner, subAccountIndex),
                'ownerOrDelegate': owner,
                'ownerState': this.fibeGetUserStatePda (owner),
                'ownerMarginAccount': this.fibeGetUserMarginAccountPda (owner, subAccountIndex, this.safeString (market, 'quoteMint')),
                'openOrdersPerMarket': openOrdersPerMarket,
                'perpControlParams': this.fibeGetPerpControlParamsPda (this.safeString (market, 'quoteMint')),
                'tokenVaultQuote': this.fibeGetPerpMarketVaultPda (this.safeString (market, 'quoteMint')),
                'vaultAuthority': this.fibeGetVaultAuthorityPda (),
                'tickArray': tickArray,
                'orderId': orderId,
            });
        }
        const result = await this.solanaSignAndSend (rpcUrl, owner, privateKeyHex, [ ix ], params);
        result['openOrdersPerMarket'] = openOrdersPerMarket;
        result['priceInTicks'] = priceInTicks;
        result['tickArray'] = tickArray;
        return result;
    }

    fibeTxParseMarket (market) {
        const info = this.safeDict (market, 'info', {});
        let mt = 'P';
        if (this.safeBool (market, 'spot')) {
            mt = 'S';
        }
        return {
            'mt': mt,
            'mi': this.safeString (info, 'mi'),
            'marketPubkey': this.safeString (info, 'marketPubkey'),
            'baseMint': this.safeString (info, 'baseMint'),
            'quoteMint': this.safeString (info, 'quoteMint'),
            'baseDecimals': this.safeInteger (info, 'baseDecimals'),
            'quoteDecimals': this.safeInteger (info, 'quoteDecimals'),
            'tickSizeInQuoteBaseUnits': this.safeString (info, 'tickSizeInQuoteBaseUnits'),
            'lotSizeInBaseBaseUnits': this.safeString (info, 'lotSizeInBaseBaseUnits'),
            'tokenProgramBase': this.safeString (info, 'tokenProgramBase'),
            'tokenProgramQuote': this.safeString (info, 'tokenProgramQuote'),
        };
    }

    async solanaGetTokenProgram (rpcUrl, mint, tokenProgram = undefined, commitment = 'confirmed'): Promise<string> {
        if (tokenProgram !== undefined) {
            return tokenProgram;
        }
        let tokenPrograms = this.safeDict (this.options, 'tokenPrograms');
        if (tokenPrograms === undefined) {
            this.options['tokenPrograms'] = {};
            tokenPrograms = this.safeDict (this.options, 'tokenPrograms');
        }
        const cached = this.safeString (tokenPrograms, mint);
        if (cached !== undefined) {
            return cached;
        }
        const accountInfo = await this.solanaGetAccountInfo (rpcUrl, mint, commitment);
        if (accountInfo === undefined) {
            throw new ExchangeError (this.id + ' token mint account not found ' + mint);
        }
        const owner = accountInfo['owner'];
        tokenPrograms[mint] = owner;
        return owner;
    }

    async solanaGetAccountData (rpcUrl, pubkey, commitment = 'confirmed'): Promise<string> {
        const accountInfo = await this.solanaGetAccountInfo (rpcUrl, pubkey, commitment);
        if (accountInfo === undefined) {
            throw new ExchangeError (this.id + ' account not found ' + pubkey);
        }
        return accountInfo['data'];
    }

    async solanaGetAccountInfo (rpcUrl, pubkey, commitment = 'confirmed'): Promise<Dict> {
        const response = await this.solanaRpc (rpcUrl, 'getAccountInfo', [
            pubkey,
            { 'encoding': 'base64', 'commitment': commitment },
        ]);
        const value = this.safeValue (response, 'value');
        if (value === undefined) {
            return undefined;
        }
        const data = this.safeList (value, 'data', []);
        if (data.length === 0) {
            throw new ExchangeError (this.id + ' Solana account response is missing base64 data for ' + pubkey);
        }
        return {
            'owner': this.safeString (value, 'owner'),
            'data': this.base64ToBinary (data[0]),
        };
    }

    async solanaSignAndSend (rpcUrl, payer, privateKeyHex, instructions, params = {}): Promise<Dict> {
        const commitment = this.safeString (params, 'commitment', 'confirmed');
        let blockhash = this.safeString (params, 'blockhash');
        let lastValidBlockHeight = undefined;
        if (blockhash === undefined) {
            const blockhashResponse = await this.solanaRpc (rpcUrl, 'getLatestBlockhash', [
                { 'commitment': commitment },
            ]);
            const value = this.safeDict (blockhashResponse, 'value', {});
            blockhash = this.safeString (value, 'blockhash');
            lastValidBlockHeight = this.safeInteger (value, 'lastValidBlockHeight');
        }
        if (blockhash === undefined) {
            throw new ExchangeError (this.id + ' Solana RPC getLatestBlockhash returned no blockhash');
        }
        const finalInstructions = this.solanaAddComputeBudgetIxs (instructions, params);
        const signed = this.solanaSignTransaction (payer, privateKeyHex, blockhash, finalInstructions);
        const sendOptions: Dict = {
            'encoding': 'base64',
        };
        let preflightCommitment = this.safeString (params, 'preflightCommitment');
        if (preflightCommitment === undefined) {
            preflightCommitment = commitment;
        }
        sendOptions['preflightCommitment'] = preflightCommitment;
        const skipPreflight = this.safeBool (params, 'skipPreflight');
        if (skipPreflight !== undefined) {
            sendOptions['skipPreflight'] = skipPreflight;
        }
        const maxRetries = this.safeInteger (params, 'maxRetries');
        if (maxRetries !== undefined) {
            sendOptions['maxRetries'] = maxRetries;
        }
        const minContextSlot = this.safeInteger (params, 'minContextSlot');
        if (minContextSlot !== undefined) {
            sendOptions['minContextSlot'] = minContextSlot;
        }
        const signature = await this.solanaRpc (rpcUrl, 'sendTransaction', [
            signed['transaction'],
            sendOptions,
        ]);
        if (signature === undefined) {
            throw new ExchangeError (this.id + ' Solana RPC sendTransaction returned no signature');
        }
        return {
            'signature': signature,
            'transaction': signed['transaction'],
            'blockhash': blockhash,
            'lastValidBlockHeight': lastValidBlockHeight,
            'sendOptions': sendOptions,
        };
    }

    async solanaRpc (rpcUrl, method, params): Promise<Dict> {
        const response = await this.fetch (rpcUrl, 'POST', { 'Content-Type': 'application/json' }, this.json ({
            'jsonrpc': '2.0',
            'id': 1,
            'method': method,
            'params': params,
        }));
        const error = this.safeValue (response, 'error');
        if (error !== undefined) {
            throw new ExchangeError (this.id + ' Solana RPC ' + method + ' failed: ' + this.json (error));
        }
        return this.safeValue (response, 'result');
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
            'GTC': 'GTC',
            'IOC': 'IOC',
            'FOK': 'FOK',
            'ALO': 'PO',
        };
        return this.safeString (timeInForces, timeInForce, timeInForce);
    }

    encodeCreateOrderTimeInForce (timeInForce: Str, postOnly: boolean): string {
        if (postOnly) {
            let upperTimeInForce = undefined;
            if (timeInForce !== undefined) {
                upperTimeInForce = timeInForce.toUpperCase ();
            }
            if ((upperTimeInForce !== undefined) && (upperTimeInForce !== 'PO') && (upperTimeInForce !== 'ALO')) {
                throw new InvalidOrder (this.id + ' createOrder() postOnly cannot be combined with timeInForce ' + timeInForce);
            }
            return 'ALO';
        }
        if (timeInForce === undefined) {
            return 'GTC';
        }
        const upper = timeInForce.toUpperCase ();
        const timeInForces: Dict = {
            'GTC': 'GTC',
            'IOC': 'IOC',
            'PO': 'ALO',
            'ALO': 'ALO',
            'FOK': 'FOK',
        };
        const result = this.safeString (timeInForces, upper);
        if (result === undefined) {
            throw new InvalidOrder (this.id + ' createOrder() local transaction construction supports timeInForce GTC, IOC, PO/ALO, or FOK');
        }
        return result;
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
        const error = this.safeString (response, 'error');
        if (error !== undefined) {
            const feedback = this.id + ' ' + body;
            this.throwBroadlyMatchedException (this.exceptions['broad'], error, feedback);
            this.throwExactlyMatchedException (this.exceptions['exact'], this.numberToString (code), feedback);
            throw new ExchangeError (feedback);
        }
        return undefined;
    }
}
