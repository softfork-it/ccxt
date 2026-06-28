import Exchange from './abstract/fibe.js';
import type { Balances, Dict, FundingHistory, FundingRate, FundingRates, Market, Num, OHLCV, Order, OrderBook, OrderSide, OrderType, Position, Strings, Ticker, Tickers, Trade, TradingFeeInterface, TradingFees, Str, Int, int } from './base/types.js';
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
    parseIncome(income: any, market?: Market): {
        info: any;
        symbol: string;
        code: string;
        timestamp: number;
        datetime: string;
        id: any;
        amount: number;
    };
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
    fetchCreateOrderMarketReferencePrice(market: Market): Promise<string>;
    createOrder(symbol: string, type: OrderType, side: OrderSide, amount: number, price?: Num, params?: {}): Promise<Order>;
    cancelOrder(id: string, symbol?: Str, params?: {}): Promise<Order>;
    parseOrder(order: Dict, market?: Market): Order;
    fibeProgramId(): string;
    solanaSystemProgramId(): string;
    solanaAssociatedTokenProgramId(): string;
    solanaComputeBudgetProgramId(): string;
    solanaNativeMint(): string;
    solanaHexAlphabet(): string;
    solanaHexNibble(value: any): number;
    solanaHexByte(hex: any, index: any): number;
    fibeIsUnsignedIntegerString(value: any): boolean;
    fibeValidateUnsignedIntegerParam(method: any, field: any, value: any): string;
    fibeValidateU8Param(method: any, field: any, value: any, min?: number): number;
    fibeValidateU32Param(method: any, field: any, value: any): number;
    fibeNormalizeMarginMode(method: any, marginMode: any): "isolated" | "cross";
    solanaU8Hex(value: any): string;
    solanaU16leHex(value: any): string;
    solanaU32leHex(value: any): string;
    solanaBytesHex(values: any): string;
    solanaStringHex(value: any): string;
    solanaPubkeyHex(pubkey: any): string;
    fibeDecimalStringStripZeros(value: any): any;
    fibeDecimalStringDivInteger(value: any, divisor: any, roundUp?: boolean): any;
    fibeDecimalStringDivmod(value: any, divisor: any): {
        quotient: string;
        remainder: number;
    };
    fibeDecimalStringCompare(a: any, b: any): 0 | 1 | -1;
    fibeDecimalStringAdd(a: any, b: any): any;
    fibeDecimalStringSubtract(a: any, b: any): any;
    fibeDecimalStringSubtractSmall(value: any, subtraction: any): any;
    fibeDecimalStringCeilDivSmall(value: any, divisor: any): string;
    fibeDecimalStringMultiplySmall(value: any, multiplier: any): any;
    fibeDecimalStringAddSmall(value: any, addition: any): any;
    fibeDecimalToUnits(value: any, decimals: any): any;
    fibeNewOrderId(): any;
    fibeNormalizeQuantity(quantity: any, lotSize: any): any;
    solanaU64leHex(value: any): string;
    solanaLeHexToDecimalString(hex: any): any;
    solanaOptionU8Hex(value: any): string;
    solanaOptionU16Hex(value: any): string;
    solanaOptionU64Hex(value: any): string;
    solanaShortVecHex(value: any): string;
    fibeSideIndex(side: any): 0 | 1;
    fibeTimeInForceIndex(timeInForce: any): number;
    fibeGetTickArrayStartTick(priceInTicks: any): string;
    fibePriceToTicks(price: any, quoteDecimals: any, tickSizeInQuoteBaseUnits: any, side?: any, slippage?: any): any;
    solanaIsHexString(value: any): boolean;
    solanaPublicKeyFromSecretKeyHex(secretKeyHex: any): string;
    solanaParsePrivateKeyHex(privateKey: any, user?: any): any;
    solanaFieldP(): number[];
    solanaFieldD(): number[];
    solanaFieldOne(): number[];
    solanaFieldCompare(a: any, b: any): 0 | 1 | -1;
    solanaFieldNormalize(input: any): any[];
    solanaFieldSubNoNormalize(a: any, b: any): any[];
    solanaFieldSub(a: any, b: any): any[];
    solanaFieldAdd(a: any, b: any): any[];
    solanaFieldMul(a: any, b: any): any[];
    solanaFieldSquare(a: any): any[];
    solanaFieldPow(a: any, exponentHex: any): number[];
    solanaFieldIsZero(a: any): boolean;
    solanaFieldIsOne(a: any): boolean;
    solanaFieldFromLittleEndianHex(hex: any): any[];
    solanaIsOnCurveHex(candidateHex: any): boolean;
    solanaFindProgramAddress(seeds: any, programId: any): string;
    fibePda(seeds: any, programId?: any): string;
    fibeGetUserStatePda(user: any): string;
    fibeGetSubAccountStatePda(owner: any, subAccountIndex: any): string;
    fibeGetUserMarginAccountPda(owner: any, subAccountIndex: any, quoteMint: any): string;
    fibeGetOrderPda(owner: any, subAccountIndex: any, orderId: any): string;
    fibeGetSpotMarketVaultPda(marketIndex: any, tokenMint: any): string;
    fibeGetPerpMarketVaultPda(tokenMint: any): string;
    fibeGetVaultAuthorityPda(): string;
    fibeGetHfmmRegistryPda(marketType: any, marketIndex: any): string;
    fibeGetPerpControlParamsPda(quoteMint: any): string;
    fibeGetHfmmMarginAccountsPda(quoteMint: any): string;
    fibeGetTickArrayPda(marketType: any, marketIndex: any, priceInTicks: any): string;
    fibeMaxTick(): number;
    fibeTickSizeInArray(): number;
    fibeMarketTickArrayBitmapOffset(): number;
    solanaReadU64FromHex(hex: any, offset: any): any;
    solanaReadI8FromHex(hex: any, offset: any): number;
    fibeDecodeTickArrayBitmap(marketData: any): {
        askTickLowerBound: any;
        bidTickUpperBound: any;
    };
    fibeTickArrayStride(marketType: any): 64 | 80;
    fibeDecodeTickArrayState(marketType: any, data: any): {
        startTick: number;
        ticks: any[];
    };
    solanaGetMultipleAccountData(rpcUrl: any, pubkeys: any, commitment?: string): Promise<any[]>;
    fibeGetTickArrayStates(rpcUrl: any, market: any, pubkeys: any, commitment?: string): Promise<any[]>;
    fibeFillTickLots(tick: any, lots: any, side: any): any;
    fibeFillTickArrayBid(state: any, priceInTicks: any, lots: any): any;
    fibeFillTickArrayAsk(state: any, priceInTicks: any, lots: any): any;
    fibeFindTickArrayIndexesForOrder(states: any, priceInTicks: any, baseLots: any, side: any): any[];
    fibeGetAllTickArrayIndexesForBid(priceInTicks: any, tickArrayIndexes: any): any[];
    fibeGetAllTickArrayIndexesForAsk(priceInTicks: any, tickArrayIndexes: any): number[];
    fibeGetTickArraysForOrder(rpcUrl: any, market: any, priceInTicks: any, sizeInBase: any, side: any, commitment: any): Promise<any[]>;
    solanaGetAssociatedTokenAddress(mint: any, owner: any, tokenProgram: any): string;
    solanaAccount(pubkey: any, isWritable?: boolean, isSigner?: boolean): {
        pubkey: any;
        isWritable: boolean;
        isSigner: boolean;
    };
    solanaCreateAssociatedTokenAccountIx(payer: any, ata: any, owner: any, mint: any, tokenProgram: any): {
        programId: string;
        accounts: {
            pubkey: any;
            isWritable: boolean;
            isSigner: boolean;
        }[];
        data: string;
    };
    solanaSetComputeUnitLimitIx(units: any): {
        programId: string;
        accounts: any[];
        data: string;
    };
    solanaSetComputeUnitPriceIx(microLamports: any): {
        programId: string;
        accounts: any[];
        data: string;
    };
    solanaAddComputeBudgetIxs(instructions: any, params: any): any;
    fibeSpotPlaceOrderIx(input: any): {
        programId: string;
        accounts: {
            pubkey: any;
            isWritable: boolean;
            isSigner: boolean;
        }[];
        data: string;
    };
    fibeSpotCloseRestingOrderIx(input: any): {
        programId: string;
        accounts: {
            pubkey: any;
            isWritable: boolean;
            isSigner: boolean;
        }[];
        data: string;
    };
    fibePerpPlaceOrderIx(input: any): {
        programId: string;
        accounts: {
            pubkey: any;
            isWritable: boolean;
            isSigner: boolean;
        }[];
        data: string;
    };
    fibePerpCloseRestingOrderIx(input: any): {
        programId: string;
        accounts: {
            pubkey: any;
            isWritable: boolean;
            isSigner: boolean;
        }[];
        data: string;
    };
    solanaFindAccountIndex(accounts: any, pubkey: any): number;
    solanaAddAccountMeta(accounts: any, meta: any): void;
    solanaComparePubkeys(a: any, b: any): 0 | 1 | -1;
    solanaCompileMessageHex(payer: any, blockhash: any, instructions: any): string;
    solanaSignTransaction(payer: any, privateKeyHex: any, blockhash: any, instructions: any): {
        signature: string;
        transaction: string;
    };
    solanaReadU64(data: any, offset: any): any;
    fibeLocalTxCreateOrder(params: any): Promise<Dict>;
    fibeLocalTxCancelOrder(params: any): Promise<Dict>;
    fibeTxParseMarket(market: any): {
        marketType: string;
        marketIndex: string;
        marketPubkey: string;
        baseMint: string;
        quoteMint: string;
        baseDecimals: number;
        quoteDecimals: number;
        tickSizeInQuoteBaseUnits: string;
        lotSizeInBaseBaseUnits: string;
        tokenProgramBase: string;
        tokenProgramQuote: string;
    };
    solanaTokenProgramCache(): import("./base/types.js").Dictionary<any>;
    solanaGetTokenProgram(rpcUrl: any, mint: any, tokenProgram?: any, commitment?: string): Promise<string>;
    solanaAccountExists(rpcUrl: any, pubkey: any, commitment?: string): Promise<boolean>;
    solanaGetAccountData(rpcUrl: any, pubkey: any, commitment?: string): Promise<string>;
    solanaGetAccountInfo(rpcUrl: any, pubkey: any, commitment?: string): Promise<Dict>;
    solanaSignAndSend(rpcUrl: any, payer: any, privateKeyHex: any, instructions: any, params?: {}): Promise<Dict>;
    solanaRpc(rpcUrl: any, method: any, params: any): Promise<Dict>;
    parseOrderStatus(status: Str): Str;
    parseOrderType(type: Str): Str;
    parseOrderTimeInForce(timeInForce: Str): Str;
    encodeCreateOrderTimeInForce(timeInForce: Str, postOnly: boolean): string;
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
