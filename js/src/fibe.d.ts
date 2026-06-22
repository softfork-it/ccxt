import Exchange from './abstract/fibe.js';
import type { Balances, Dict, FundingHistory, FundingRate, FundingRates, Market, OHLCV, Order, OrderBook, Position, Strings, Ticker, Tickers, Trade, TradingFeeInterface, TradingFees, Str, Int, int } from './base/types.js';
/**
 * @class fibe
 * @augments Exchange
 * Fibe — Solana on-chain orderbook DEX (spot + perp).
 */
export default class fibe extends Exchange {
    describe(): any;
    fetchMarkets(params?: {}): Promise<Market[]>;
    parseMarket(market: Dict): Market;
    fetchBalance(params?: {}): Promise<Balances>;
    fetchPositions(symbols?: Strings, params?: {}): Promise<Position[]>;
    parsePosition(position: Dict, market?: Market): Position;
    fetchFundingHistory(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<FundingHistory[]>;
    parseIncome(income: Dict, market?: Market): FundingHistory;
    fetchTradingFees(params?: {}): Promise<TradingFees>;
    fetchTradingFee(symbol: string, params?: {}): Promise<TradingFeeInterface>;
    fetchTicker(symbol: string, params?: {}): Promise<Ticker>;
    fetchTickers(symbols?: Strings, params?: {}): Promise<Tickers>;
    parseTicker(ticker: Dict, market?: Market): Ticker;
    fetchFundingRate(symbol: string, params?: {}): Promise<FundingRate>;
    fetchFundingRates(symbols?: Strings, params?: {}): Promise<FundingRates>;
    parseFundingRate(contract: any, market?: Market): FundingRate;
    fetchOrderBook(symbol: string, limit?: Int, params?: {}): Promise<OrderBook>;
    fetchTrades(symbol: string, since?: Int, limit?: Int, params?: {}): Promise<Trade[]>;
    parseTrade(trade: Dict, market?: Market): Trade;
    fetchOHLCV(symbol: string, timeframe?: string, since?: Int, limit?: Int, params?: {}): Promise<OHLCV[]>;
    parseOHLCV(ohlcv: any, market?: Market): OHLCV;
    fetchOpenOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    fetchOrders(symbol?: Str, since?: Int, limit?: Int, params?: {}): Promise<Order[]>;
    parseOrder(order: Dict, market?: Market): Order;
    parseOrderStatus(status: Str): Str;
    parseOrderType(type: Str): Str;
    parseOrderTimeInForce(timeInForce: Str): Str;
    parseSide(side: Str): Str;
    parseOrderTimestamp(order: Dict, key: string): Int;
    handlePublicAddress(methodName: string, params: Dict): any[];
    sign(path: any, api?: string, method?: string, params?: {}, headers?: any, body?: any): {
        url: string;
        method: string;
        body: any;
        headers: any;
    };
    handleErrors(code: int, reason: string, url: string, method: string, headers: Dict, body: string, response: any, requestHeaders: any, requestBody: any): any;
}
