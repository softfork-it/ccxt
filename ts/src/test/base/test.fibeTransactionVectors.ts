// AUTO_TRANSPILE_ENABLED
import assert from 'assert';
import ccxt from '../../../ccxt.js';

// Frozen from rust-sdk 831356e. Do not regenerate the expected values with CCXT helpers.
function testFibeTransactionVectors () {
    const exchange = new ccxt.fibe ({});
    const walletAddress = 'bNMBfVAEjgxhNruYTR2vSZ92UdVKP2pdZewEG7978Vt';
    const privateKeyHex = '53044db873cead13a10478acd042f15541f041d90dc3d90223c30da52ced2522';
    const secretKeyHex = '53044db873cead13a10478acd042f15541f041d90dc3d90223c30da52ced252208cde2c193eb2fd652d5ccceb8347e4b246df2f6cf412df506c3c51a14b997f7';
    const blockhash = '9zp3GFAJpCL3LkizPusx3BFrxdnK47hYmZCypWvkKUT7';
    const tokenProgram = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const baseMint = '22HX2NvQeuid5EUenvRtZtSN4i4wtjqGwqAyN5RJ7zHw';
    const quoteMint = 'EM7eDa1KFZeKddqizAWur7yMJytKASPtoQmZxSDNYcKR';
    const spotMarket = '5Sau7pWyabqTFmC2bvH5VARGek14EhLsAPcWETUbjjV1';
    const perpMarket = '3TFEPaXhciaFAtAQKa2JdwKeki4294nF4VMkMbfTxdxc';
    const accountId = '42';
    const quoteTokenIndex = '0';

    assert (exchange.fibeProgramId () === '24d8kVRSuEy4onKWSfvSUutDbXnSgdoPYMGqMwTQ1aRU', 'Fibe program id mismatch');
    assert (exchange.fibeNormalizeMarginMode ('createOrder', 'CROSS') === 'cross', 'Fibe margin mode normalization mismatch');
    assert (exchange.fibeValidateU8Param ('test', 'value', '255') === 255, 'Fibe u8 validation mismatch');
    let badRequest = false;
    try {
        exchange.fibeValidateU8Param ('test', 'value', null);
    } catch (error) {
        const message = exchange.exceptionMessage (error, false);
        badRequest = message.indexOf ('BadRequest') >= 0;
    }
    assert (badRequest, 'Fibe invalid u8 must throw BadRequest');
    assert (exchange.encodeCreateOrderTimeInForce ('po', true) === 'ALO', 'Fibe time in force normalization mismatch');
    assert (exchange.solanaParsePrivateKeyHex (secretKeyHex, walletAddress) === privateKeyHex, 'Fibe private key parsing mismatch');
    assert (exchange.fibeGetDexConfigPda () === 'FXUc9jZQtLjxo6YDLxVpg5JAQhN1ikFWDgMvwxisdrmH', 'Fibe dex config PDA mismatch');
    assert (exchange.fibeGetUserStatePda (walletAddress) === '6s6wMnMKhn3SUtK1KzZhVsrZrjhzzCTqANc2BjsHJxYk', 'Fibe user state PDA mismatch');
    assert (exchange.fibeGetSubAccountStatePda (walletAddress, 0) === 'ECtnkcCzY2zWFmK6F3r8qLjyvMtRNpq8aMxvfL11PJWE', 'Fibe spot subaccount PDA mismatch');
    assert (exchange.fibeGetSubAccountStatePda (walletAddress, 2) === 'HT9YkCUsk7nYj51JeiDPYMbXBr7WAmFJy7C1KxZfiScP', 'Fibe perp subaccount PDA mismatch');
    assert (exchange.fibeGetUserMarginAccountPda (accountId, quoteTokenIndex) === 'GjiwBmLcvHmc26gbcY2jPby6GSp7ACeZjpyUL9vRDigW', 'Fibe margin PDA mismatch');

    const ownerBaseTokenAccount = exchange.solanaGetAssociatedTokenAddress (baseMint, walletAddress, tokenProgram);
    const ownerQuoteTokenAccount = exchange.solanaGetAssociatedTokenAddress (quoteMint, walletAddress, tokenProgram);
    const spotTickArray = exchange.fibeGetTickArrayPda ('S', '1', '17896');
    const perpTickArray = exchange.fibeGetTickArrayPda ('P', '1', '17901');
    const spotOpenOrders = exchange.fibeGetOpenOrdersPerMarketPda ('S', accountId, '1');
    const perpOpenOrders = exchange.fibeGetOpenOrdersPerMarketPda ('P', accountId, '1');
    assert (spotTickArray === 'BoAfJRRiibRL2AVWpUDUF8aurcisFsrtaaBRAzqsvSzm', 'Fibe spot tick array PDA mismatch');
    assert (perpTickArray === 'PkTBcR2aGiHB532pQWuW9U34Gce1ykTCXES1BqAZMWm', 'Fibe perp tick array PDA mismatch');
    assert (spotOpenOrders === 'AZYuug49p6ejoEoKHsgdwUmNdfv8puUBheJY6YXC8NS', 'Fibe spot open orders PDA mismatch');
    assert (perpOpenOrders === 'BfsW5SMQzfx4D97xaUkF4m6Rk2W7krhaUsYzqJhktJNq', 'Fibe perp open orders PDA mismatch');

    const initUser = exchange.fibeInitUserIx (walletAddress, 0);
    assert (initUser['data'] === '1000000000000000000000cde2c193eb2fd652d5ccceb8347e4b246df2f6cf412df506c3c51a14b997f7', 'Fibe init user data mismatch');

    const spotCreateIx = exchange.fibeSpotPlaceOrderIx ({
        'owner': walletAddress,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 0),
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'openOrdersPerMarket': spotOpenOrders,
        'ownerBaseTokenAccount': ownerBaseTokenAccount,
        'ownerQuoteTokenAccount': ownerQuoteTokenAccount,
        'market': spotMarket,
        'tokenVaultBase': exchange.fibeGetSpotMarketVaultPda ('1', baseMint),
        'tokenVaultQuote': exchange.fibeGetSpotMarketVaultPda ('1', quoteMint),
        'hfmmRegistry': exchange.fibeGetHfmmRegistryPda ('S', '1'),
        'tokenMintBase': baseMint,
        'tokenMintQuote': quoteMint,
        'tokenProgramBase': tokenProgram,
        'tokenProgramQuote': tokenProgram,
        'priceInTicks': '17896',
        'orderId': '123456789',
        'side': 'B',
        'sizeInBase': '2000',
        'timeInForce': 'GTC',
        'tickArray': spotTickArray,
        'tickArrays': [ spotTickArray ],
    });
    assert (spotCreateIx['data'] === '3900000000000000e84500000000000015cd5b07000000000001d007000000000000000000', 'Fibe spot create data mismatch');
    const spotCreate = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, [ spotCreateIx ]);
    assert (spotCreate['signature'] === '4bfajjHJo9GU8oBwPHsasfMu63EB5MrjAL6Eap6soW2VWmNJvWvtZomLvqUFtXDm3UU8dWzAL8L78rTEa58sWuvr', 'Fibe spot create transaction mismatch');

    const spotOpenOrdersAccount = 'IwAAAAAAAAAqAAAAAAAAAAEAAAAAAAAAAQAAAAAAAAAAAAAAAQAAABXNWwcAAAAAAPFTZQAAAADoRQAAAAAAAAwAAAAAAQAABwAAAAAAAADQBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const spotPriceInTicks = exchange.fibeReadOpenOrderPriceInTicks (exchange.base64ToBinary (spotOpenOrdersAccount), 'S', '123456789');
    assert (spotPriceInTicks === '17896', 'Fibe spot open order decoding mismatch');

    const spotCancelIx = exchange.fibeSpotCloseRestingOrderIx ({
        'owner': walletAddress,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 0),
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'openOrdersPerMarket': spotOpenOrders,
        'tickArray': exchange.fibeGetTickArrayPda ('S', '1', spotPriceInTicks),
        'ownerBaseTokenAccount': ownerBaseTokenAccount,
        'ownerQuoteTokenAccount': ownerQuoteTokenAccount,
        'market': spotMarket,
        'tokenVaultBase': exchange.fibeGetSpotMarketVaultPda ('1', baseMint),
        'tokenVaultQuote': exchange.fibeGetSpotMarketVaultPda ('1', quoteMint),
        'tokenMintBase': baseMint,
        'tokenMintQuote': quoteMint,
        'tokenProgramBase': tokenProgram,
        'tokenProgramQuote': tokenProgram,
        'orderId': '123456789',
    });
    assert (spotCancelIx['data'] === '3a0000000000000015cd5b0700000000', 'Fibe spot cancel data mismatch');
    const spotCancel = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, [ spotCancelIx ]);
    assert (spotCancel['signature'] === '3mJce4wnaYXU4vUp4TzuVPyMXvEhJUXitryghMnU3MxKBdrFgDJBsc1EpUcYDUXfatG8kXcbkyCbwAaSmd4PY6Aj', 'Fibe spot cancel transaction mismatch');

    const perpCreateIx = exchange.fibePerpPlaceOrderIx ({
        'ownerOrDelegate': walletAddress,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 2),
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'ownerMarginAccount': exchange.fibeGetUserMarginAccountPda (accountId, quoteTokenIndex),
        'openOrdersPerMarket': perpOpenOrders,
        'market': perpMarket,
        'perpControlParams': exchange.fibeGetPerpControlParamsPda (quoteTokenIndex),
        'hfmmMarginAccounts': exchange.fibeGetHfmmMarginAccountsPda (quoteTokenIndex),
        'hfmmRegistry': exchange.fibeGetHfmmRegistryPda ('P', '1'),
        'priceInTicks': '17901',
        'orderId': '223456789',
        'side': 'A',
        'isCrossMargin': false,
        'initialLeverage': 5,
        'sizeInBase': '3000',
        'timeInForce': 'FOK',
        'tickArray': perpTickArray,
        'tickArrays': [ perpTickArray ],
    });
    assert (perpCreateIx['data'] === '8700000000000000ed4500000000000015ae510d000000000100010501b80b000000000000000300', 'Fibe perp create data mismatch');
    const perpCreate = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, [ perpCreateIx ]);
    assert (perpCreate['signature'] === '236BGiVx8WQ27RGuukKDbYfjD9oYJuRb8RTxU8c8JEcRdbnyfMp6q1Q34PivfjrAAxPpQrFRmi72dDwqLWAeJ3sJ', 'Fibe perp create transaction mismatch');

    const perpOpenOrdersAccount = 'RAAAAAAAAAAqAAAAAAAAAAEAAAAAAAAAAQAAAAAAAAAAAAAAAQAAABWuUQ0AAAAAAfFTZQAAAADtRQAAAAAAAA0AAAAA/wMACAAAAAAAAAC4CwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
    const perpPriceInTicks = exchange.fibeReadOpenOrderPriceInTicks (exchange.base64ToBinary (perpOpenOrdersAccount), 'P', '223456789');
    assert (perpPriceInTicks === '17901', 'Fibe perp open order decoding mismatch');

    const perpCancelIx = exchange.fibePerpCloseRestingOrderIx ({
        'market': perpMarket,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 2),
        'ownerOrDelegate': walletAddress,
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'ownerMarginAccount': exchange.fibeGetUserMarginAccountPda (accountId, quoteTokenIndex),
        'openOrdersPerMarket': perpOpenOrders,
        'perpControlParams': exchange.fibeGetPerpControlParamsPda (quoteTokenIndex),
        'tickArray': exchange.fibeGetTickArrayPda ('P', '1', perpPriceInTicks),
        'orderId': '223456789',
    });
    assert (perpCancelIx['data'] === '880000000000000015ae510d0000000000', 'Fibe perp cancel data mismatch');
    const perpCancel = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, [ perpCancelIx ]);
    assert (perpCancel['signature'] === '2KyaP5RgBCr4B2GhHZ5LYg6ZyoCreFDrPVo4tjviBPHhW9EA55F8BSz8HuFjYNZgY6nTLRzASuFryZDcvMPwXKFA', 'Fibe perp cancel transaction mismatch');
}

export default testFibeTransactionVectors;
