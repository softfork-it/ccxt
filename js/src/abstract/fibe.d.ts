import { implicitReturnType } from '../base/types.js';
import { Exchange as _Exchange } from '../base/Exchange.js';
interface Exchange {
    publicGetMarkets(params?: {}): Promise<implicitReturnType>;
    publicGetMarket(params?: {}): Promise<implicitReturnType>;
    publicGetAllMids(params?: {}): Promise<implicitReturnType>;
    publicGetMarketStats(params?: {}): Promise<implicitReturnType>;
    publicGetSpotAssetCtx(params?: {}): Promise<implicitReturnType>;
    publicGetPerpAssetCtx(params?: {}): Promise<implicitReturnType>;
    publicGetL2book(params?: {}): Promise<implicitReturnType>;
    publicGetRecentMarketTrades(params?: {}): Promise<implicitReturnType>;
    publicGetCandles(params?: {}): Promise<implicitReturnType>;
    publicGetOpenOrders(params?: {}): Promise<implicitReturnType>;
    publicGetHistoricalOrders(params?: {}): Promise<implicitReturnType>;
    publicGetSpotState(params?: {}): Promise<implicitReturnType>;
    publicGetClearinghouseState(params?: {}): Promise<implicitReturnType>;
    publicGetAllClearinghouseState(params?: {}): Promise<implicitReturnType>;
    publicGetUserFees(params?: {}): Promise<implicitReturnType>;
    publicGetUserFundingHistory(params?: {}): Promise<implicitReturnType>;
    publicGetUserTrades(params?: {}): Promise<implicitReturnType>;
}
declare abstract class Exchange extends _Exchange {
}
export default Exchange;
