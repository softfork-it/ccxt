// AUTO_TRANSPILE_ENABLED
import assert from 'assert';
import ccxt from '../../../ccxt.js';

// Frozen from SDK/server parity checks; do not regenerate these vectors with CCXT helpers.
function testFibeTransactionVectors () {
    const walletAddress = 'bNMBfVAEjgxhNruYTR2vSZ92UdVKP2pdZewEG7978Vt';
    const privateKeyHex = '53044db873cead13a10478acd042f15541f041d90dc3d90223c30da52ced2522';
    const blockhash = '9zp3GFAJpCL3LkizPusx3BFrxdnK47hYmZCypWvkKUT7';
    const tokenProgram = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const baseMint = '22HX2NvQeuid5EUenvRtZtSN4i4wtjqGwqAyN5RJ7zHw';
    const quoteMint = 'EM7eDa1KFZeKddqizAWur7yMJytKASPtoQmZxSDNYcKR';
    const spotMarket = 'Cwz8UtKVh4sAVQnHdeZFB3dDJfVE7Wd8idDV3Ux466dX';
    const perpMarket = '8MEW7FcjkaoagB3oy8JyP4xidgSZnb7yHgbWHDsC5zSW';
    const spotTickArray = '4fFJyphLe6tPCzEiVBxESwYSRBumJ4W76srcYs6Tj5Cn';
    const perpTickArray = 'FB6JhTAfMddLKqPhiUjcpfnmbfMJXTMST81CxmUTtMqn';
    const spotOpenOrdersAccount = 'IwAAAAAAAAABAAAAAAAAAAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3AAABAAAAAAAAAAAAAQAAAAEAAAAAAAAACM3iwZPrL9ZS1czOuDR+SyRt8vbPQS31BsPFGhS5l/cVzVsHAAAAAAAAAAAAAAAA6EUAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
    const perpOpenOrdersAccount = 'RAAAAAAAAAABAAAAAAAAAAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3AgABAAAAAAAAAAAAAQAAAAEAAAAAAAAACM3iwZPrL9ZS1czOuDR+SyRt8vbPQS31BsPFGhS5l/cVrlENAAAAAAAAAAAAAAAA7UUAAAAAAAAAAAIDBQH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const exchange = new ccxt.fibe ({});
    const ownerBaseTokenAccount = exchange.solanaGetAssociatedTokenAddress (baseMint, walletAddress, tokenProgram);
    const ownerQuoteTokenAccount = exchange.solanaGetAssociatedTokenAddress (quoteMint, walletAddress, tokenProgram);

    const spotCreateIx = exchange.fibeSpotPlaceOrderIx ({
        'owner': walletAddress,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 0),
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'openOrdersPerMarket': exchange.fibeGetOpenOrdersPerMarketPda ('S', walletAddress, 0, '1'),
        'ownerBaseTokenAccount': ownerBaseTokenAccount,
        'ownerQuoteTokenAccount': ownerQuoteTokenAccount,
        'market': spotMarket,
        'tokenVaultBase': exchange.fibeGetSpotMarketVaultPda ('1', baseMint),
        'tokenVaultQuote': exchange.fibeGetSpotMarketVaultPda ('1', quoteMint),
        'vaultAuthority': exchange.fibeGetVaultAuthorityPda (),
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
        'tickArray': exchange.fibeGetTickArrayPda ('S', '1', '17896'),
        'tickArrays': [ spotTickArray ],
    });
    const createBaseAtaIx = exchange.solanaCreateAssociatedTokenAccountIx (walletAddress, ownerBaseTokenAccount, walletAddress, baseMint, tokenProgram);
    const spotCreateIxs = exchange.solanaAddComputeBudgetIxs ([ createBaseAtaIx, spotCreateIx ], {
        'computeUnitLimit': 300000,
        'computeUnitPriceMicroLamports': '1000',
    });
    const spotCreate = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, spotCreateIxs);
    const expectedSpotCreate = 'AeQG8ha1P2QWAYMqY8FDJfHwiHNMXs8b2g1kyfkne8IK585jYNvJEvVV0CLIsFguTHBDNxQuN6tuj497i6xQmwyAAQAIEwjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Cu+IiCyHL9TsAO8LaSegv5xcToPZ+mpLMMKDAtfD/BAerFct1WxVWud03Z35MMfSY8+rWlSE9TWEDsRs+MVpCjU4nkY/TZB1ZOUePtKm1zZFeUFCEuO1ndWAYs2x4kKcNl9P18wbYxTK0Ttr6YBo88WzPxSAWa6paHqJIPOe7Is5wvXd2bSFg3YwKqrw1VQem3cjRRI1Bs+toGsUJ1VzLjrMtoXvhOVc4qIh5vP+xzYd8Koobhy/Hazk8wUPBQcDqaz+qAc98EXEKwGE0fDO+DKOQO8lhLd04MoLwN/nUwixhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEuIyVp1UYzA9WH4ifFh5m5AsPlPep8muvZ6mgqfeFAx770ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALu33okwNZ/pDc81WvtG6d6cKb6nPUX7FC4ZkOiJOZdAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQ8v8b3Wih/RPp8/hiIj7cGKy6E2NEoVByQzZkGIMopaNFAwFtLkaIGp+Tf9aOXhzy+jVDh1RutlbiFkwcQp+IGMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WcZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKAhazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYEDQAFAuCTBAANAAkD6AMAAAAAAAARBgAHAA8LDgEAEBYLAAkGARAQEBAQBwoIBQMMAg8SDg4EJTgAAAAAAAAA6EUAAAAAAAAVzVsHAAAAAAAB0AcAAAAAAAAAAAAA';
    assert (spotCreate['transaction'] === expectedSpotCreate, 'Fibe spot create transaction vector mismatch');

    const spotPriceInTicks = exchange.fibeReadOpenOrderPriceInTicks (exchange.base64ToBinary (spotOpenOrdersAccount), 'S', '123456789');
    const spotCancelIx = exchange.fibeSpotCloseRestingOrderIx ({
        'market': spotMarket,
        'owner': walletAddress,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 0),
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'openOrdersPerMarket': exchange.fibeGetOpenOrdersPerMarketPda ('S', walletAddress, 0, '1'),
        'tickArray': exchange.fibeGetTickArrayPda ('S', '1', spotPriceInTicks),
        'ownerBaseTokenAccount': ownerBaseTokenAccount,
        'ownerQuoteTokenAccount': ownerQuoteTokenAccount,
        'tokenVaultBase': exchange.fibeGetSpotMarketVaultPda ('1', baseMint),
        'tokenVaultQuote': exchange.fibeGetSpotMarketVaultPda ('1', quoteMint),
        'vaultAuthority': exchange.fibeGetVaultAuthorityPda (),
        'tokenMintBase': baseMint,
        'tokenMintQuote': quoteMint,
        'tokenProgramBase': tokenProgram,
        'tokenProgramQuote': tokenProgram,
        'orderId': '123456789',
    });
    const spotCancelIxs = exchange.solanaAddComputeBudgetIxs ([ spotCancelIx ], {
        'computeUnitLimit': 300000,
        'computeUnitPriceMicroLamports': '1000',
    });
    const spotCancel = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, spotCancelIxs);
    const expectedSpotCancel = 'AeupOig4kHOP9mHVwo2psL+QQRdvwiBVoYWPp/eHTFfjD7wTtGMJIaFw3KOPWuIYm0ZQGjMEuYulMpoxtIW0dACAAQAGEAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Cu+IiCyHL9TsAO8LaSegv5xcToPZ+mpLMMKDAtfD/BA1OJ5GP02QdWTlHj7Sptc2RXlBQhLjtZ3VgGLNseJCnDnC9d3ZtIWDdjAqqvDVVB6bdyNFEjUGz62gaxQnVXMuOsy2he+E5VzioiHm8/7HNh3wqihuHL8drOTzBQ8FBwOYBU6uaLNPfYbFPYYWMgxyoymODQlrjgW6w7/mRVb/Tams/qgHPfBFxCsBhNHwzvgyjkDvJYS3dODKC8Df51MIsYaEDO0Mx1xoHoZ/mgJz5uoABk/B0WHY5AU8hTnuExLiMladVGMwPVh+InxYeZuQLD5T3qfJrr2epoKn3hQMe+9LnL70l9RUEAAtb51QBBb1Xyd98c8V1FCnmcAy3V9HAu7feiTA1n+kNzzVa+0bp3pwpvqc9RfsULhmQ6Ik5l0DBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpDy/xvdaKH9E+nz+GIiPtwYrLoTY0ShUHJDNmQYgyilo0UDAW0uRogan5N/1o5eHPL6NUOHVG62VuIWTBxCn4gcZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKAhazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYDCwAFAuCTBAALAAkD6AMAAAAAAAAODwcACAQBBQYJAwIKDQ8MDBA5AAAAAAAAABXNWwcAAAAAAA==';
    assert (spotCancel['transaction'] === expectedSpotCancel, 'Fibe spot cancel transaction vector mismatch');

    const perpCreateIx = exchange.fibePerpPlaceOrderIx ({
        'owner': walletAddress,
        'ownerOrDelegate': walletAddress,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 2),
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'ownerMarginAccount': exchange.fibeGetUserMarginAccountPda (walletAddress, 2, quoteMint),
        'openOrdersPerMarket': exchange.fibeGetOpenOrdersPerMarketPda ('P', walletAddress, 2, '1'),
        'ownerOrDelegateQuoteTokenAccount': ownerQuoteTokenAccount,
        'market': perpMarket,
        'perpControlParams': exchange.fibeGetPerpControlParamsPda (quoteMint),
        'hfmmMarginAccounts': exchange.fibeGetHfmmMarginAccountsPda (quoteMint),
        'tokenVaultQuote': exchange.fibeGetPerpMarketVaultPda (quoteMint),
        'vaultAuthority': exchange.fibeGetVaultAuthorityPda (),
        'hfmmRegistry': exchange.fibeGetHfmmRegistryPda ('P', '1'),
        'tokenMintQuote': quoteMint,
        'tokenProgramQuote': tokenProgram,
        'priceInTicks': '17901',
        'orderId': '223456789',
        'side': 'A',
        'isCrossMargin': false,
        'autoTopUpCollateralFromWallet': true,
        'initialLeverage': 5,
        'sizeInBase': '3000',
        'timeInForce': 'FOK',
        'tickArray': exchange.fibeGetTickArrayPda ('P', '1', '17901'),
        'tickArrays': [ perpTickArray ],
    });
    const createQuoteAtaIx = exchange.solanaCreateAssociatedTokenAccountIx (walletAddress, ownerQuoteTokenAccount, walletAddress, quoteMint, tokenProgram);
    const perpCreateIxs = exchange.solanaAddComputeBudgetIxs ([ createQuoteAtaIx, perpCreateIx ], {
        'computeUnitLimit': 400000,
    });
    const perpCreate = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, perpCreateIxs);
    const expectedPerpCreate = 'ARnsVR2n+LXijYYXhSt81/HLX4JkQYz5wK2U/kQhqIpXol1grhSv6yjtYrIk6HT+/K2gQzUpjvNHhNEZYGonegyAAQAHEwjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3GcMdJO8FT20s4l7r3pC1jf3LAy7c0AAMzOxvvmAb3Cw6zLaF74TlXOKiIebz/sc2HfCqKG4cvx2s5PMFDwUHA1KcOX044OXbNGyoEaw3MdZzQMd/srSDkOyIj6Qf144JYTDT3Nxp/h8R8FNu4Thg4Vqqm9WSV0usrHpFc09uO+9hqedSu83egfVETEL5KC06Y5MYR6PL+XZ413S1nKsO020wsPbPyONS6Kb5g/unF3fCc+JgPx39v9Jq6aRfsGRb0UQ3hQfkoteJPDRgKVssWCVEdD4ZIBBZ5rUuA96d6KDSmWxwNljdfi+yRpSq0Xqs6aV1MiJPl+LKrm5rQGhe1d1kG59a8j5SyQv+uFsexwSKldRce0GfqYRGoJS0OHHs53FnLNFjTFE0RRKmNQk2cxjCgnR8h8YCQ3QuXRJHFE3vS5y+9JfUVBAALW+dUAQW9V8nffHPFdRQp5nAMt1fRwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAu7feiTA1n+kNzzVa+0bp3pwpvqc9RfsULhmQ6Ik5l0DBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpNFAwFtLkaIGp+Tf9aOXhzy+jVDh1RutlbiFkwcQp+IGMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WcZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKAhazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYDDgAFAoAaBgARBgALABIMDwEAEBUMBgoAAgkHCxAQEBAQBQEDDQQSDwgphgAAAAAAAADtRQAAAAAAABWuUQ0AAAAAAQABAQUBuAsAAAAAAAAAAwAA';
    assert (perpCreate['transaction'] === expectedPerpCreate, 'Fibe perp create transaction vector mismatch');

    const perpPriceInTicks = exchange.fibeReadOpenOrderPriceInTicks (exchange.base64ToBinary (perpOpenOrdersAccount), 'P', '223456789');
    const perpCancelIx = exchange.fibePerpCloseRestingOrderIx ({
        'market': perpMarket,
        'ownerSubAccountState': exchange.fibeGetSubAccountStatePda (walletAddress, 2),
        'ownerOrDelegate': walletAddress,
        'ownerState': exchange.fibeGetUserStatePda (walletAddress),
        'ownerMarginAccount': exchange.fibeGetUserMarginAccountPda (walletAddress, 2, quoteMint),
        'openOrdersPerMarket': exchange.fibeGetOpenOrdersPerMarketPda ('P', walletAddress, 2, '1'),
        'perpControlParams': exchange.fibeGetPerpControlParamsPda (quoteMint),
        'tokenVaultQuote': exchange.fibeGetPerpMarketVaultPda (quoteMint),
        'vaultAuthority': exchange.fibeGetVaultAuthorityPda (),
        'tickArray': exchange.fibeGetTickArrayPda ('P', '1', perpPriceInTicks),
        'orderId': '223456789',
    });
    const perpCancelIxs = exchange.solanaAddComputeBudgetIxs ([ perpCancelIx ], {
        'computeUnitLimit': 400000,
    });
    const perpCancel = exchange.solanaSignTransaction (walletAddress, privateKeyHex, blockhash, perpCancelIxs);
    const expectedPerpCancel = 'AaLQl9kR4o5Wr15B8dh1ZYwB0hBdRRRjAWvQo/RwfJF8kHh2y+s+yo/Ygb7B758MfejTriMtZt3eomO/ZQWV2QyAAQAEDAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Osy2he+E5VzioiHm8/7HNh3wqihuHL8drOTzBQ8FBwNSnDl9OODl2zRsqBGsNzHWc0DHf7K0g5DsiI+kH9eOCW0wsPbPyONS6Kb5g/unF3fCc+JgPx39v9Jq6aRfsGRbcN2tZbxCBtzm6Gaj97NC0XH4A8quWE+6HPKJ8neIDFrRRDeFB+Si14k8NGApWyxYJUR0PhkgEFnmtS4D3p3ooN1kG59a8j5SyQv+uFsexwSKldRce0GfqYRGoJS0OHHs53FnLNFjTFE0RRKmNQk2cxjCgnR8h8YCQ3QuXRJHFE0C7t96JMDWf6Q3PNVr7RunenCm+pz1F+xQuGZDoiTmXQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAANFAwFtLkaIGp+Tf9aOXhzy+jVDh1RutlbiFkwcQp+IFhqedSu83egfVETEL5KC06Y5MYR6PL+XZ413S1nKsO04Wsyej5M16tAr2F7cmXtYV5hzm6BAOfGz/aX8ZltJQWAgkABQKAGgYACgoDBwABBgULAggEEYcAAAAAAAAAFa5RDQAAAAAAAA==';
    assert (perpCancel['transaction'] === expectedPerpCancel, 'Fibe perp cancel transaction vector mismatch');
}

export default testFibeTransactionVectors;
