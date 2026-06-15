import Exchange from './abstract/fibe.js';
import type { Dict, Market, OrderBook, Int, int } from './base/types.js';
/**
 * @class fibe
 * @augments Exchange
 * Fibe — Solana on-chain orderbook DEX (spot + perp).
 */
export default class fibe extends Exchange {
    describe(): any;
    fetchMarkets(params?: {}): Promise<Market[]>;
    parseMarket(market: Dict): Market;
    fetchOrderBook(symbol: string, limit?: Int, params?: {}): Promise<OrderBook>;
    sign(path: any, api?: string, method?: string, params?: {}, headers?: any, body?: any): {
        url: string;
        method: string;
        body: any;
        headers: any;
    };
    handleErrors(code: int, reason: string, url: string, method: string, headers: Dict, body: string, response: any, requestHeaders: any, requestBody: any): any;
}
