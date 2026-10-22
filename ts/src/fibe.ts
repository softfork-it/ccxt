
//  ---------------------------------------------------------------------------

import Exchange from './abstract/fibe.js';
import { ArgumentsRequired, AuthenticationError, BadRequest, ExchangeError, InvalidOrder, OrderNotFound, RateLimitExceeded } from './base/errors.js';
import { TICK_SIZE } from './base/functions/number.js';
import { eddsa } from './base/functions/crypto.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { Precise } from './base/Precise.js';
import type { Balances, Dict, FundingHistory, FundingRate, FundingRates, List, Market, Num, OHLCV, OpenInterest, Order, OrderBook, OrderSide, OrderType, Position, Strings, Ticker, Tickers, Trade, TradingFeeInterface, TradingFees, Str, Int, int } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class fibe
 * @augments Exchange
 * Fibe — Solana on-chain orderbook DEX (spot + perp).
 */
export default class fibe extends Exchange {
    override describe (): any {
        return this.deepExtend (super.describe (), {
            'id': 'fibe',
            'name': 'Fibe',
            'countries': [ ],
            'certified': false,
            'pro': true,
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
            'options': {
                'rpcUrl': 'https://api.devnet.solana.com',
                'commitment': 'confirmed',
            },
            'urls': {
                'logo': 'https://avatars.githubusercontent.com/u/222646239?v=4',
                'api': {
                    'rest': 'https://api.devnet.fibe.trade/api/v1',
                },
                'www': 'https://fibe.trade',
                'doc': 'https://api.devnet.fibe.trade/swagger-ui/',
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
                        'account-id': 1,
                        'next-account-id': 1,
                        'order': 1,
                        'order-slots': 1,
                        'open-orders': 1,
                        'historical-orders': 1,
                        'spot-state': 1,
                        'clearinghouse-state': 1,
                        'all-clearinghouse-state': 1,
                        'user-fees': 1,
                        'user-funding-history': 1,
                        'user-fills': 1,
                        'referral-state': 1,
                        'tick-array': 1,
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
     * @see https://api.devnet.fibe.trade/api/v1/markets
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} an array of objects representing market data
     */
    override async fetchMarkets (params = {}): Promise<Market[]> {
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

    override parseMarket (market: Dict): Market {
        // spot symbols are "BASE/USDC", perp symbols are "BASE-USDC"
        const marketSymbol = this.safeString (market, 'symbol');
        if (marketSymbol === undefined) {
            throw new ExchangeError (this.id + ' market is missing a symbol');
        }
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
        const executionMode = this.safeString (market, 'executionMode', 'active');
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
        const baseDecimals: any = this.safeInteger (market, 'baseDecimals');
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
            'active': executionMode !== 'closeOnly',
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
     * @description query spot wallet balances and funds held by open orders for a user
     * @see https://api.devnet.fibe.trade/api/v1/spot-state
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.subAccountIndex] account subindex used to resolve the user's account id, defaults to 0
     * @param {string} [params.rpcUrl] Solana RPC endpoint
     * @param {string} [params.commitment] Solana commitment for balance RPC calls, defaults to confirmed
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
     */
    override async fetchBalance (params = {}): Promise<Balances> {
        await this.loadMarkets ();
        let requestParams = params;
        let userAddress = undefined;
        [ userAddress, requestParams ] = this.handlePublicAddress ('fetchBalance', requestParams);
        let rpcUrl = undefined;
        [ rpcUrl, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchBalance', 'rpcUrl', this.safeString (this.options, 'rpcUrl'));
        let commitment = undefined;
        [ commitment, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchBalance', 'commitment', this.safeString (this.options, 'commitment', 'confirmed'));
        if (this.safeValue (requestParams, 'accountId') !== undefined) {
            throw new BadRequest (this.id + ' fetchBalance() does not accept accountId; use user or walletAddress');
        }
        let subAccountIndex = undefined;
        [ subAccountIndex, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchBalance', 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param ('fetchBalance', 'subAccountIndex', subAccountIndex);
        const accountIdResponse = await this.publicGetAccountId ({
            'owner': userAddress,
            'subAccountIndex': subAccountIndex,
        });
        const accountId = this.safeString (accountIdResponse, 'accountId');
        let response: Dict = { 'balances': [] };
        if (accountId !== undefined) {
            response = await this.publicGetSpotState (this.extend ({ 'aid': accountId }, requestParams));
        }
        //
        //     {
        //         "aid": "42",
        //         "balances": [
        //             { "symbol": "USDC", "hold": "1.2", "entryNtl": "3.4" }
        //         ]
        //     }
        //
        const balances = this.safeList (response, 'balances', []);
        const result: Dict = { 'info': response };
        const holds: Dict = {};
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            const currencyId = this.safeString (balance, 'symbol');
            const code = this.safeCurrencyCode (currencyId);
            if (code === undefined) {
                continue;
            }
            holds[code] = this.safeString (balance, 'hold', '0');
            const account = this.account ();
            account['used'] = holds[code];
            result[code] = account;
        }
        const currencies: Dict = {};
        for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];
            if (symbol === undefined) {
                continue;
            }
            const market = this.market (symbol);
            if (market['spot'] === true) {
                const info = market['info'];
                const base = market['base'];
                const quote = market['quote'];
                if (!(base in currencies)) {
                    currencies[base] = {
                        'mint': market['baseId'],
                        'decimals': this.safeInteger (info, 'baseDecimals'),
                        'tokenProgram': this.safeString (info, 'tokenProgramBase'),
                    };
                }
                if (!(quote in currencies)) {
                    currencies[quote] = {
                        'mint': market['quoteId'],
                        'decimals': this.safeInteger (info, 'quoteDecimals'),
                        'tokenProgram': this.safeString (info, 'tokenProgramQuote'),
                    };
                }
            }
        }
        const codes = Object.keys (currencies);
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            const currency = currencies[code];
            const mint = this.safeString (currency, 'mint');
            const decimals = this.safeInteger (currency, 'decimals');
            const tokenProgram = await this.solanaGetTokenProgram (rpcUrl, mint, this.safeString (currency, 'tokenProgram'), commitment);
            const tokenAccount = this.solanaGetAssociatedTokenAddress (mint, userAddress, tokenProgram);
            const tokenAccountInfo = await this.solanaGetAccountInfo (rpcUrl, tokenAccount, commitment);
            let rawFree = '0';
            if (tokenAccountInfo !== undefined) {
                const tokenAccountHex = this.binaryToBase16 (tokenAccountInfo['data']);
                if (tokenAccountHex.length < 144) {
                    throw new ExchangeError (this.id + ' invalid Solana token account ' + tokenAccount);
                }
                rawFree = this.solanaReadU64FromHex (tokenAccountHex, 64);
            }
            if (mint === this.solanaNativeMint ()) {
                const ownerAccountInfo = await this.solanaGetAccountInfo (rpcUrl, userAddress, commitment);
                if (ownerAccountInfo !== undefined) {
                    const totalFree = Precise.stringAdd (rawFree, this.safeString (ownerAccountInfo, 'lamports', '0'));
                    if (totalFree !== undefined) {
                        rawFree = totalFree;
                    }
                }
            }
            const account = this.account ();
            account['free'] = Precise.stringMul (rawFree, this.parsePrecision (this.numberToString (decimals)));
            account['used'] = this.safeString (holds, code, '0');
            account['total'] = Precise.stringAdd (account['free'], account['used']);
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    /**
     * @method
     * @name fibe#fetchPositions
     * @description fetch open perp positions for a user
     * @see https://api.devnet.fibe.trade/api/v1/all-clearinghouse-state
     * @param {string[]|undefined} symbols list of unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @returns {object[]} a list of [position structures]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    override async fetchPositions (symbols: Strings = undefined, params = {}): Promise<Position[]> {
        let requestParams = params;
        let accountId = undefined;
        const accountIdResponse = await this.fibeAccountId ('fetchPositions', requestParams);
        [ accountId, requestParams ] = accountIdResponse;
        await this.loadMarkets ();
        const marketSymbols = this.marketSymbols (symbols, 'swap');
        const request: Dict = {
            'aid': accountId,
        };
        const response = await this.publicGetAllClearinghouseState (this.extend (request, requestParams));
        //
        //     {
        //         "aid": "42",
        //         "states": [
        //             {
        //                 "aid": "42",
        //                 "qti": 0,
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
                    'accountId': this.safeString (state, 'aid'),
                    'quoteTokenIndex': this.safeValue (state, 'qti'),
                }, positions[j]);
                result.push (this.parsePosition (position));
            }
        }
        return this.filterByArrayPositions (result, 'symbol', marketSymbols);
    }

    /**
     * @method
     * @name fibe#fetchPosition
     * @description fetch an open perp position for a market
     * @see https://api.devnet.fibe.trade/api/v1/all-clearinghouse-state
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @returns {object} a [position structure]{@link https://docs.ccxt.com/#/?id=position-structure}
     */
    override async fetchPosition (symbol: string, params = {}): Promise<Position> {
        const positions = await this.fetchPositions ([ symbol ], params);
        return this.safeDict (positions, 0, {}) as Position;
    }

    override parsePosition (position: Dict, market: Market = undefined): Position {
        //
        //     {
        //         "accountId": "42",
        //         "quoteTokenIndex": 0,
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
        const marketResolved = this.safeMarket (marketId, market);
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
            'symbol': marketResolved['symbol'],
            'timestamp': undefined,
            'datetime': undefined,
            'contracts': this.parseNumber (Precise.stringAbs (size)),
            'contractSize': this.safeNumber (marketResolved, 'contractSize'),
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
     * @see https://api.devnet.fibe.trade/api/v1/user-funding-history
     * @param {string} [symbol] unified market symbol
     * @param {int} [since] the earliest time in ms to fetch funding history for
     * @param {int} [limit] the maximum number of funding history structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @param {int} [params.until] the latest time in ms to fetch funding history for
     * @returns {object[]} a list of [funding history structures]{@link https://docs.ccxt.com/#/?id=funding-history-structure}
     */
    override async fetchFundingHistory (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<FundingHistory[]> {
        await this.loadMarkets ();
        let marketSymbol = symbol;
        if (marketSymbol !== undefined) {
            marketSymbol = this.market (marketSymbol)['symbol'];
        }
        let requestParams = params;
        let accountId = undefined;
        const accountIdResponse = await this.fibeAccountId ('fetchFundingHistory', requestParams);
        [ accountId, requestParams ] = accountIdResponse;
        let until: Int = undefined;
        [ until, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchFundingHistory', 'until');
        let startTime = 0;
        if (since !== undefined) {
            startTime = this.parseToInt (since / 1000);
        }
        const request: Dict = {
            'aid': accountId,
            'startTime': startTime,
        };
        if (until !== undefined) {
            request['endTime'] = this.parseToInt (until / 1000);
        }
        const response = await this.publicGetUserFundingHistory (this.extend (request, requestParams));
        const fundingHistory = this.parseIncomes (response);
        return this.filterBySymbolSinceLimit (fundingHistory, marketSymbol, since, limit) as FundingHistory[];
    }

    override parseIncome (income: Dict, market: Market = undefined) {
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
        const marketResolved = this.safeMarket (marketId, market);
        const timestamp = this.safeTimestamp (income, 'time');
        return {
            'info': income,
            'symbol': marketResolved['symbol'],
            'code': this.safeString (marketResolved, 'settle', 'USDC'),
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
     * @see https://api.devnet.fibe.trade/api/v1/user-fees
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {object} a dictionary of [fee structures]{@link https://docs.ccxt.com/#/?id=fee-structure} indexed by market symbols
     */
    override async fetchTradingFees (params = {}): Promise<TradingFees> {
        let requestParams = params;
        let userAddress = undefined;
        [ userAddress, requestParams ] = this.handlePublicAddress ('fetchTradingFees', requestParams);
        await this.loadMarkets ();
        const response = await this.publicGetUserFees (this.extend ({
            'user': userAddress,
        }, requestParams));
        const result: Dict = {};
        for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];
            result[symbol] = this.parseTradingFee (response, this.market (symbol));
        }
        return result;
    }

    /**
     * @method
     * @name fibe#fetchTradingFee
     * @description fetch the user trading fees for one market
     * @see https://api.devnet.fibe.trade/api/v1/user-fees
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @returns {object} a [fee structure]{@link https://docs.ccxt.com/#/?id=fee-structure}
     */
    override async fetchTradingFee (symbol: string, params = {}): Promise<TradingFeeInterface> {
        let requestParams = params;
        let userAddress = undefined;
        [ userAddress, requestParams ] = this.handlePublicAddress ('fetchTradingFee', requestParams);
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'user': userAddress,
        };
        const response = await this.publicGetUserFees (this.extend (request, requestParams));
        return this.parseTradingFee (response, market);
    }

    parseTradingFee (response: Dict, market: Market): TradingFeeInterface {
        const isSpot = this.safeBool (market, 'spot', false);
        const makerField = isSpot ? 'userSpotAddRate' : 'userAddRate';
        const takerField = isSpot ? 'userSpotCrossRate' : 'userCrossRate';
        return {
            'info': response,
            'symbol': this.safeString (market, 'symbol'),
            'maker': this.safeNumber (response, makerField),
            'taker': this.safeNumber (response, takerField),
            'percentage': true,
            'tierBased': true,
        };
    }

    /**
     * @method
     * @name fibe#fetchTicker
     * @description fetches a midpoint-based price ticker, 24h volume, and 24h change for a market
     * @see https://api.devnet.fibe.trade/api/v1/spot-asset-ctx
     * @see https://api.devnet.fibe.trade/api/v1/perp-asset-ctx
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    override async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
        };
        let response = undefined;
        if (market['spot'] === true) {
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
     * @see https://api.devnet.fibe.trade/api/v1/spot-asset-ctx
     * @see https://api.devnet.fibe.trade/api/v1/perp-asset-ctx
     * @param {string[]|undefined} symbols unified symbols of the markets to fetch tickers for, all market tickers are returned if not assigned
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    override async fetchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        await this.loadMarkets ();
        let marketSymbols: string[] = [];
        if (symbols === undefined) {
            marketSymbols = this.symbols;
        } else {
            marketSymbols = this.marketSymbols (symbols);
        }
        const result: Tickers = {};
        for (let i = 0; i < marketSymbols.length; i++) {
            const symbol = marketSymbols[i];
            if (symbol === undefined) {
                continue;
            }
            const ticker = await this.fetchTicker (symbol, params);
            result[symbol] = ticker;
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
    override async fetchBidsAsks (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        return await this.fetchTickers (symbols, params);
    }

    /**
     * @method
     * @name fibe#fetchMarkPrice
     * @description fetches the current mark price for a perpetual market
     * @see https://api.devnet.fibe.trade/api/v1/perp-asset-ctx
     * @param {string} symbol unified symbol of the market
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    override async fetchMarkPrice (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (market['swap'] !== true) {
            throw new ExchangeError (this.id + ' fetchMarkPrice() is only valid for swap markets');
        }
        return await this.fetchTicker (symbol, params);
    }

    override parseTicker (ticker: Dict, market: Market = undefined): Ticker {
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
     * @see https://api.devnet.fibe.trade/api/v1/perp-asset-ctx
     * @param {string} symbol unified symbol of the market
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} an [open interest structure]{@link https://docs.ccxt.com/#/?id=open-interest-structure}
     */
    override async fetchOpenInterest (symbol: string, params = {}): Promise<OpenInterest> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (market['swap'] !== true) {
            throw new ExchangeError (this.id + ' fetchOpenInterest() is only valid for swap markets');
        }
        const info = market['info'];
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
        };
        const response = await this.publicGetPerpAssetCtx (this.extend (request, params));
        return this.parseOpenInterest (response, market);
    }

    override parseOpenInterest (interest: any, market: Market = undefined): OpenInterest {
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
     * @see https://api.devnet.fibe.trade/api/v1/perp-asset-ctx
     * @param {string} symbol unified market symbol
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [funding rate structure]{@link https://docs.ccxt.com/#/?id=funding-rate-structure}
     */
    override async fetchFundingRate (symbol: string, params = {}): Promise<FundingRate> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (market['swap'] !== true) {
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
     * @see https://api.devnet.fibe.trade/api/v1/perp-asset-ctx
     * @param {string[]} [symbols] unified market symbols
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a dictionary of [funding rates structures]{@link https://docs.ccxt.com/#/?id=funding-rates-structure}
     */
    override async fetchFundingRates (symbols: Strings = undefined, params = {}): Promise<FundingRates> {
        await this.loadMarkets ();
        let marketSymbols: string[] = [];
        if (symbols === undefined) {
            const allSymbols = this.symbols;
            for (let i = 0; i < allSymbols.length; i++) {
                const symbol = allSymbols[i];
                if (symbol === undefined) {
                    continue;
                }
                const market = this.market (symbol);
                if (market['swap'] === true) {
                    marketSymbols.push (symbol);
                }
            }
        } else {
            marketSymbols = this.marketSymbols (symbols, 'swap');
        }
        const result: FundingRates = {};
        for (let i = 0; i < marketSymbols.length; i++) {
            const symbol = this.safeString (marketSymbols, i);
            if (symbol === undefined) {
                continue;
            }
            const fundingRate = await this.fetchFundingRate (symbol, params);
            result[symbol] = fundingRate;
        }
        return result;
    }

    override parseFundingRate (contract: any, market: Market = undefined): FundingRate {
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
     * @see https://api.devnet.fibe.trade/api/v1/l2book
     * @param {string} symbol unified market symbol
     * @param {int} [limit] the maximum number of order book levels to return per side (applied client-side)
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.nSigFigs] price aggregation significant figures, valid values are 2, 3, 4, or 5
     * @param {int} [params.mantissa] price aggregation mantissa, valid values are 1, 2, or 5 and require nSigFigs to be 5
     * @returns {object} an order book structure
     */
    override async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        let mt = 'P';
        if (market['spot'] === true) {
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
     * @see https://api.devnet.fibe.trade/api/v1/recent-market-trades
     * @param {string} symbol unified symbol of the market to fetch trades for
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum amount of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
     */
    override async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        let mt = 'P';
        if (market['spot'] === true) {
            mt = 'S';
        }
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
            'mt': mt,
        };
        const response = await this.publicGetRecentMarketTrades (this.extend (request, params));
        return this.parseTrades (response as List, market, since, limit);
    }

    /**
     * @method
     * @name fibe#fetchMyTrades
     * @description fetch all trades made by the user
     * @see https://api.devnet.fibe.trade/api/v1/user-fills
     * @param {string} [symbol] unified market symbol
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum amount of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @param {int} [params.until] timestamp in ms of the latest trade to fetch
     * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
     */
    override async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        let requestParams = params;
        let accountId = undefined;
        const accountIdResponse = await this.fibeAccountId ('fetchMyTrades', requestParams);
        [ accountId, requestParams ] = accountIdResponse;
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {
            'aid': accountId,
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
        [ until, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchMyTrades', 'until');
        if (until !== undefined) {
            request['endTime'] = this.parseToInt (Math.ceil (until / 1000));
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.publicGetUserFills (this.extend (request, requestParams));
        let trades = this.parseTrades (response as List, market, since, undefined);
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

    override parseTrade (trade: Dict, market: Market = undefined): Trade {
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
        const marketResolved = this.safeMarket (marketId, market);
        const timestamp = this.safeTimestamp (trade, 'time');
        const side = this.parseSide (this.safeString (trade, 'side'));
        const takerOrMaker = this.safeString (trade, 'takerOrMaker');
        const feeToken = this.safeString (trade, 'feeToken');
        let feeCurrency = undefined;
        if (feeToken === 'base') {
            feeCurrency = marketResolved['base'];
        } else if (feeToken === 'quote') {
            feeCurrency = marketResolved['quote'];
        }
        const feeCost = this.safeString (trade, 'feeAmount');
        let fee = undefined;
        if ((feeCost !== undefined) || (feeCurrency !== undefined)) {
            fee = {
                'cost': feeCost,
                'currency': feeCurrency,
            };
        }
        return this.safeTrade ({
            'info': trade,
            'id': undefined,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': marketResolved['symbol'],
            'order': this.safeString (trade, 'oid'),
            'type': this.parseOrderType (this.safeString (trade, 'type')),
            'side': side,
            'takerOrMaker': takerOrMaker,
            'price': this.safeString (trade, 'px'),
            'amount': this.safeString (trade, 'sz'),
            'cost': this.safeString (trade, 'tradeValue'),
            'fee': fee,
        }, marketResolved);
    }

    /**
     * @method
     * @name fibe#fetchOHLCV
     * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
     * @see https://api.devnet.fibe.trade/api/v1/candles
     * @param {string} symbol unified symbol of the market to fetch OHLCV data for
     * @param {string} timeframe the length of time each candle represents
     * @param {int} [since] timestamp in ms of the earliest candle to fetch
     * @param {int} [limit] the maximum amount of candles to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {int} [params.until] timestamp in ms of the latest candle to fetch
     * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
     */
    override async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        await this.loadMarkets ();
        let requestParams = params;
        const market = this.market (symbol);
        const info = market['info'];
        const duration = this.parseTimeframe (timeframe);
        let requestLimit = limit;
        if (requestLimit === undefined) {
            requestLimit = 100;
        }
        let until: Int = undefined;
        [ until, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchOHLCV', 'until');
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
        if (market['spot'] === true) {
            mt = 'S';
        }
        const request: Dict = {
            'mi': this.safeString (info, 'mi'),
            'mt': mt,
            'startTimestamp': startTimestamp,
            'endTimestamp': endTimestamp,
            'interval': this.safeString (this.timeframes, timeframe, timeframe),
        };
        const response = await this.publicGetCandles (this.extend (request, requestParams));
        return this.parseOHLCVs (response as List, market, timeframe, since, requestLimit);
    }

    override parseOHLCV (ohlcv: any, market: Market = undefined): OHLCV {
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
     * @see https://api.devnet.fibe.trade/api/v1/order
     * @param {string} id order id
     * @param {string} symbol unified market symbol of the order
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @param {boolean|string} [params.clientOrderId] fetch by client order id; when a string is supplied it replaces id
     * @returns {Order} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    override async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrder() requires a symbol');
        }
        let requestParams = params;
        let clientOrderId = undefined;
        [ clientOrderId, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchOrder', 'clientOrderId');
        const isClientOrderId = (clientOrderId !== undefined) && (clientOrderId !== false);
        let orderReference = id;
        if (typeof clientOrderId === 'string') {
            orderReference = clientOrderId;
        }
        orderReference = this.fibeValidateUnsignedIntegerParam ('fetchOrder', 'id', orderReference);
        let accountId = undefined;
        const accountIdResponse = await this.fibeAccountId ('fetchOrder', requestParams);
        [ accountId, requestParams ] = accountIdResponse;
        await this.loadMarkets ();
        const market = this.market (symbol);
        const info = market['info'];
        const request: Dict = {
            'aid': accountId,
            'mi': this.safeString (info, 'mi'),
            'mt': this.safeString (info, 'mt', 'S'),
        };
        if (isClientOrderId) {
            request['cloid'] = orderReference;
        } else {
            request['oid'] = orderReference;
        }
        const response = await this.publicGetOrder (this.extend (request, requestParams));
        return this.parseOrder (response, market);
    }

    /**
     * @method
     * @name fibe#fetchOpenOrders
     * @description fetch all unfilled currently open orders
     * @see https://api.devnet.fibe.trade/api/v1/open-orders
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch open orders for
     * @param {int} [limit] the maximum number of open orders structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    override async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        let requestParams = params;
        let accountId = undefined;
        const accountIdResponse = await this.fibeAccountId ('fetchOpenOrders', requestParams);
        [ accountId, requestParams ] = accountIdResponse;
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        const request: Dict = {
            'aid': accountId,
        };
        if (market !== undefined) {
            const info = market['info'];
            request['mi'] = this.safeString (info, 'mi');
            request['mt'] = this.safeString (info, 'mt');
        }
        const response = await this.publicGetOpenOrders (this.extend (request, requestParams));
        const orders = this.parseOrders (response, undefined, since, undefined);
        return this.filterBySymbolSinceLimit (orders, symbol, since, limit) as Order[];
    }

    /**
     * @method
     * @name fibe#fetchOrders
     * @description fetch historical orders
     * @see https://api.devnet.fibe.trade/api/v1/historical-orders
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch orders for
     * @param {int} [limit] the maximum number of order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {string} [params.accountId] resolved account id, bypasses the account-id request
     * @param {int} [params.subAccountIndex] account subindex used to resolve params.accountId, defaults to 0
     * @param {string} [params.status] raw status filter, "F" for closed/filled orders or "C" for canceled orders
     * @param {int} [params.page] page number
     * @param {int} [params.pageSize] page size, defaults to limit when provided
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    override async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        let requestParams = params;
        let accountId = undefined;
        const accountIdResponse = await this.fibeAccountId ('fetchOrders', requestParams);
        [ accountId, requestParams ] = accountIdResponse;
        await this.loadMarkets ();
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
        }
        let page = undefined;
        [ page, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchOrders', 'page');
        let pageSize = undefined;
        const defaultPageSize = limit;
        [ pageSize, requestParams ] = this.handleOptionAndParams (requestParams, 'fetchOrders', 'pageSize', defaultPageSize);
        const request: Dict = {
            'aid': accountId,
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
        const response = await this.publicGetHistoricalOrders (this.extend (request, requestParams));
        const orders = this.parseOrders (response, undefined, since, undefined);
        return this.filterBySymbolSinceLimit (orders, symbol, since, limit) as Order[];
    }

    /**
     * @method
     * @name fibe#fetchClosedOrders
     * @description fetch all closed orders
     * @see https://api.devnet.fibe.trade/api/v1/historical-orders
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch closed orders for
     * @param {int} [limit] the maximum number of closed order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.page] page number
     * @param {int} [params.pageSize] page size
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    override async fetchClosedOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        const orders = await this.fetchOrders (symbol, undefined, undefined, params);
        const closedOrders = this.filterByArray (orders, 'status', [ 'closed' ], false);
        return this.filterBySymbolSinceLimit (closedOrders, symbol, since, limit) as Order[];
    }

    /**
     * @method
     * @name fibe#fetchCanceledOrders
     * @description fetch all canceled orders
     * @see https://api.devnet.fibe.trade/api/v1/historical-orders
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch canceled orders for
     * @param {int} [limit] the maximum number of canceled order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {string} [params.user] user address, will default to this.walletAddress if not provided
     * @param {int} [params.page] page number
     * @param {int} [params.pageSize] page size
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    override async fetchCanceledOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        const orders = await this.fetchOrders (symbol, undefined, undefined, params);
        const canceledOrders = this.filterByArray (orders, 'status', [ 'canceled' ], false);
        return this.filterBySymbolSinceLimit (canceledOrders, symbol, since, limit) as Order[];
    }

    async fetchCreateOrderMarketReferencePrice (market: Market): Promise<string> {
        /**
         * @method
         * @ignore
         */
        if (market === undefined) {
            throw new ExchangeError (this.id + ' createOrder() requires a market');
        }
        const response = await this.publicGetAllMids ();
        const allMids = response as List;
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
     * @param {string} [params.timeInForce] GTC, IOC, PO, or FOK; unified market orders use IOC and serialize the DEX FrontendMarket variant
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
     * @param {int} [params.leverage] required when opening a new perp position; when provided, must match the leverage of an existing position
     * @returns {Order} an order structure
     */
    override async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}): Promise<Order> {
        let requestParams = params;
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
        const marketInfo = market['info'];
        const executionMode = this.safeString (marketInfo, 'executionMode', 'active').toLowerCase ();
        if (executionMode === 'closeonly') {
            throw new InvalidOrder (this.id + ' createOrder() cannot open orders while the market is closeOnly');
        }
        const orderSide = side.toLowerCase ();
        const isBuy = (orderSide === 'buy');
        if (!isBuy && (orderSide !== 'sell')) {
            throw new InvalidOrder (this.id + ' createOrder() side must be buy or sell');
        }
        let privateKey = undefined;
        [ privateKey, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'privateKey', this.privateKey);
        if (privateKey !== undefined) {
            privateKey = privateKey.trim ();
        }
        if ((privateKey === undefined) || (privateKey === '')) {
            throw new ArgumentsRequired (this.id + ' createOrder() requires a privateKey parameter or exchange.privateKey');
        }
        let user = undefined;
        [ user, requestParams ] = this.handlePublicAddress ('createOrder', requestParams);
        let rpcUrl = undefined;
        [ rpcUrl, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'rpcUrl', this.safeString (this.options, 'rpcUrl'));
        let orderId = undefined;
        [ orderId, requestParams ] = this.handleOptionAndParams2 (requestParams, 'createOrder', 'orderId', 'clientOrderId');
        if (orderId === undefined) {
            orderId = this.fibeNewOrderId ();
        }
        orderId = this.fibeValidateUnsignedIntegerParam ('createOrder', 'orderId', orderId);
        if (!Precise.stringGt (orderId, '0')) {
            throw new InvalidOrder (this.id + ' createOrder() orderId must be greater than zero');
        }
        let postOnly = undefined;
        [ postOnly, requestParams ] = this.handlePostOnly (false, false, requestParams);
        requestParams = this.omit (requestParams, 'postOnly');
        let timeInForce = undefined;
        [ timeInForce, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'timeInForce');
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
        let transactionTimeInForce = fibeTimeInForce;
        if (isMarketOrder) {
            transactionTimeInForce = 'FrontendMarket';
        }
        if ((executionMode === 'postonly') && (transactionTimeInForce !== 'ALO')) {
            throw new InvalidOrder (this.id + ' createOrder() requires postOnly while the market is postOnly');
        }
        let slippage = undefined;
        [ slippage, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'slippage');
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
        [ subAccountIndex, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param ('createOrder', 'subAccountIndex', subAccountIndex);
        const isolatedOnly = this.safeBool (market, 'swap', false) && this.safeBool (marketInfo, 'isolatedOnly', false);
        let defaultMarginMode = 'cross';
        if (isolatedOnly) {
            defaultMarginMode = 'isolated';
        }
        let marginMode = undefined;
        [ marginMode, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'marginMode', defaultMarginMode);
        marginMode = this.fibeNormalizeMarginMode ('createOrder', marginMode);
        if (isolatedOnly && (marginMode !== 'isolated')) {
            throw new InvalidOrder (this.id + ' createOrder() requires isolated margin for this market');
        }
        let initialLeverage = undefined;
        [ initialLeverage, requestParams ] = this.handleOptionAndParams2 (requestParams, 'createOrder', 'leverage', 'initialLeverage');
        if (initialLeverage !== undefined) {
            initialLeverage = this.fibeValidateU8Param ('createOrder', 'leverage', initialLeverage, 1);
            const maxLeverage = this.safeInteger (marketInfo, 'maxLeverage');
            if ((maxLeverage !== undefined) && (initialLeverage > maxLeverage)) {
                throw new InvalidOrder (this.id + ' createOrder() leverage exceeds the market maximum of ' + this.numberToString (maxLeverage));
            }
        }
        let commitment = undefined;
        [ commitment, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'commitment', this.safeString (this.options, 'commitment', 'confirmed'));
        let preflightCommitment = undefined;
        [ preflightCommitment, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'preflightCommitment');
        let skipPreflight = undefined;
        [ skipPreflight, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'skipPreflight');
        let maxRetries = undefined;
        [ maxRetries, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'maxRetries');
        let minContextSlot = undefined;
        [ minContextSlot, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'minContextSlot');
        let computeUnitLimit = undefined;
        [ computeUnitLimit, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'computeUnitLimit');
        if (computeUnitLimit !== undefined) {
            computeUnitLimit = this.fibeValidateU32Param ('createOrder', 'computeUnitLimit', computeUnitLimit);
        }
        let computeUnitPriceMicroLamports = undefined;
        [ computeUnitPriceMicroLamports, requestParams ] = this.handleOptionAndParams (requestParams, 'createOrder', 'computeUnitPriceMicroLamports');
        if (computeUnitPriceMicroLamports !== undefined) {
            computeUnitPriceMicroLamports = this.fibeValidateUnsignedIntegerParam ('createOrder', 'computeUnitPriceMicroLamports', computeUnitPriceMicroLamports);
        }
        if (!this.isEmpty (requestParams)) {
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
            'timeInForce': transactionTimeInForce,
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
        });
        let orderPrice = undefined;
        if (isLimitOrder) {
            const priceMarketInfo = market['info'];
            orderPrice = this.fibeTicksToPrice (this.safeString (result, 'priceInTicks'), this.safeInteger (priceMarketInfo, 'quoteDecimals'), this.safeString (priceMarketInfo, 'tickSizeInQuoteBaseUnits'));
        }
        return this.safeOrder ({
            'info': result,
            'id': undefined,
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
     * @param {boolean|string} [params.clientOrderId] cancel by client order id; when a string is supplied it replaces id
     * @returns {Order} an order structure
     */
    override async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelOrder() requires a symbol for local tx construction');
        }
        let requestParams = params;
        let clientOrderId = undefined;
        [ clientOrderId, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'clientOrderId');
        const isClientOrderId = (clientOrderId !== undefined) && (clientOrderId !== false);
        let orderReference = id;
        if (typeof clientOrderId === 'string') {
            orderReference = clientOrderId;
        }
        orderReference = this.fibeValidateUnsignedIntegerParam ('cancelOrder', 'id', orderReference);
        await this.loadMarkets ();
        const market = this.market (symbol);
        let privateKey = undefined;
        [ privateKey, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'privateKey', this.privateKey);
        if (privateKey !== undefined) {
            privateKey = privateKey.trim ();
        }
        if ((privateKey === undefined) || (privateKey === '')) {
            throw new ArgumentsRequired (this.id + ' cancelOrder() requires a privateKey parameter or exchange.privateKey');
        }
        let user = undefined;
        [ user, requestParams ] = this.handlePublicAddress ('cancelOrder', requestParams);
        let rpcUrl = undefined;
        [ rpcUrl, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'rpcUrl', this.safeString (this.options, 'rpcUrl'));
        let subAccountIndex = undefined;
        [ subAccountIndex, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param ('cancelOrder', 'subAccountIndex', subAccountIndex);
        let commitment = undefined;
        [ commitment, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'commitment', this.safeString (this.options, 'commitment', 'confirmed'));
        let preflightCommitment = undefined;
        [ preflightCommitment, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'preflightCommitment');
        let skipPreflight = undefined;
        [ skipPreflight, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'skipPreflight');
        let maxRetries = undefined;
        [ maxRetries, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'maxRetries');
        let minContextSlot = undefined;
        [ minContextSlot, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'minContextSlot');
        let computeUnitLimit = undefined;
        [ computeUnitLimit, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'computeUnitLimit');
        if (computeUnitLimit !== undefined) {
            computeUnitLimit = this.fibeValidateU32Param ('cancelOrder', 'computeUnitLimit', computeUnitLimit);
        }
        let computeUnitPriceMicroLamports = undefined;
        [ computeUnitPriceMicroLamports, requestParams ] = this.handleOptionAndParams (requestParams, 'cancelOrder', 'computeUnitPriceMicroLamports');
        if (computeUnitPriceMicroLamports !== undefined) {
            computeUnitPriceMicroLamports = this.fibeValidateUnsignedIntegerParam ('cancelOrder', 'computeUnitPriceMicroLamports', computeUnitPriceMicroLamports);
        }
        if (!this.isEmpty (requestParams)) {
            throw new ExchangeError (this.id + ' cancelOrder() local transaction construction does not support extra params');
        }
        const result = await this.fibeLocalTxCancelOrder ({
            'rpcUrl': rpcUrl,
            'market': market,
            'user': user,
            'privateKey': privateKey,
            'orderId': orderReference,
            'isClientOrderId': isClientOrderId,
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
            'id': isClientOrderId ? undefined : orderReference,
            'clientOrderId': isClientOrderId ? orderReference : undefined,
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
    override async cancelOrders (ids: string[], symbol: Str = undefined, params = {}): Promise<Order[]> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelOrders() requires a symbol');
        }
        const orders = [];
        for (let i = 0; i < ids.length; i++) {
            const id = this.safeString (ids, i) as string;
            const order = await this.cancelOrder (id, symbol, this.extend ({}, params));
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
    override async cancelAllOrders (symbol: Str = undefined, params = {}): Promise<Order[]> {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelAllOrders() requires a symbol');
        }
        let requestParams = params;
        const fetchOpenOrdersParams: Dict = {};
        const user = this.safeString2 (requestParams, 'user', 'address');
        if (user !== undefined) {
            fetchOpenOrdersParams['user'] = user;
        }
        const accountId = this.safeString (requestParams, 'accountId');
        if (accountId !== undefined) {
            fetchOpenOrdersParams['accountId'] = accountId;
        }
        const subAccountIndex = this.safeInteger (requestParams, 'subAccountIndex');
        if (subAccountIndex !== undefined) {
            fetchOpenOrdersParams['subAccountIndex'] = subAccountIndex;
        }
        const openOrders = await this.fetchOpenOrders (symbol, undefined, undefined, fetchOpenOrdersParams);
        requestParams = this.omit (requestParams, 'accountId');
        const ids = [];
        for (let i = 0; i < openOrders.length; i++) {
            const id = this.safeString (openOrders[i], 'id');
            if (id === undefined) {
                throw new ExchangeError (this.id + ' cancelAllOrders() cannot cancel an open order without an id');
            }
            ids.push (id);
        }
        return await this.cancelOrders (ids, symbol, requestParams);
    }

    override parseOrder (order: Dict, market: Market = undefined): Order {
        //
        //     {
        //         "mi": "1",
        //         "mt": "S",
        //         "oid": "1",
        //         "cloid": "20",
        //         "orderType": "Limit",
        //         "timeInForce": "ALO",
        //         "limitPx": "1",
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
        const marketResolved = this.safeMarket (marketId, market);
        const timestamp = this.parseOrderTimestamp (order, 'createdAt');
        const lastUpdateTimestamp = this.parseOrderTimestamp (order, 'updatedAt');
        const amount = this.safeString (order, 'origSz');
        const remaining = this.safeString (order, 'sz');
        const rawStatus = this.safeString (order, 'status');
        let filled = undefined;
        if (this.safeBool (order, 'isTrigger', false)) {
            filled = '0';
        } else if ((amount !== undefined) && (remaining !== undefined)) {
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
            'clientOrderId': this.safeString (order, 'cloid'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'lastUpdateTimestamp': lastUpdateTimestamp,
            'symbol': marketResolved['symbol'],
            'type': this.parseOrderType (this.safeString (order, 'orderType')),
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'reduceOnly': this.safeBool (order, 'reduceOnly'),
            'side': this.parseSide (this.safeString (order, 'side')),
            'price': this.safeString (order, 'limitPx'),
            'triggerPrice': this.safeString (order, 'triggerPx'),
            'amount': amount,
            'cost': undefined,
            'average': undefined,
            'filled': filled,
            'remaining': remaining,
            'status': this.parseOrderStatus (rawStatus),
            'fee': undefined,
            'trades': undefined,
        }, marketResolved);
    }

    fibeProgramId (): string {
        return 'HDb42K3Xyj2swE9nk2qc3aVUyVNFRd4jEGmHQiovjhpG';
    }

    solanaSystemProgramId (): string {
        return '11111111111111111111111111111111';
    }

    solanaAssociatedTokenProgramId (): string {
        return 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
    }

    solanaComputeBudgetProgramId (): string {
        return 'ComputeBudget111111111111111111111111111111';
    }

    solanaNativeMint (): string {
        return 'So11111111111111111111111111111111111111112';
    }

    solanaHexAlphabet (): string {
        return '0123456789abcdef';
    }

    solanaHexNibble (value: any): number {
        const lower = this.solanaHexAlphabet ();
        const upper = '0123456789ABCDEF';
        for (let i = 0; i < 16; i++) {
            if ((value === lower[i]) || (value === upper[i])) {
                return i;
            }
        }
        throw new ExchangeError (this.id + ' invalid hex character ' + value);
    }

    solanaHexByte (hex: string, index: int): number {
        const hi = this.solanaHexNibble (hex[index]);
        const lo = this.solanaHexNibble (hex[index + 1]);
        return this.sum (hi * 16, lo);
    }

    fibeIsUnsignedIntegerString (value: any): boolean {
        if ((value === undefined) || (value === null)) {
            return false;
        }
        const stringValue = this.numberToString (value);
        if ((stringValue === undefined) || (stringValue === '')) {
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

    fibeValidateUnsignedIntegerParam (method: string, field: string, value: any): string {
        if ((value === undefined) || (value === null) || ((typeof value !== 'number') && (typeof value !== 'string'))) {
            throw new BadRequest (this.id + ' ' + method + '() ' + field + ' must be an unsigned integer');
        }
        const stringValue = this.numberToString (value);
        if ((stringValue === undefined) || !this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new BadRequest (this.id + ' ' + method + '() ' + field + ' must be an unsigned integer');
        }
        return stringValue;
    }

    fibeValidateU8Param (method: string, field: string, value: any, min = 0): number {
        const stringValue = this.fibeValidateUnsignedIntegerParam (method, field, value);
        const numeric = parseInt (stringValue);
        if ((numeric < min) || (numeric > 255)) {
            throw new BadRequest (this.id + ' ' + method + '() ' + field + ' must be between ' + this.numberToString (min) + ' and 255');
        }
        return numeric;
    }

    fibeValidateU32Param (method: string, field: string, value: any): number {
        const stringValue = this.fibeValidateUnsignedIntegerParam (method, field, value);
        const numeric = parseInt (stringValue);
        if (numeric > 4294967295) {
            throw new BadRequest (this.id + ' ' + method + '() ' + field + ' must be between 0 and 4294967295');
        }
        return numeric;
    }

    fibeNormalizeMarginMode (method: string, marginMode: any): string {
        const normalized = marginMode.toLowerCase ();
        if ((normalized !== 'cross') && (normalized !== 'isolated')) {
            throw new InvalidOrder (this.id + ' ' + method + '() marginMode must be cross or isolated');
        }
        return normalized;
    }

    solanaU8Hex (value: any): string {
        const stringValue = this.numberToString (value);
        if ((stringValue === undefined) || !this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new ExchangeError (this.id + ' invalid u8 value ' + stringValue);
        }
        const numeric = parseInt (stringValue);
        if (numeric > 255) {
            throw new ExchangeError (this.id + ' u8 overflow');
        }
        const hex = this.intToBase16 (numeric);
        return hex.padStart (2, '0');
    }

    solanaU16leHex (value: any): string {
        const stringValue: any = this.numberToString (value);
        const numeric = parseInt (stringValue);
        const lo = numeric % 256;
        const hi = Math.floor (numeric / 256);
        return this.solanaU8Hex (lo) + this.solanaU8Hex (hi);
    }

    solanaU32leHex (value: any): string {
        const stringValue = this.numberToString (value);
        if ((stringValue === undefined) || !this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new ExchangeError (this.id + ' invalid u32 value ' + stringValue);
        }
        let remaining = parseInt (stringValue);
        let result = '';
        for (let i = 0; i < 4; i++) {
            const byteValue = remaining % 256;
            result += this.solanaU8Hex (byteValue);
            remaining = Math.floor (remaining / 256);
        }
        if (remaining !== 0) {
            throw new ExchangeError (this.id + ' u32 overflow');
        }
        return result;
    }

    solanaBytesHex (values: any[]): string {
        let result = '';
        for (let i = 0; i < values.length; i++) {
            result += this.solanaU8Hex (values[i]);
        }
        return result;
    }

    solanaStringHex (value: any): string {
        const result = this.remove0xPrefix (this.stringToBase16 (value));
        if (result === undefined) {
            throw new ExchangeError (this.id + ' could not encode string');
        }
        return result;
    }

    solanaPubkeyHex (pubkey: any): string {
        const decoded = this.base58ToBinary (pubkey);
        const result = this.binaryToBase16 (decoded);
        if (result.length !== 64) {
            throw new ExchangeError (this.id + ' invalid Solana address ' + pubkey);
        }
        return result;
    }

    fibeDecimalStringDivInteger (value: any, divisor: any, roundUp = false): any {
        const divisorString = this.numberToString (divisor);
        let quotient = Precise.stringDiv (value, divisorString, 0);
        if (roundUp && Precise.stringGt (Precise.stringMod (value, divisorString), '0')) {
            quotient = Precise.stringAdd (quotient, '1');
        }
        return quotient;
    }

    fibeDecimalToUnits (value: any, decimals: any): any {
        return Precise.stringDiv (value.trim (), this.parsePrecision (this.numberToString (decimals)), 0);
    }

    fibeNewOrderId (): any {
        const randomHex = this.randomBytes (8).padStart (16, '0');
        let result: any = '0';
        let i = 0;
        while (i < randomHex.length) {
            const byteValue = this.solanaHexByte (randomHex, i);
            result = Precise.stringAdd (Precise.stringMul (result, '256'), this.numberToString (byteValue));
            i = i + 2;
        }
        return result;
    }

    fibeNormalizeQuantity (quantity: any, lotSize: any): any {
        return Precise.stringSub (quantity, Precise.stringMod (quantity, lotSize));
    }

    solanaU64leHex (value: any): string {
        const stringValue = this.numberToString (value);
        if ((stringValue === undefined) || !this.fibeIsUnsignedIntegerString (stringValue)) {
            throw new ExchangeError (this.id + ' invalid u64 value ' + stringValue);
        }
        let remaining: any = Precise.stringAdd (stringValue, '0');
        let result = '';
        for (let i = 0; i < 8; i++) {
            const byteValue: any = Precise.stringMod (remaining, '256');
            result += this.solanaU8Hex (parseInt (byteValue));
            remaining = Precise.stringDiv (remaining, '256', 0);
        }
        if (remaining !== '0') {
            throw new ExchangeError (this.id + ' u64 overflow');
        }
        return result;
    }

    solanaLeHexToDecimalString (hex: string): any {
        let result: any = '0';
        let i = hex.length - 2;
        while (i >= 0) {
            const byteValue = this.solanaHexByte (hex, i);
            result = Precise.stringAdd (Precise.stringMul (result, '256'), this.numberToString (byteValue));
            i = i - 2;
        }
        return result;
    }

    solanaOptionU8Hex (value: any): string {
        if (value === undefined) {
            return this.solanaU8Hex (0);
        }
        return this.solanaU8Hex (1) + this.solanaU8Hex (value);
    }

    solanaOptionU16Hex (value: any): string {
        if (value === undefined) {
            return this.solanaU8Hex (0);
        }
        return this.solanaU8Hex (1) + this.solanaU16leHex (value);
    }

    solanaOptionU64Hex (value: any): string {
        if (value === undefined) {
            return this.solanaU8Hex (0);
        }
        return this.solanaU8Hex (1) + this.solanaU64leHex (value);
    }

    solanaShortVecHex (value: number): string {
        let result = '';
        let remaining = value;
        while (remaining >= 128) {
            const elem = (remaining % 128) + 128;
            remaining = Math.floor (remaining / 128);
            result += this.solanaU8Hex (elem);
        }
        return result + this.solanaU8Hex (remaining);
    }

    fibeSideIndex (side: any): number {
        if (side === 'B') {
            return 0;
        }
        return 1;
    }

    fibeTimeInForceIndex (timeInForce: any): any {
        const values = {
            'GTC': 0,
            'IOC': 1,
            'ALO': 2,
            'FOK': 3,
            'FrontendMarket': 4,
        };
        return this.safeInteger (values, timeInForce);
    }

    fibeGetTickArrayStartTick (priceInTicks: any): any {
        const numeric = parseInt (priceInTicks);
        const tickSizeInArray = this.fibeTickSizeInArray ();
        return this.numberToString (numeric - (numeric % tickSizeInArray));
    }

    fibePriceToTicks (price: any, quoteDecimals: any, tickSizeInQuoteBaseUnits: any, side: any = undefined, slippage: any = undefined): any {
        let adjustedPrice: any = this.numberToString (price);
        if (slippage !== undefined) {
            let factor: any = Precise.stringSub ('1', this.numberToString (slippage));
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

    fibeTicksToPrice (priceInTicks: any, quoteDecimals: any, tickSizeInQuoteBaseUnits: any): any {
        const rawPrice = Precise.stringMul (this.numberToString (priceInTicks), this.numberToString (tickSizeInQuoteBaseUnits));
        return Precise.stringMul (rawPrice, this.parsePrecision (this.numberToString (quoteDecimals)));
    }

    fibeSpotInputAmount (market: Dict, sizeInBase: any, priceInTicks: any, side: any): any {
        if (side !== 'B') {
            return sizeInBase;
        }
        const price = Precise.stringMul (this.numberToString (priceInTicks), this.safeString (market, 'tickSizeInQuoteBaseUnits'));
        const quoteAmount = Precise.stringMul (this.numberToString (sizeInBase), price);
        let scale = '1';
        const baseDecimals: any = this.safeInteger (market, 'baseDecimals');
        for (let i = 0; i < baseDecimals; i++) {
            scale += '0';
        }
        return this.fibeDecimalStringDivInteger (quoteAmount, scale, true);
    }

    solanaIsHexString (value: string): boolean {
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

    solanaPublicKeyFromSecretKeyHex (secretKeyHex: string): string {
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

    solanaParsePrivateKeyHex (privateKey: any, user?: string): string {
        if (privateKey === undefined) {
            throw new ArgumentsRequired (this.id + ' requires a 64-byte Solana secret key');
        }
        const privateKeyString = privateKey.trim ();
        if (privateKeyString === '') {
            throw new ArgumentsRequired (this.id + ' requires a 64-byte Solana secret key');
        }
        let rawHex = undefined;
        if (privateKeyString.indexOf ('[') === 0) {
            const raw = this.parseJson (privateKeyString);
            if (!Array.isArray (raw)) {
                throw new ExchangeError (this.id + ' Solana secret key JSON must be an array of bytes');
            }
            for (let i = 0; i < raw.length; i++) {
                if (!this.fibeIsUnsignedIntegerString (raw[i])) {
                    throw new ExchangeError (this.id + ' invalid Solana private key byte at index ' + this.numberToString (i));
                }
                const byteValueString = this.numberToString (raw[i]);
                if (byteValueString === undefined) {
                    throw new ExchangeError (this.id + ' invalid Solana private key byte at index ' + this.numberToString (i));
                }
                const byteValue = parseInt (byteValueString);
                if ((byteValue < 0) || (byteValue > 255)) {
                    throw new ExchangeError (this.id + ' invalid Solana private key byte at index ' + this.numberToString (i));
                }
            }
            rawHex = this.solanaBytesHex (raw);
        } else {
            let candidate = privateKeyString;
            if (privateKeyString.indexOf ('0x') === 0) {
                candidate = privateKeyString.slice (2);
            }
            if (this.solanaIsHexString (candidate)) {
                rawHex = candidate.toLowerCase ();
            } else {
                rawHex = this.binaryToBase16 (this.base58ToBinary (privateKeyString));
            }
        }
        if (rawHex.length !== 128) {
            throw new ExchangeError (this.id + ' invalid Solana secret key length ' + this.numberToString (rawHex.length / 2) + ', expected 64 bytes');
        }
        const publicKey = this.solanaPublicKeyFromSecretKeyHex (rawHex);
        if (user !== undefined) {
            if (!this.inArray (publicKey, [ user ])) {
                throw new AuthenticationError (this.id + ' credential does not match address ' + user);
            }
        }
        return rawHex.slice (0, 64);
    }

    solanaIsOnCurveHex (candidateHex: string): boolean {
        if (candidateHex.length !== 64) {
            return false;
        }
        return this.eddsaPointIsValid (this.base16ToBinary (candidateHex), ed25519);
    }

    solanaFindProgramAddress (seeds: string[], programId: any): string {
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

    fibePda (seeds: string[], programId: any = undefined): string {
        const program = (programId === undefined) ? this.fibeProgramId () : programId;
        return this.solanaFindProgramAddress (seeds, program);
    }

    fibeGetUserStatePda (user: any): string {
        return this.fibePda ([ this.solanaStringHex ('user'), this.solanaPubkeyHex (user) ]);
    }

    fibeGetDexConfigPda (): string {
        return this.fibePda ([ this.solanaStringHex ('dex_config') ]);
    }

    fibeGetAccountLabelHex (owner: any, subAccountIndex: any): string {
        const ownerHex = this.solanaPubkeyHex (owner);
        return this.solanaU8Hex (subAccountIndex) + ownerHex.slice (2);
    }

    fibeGetDexAuthorityConfigPda (): string {
        return this.fibePda ([ this.solanaStringHex ('dex_authority_config') ]);
    }

    fibeGetSpotDexConfigPda (): string {
        return this.fibePda ([ this.solanaStringHex ('spot_dex_config') ]);
    }

    fibeGetPerpDexConfigPda (): string {
        return this.fibePda ([ this.solanaStringHex ('perp_dex_config') ]);
    }

    fibeEncodeReferralCodeHex (code: string): string {
        const codeHex = this.solanaStringHex (code);
        if ((codeHex.length === 0) || (codeHex.length > 64)) {
            throw new ExchangeError (this.id + ' referral code must contain 1 to 32 bytes');
        }
        return codeHex.padEnd (64, '0');
    }

    fibeGetReferrerInfoPda (code: string): string {
        return this.fibePda ([ this.solanaStringHex ('referrer_info'), this.fibeEncodeReferralCodeHex (code) ]);
    }

    fibeGetPerpFeeRewardClaimPda (referrerInfo: any, mi: any): string {
        return this.fibePda ([ this.solanaStringHex ('perp_fee_reward_claim'), this.solanaPubkeyHex (referrerInfo), this.solanaU64leHex (mi) ]);
    }

    async fibeGetReferralAccounts (owner: any, market: Dict, tokenProgramQuote: any = undefined, rpcUrl: any = undefined, commitment: any = undefined): Promise<Dict> {
        const response = await this.publicGetReferralState ({ 'owner': owner });
        const referredBy = this.safeDict (response, 'referredBy');
        if (referredBy === undefined) {
            return {};
        }
        const code = this.safeString (referredBy, 'code');
        const referrer = this.safeString (referredBy, 'referrer');
        if ((code === undefined) || (referrer === undefined)) {
            throw new ExchangeError (this.id + ' referral state is missing the referral code or referrer');
        }
        const referrerInfo = this.fibeGetReferrerInfoPda (code);
        if (this.safeString (market, 'mt') === 'P') {
            return {
                'referrerInfo': referrerInfo,
                'referralFeeAccount': this.fibeGetPerpFeeRewardClaimPda (referrerInfo, this.safeString (market, 'mi')),
            };
        }
        const quoteMint = this.safeString (market, 'quoteMint');
        const referralFeeAccount = this.solanaGetAssociatedTokenAddress (quoteMint, referrer, tokenProgramQuote);
        const createFeeAccountIx = await this.solanaCreateAssociatedTokenAccountIfNeeded (rpcUrl, owner, referrer, quoteMint, tokenProgramQuote, commitment);
        return {
            'referrerInfo': referrerInfo,
            'referralFeeAccount': referralFeeAccount,
            'createFeeAccountIx': createFeeAccountIx,
        };
    }

    async fibeGetOrNextAccountId (owner: any, subAccountIndex: any, allowNext = true): Promise<Dict> {
        const response = await this.publicGetAccountId ({
            'owner': owner,
            'subAccountIndex': subAccountIndex,
        });
        let accountId = this.safeString (response, 'accountId');
        let createSubAccount = false;
        if (accountId !== undefined) {
            return { 'accountId': accountId, 'createSubAccount': createSubAccount };
        }
        if (!allowNext) {
            throw new ExchangeError (this.id + ' account is not initialized for subAccountIndex ' + this.numberToString (subAccountIndex));
        }
        const nextAccount = await this.publicGetNextAccountId ({});
        accountId = this.safeString (nextAccount, 'accountId');
        if (accountId === undefined) {
            throw new ExchangeError (this.id + ' could not resolve the next Fibe account id');
        }
        createSubAccount = true;
        return { 'accountId': accountId, 'createSubAccount': createSubAccount };
    }

    fibeGetUserMarginAccountPda (owner: any, subAccountIndex: any, quoteTokenIndex: any): string {
        return this.fibePda ([ this.solanaStringHex ('user_margin_account'), this.solanaPubkeyHex (owner), this.solanaU8Hex (subAccountIndex), this.solanaU16leHex (quoteTokenIndex) ]);
    }

    fibeGetOrderSlotsPda (mt: any, accountId: any, mi: any): string {
        const marketSeed = (mt === 'S') ? 'spot' : 'perp';
        return this.fibePda ([ this.solanaStringHex (marketSeed), this.solanaStringHex ('order_slots'), this.solanaU64leHex (mi), this.solanaU64leHex (accountId) ]);
    }

    fibeGetSpotMarketVaultPda (mi: any, tokenMint: any): string {
        return this.fibePda ([ this.solanaStringHex ('spot_market_vault'), this.solanaU64leHex (mi), this.solanaPubkeyHex (tokenMint) ]);
    }

    fibeGetHfmmRegistryPda (mt: any, mi: any): string {
        const marketSeed = (mt === 'S') ? 'spot' : 'perp';
        return this.fibePda ([ this.solanaStringHex (marketSeed), this.solanaStringHex ('hfmm_market_registry'), this.solanaU64leHex (mi) ]);
    }

    fibeGetPerpControlParamsPda (quoteTokenIndex: any): string {
        return this.fibePda ([ this.solanaStringHex ('perp_control_params'), this.solanaU16leHex (quoteTokenIndex) ]);
    }

    fibeGetMarginTableRegistryPda (quoteTokenIndex: any): string {
        return this.fibePda ([ this.solanaStringHex ('margin_table'), this.solanaU16leHex (quoteTokenIndex) ]);
    }

    fibeGetHfmmMarginAccountsPda (quoteTokenIndex: any): string {
        return this.fibePda ([ this.solanaStringHex ('hfmm_margin_accounts'), this.solanaU16leHex (quoteTokenIndex) ]);
    }

    fibeGetTickArrayPda (mt: any, mi: any, priceInTicks: any): string {
        const marketSeed = (mt === 'S') ? 'spot' : 'perp';
        const arrayStartTick = this.fibeGetTickArrayStartTick (priceInTicks);
        return this.fibePda ([ this.solanaStringHex (marketSeed), this.solanaStringHex ('tick_array'), this.solanaU64leHex (this.fibeTickSizeInArray ()), this.solanaU64leHex (mi), this.solanaU32leHex (arrayStartTick) ]);
    }

    fibeMaxTick (): number {
        return 2457600;
    }

    fibeTickSizeInArray (): number {
        return 150;
    }

    solanaReadU64FromHex (hex: string, offset: number): string {
        const start = offset * 2;
        return this.solanaLeHexToDecimalString (hex.slice (start, start + 16));
    }

    fibeAddTickArrayIndex (indexes: number[], index: number): number[] {
        if (!this.inArray (index, indexes)) {
            indexes.push (index);
        }
        return indexes;
    }

    fibeSelectMatchingTickArrayIndexes (response: Dict, priceInTicks: any, baseLots: any, side: any, coverLimit: boolean): number[] {
        const arrays = this.safeList (response, (side === 'B') ? 'asks' : 'bids', []);
        const current = parseInt (this.fibeGetTickArrayStartTick (priceInTicks));
        let remaining: any = baseLots;
        const selectedIndexes: number[] = [];
        for (let i = 0; i < arrays.length; i++) {
            const array = arrays[i];
            const startTick = this.safeInteger (array, 'start_tick');
            if (startTick === undefined) {
                continue;
            }
            const size = this.safeString (array, 'size', '0');
            if (!Precise.stringGt (size, '0')) {
                continue;
            }
            if (((side === 'B') && (startTick > current)) || ((side === 'A') && (startTick < current))) {
                break;
            }
            selectedIndexes.push (startTick);
            remaining = Precise.stringGe (size, remaining) ? '0' : Precise.stringSub (remaining, size);
            if (!coverLimit && (remaining === '0')) {
                break;
            }
        }
        let selectedLength = selectedIndexes.length;
        if ((selectedLength === 0) || (coverLimit && (selectedIndexes[selectedLength - 1] !== current))) {
            selectedIndexes.push (current);
            selectedLength = selectedIndexes.length;
        }
        if (selectedLength > 16) {
            throw new InvalidOrder (this.id + ' createOrder() requires more than 16 matching tick arrays');
        }
        const indexes: number[] = [];
        if (side === 'A') {
            for (let i = 0; i < selectedLength; i++) {
                indexes.push (selectedIndexes[selectedLength - i - 1]);
            }
        } else {
            for (let i = 0; i < selectedLength; i++) {
                indexes.push (selectedIndexes[i]);
            }
        }
        let indexesLength = indexes.length;
        const first = parseInt (this.numberToString (indexes[0]));
        const lastIndex = indexesLength - 1;
        const last = parseInt (this.numberToString (indexes[lastIndex]));
        const maxStart = this.fibeMaxTick () - this.fibeTickSizeInArray ();
        const prependedIndexes: number[] = [];
        let prependedLength = 0;
        let offset = 1;
        while (offset <= 2) {
            if (this.sum (indexesLength, prependedLength) >= 16) {
                break;
            }
            const lower = first - (offset * this.fibeTickSizeInArray ());
            const upper = this.sum (last, offset * this.fibeTickSizeInArray ());
            const candidates = (side === 'B') ? [ lower, upper ] : [ upper, lower ];
            for (let i = 0; i < candidates.length; i++) {
                if (this.sum (indexesLength, prependedLength) >= 16) {
                    break;
                }
                const candidate = candidates[i];
                if ((candidate >= 0) && (candidate <= maxStart)) {
                    if (candidate < first) {
                        prependedIndexes.push (candidate);
                        prependedLength += 1;
                    } else {
                        indexes.push (candidate);
                        indexesLength += 1;
                    }
                }
            }
            offset += 1;
        }
        const result: number[] = [];
        for (let i = 0; i < prependedLength; i++) {
            result.push (prependedIndexes[prependedLength - i - 1]);
        }
        for (let i = 0; i < indexesLength; i++) {
            result.push (indexes[i]);
        }
        return result;
    }

    fibeSettlementTickArrayIndexes (orderSlots: Dict[]): number[] {
        let indexes: number[] = [];
        for (let i = 0; i < orderSlots.length; i++) {
            if (this.safeBool (orderSlots[i], 'isTriggerOrder', false)) {
                continue;
            }
            const priceInTicks = this.safeInteger (orderSlots[i], 'priceInTicks');
            if ((priceInTicks !== undefined) && (priceInTicks !== 0)) {
                indexes = this.fibeAddTickArrayIndex (indexes, parseInt (this.fibeGetTickArrayStartTick (this.numberToString (priceInTicks))));
            }
        }
        return indexes;
    }

    fibeTickArrayPdas (mt: string, mi: string, indexes: number[]): string[] {
        const result: string[] = [];
        for (let i = 0; i < indexes.length; i++) {
            result.push (this.fibeGetTickArrayPda (mt, mi, this.numberToString (indexes[i])));
        }
        return result;
    }

    async fibeGetCreateOrderTickArrays (market: Dict, owner: any, subAccountIndex: any, priceInTicks: any, sizeInBase: any, side: any, timeInForce: any): Promise<Dict> {
        const mt = this.safeString (market, 'mt') as string;
        const mi = this.safeString (market, 'mi') as string;
        const tickArrayResponse = await this.publicGetTickArray ({ 'mi': mi, 'mt': mt });
        const orderSlotsResponse = await this.publicGetOrderSlots ({
            'owner': owner,
            'mi': mi,
            'mt': mt,
            'subAccountIndex': subAccountIndex,
        });
        const coverLimit = (timeInForce === 'GTC') || (timeInForce === 'ALO');
        const matchingIndexes = this.fibeSelectMatchingTickArrayIndexes (tickArrayResponse, priceInTicks, sizeInBase, side, coverLimit);
        const matchingCount = matchingIndexes.length;
        let indexes: number[] = [];
        for (let i = 0; i < matchingIndexes.length; i++) {
            indexes.push (matchingIndexes[i]);
        }
        const orderSlots = this.safeList (orderSlotsResponse, 'orderSlots', []);
        const settlementIndexes = this.fibeSettlementTickArrayIndexes (orderSlots);
        for (let i = 0; i < settlementIndexes.length; i++) {
            indexes = this.fibeAddTickArrayIndex (indexes, settlementIndexes[i]);
        }
        return {
            'tickArrays': this.fibeTickArrayPdas (mt, mi, indexes),
            'matchingCount': matchingCount,
        };
    }

    async fibeGetCancelOrderTickArrays (market: Dict, owner: any, subAccountIndex: any, orderId: any, clientOrderId: boolean): Promise<Dict> {
        const mt = this.safeString (market, 'mt') as string;
        const mi = this.safeString (market, 'mi') as string;
        const response = await this.publicGetOrderSlots ({
            'owner': owner,
            'mi': mi,
            'mt': mt,
            'subAccountIndex': subAccountIndex,
        });
        const orderSlots = this.safeList (response, 'orderSlots', []);
        const key = clientOrderId ? 'cloid' : 'oid';
        let found = false;
        for (let i = 0; i < orderSlots.length; i++) {
            if (this.safeString (orderSlots[i], key) === orderId) {
                found = true;
                break;
            }
        }
        if (!found) {
            throw new OrderNotFound (this.id + ' cancelOrder() could not find open order ' + orderId);
        }
        return {
            'tickArrays': this.fibeTickArrayPdas (mt, mi, this.fibeSettlementTickArrayIndexes (orderSlots)),
        };
    }

    solanaGetAssociatedTokenAddress (mint: any, owner: any, tokenProgram: any): string {
        return this.fibePda ([ this.solanaPubkeyHex (owner), this.solanaPubkeyHex (tokenProgram), this.solanaPubkeyHex (mint) ], this.solanaAssociatedTokenProgramId ());
    }

    solanaAccount (pubkey: any, isWritable = false, isSigner = false): Dict {
        return {
            'pubkey': pubkey,
            'isWritable': isWritable,
            'isSigner': isSigner,
        };
    }

    solanaCreateAssociatedTokenAccountIx (payer: any, ata: any, owner: any, mint: any, tokenProgram: any): Dict {
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

    async solanaCreateAssociatedTokenAccountIfNeeded (rpcUrl: any, payer: any, owner: any, mint: any, tokenProgram: any, commitment = 'confirmed'): Promise<any> {
        const ata = this.solanaGetAssociatedTokenAddress (mint, owner, tokenProgram);
        const accountInfo = await this.solanaGetAccountInfo (rpcUrl, ata, commitment);
        if (accountInfo !== undefined) {
            return undefined;
        }
        return this.solanaCreateAssociatedTokenAccountIx (payer, ata, owner, mint, tokenProgram);
    }

    solanaSystemTransferIx (source: any, destination: any, lamports: any): Dict {
        return {
            'programId': this.solanaSystemProgramId (),
            'accounts': [
                this.solanaAccount (source, true, true),
                this.solanaAccount (destination, true),
            ],
            'data': this.solanaU32leHex (2) + this.solanaU64leHex (lamports),
        };
    }

    solanaSyncNativeIx (account: any, tokenProgram: any): Dict {
        return {
            'programId': tokenProgram,
            'accounts': [ this.solanaAccount (account, true) ],
            'data': this.solanaU8Hex (17),
        };
    }

    async solanaWrapNativeIfNeeded (rpcUrl: any, owner: any, tokenProgram: any, amount: any, commitment = 'confirmed'): Promise<Dict[]> {
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

    solanaSetComputeUnitLimitIx (units: any): Dict {
        return {
            'programId': this.solanaComputeBudgetProgramId (),
            'accounts': [],
            'data': this.solanaU8Hex (2) + this.solanaU32leHex (units),
        };
    }

    solanaSetComputeUnitPriceIx (microLamports: any): Dict {
        return {
            'programId': this.solanaComputeBudgetProgramId (),
            'accounts': [],
            'data': this.solanaU8Hex (3) + this.solanaU64leHex (microLamports),
        };
    }

    solanaAddComputeBudgetIxs (instructions: Dict[], params: Dict): Dict[] {
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

    fibeOrderReferenceHex (orderId: string, clientOrderId: boolean): string {
        let orderReferenceType = 1;
        if (clientOrderId) {
            orderReferenceType = 0;
        }
        return this.solanaU8Hex (orderReferenceType) + this.solanaU64leHex (orderId);
    }

    fibeCreateSubAccountIx (owner: any, subAccountIndex: any): Dict {
        return {
            'programId': this.fibeProgramId (),
            'accounts': [
                this.solanaAccount (this.fibeProgramId ()),
                this.solanaAccount (this.solanaSystemProgramId ()),
                this.solanaAccount (this.fibeGetDexAuthorityConfigPda ()),
                this.solanaAccount (this.fibeGetDexConfigPda (), true),
                this.solanaAccount (owner, true, true),
                this.solanaAccount (owner, false, true),
                this.solanaAccount (owner),
                this.solanaAccount (this.fibeGetUserStatePda (owner), true),
            ],
            'data': this.solanaBytesHex ([ 32, 0, 0, 0, 0, 0, 0, 0 ]) + this.solanaU8Hex (subAccountIndex) + this.solanaU8Hex (0) + this.fibeGetAccountLabelHex (owner, subAccountIndex),
        };
    }

    fibeSpotPlaceOrderIx (input: Dict): Dict {
        let data = this.solanaBytesHex ([ 96, 0, 0, 0, 0, 0, 0, 0 ]);
        data += this.solanaU8Hex (input['subAccountIndex']);
        data += this.solanaU32leHex (input['priceInTicks']);
        data += this.solanaOptionU64Hex (input['clientOrderId']);
        data += this.solanaU8Hex (this.fibeSideIndex (input['side']));
        data += this.solanaU64leHex (input['sizeInBase']);
        data += this.solanaU8Hex (this.fibeTimeInForceIndex (input['timeInForce']));
        data += this.solanaOptionU16Hex (undefined);
        data += this.solanaU8Hex (input['matchingCount']);
        const referrerInfo = this.safeString (input, 'referrerInfo', this.fibeProgramId ());
        const referralFeeAccount = this.safeString (input, 'referralFeeAccount');
        const referralFeeAccountAddress = (referralFeeAccount === undefined) ? this.fibeProgramId () : referralFeeAccount;
        const accounts = [
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.solanaSystemProgramId ()),
            this.solanaAccount (input['owner'], true, true),
            this.solanaAccount (this.fibeGetDexConfigPda ()),
            this.solanaAccount (this.fibeGetSpotDexConfigPda ()),
            this.solanaAccount (input['owner'], false, true),
            this.solanaAccount (input['ownerState'], true),
            this.solanaAccount (input['market'], true),
            this.solanaAccount (input['orderSlots'], true),
            this.solanaAccount (input['ownerBaseTokenAccount'], true),
            this.solanaAccount (input['ownerQuoteTokenAccount'], true),
            this.solanaAccount (input['tokenVaultBase'], true),
            this.solanaAccount (input['tokenVaultQuote'], true),
            this.solanaAccount (input['tokenMintBase']),
            this.solanaAccount (input['tokenMintQuote']),
            this.solanaAccount (input['tokenProgramBase']),
            this.solanaAccount (input['tokenProgramQuote']),
            this.solanaAccount (referrerInfo),
            this.solanaAccount (referralFeeAccountAddress, referralFeeAccount !== undefined),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (input['hfmmRegistry'], true),
        ];
        const tickArrays = this.safeList (input, 'tickArrays', []);
        for (let i = 0; i < tickArrays.length; i++) {
            accounts.push (this.solanaAccount (tickArrays[i], true));
        }
        return {
            'programId': this.fibeProgramId (),
            'accounts': accounts,
            'data': data,
        };
    }

    fibeSpotCloseRestingOrderIx (input: Dict): Dict {
        let data = this.solanaBytesHex ([ 97, 0, 0, 0, 0, 0, 0, 0 ]);
        data += this.solanaU8Hex (input['subAccountIndex']);
        data += this.fibeOrderReferenceHex (input['orderId'], input['isClientOrderId']);
        const accounts = [
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeGetDexConfigPda ()),
            this.solanaAccount (this.fibeGetSpotDexConfigPda ()),
            this.solanaAccount (input['owner'], false, true),
            this.solanaAccount (input['ownerState'], true),
            this.solanaAccount (input['market'], true),
            this.solanaAccount (input['orderSlots'], true),
            this.solanaAccount (input['ownerBaseTokenAccount'], true),
            this.solanaAccount (input['ownerQuoteTokenAccount'], true),
            this.solanaAccount (input['tokenVaultBase'], true),
            this.solanaAccount (input['tokenVaultQuote'], true),
            this.solanaAccount (input['tokenMintBase']),
            this.solanaAccount (input['tokenMintQuote']),
            this.solanaAccount (input['tokenProgramBase']),
            this.solanaAccount (input['tokenProgramQuote']),
        ];
        const tickArrays = this.safeList (input, 'tickArrays', []);
        for (let i = 0; i < tickArrays.length; i++) {
            accounts.push (this.solanaAccount (tickArrays[i], true));
        }
        return {
            'programId': this.fibeProgramId (),
            'accounts': accounts,
            'data': data,
        };
    }

    fibePerpPlaceOrderIx (input: Dict): Dict {
        const isCrossMargin = this.safeBool (input, 'isCrossMargin', false) ? 1 : 0;
        const reduceOnly = this.safeBool (input, 'reduceOnly', false) ? 1 : 0;
        let data = this.solanaBytesHex ([ 176, 0, 0, 0, 0, 0, 0, 0 ]);
        data += this.solanaU8Hex (input['subAccountIndex']);
        data += this.solanaU32leHex (input['priceInTicks']);
        data += this.solanaOptionU64Hex (input['clientOrderId']);
        data += this.solanaU8Hex (this.fibeSideIndex (input['side']));
        data += this.solanaU64leHex (input['sizeInBase']);
        data += this.solanaU8Hex (this.fibeTimeInForceIndex (input['timeInForce']));
        data += this.solanaU8Hex (reduceOnly);
        data += this.solanaU8Hex (isCrossMargin);
        data += this.solanaOptionU8Hex (input['initialLeverage']);
        data += this.solanaOptionU16Hex (undefined);
        data += this.solanaU64leHex (0);
        data += this.solanaU8Hex (input['matchingCount']);
        const referrerInfo = this.safeString (input, 'referrerInfo', this.fibeProgramId ());
        const referralFeeAccount = this.safeString (input, 'referralFeeAccount');
        const referralFeeAccountAddress = (referralFeeAccount === undefined) ? this.fibeProgramId () : referralFeeAccount;
        const accounts = [
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.solanaSystemProgramId ()),
            this.solanaAccount (this.fibeGetDexConfigPda ()),
            this.solanaAccount (this.fibeGetPerpDexConfigPda ()),
            this.solanaAccount (input['owner'], true, true),
            this.solanaAccount (input['owner'], false, true),
            this.solanaAccount (input['ownerState'], true),
            this.solanaAccount (input['ownerMarginAccount'], true),
            this.solanaAccount (input['orderSlots'], true),
            this.solanaAccount (input['market'], true),
            this.solanaAccount (input['perpControlParams']),
            this.solanaAccount (input['marginTables']),
            this.solanaAccount (input['hfmmMarginAccounts']),
            this.solanaAccount (input['hfmmRegistry'], true),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (referrerInfo),
            this.solanaAccount (referralFeeAccountAddress, referralFeeAccount !== undefined),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.fibeProgramId ()),
        ];
        const tickArrays = this.safeList (input, 'tickArrays', []);
        for (let i = 0; i < tickArrays.length; i++) {
            accounts.push (this.solanaAccount (tickArrays[i], true));
        }
        return {
            'programId': this.fibeProgramId (),
            'accounts': accounts,
            'data': data,
        };
    }

    fibePerpCloseRestingOrderIx (input: Dict): Dict {
        let data = this.solanaBytesHex ([ 177, 0, 0, 0, 0, 0, 0, 0 ]);
        data += this.solanaU8Hex (input['subAccountIndex']);
        data += this.fibeOrderReferenceHex (input['orderId'], input['isClientOrderId']);
        data += this.solanaU8Hex (0); // no tick-event location hint
        const accounts = [
            this.solanaAccount (this.fibeProgramId ()),
            this.solanaAccount (this.solanaSystemProgramId ()),
            this.solanaAccount (input['owner'], true, true),
            this.solanaAccount (this.fibeGetDexConfigPda ()),
            this.solanaAccount (this.fibeGetPerpDexConfigPda ()),
            this.solanaAccount (input['owner'], false, true),
            this.solanaAccount (input['ownerState'], true),
            this.solanaAccount (input['ownerMarginAccount'], true),
            this.solanaAccount (input['orderSlots'], true),
            this.solanaAccount (input['market'], true),
            this.solanaAccount (input['perpControlParams']),
            this.solanaAccount (input['marginTables']),
        ];
        const tickArrays = this.safeList (input, 'tickArrays', []);
        for (let i = 0; i < tickArrays.length; i++) {
            accounts.push (this.solanaAccount (tickArrays[i], true));
        }
        return {
            'programId': this.fibeProgramId (),
            'accounts': accounts,
            'data': data,
        };
    }

    solanaFindAccountIndex (accounts: Dict[], pubkey: any): number {
        for (let i = 0; i < accounts.length; i++) {
            if (this.safeString (accounts[i], 'pubkey') === pubkey) {
                return i;
            }
        }
        return -1;
    }

    solanaAddAccountMeta (accounts: Dict[], meta: Dict): Dict[] {
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

    solanaCompileMessageHex (payer: any, blockhash: any, instructions: Dict[]): string {
        let metas: Dict[] = [];
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
            if (this.safeBool (meta, 'isSigner', false) && this.safeBool (meta, 'isWritable', false)) {
                ordered.push (meta);
            }
        }
        for (let i = 0; i < sortedMetas.length; i++) {
            const meta = sortedMetas[i];
            if (this.safeBool (meta, 'isSigner', false) && !this.safeBool (meta, 'isWritable', false)) {
                ordered.push (meta);
            }
        }
        for (let i = 0; i < sortedMetas.length; i++) {
            const meta = sortedMetas[i];
            if (!this.safeBool (meta, 'isSigner', false) && this.safeBool (meta, 'isWritable', false)) {
                ordered.push (meta);
            }
        }
        for (let i = 0; i < sortedMetas.length; i++) {
            const meta = sortedMetas[i];
            if (!this.safeBool (meta, 'isSigner', false) && !this.safeBool (meta, 'isWritable', false)) {
                ordered.push (meta);
            }
        }
        let requiredSignatures = 0;
        let readonlySigners = 0;
        let readonlyUnsigned = 0;
        for (let i = 0; i < ordered.length; i++) {
            const meta = ordered[i];
            if (this.safeBool (meta, 'isSigner', false)) {
                requiredSignatures += 1;
                if (!this.safeBool (meta, 'isWritable', false)) {
                    readonlySigners += 1;
                }
            } else if (!this.safeBool (meta, 'isWritable', false)) {
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

    solanaSignTransaction (payer: any, privateKeyHex: any, blockhash: any, instructions: Dict[]): Dict {
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

    async fibeLocalTxCreateOrder (params: Dict): Promise<Dict> {
        const market = this.fibeTxParseMarket (params['market']);
        const mt = market['mt'];
        const mi = market['mi'];
        let marginMode = this.safeString (params, 'marginMode', 'cross');
        if (mt === 'P') {
            marginMode = this.fibeNormalizeMarginMode ('createOrder', marginMode);
        }
        const owner = this.safeString (params, 'user');
        const privateKeyHex = this.solanaParsePrivateKeyHex (this.safeString (params, 'privateKey'), owner);
        const clientOrderId = this.safeString (params, 'orderId');
        const subAccountIndex = this.safeInteger (params, 'subAccountIndex', 0);
        const orderSubAccountIndex = (mt === 'S') ? 0 : subAccountIndex;
        const priceInTicks = this.fibePriceToTicks (this.safeString (params, 'price'), this.safeInteger (market, 'quoteDecimals'), this.safeString (market, 'tickSizeInQuoteBaseUnits'), this.safeString (params, 'side'), this.safeNumber (params, 'slippage'));
        if (!Precise.stringGt (priceInTicks, '0') || !Precise.stringLt (priceInTicks, this.numberToString (this.fibeMaxTick ()))) {
            throw new InvalidOrder (this.id + ' createOrder() price must map to a tick between 1 and ' + this.numberToString (this.fibeMaxTick () - 1));
        }
        const sizeInBase = this.fibeNormalizeQuantity (
            this.fibeDecimalToUnits (this.safeString (params, 'amount'), this.safeInteger (market, 'baseDecimals')),
            this.safeString (market, 'lotSizeInBaseBaseUnits')
        );
        const rpcUrl = this.safeString (params, 'rpcUrl');
        const commitment = this.safeString (params, 'commitment', 'confirmed');
        const account = await this.fibeGetOrNextAccountId (owner, orderSubAccountIndex, mt === 'S');
        const accountId = this.safeString (account, 'accountId');
        const createSubAccount = this.safeBool (account, 'createSubAccount', false);
        const orderSlots = this.fibeGetOrderSlotsPda (mt, accountId, mi);
        const tickArrayResult = await this.fibeGetCreateOrderTickArrays (market, owner, orderSubAccountIndex, priceInTicks, sizeInBase, this.safeString (params, 'side'), this.safeString (params, 'timeInForce'));
        const tickArrays = this.safeList (tickArrayResult, 'tickArrays', []);
        const matchingCount = this.safeInteger (tickArrayResult, 'matchingCount');
        let ixs: Dict[] = [];
        if (createSubAccount) {
            ixs.push (this.fibeCreateSubAccountIx (owner, orderSubAccountIndex));
        }
        if (mt === 'S') {
            const tokenProgramQuote = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'quoteMint'), this.safeString (market, 'tokenProgramQuote'), commitment);
            const tokenProgramBase = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'baseMint'), this.safeString (market, 'tokenProgramBase'), commitment);
            const ownerBaseTokenAccount = this.solanaGetAssociatedTokenAddress (this.safeString (market, 'baseMint'), owner, tokenProgramBase);
            const ownerQuoteTokenAccount = this.solanaGetAssociatedTokenAddress (this.safeString (market, 'quoteMint'), owner, tokenProgramQuote);
            const side = this.safeString (params, 'side');
            let inputMint = this.safeString (market, 'baseMint');
            let inputTokenProgram = tokenProgramBase;
            if (side === 'B') {
                inputMint = this.safeString (market, 'quoteMint');
                inputTokenProgram = tokenProgramQuote;
            }
            const inputAmount = this.fibeSpotInputAmount (market, sizeInBase, priceInTicks, side);
            if (inputMint === this.solanaNativeMint ()) {
                const wrapIxs = await this.solanaWrapNativeIfNeeded (rpcUrl, owner, inputTokenProgram, inputAmount, commitment);
                ixs = this.arrayConcat (ixs, wrapIxs);
            } else {
                const inputAtaIx = await this.solanaCreateAssociatedTokenAccountIfNeeded (rpcUrl, owner, owner, inputMint, inputTokenProgram, commitment);
                if (inputAtaIx !== undefined) {
                    ixs.push (inputAtaIx);
                }
            }
            let outputMint = this.safeString (market, 'quoteMint');
            let outputTokenProgram = tokenProgramQuote;
            if (side === 'B') {
                outputMint = this.safeString (market, 'baseMint');
                outputTokenProgram = tokenProgramBase;
            }
            const outputAtaIx = await this.solanaCreateAssociatedTokenAccountIfNeeded (rpcUrl, owner, owner, outputMint, outputTokenProgram, commitment);
            if (outputAtaIx !== undefined) {
                ixs.push (outputAtaIx);
            }
            const referralAccounts = await this.fibeGetReferralAccounts (owner, market, tokenProgramQuote, rpcUrl, commitment);
            const createReferralFeeAccountIx = this.safeDict (referralAccounts, 'createFeeAccountIx');
            if (createReferralFeeAccountIx !== undefined) {
                ixs.push (createReferralFeeAccountIx);
            }
            ixs.push (this.fibeSpotPlaceOrderIx ({
                'owner': owner,
                'ownerState': this.fibeGetUserStatePda (owner),
                'orderSlots': orderSlots,
                'ownerBaseTokenAccount': ownerBaseTokenAccount,
                'ownerQuoteTokenAccount': ownerQuoteTokenAccount,
                'market': this.safeString (market, 'marketPubkey'),
                'tokenVaultBase': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'baseMint')),
                'tokenVaultQuote': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'quoteMint')),
                'hfmmRegistry': this.fibeGetHfmmRegistryPda ('S', mi),
                'tokenMintBase': this.safeString (market, 'baseMint'),
                'tokenMintQuote': this.safeString (market, 'quoteMint'),
                'tokenProgramBase': tokenProgramBase,
                'tokenProgramQuote': tokenProgramQuote,
                'referrerInfo': this.safeString (referralAccounts, 'referrerInfo'),
                'referralFeeAccount': this.safeString (referralAccounts, 'referralFeeAccount'),
                'priceInTicks': priceInTicks,
                'clientOrderId': clientOrderId,
                'side': this.safeString (params, 'side'),
                'sizeInBase': sizeInBase,
                'timeInForce': this.safeString (params, 'timeInForce'),
                'matchingCount': matchingCount,
                'subAccountIndex': orderSubAccountIndex,
                'tickArrays': tickArrays,
            }));
        } else {
            const isCrossMargin = (marginMode === 'cross');
            const quoteTokenIndex = this.safeInteger (market, 'quoteTokenIndex');
            let referralAccounts: Dict = {};
            if (subAccountIndex === 0) {
                referralAccounts = await this.fibeGetReferralAccounts (owner, market);
            }
            ixs.push (this.fibePerpPlaceOrderIx ({
                'owner': owner,
                'ownerState': this.fibeGetUserStatePda (owner),
                'ownerMarginAccount': this.fibeGetUserMarginAccountPda (owner, subAccountIndex, quoteTokenIndex),
                'orderSlots': orderSlots,
                'market': this.safeString (market, 'marketPubkey'),
                'perpControlParams': this.fibeGetPerpControlParamsPda (quoteTokenIndex),
                'marginTables': this.fibeGetMarginTableRegistryPda (quoteTokenIndex),
                'hfmmMarginAccounts': this.fibeGetHfmmMarginAccountsPda (quoteTokenIndex),
                'hfmmRegistry': this.fibeGetHfmmRegistryPda ('P', mi),
                'referrerInfo': this.safeString (referralAccounts, 'referrerInfo'),
                'referralFeeAccount': this.safeString (referralAccounts, 'referralFeeAccount'),
                'priceInTicks': priceInTicks,
                'clientOrderId': clientOrderId,
                'side': this.safeString (params, 'side'),
                'isCrossMargin': isCrossMargin,
                'initialLeverage': this.safeInteger (params, 'initialLeverage'),
                'reduceOnly': false,
                'sizeInBase': sizeInBase,
                'timeInForce': this.safeString (params, 'timeInForce'),
                'matchingCount': matchingCount,
                'subAccountIndex': subAccountIndex,
                'tickArrays': tickArrays,
            }));
        }
        const result = await this.solanaSignAndSend (rpcUrl, owner, privateKeyHex, ixs, params);
        result['accountId'] = accountId;
        result['orderSlots'] = orderSlots;
        result['priceInTicks'] = priceInTicks;
        result['tickArrays'] = tickArrays;
        result['matchingCount'] = matchingCount;
        return result;
    }

    async fibeLocalTxCancelOrder (params: Dict): Promise<Dict> {
        const market = this.fibeTxParseMarket (params['market']);
        const mt = market['mt'];
        const mi = market['mi'];
        const owner = this.safeString (params, 'user');
        const privateKeyHex = this.solanaParsePrivateKeyHex (this.safeString (params, 'privateKey'), owner);
        const orderId = this.safeString (params, 'orderId');
        const isClientOrderId = this.safeBool (params, 'isClientOrderId', false);
        let subAccountIndex = this.safeInteger (params, 'subAccountIndex', 0);
        if (mt === 'S') {
            subAccountIndex = 0;
        }
        const rpcUrl = this.safeString (params, 'rpcUrl');
        const commitment = this.safeString (params, 'commitment', 'confirmed');
        const account = await this.fibeGetOrNextAccountId (owner, subAccountIndex, false);
        const accountId = this.safeString (account, 'accountId');
        const orderSlots = this.fibeGetOrderSlotsPda (mt, accountId, mi);
        const tickArrayResult = await this.fibeGetCancelOrderTickArrays (market, owner, subAccountIndex, orderId, isClientOrderId);
        const tickArrays = this.safeList (tickArrayResult, 'tickArrays', []);
        let ix: any = undefined;
        if (mt === 'S') {
            const tokenProgramBase = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'baseMint'), this.safeString (market, 'tokenProgramBase'), commitment);
            const tokenProgramQuote = await this.solanaGetTokenProgram (rpcUrl, this.safeString (market, 'quoteMint'), this.safeString (market, 'tokenProgramQuote'), commitment);
            ix = this.fibeSpotCloseRestingOrderIx ({
                'owner': owner,
                'ownerState': this.fibeGetUserStatePda (owner),
                'orderSlots': orderSlots,
                'ownerBaseTokenAccount': this.solanaGetAssociatedTokenAddress (this.safeString (market, 'baseMint'), owner, tokenProgramBase),
                'ownerQuoteTokenAccount': this.solanaGetAssociatedTokenAddress (this.safeString (market, 'quoteMint'), owner, tokenProgramQuote),
                'market': this.safeString (market, 'marketPubkey'),
                'tokenVaultBase': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'baseMint')),
                'tokenVaultQuote': this.fibeGetSpotMarketVaultPda (mi, this.safeString (market, 'quoteMint')),
                'tokenMintBase': this.safeString (market, 'baseMint'),
                'tokenMintQuote': this.safeString (market, 'quoteMint'),
                'tokenProgramBase': tokenProgramBase,
                'tokenProgramQuote': tokenProgramQuote,
                'orderId': orderId,
                'isClientOrderId': isClientOrderId,
                'subAccountIndex': subAccountIndex,
                'tickArrays': tickArrays,
            });
        } else {
            const quoteTokenIndex = this.safeInteger (market, 'quoteTokenIndex');
            ix = this.fibePerpCloseRestingOrderIx ({
                'market': this.safeString (market, 'marketPubkey'),
                'owner': owner,
                'ownerState': this.fibeGetUserStatePda (owner),
                'ownerMarginAccount': this.fibeGetUserMarginAccountPda (owner, subAccountIndex, quoteTokenIndex),
                'orderSlots': orderSlots,
                'perpControlParams': this.fibeGetPerpControlParamsPda (quoteTokenIndex),
                'marginTables': this.fibeGetMarginTableRegistryPda (quoteTokenIndex),
                'orderId': orderId,
                'isClientOrderId': isClientOrderId,
                'subAccountIndex': subAccountIndex,
                'tickArrays': tickArrays,
            });
        }
        const result = await this.solanaSignAndSend (rpcUrl, owner, privateKeyHex, [ ix ], params);
        result['accountId'] = accountId;
        result['orderSlots'] = orderSlots;
        result['tickArrays'] = tickArrays;
        return result;
    }

    fibeTxParseMarket (market: Market): Dict {
        const info = this.safeDict (market, 'info', {});
        let mt = 'P';
        if (this.safeBool (market, 'spot', false)) {
            mt = 'S';
        }
        return {
            'mt': mt,
            'mi': this.safeString (info, 'mi'),
            'marketPubkey': this.safeString (info, 'marketPubkey'),
            'baseMint': this.safeString (info, 'baseMint'),
            'quoteMint': this.safeString (info, 'quoteMint'),
            'quoteTokenIndex': this.safeString (info, 'qti'),
            'baseDecimals': this.safeInteger (info, 'baseDecimals'),
            'quoteDecimals': this.safeInteger (info, 'quoteDecimals'),
            'tickSizeInQuoteBaseUnits': this.safeString (info, 'tickSizeInQuoteBaseUnits'),
            'lotSizeInBaseBaseUnits': this.safeString (info, 'lotSizeInBaseBaseUnits'),
            'tokenProgramBase': this.safeString (info, 'tokenProgramBase'),
            'tokenProgramQuote': this.safeString (info, 'tokenProgramQuote'),
        };
    }

    async solanaGetTokenProgram (rpcUrl: any, mint: any, tokenProgram: any = undefined, commitment = 'confirmed'): Promise<string> {
        if (tokenProgram !== undefined) {
            return tokenProgram;
        }
        const tokenPrograms: Dict = this.safeDict (this.options, 'tokenPrograms', {});
        this.options['tokenPrograms'] = tokenPrograms;
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

    async solanaGetAccountInfo (rpcUrl: any, pubkey: any, commitment = 'confirmed'): Promise<any> {
        const response = await this.solanaRpc (rpcUrl, 'getAccountInfo', [
            pubkey,
            { 'encoding': 'base64', 'commitment': commitment },
        ]);
        const value = this.safeValue (response, 'value');
        if (value === undefined) {
            return undefined;
        }
        const data = this.safeList (value, 'data', []);
        // Store the length so PHP transpiles this list check to count().
        const dataLength = data.length;
        if (dataLength === 0) {
            throw new ExchangeError (this.id + ' Solana account response is missing base64 data for ' + pubkey);
        }
        return {
            'owner': this.safeString (value, 'owner'),
            'lamports': this.safeString (value, 'lamports'),
            'data': this.base64ToBinary (data[0]),
        };
    }

    async solanaSignAndSend (rpcUrl: any, payer: any, privateKeyHex: any, instructions: Dict[], params: Dict = {}): Promise<Dict> {
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

    async solanaRpc (rpcUrl: any, method: string, params: any[]): Promise<any> {
        const url = rpcUrl.toString ();
        const response = await this.fetch (url, 'POST', { 'Content-Type': 'application/json' }, this.json ({
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
            'P': 'open',
            'F': 'closed',
            'C': 'canceled',
            'R': 'rejected',
            'M': 'canceled',
            'L': 'canceled',
            'S': 'canceled',
            'I': 'canceled',
            'triggered': 'closed',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrderType (type: Str): Str {
        const types: Dict = {
            'L': 'limit',
            'M': 'market',
            'Limit': 'limit',
            'Market': 'market',
            'Stop Limit': 'limit',
            'Stop Market': 'market',
            'Take Profit Limit': 'limit',
            'Take Profit Market': 'market',
        };
        return this.safeString (types, type, type);
    }

    parseOrderTimeInForce (timeInForce: Str): Str {
        const timeInForces: Dict = {
            'GTC': 'GTC',
            'IOC': 'IOC',
            'FOK': 'FOK',
            'ALO': 'PO',
            'FM': 'IOC',
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
            throw new InvalidOrder (this.id + ' createOrder() supports timeInForce GTC, IOC, PO/ALO, or FOK');
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

    handlePublicAddress (methodName: any, params: Dict) {
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

    async fibeAccountId (methodName: string, params: Dict) {
        let accountId = undefined;
        [ accountId, params ] = this.handleOptionAndParams (params, methodName, 'accountId');
        let subAccountIndex = undefined;
        [ subAccountIndex, params ] = this.handleOptionAndParams (params, methodName, 'subAccountIndex', 0);
        subAccountIndex = this.fibeValidateU8Param (methodName, 'subAccountIndex', subAccountIndex);
        if (accountId !== undefined) {
            accountId = this.fibeValidateUnsignedIntegerParam (methodName, 'accountId', accountId);
            params = this.omit (params, [ 'user', 'address' ]);
            return [ accountId, params ];
        }
        let userAddress = undefined;
        [ userAddress, params ] = this.handlePublicAddress (methodName, params);
        const cacheKey = userAddress + ':' + this.numberToString (subAccountIndex);
        const accountIds = this.safeDict (this.options, 'accountIds', {});
        accountId = this.safeString (accountIds, cacheKey);
        if (accountId === undefined) {
            const response = await this.publicGetAccountId ({
                'owner': userAddress,
                'subAccountIndex': subAccountIndex,
            });
            accountId = this.safeString (response, 'accountId');
        }
        if (accountId === undefined) {
            throw new ExchangeError (this.id + ' ' + methodName + '() could not resolve the account id');
        }
        accountId = this.fibeValidateUnsignedIntegerParam (methodName, 'accountId', accountId);
        accountIds[cacheKey] = accountId;
        this.options['accountIds'] = accountIds;
        return [ accountId, params ];
    }

    override sign (path: string, api: string[] = [ 'public' ], method = 'GET', params: Dict = {}): Dict {
        let headers: any = undefined;
        let body: any = undefined;
        let url = this.urls['api']['rest'] + '/' + path;
        const query = this.urlencode (params);
        if (method === 'GET') {
            if (query.length !== 0) {
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

    override handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response: any, requestHeaders: any, requestBody: any) {
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
