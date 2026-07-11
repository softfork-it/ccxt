// NO_AUTO_TRANSPILE
import assert from 'assert';
import fibe from '../../fibe.js';

const testPrivateKey = '2fGURdTtScQVocLdZovb6kJ3V8TmWe3eg5TJpYAqrTRTqYf27goDdQVfMx4W2uUmTwTc78qxsxhhvrdx7MTd55rn';
const testPrivateKeyHex = '53044db873cead13a10478acd042f15541f041d90dc3d90223c30da52ced252208cde2c193eb2fd652d5ccceb8347e4b246df2f6cf412df506c3c51a14b997f7';
const testPrivateKeyJson = '[83,4,77,184,115,206,173,19,161,4,120,172,208,66,241,85,65,240,65,217,13,195,217,2,35,195,13,165,44,237,37,34,8,205,226,193,147,235,47,214,82,213,204,206,184,52,126,75,36,109,242,246,207,65,45,245,6,195,197,26,20,185,151,247]';
const walletAddress = 'bNMBfVAEjgxhNruYTR2vSZ92UdVKP2pdZewEG7978Vt';
const blockhash = '9zp3GFAJpCL3LkizPusx3BFrxdnK47hYmZCypWvkKUT7';
const rpcUrl = 'https://api.devnet.solana.com';
const tokenProgram = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const spotTickArray = '4fFJyphLe6tPCzEiVBxESwYSRBumJ4W76srcYs6Tj5Cn';
const perpTickArray = 'FB6JhTAfMddLKqPhiUjcpfnmbfMJXTMST81CxmUTtMqn';
// Encoded once with the TS SDK codecs; do not regenerate these with CCXT helpers.
const spotOpenOrdersAccount = 'IwAAAAAAAAABAAAAAAAAAAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3AAABAAAAAAAAAAAAAQAAAAEAAAAAAAAACM3iwZPrL9ZS1czOuDR+SyRt8vbPQS31BsPFGhS5l/cVzVsHAAAAAAAAAAAAAAAA6EUAAAAAAAAAAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
const perpOpenOrdersAccount = 'RAAAAAAAAAABAAAAAAAAAAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3AgABAAAAAAAAAAAAAQAAAAEAAAAAAAAACM3iwZPrL9ZS1czOuDR+SyRt8vbPQS31BsPFGhS5l/cVrlENAAAAAAAAAAAAAAAA7UUAAAAAAAAAAAIDBQH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

const expectedPdas = {
    'userState': '4xXhMEGgMMQMr3VcYXANJhPUKhjNN8gTz35udhLZ7BkE',
    'spotSubAccountState': 'GDyfEU3rHTGJr8t9S7Qt5BWCVAyR7raWbHCipWZcjFEJ',
    'perpSubAccountState': 'GaTUQ91A6qUb73xTWAWo3Dbtk3YCWG7kKeySaRdFFkAg',
    'spotOpenOrders': 'jgvSpHAPaMZ6u6jQY5JFXuvNemCyfaorgbaj7kovYd5',
    'perpOpenOrders': 'F5tYLAnjCxHuBuuFR1resos1pbSxstChUVFCFQ1P3pjH',
    'perpMarginAccount': 'FuDdxLcaAQZZMng7LtVXHqtzCrDbb93R7QegE5Pbymf1',
    'spotTickArray': 'BERfWP161GaeF6wcY1ADkzHMonjDbAWfMehsT2Ld44qi',
    'perpTickArray': '8baiTGtSFdKJm9LmNQ2nUKuQR8QXoJy6yKDqDKmtuNch',
};

// Expected by solana_pubkey::bytes_are_curve_point; hash vectors use SHA-256("fibe-curve-vector-N").
const curvePointVectors = [
    { 'name': 'Ed25519 basepoint', 'hex': '5866666666666666666666666666666666666666666666666666666666666666', 'onCurve': true },
    { 'name': 'identity', 'hex': '01' + '00'.repeat (31), 'onCurve': true },
    { 'name': 'negative-zero identity', 'hex': '01' + '00'.repeat (30) + '80', 'onCurve': true },
    { 'name': 'non-canonical field element p', 'hex': 'ed' + 'ff'.repeat (30) + '7f', 'onCurve': true },
    { 'name': 'hash 0', 'hex': 'dc1a9fa1f50923c39ba07cac584f39edadac97f4c2f9da07f361be6d63f9c79a', 'onCurve': false },
    { 'name': 'hash 1', 'hex': 'f6c94dcd7ed588518da78b58ead7dafbe2b2835e7af84f47a4eefb24b705f102', 'onCurve': false },
    { 'name': 'hash 5', 'hex': '544e9e41211a6c230b638598b26fdb7874bd5390ee16c59d0b304f61f37256e3', 'onCurve': true },
    { 'name': 'hash 13', 'hex': '9347d96440a488e810b172703a565ce7f4445b7a07dee886188dd030e06b4683', 'onCurve': true },
];

const rawMarkets = [
    {
        'marketPubkey': 'Cwz8UtKVh4sAVQnHdeZFB3dDJfVE7Wd8idDV3Ux466dX',
        'mi': '1',
        'baseMint': '22HX2NvQeuid5EUenvRtZtSN4i4wtjqGwqAyN5RJ7zHw',
        'baseDecimals': 8,
        'quoteMint': 'EM7eDa1KFZeKddqizAWur7yMJytKASPtoQmZxSDNYcKR',
        'quoteDecimals': 6,
        'sizeDecimals': 5,
        'priceDecimals': 1,
        'symbol': 'ETH/USDC',
        'tickSizeInQuoteBaseUnits': 100000,
        'lotSizeInBaseBaseUnits': 1000,
        'mt': 'S',
    },
    {
        'marketPubkey': '8MEW7FcjkaoagB3oy8JyP4xidgSZnb7yHgbWHDsC5zSW',
        'mi': '1',
        'baseMint': '22HX2NvQeuid5EUenvRtZtSN4i4wtjqGwqAyN5RJ7zHw',
        'baseDecimals': 8,
        'quoteMint': 'EM7eDa1KFZeKddqizAWur7yMJytKASPtoQmZxSDNYcKR',
        'quoteDecimals': 6,
        'sizeDecimals': 5,
        'priceDecimals': 1,
        'symbol': 'ETH-USDC',
        'tickSizeInQuoteBaseUnits': 100000,
        'lotSizeInBaseBaseUnits': 1000,
        'mt': 'P',
    },
];

// Reference transactions retained from SDK/Fibone parity verification.
const expectedTransactions = {
    'spotCreate': 'AeQG8ha1P2QWAYMqY8FDJfHwiHNMXs8b2g1kyfkne8IK585jYNvJEvVV0CLIsFguTHBDNxQuN6tuj497i6xQmwyAAQAIEwjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Cu+IiCyHL9TsAO8LaSegv5xcToPZ+mpLMMKDAtfD/BAerFct1WxVWud03Z35MMfSY8+rWlSE9TWEDsRs+MVpCjU4nkY/TZB1ZOUePtKm1zZFeUFCEuO1ndWAYs2x4kKcNl9P18wbYxTK0Ttr6YBo88WzPxSAWa6paHqJIPOe7Is5wvXd2bSFg3YwKqrw1VQem3cjRRI1Bs+toGsUJ1VzLjrMtoXvhOVc4qIh5vP+xzYd8Koobhy/Hazk8wUPBQcDqaz+qAc98EXEKwGE0fDO+DKOQO8lhLd04MoLwN/nUwixhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEuIyVp1UYzA9WH4ifFh5m5AsPlPep8muvZ6mgqfeFAx770ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALu33okwNZ/pDc81WvtG6d6cKb6nPUX7FC4ZkOiJOZdAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQ8v8b3Wih/RPp8/hiIj7cGKy6E2NEoVByQzZkGIMopaNFAwFtLkaIGp+Tf9aOXhzy+jVDh1RutlbiFkwcQp+IGMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WcZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKAhazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYEDQAFAuCTBAANAAkD6AMAAAAAAAARBgAHAA8LDgEAEBYLAAkGARAQEBAQBwoIBQMMAg8SDg4EJTgAAAAAAAAA6EUAAAAAAAAVzVsHAAAAAAAB0AcAAAAAAAAAAAAA',
    'spotMarketCreate': 'AVHS2BCjeylp2vth2ZCraQFJkVEnpjXt1U6Ui77RrEJN9UEtB8QdXie9wU+XQWp/jYooIyKiZeknuClFI5SbGQGAAQAIEwjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Cu+IiCyHL9TsAO8LaSegv5xcToPZ+mpLMMKDAtfD/BAerFct1WxVWud03Z35MMfSY8+rWlSE9TWEDsRs+MVpCjU4nkY/TZB1ZOUePtKm1zZFeUFCEuO1ndWAYs2x4kKcNl9P18wbYxTK0Ttr6YBo88WzPxSAWa6paHqJIPOe7Is5wvXd2bSFg3YwKqrw1VQem3cjRRI1Bs+toGsUJ1VzLjrMtoXvhOVc4qIh5vP+xzYd8Koobhy/Hazk8wUPBQcDqaz+qAc98EXEKwGE0fDO+DKOQO8lhLd04MoLwN/nUwixhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEuIyVp1UYzA9WH4ifFh5m5AsPlPep8muvZ6mgqfeFAx770ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALu33okwNZ/pDc81WvtG6d6cKb6nPUX7FC4ZkOiJOZdAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAAAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQ8v8b3Wih/RPp8/hiIj7cGKy6E2NEoVByQzZkGIMopaNFAwFtLkaIGp+Tf9aOXhzy+jVDh1RutlbiFkwcQp+IGMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WcZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKAhazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYEDQAFAuCTBAANAAkD6AMAAAAAAAARBgAHAA8LDgEAEBYLAAkGARAQEBAQBwoIBQMMAg8SDg4EJTgAAAAAAAAAZkkAAAAAAAAVj0cTAAAAAAAB0AcAAAAAAAAAAQAA',
    'spotMarketCreateFromMid': 'ARwt/LfeClC1HVsD/5n2rIew5R/yUQl7RHXlYOtMRdixmWe/dkoD6l5e0V1mNQTFOA3kc2/aDDeGZXrGxjFEeAKAAQAHEgjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Cu+IiCyHL9TsAO8LaSegv5xcToPZ+mpLMMKDAtfD/BAerFct1WxVWud03Z35MMfSY8+rWlSE9TWEDsRs+MVpCjU4nkY/TZB1ZOUePtKm1zZFeUFCEuO1ndWAYs2x4kKcNl9P18wbYxTK0Ttr6YBo88WzPxSAWa6paHqJIPOe7Is5wvXd2bSFg3YwKqrw1VQem3cjRRI1Bs+toGsUJ1VzLjrMtoXvhOVc4qIh5vP+xzYd8Koobhy/Hazk8wUPBQcDqaz+qAc98EXEKwGE0fDO+DKOQO8lhLd04MoLwN/nUwixhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEuIyVp1UYzA9WH4ifFh5m5AsPlPep8muvZ6mgqfeFAx770ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALu33okwNZ/pDc81WvtG6d6cKb6nPUX7FC4ZkOiJOZdBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkPL/G91oof0T6fP4YiI+3BisuhNjRKFQckM2ZBiDKKWjRQMBbS5GiBqfk3/Wjl4c8vo1Q4dUbrZW4hZMHEKfiBjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FnGTw5UytIRaGytEtMgQM1yHQnHteUuX6M0MSGAnYnigIWsyej5M16tAr2F7cmXtYV5hzm6BAOfGz/aX8ZltJQWAhAGAAoAEQsNAQAPFgsACQYBDw8PDw8HCggFAwwCDhENDQQlOAAAAAAAAABqQgAAAAAAABaPRxMAAAAAAQHQBwAAAAAAAAABAAA=',
    'spotCreateMultiTickArrays': 'AcGWZPe/j3JbCPuI2nEvt88WXIJyxOpTqP7R62FlvN6j9VN5YWzzA+upCspSXye7izOx+Et/tb/7yHOAP91K+QqAAQAIFQjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Cu+IiCyHL9TsAO8LaSegv5xcToPZ+mpLMMKDAtfD/BAOWR2LDDBqYKTBa3mUNm15d5inRalUDGeperc0MluPzR6sVy3VbFVa53Tdnfkwx9Jjz6taVIT1NYQOxGz4xWkKNTieRj9NkHVk5R4+0qbXNkV5QUIS47Wd1YBizbHiQpw5wvXd2bSFg3YwKqrw1VQem3cjRRI1Bs+toGsUJ1VzLjrMtoXvhOVc4qIh5vP+xzYd8Koobhy/Hazk8wUPBQcDTeuPs0v+LdMwdVMswV7eDvQmfZNkGO/Hb+Q1oasQ73CYBU6uaLNPfYbFPYYWMgxyoymODQlrjgW6w7/mRVb/Tams/qgHPfBFxCsBhNHwzvgyjkDvJYS3dODKC8Df51MIsYaEDO0Mx1xoHoZ/mgJz5uoABk/B0WHY5AU8hTnuExLiMladVGMwPVh+InxYeZuQLD5T3qfJrr2epoKn3hQMe+9LnL70l9RUEAAtb51QBBb1Xyd98c8V1FCnmcAy3V9HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC7t96JMDWf6Q3PNVr7RunenCm+pz1F+xQuGZDoiTmXQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkPL/G91oof0T6fP4YiI+3BisuhNjRKFQckM2ZBiDKKWjRQMBbS5GiBqfk3/Wjl4c8vo1Q4dUbrZW4hZMHEKfiBjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+FnGTw5UytIRaGytEtMgQM1yHQnHteUuX6M0MSGAnYnigIWsyej5M16tAr2F7cmXtYV5hzm6BAOfGz/aX8ZltJQWBA8ABQLgkwQADwAJA+gDAAAAAAAAEwYACQARDRABABIYDQALBgESEhISEgkMCgUEDgMRFBAQBwIIJTgAAAAAAAAA6EUAAAAAAAAVzVsHAAAAAAAB0AcAAAAAAAAAAAAA',
    'spotCancel': 'AeupOig4kHOP9mHVwo2psL+QQRdvwiBVoYWPp/eHTFfjD7wTtGMJIaFw3KOPWuIYm0ZQGjMEuYulMpoxtIW0dACAAQAGEAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Cu+IiCyHL9TsAO8LaSegv5xcToPZ+mpLMMKDAtfD/BA1OJ5GP02QdWTlHj7Sptc2RXlBQhLjtZ3VgGLNseJCnDnC9d3ZtIWDdjAqqvDVVB6bdyNFEjUGz62gaxQnVXMuOsy2he+E5VzioiHm8/7HNh3wqihuHL8drOTzBQ8FBwOYBU6uaLNPfYbFPYYWMgxyoymODQlrjgW6w7/mRVb/Tams/qgHPfBFxCsBhNHwzvgyjkDvJYS3dODKC8Df51MIsYaEDO0Mx1xoHoZ/mgJz5uoABk/B0WHY5AU8hTnuExLiMladVGMwPVh+InxYeZuQLD5T3qfJrr2epoKn3hQMe+9LnL70l9RUEAAtb51QBBb1Xyd98c8V1FCnmcAy3V9HAu7feiTA1n+kNzzVa+0bp3pwpvqc9RfsULhmQ6Ik5l0DBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpDy/xvdaKH9E+nz+GIiPtwYrLoTY0ShUHJDNmQYgyilo0UDAW0uRogan5N/1o5eHPL6NUOHVG62VuIWTBxCn4gcZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKAhazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYDCwAFAuCTBAALAAkD6AMAAAAAAAAODwcACAQBBQYJAwIKDQ8MDBA5AAAAAAAAABXNWwcAAAAAAA==',
    'perpCreate': 'ARnsVR2n+LXijYYXhSt81/HLX4JkQYz5wK2U/kQhqIpXol1grhSv6yjtYrIk6HT+/K2gQzUpjvNHhNEZYGonegyAAQAHEwjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3GcMdJO8FT20s4l7r3pC1jf3LAy7c0AAMzOxvvmAb3Cw6zLaF74TlXOKiIebz/sc2HfCqKG4cvx2s5PMFDwUHA1KcOX044OXbNGyoEaw3MdZzQMd/srSDkOyIj6Qf144JYTDT3Nxp/h8R8FNu4Thg4Vqqm9WSV0usrHpFc09uO+9hqedSu83egfVETEL5KC06Y5MYR6PL+XZ413S1nKsO020wsPbPyONS6Kb5g/unF3fCc+JgPx39v9Jq6aRfsGRb0UQ3hQfkoteJPDRgKVssWCVEdD4ZIBBZ5rUuA96d6KDSmWxwNljdfi+yRpSq0Xqs6aV1MiJPl+LKrm5rQGhe1d1kG59a8j5SyQv+uFsexwSKldRce0GfqYRGoJS0OHHs53FnLNFjTFE0RRKmNQk2cxjCgnR8h8YCQ3QuXRJHFE3vS5y+9JfUVBAALW+dUAQW9V8nffHPFdRQp5nAMt1fRwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAu7feiTA1n+kNzzVa+0bp3pwpvqc9RfsULhmQ6Ik5l0DBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCpNFAwFtLkaIGp+Tf9aOXhzy+jVDh1RutlbiFkwcQp+IGMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WcZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKAhazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYDDgAFAoAaBgARBgALABIMDwEAEBUMBgoAAgkHCxAQEBAQBQEDDQQSDwgphgAAAAAAAADtRQAAAAAAABWuUQ0AAAAAAQABAQUBuAsAAAAAAAAAAwAA',
    'perpCancel': 'AaLQl9kR4o5Wr15B8dh1ZYwB0hBdRRRjAWvQo/RwfJF8kHh2y+s+yo/Ygb7B758MfejTriMtZt3eomO/ZQWV2QyAAQAEDAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3Osy2he+E5VzioiHm8/7HNh3wqihuHL8drOTzBQ8FBwNSnDl9OODl2zRsqBGsNzHWc0DHf7K0g5DsiI+kH9eOCW0wsPbPyONS6Kb5g/unF3fCc+JgPx39v9Jq6aRfsGRbcN2tZbxCBtzm6Gaj97NC0XH4A8quWE+6HPKJ8neIDFrRRDeFB+Si14k8NGApWyxYJUR0PhkgEFnmtS4D3p3ooN1kG59a8j5SyQv+uFsexwSKldRce0GfqYRGoJS0OHHs53FnLNFjTFE0RRKmNQk2cxjCgnR8h8YCQ3QuXRJHFE0C7t96JMDWf6Q3PNVr7RunenCm+pz1F+xQuGZDoiTmXQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAANFAwFtLkaIGp+Tf9aOXhzy+jVDh1RutlbiFkwcQp+IFhqedSu83egfVETEL5KC06Y5MYR6PL+XZ413S1nKsO04Wsyej5M16tAr2F7cmXtYV5hzm6BAOfGz/aX8ZltJQWAgkABQKAGgYACgoDBwABBgULAggEEYcAAAAAAAAAFa5RDQAAAAAAAA==',
};

function createExchange (spotSubAccountExists = true) {
    const exchange: any = new fibe ({
        'walletAddress': walletAddress,
        'privateKey': testPrivateKey,
    });
    exchange.setMarkets (exchange.parseMarkets (rawMarkets));
    const accountDataByPubkey: { [key: string]: string } = {};
    accountDataByPubkey[expectedPdas['spotOpenOrders']] = spotOpenOrdersAccount;
    accountDataByPubkey[expectedPdas['perpOpenOrders']] = perpOpenOrdersAccount;
    const requests = [];
    exchange.solanaRpc = async (url, method, params) => {
        requests.push ({
            'url': url,
            'method': method,
            'params': params,
        });
        if (method === 'getAccountInfo') {
            const data = accountDataByPubkey[params[0]];
            if (data !== undefined) {
                return {
                    'value': {
                        'owner': exchange.fibeProgramId (),
                        'data': [ data, 'base64' ],
                    },
                };
            }
            if ((params[0] === expectedPdas['spotSubAccountState']) && spotSubAccountExists) {
                return {
                    'value': {
                        'owner': exchange.fibeProgramId (),
                        'data': [ '', 'base64' ],
                    },
                };
            }
            return {
                'value': null,
            };
        }
        if (method === 'getLatestBlockhash') {
            return {
                'value': {
                    'blockhash': blockhash,
                },
            };
        }
        assert (method === 'sendTransaction');
        return 'fake-signature';
    };
    exchange.solanaGetTokenProgram = async () => tokenProgram;
    exchange.fibeGetTickArraysForOrder = async (url, market) => {
        if (market['mt'] === 'P') {
            return [ perpTickArray ];
        }
        return [ spotTickArray ];
    };
    return { exchange, requests };
}

function readShortVec (bytes, cursor) {
    let value = 0;
    let shift = 0;
    while (true) {
        const byte = bytes[cursor['offset']];
        cursor['offset'] += 1;
        value |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) {
            return value;
        }
        shift += 7;
    }
}

function readU8 (bytes, cursor) {
    const value = bytes[cursor['offset']];
    cursor['offset'] += 1;
    return value;
}

function readBytes (bytes, cursor, length) {
    const value = bytes.slice (cursor['offset'], cursor['offset'] + length);
    cursor['offset'] += length;
    return value;
}

function accountRole (accountIndex, accountCount, requiredSignatures, readonlySigners, readonlyUnsigned) {
    const isSigner = accountIndex < requiredSignatures;
    let isWritable = false;
    if (isSigner) {
        isWritable = accountIndex < (requiredSignatures - readonlySigners);
    } else {
        isWritable = accountIndex < (accountCount - readonlyUnsigned);
    }
    return {
        'isSigner': isSigner,
        'isWritable': isWritable,
    };
}

function transactionSemantics (exchange, transaction) {
    const bytes = exchange.base64ToBinary (transaction);
    const cursor = { 'offset': 0 };
    const signatureCount = readShortVec (bytes, cursor);
    cursor['offset'] += signatureCount * 64;
    const version = readU8 (bytes, cursor);
    assert (version === 0x80);
    const requiredSignatures = readU8 (bytes, cursor);
    const readonlySigners = readU8 (bytes, cursor);
    const readonlyUnsigned = readU8 (bytes, cursor);
    const accountCount = readShortVec (bytes, cursor);
    const accountKeys = [];
    for (let i = 0; i < accountCount; i++) {
        accountKeys.push (exchange.binaryToBase58 (readBytes (bytes, cursor, 32)));
    }
    cursor['offset'] += 32; // recent blockhash
    const instructionCount = readShortVec (bytes, cursor);
    const roles = accountKeys.map ((_, index) => accountRole (index, accountCount, requiredSignatures, readonlySigners, readonlyUnsigned));
    const instructions = [];
    for (let i = 0; i < instructionCount; i++) {
        const programIndex = readU8 (bytes, cursor);
        const accountIndexCount = readShortVec (bytes, cursor);
        const accounts = [];
        for (let j = 0; j < accountIndexCount; j++) {
            const accountIndex = readU8 (bytes, cursor);
            const role = roles[accountIndex];
            accounts.push ({
                'pubkey': accountKeys[accountIndex],
                'isSigner': role['isSigner'],
                'isWritable': role['isWritable'],
            });
        }
        const dataLength = readShortVec (bytes, cursor);
        instructions.push ({
            'programId': accountKeys[programIndex],
            'accounts': accounts,
            'dataHex': exchange.binaryToBase16 (readBytes (bytes, cursor, dataLength)),
        });
    }
    const addressTableLookupCount = readShortVec (bytes, cursor);
    assert (addressTableLookupCount === 0);
    assert (cursor['offset'] === bytes.length);
    return instructions;
}

function assertSendTransaction (requests, expectedTransaction, expectedSendOptions) {
    const sendRequests = requests.filter ((request) => request['method'] === 'sendTransaction');
    assert (sendRequests.length === 1);
    const request = sendRequests[0];
    assert (request['url'] === rpcUrl);
    assert (request['method'] === 'sendTransaction');
    const exchange = createExchange ()['exchange'];
    assert.deepStrictEqual (transactionSemantics (exchange, request['params'][0]), transactionSemantics (exchange, expectedTransaction));
    assert (request['params'][0] === expectedTransaction);
    assert.deepStrictEqual (request['params'][1], expectedSendOptions);
}

async function assertRejectsWithName (description, call, errorName) {
    try {
        await call ();
        assert (false, description);
    } catch (error) {
        assert (error.constructor.name === errorName, error.constructor.name);
    }
}

function assertThrowsWithName (description, call, errorName) {
    try {
        call ();
        assert (false, description);
    } catch (error) {
        assert (error.constructor.name === errorName, error.constructor.name);
    }
}

async function testFibeLocalTx () {
    {
        const { exchange } = createExchange ();
        for (let i = 0; i < curvePointVectors.length; i++) {
            const vector = curvePointVectors[i];
            assert (exchange.solanaIsOnCurveHex (vector['hex']) === vector['onCurve'], vector['name']);
        }
        assert (!exchange.solanaIsOnCurveHex ('00'.repeat (31)));
        const pdaNames = Object.keys (expectedPdas);
        for (let i = 0; i < pdaNames.length; i++) {
            const name = pdaNames[i];
            assert (!exchange.solanaIsOnCurveHex (exchange.solanaPubkeyHex (expectedPdas[name])), name);
        }
    }
    {
        const { exchange } = createExchange ();
        const quoteMint = rawMarkets[0]['quoteMint'];
        assert (exchange.fibeGetUserStatePda (walletAddress) === expectedPdas['userState']);
        assert (exchange.fibeGetSubAccountStatePda (walletAddress, 0) === expectedPdas['spotSubAccountState']);
        assert (exchange.fibeGetSubAccountStatePda (walletAddress, 2) === expectedPdas['perpSubAccountState']);
        assert (exchange.fibeGetOpenOrdersPerMarketPda ('S', walletAddress, 0, '1') === expectedPdas['spotOpenOrders']);
        assert (exchange.fibeGetOpenOrdersPerMarketPda ('P', walletAddress, 2, '1') === expectedPdas['perpOpenOrders']);
        assert (exchange.fibeGetUserMarginAccountPda (walletAddress, 2, quoteMint) === expectedPdas['perpMarginAccount']);
        assert (exchange.fibeGetTickArrayPda ('S', '1', '17896') === expectedPdas['spotTickArray']);
        assert (exchange.fibeGetTickArrayPda ('P', '1', '17901') === expectedPdas['perpTickArray']);
        const ata = exchange.solanaGetAssociatedTokenAddress (quoteMint, walletAddress, tokenProgram);
        const createAtaIx = exchange.solanaCreateAssociatedTokenAccountIx (walletAddress, ata, walletAddress, quoteMint, tokenProgram);
        assert (createAtaIx['data'] === '00');
        assert (exchange.fibeCalculateEncodedUserId (walletAddress) === '78b619e3f027eb9f');
        assert (exchange.fibeGetDexConfigPda () === '4a99EpcVvdLwWMGEUH9ph28bzxGES3HsZJP8RV3xM2xE');
        assert (exchange.fibeGetUserIdPda (walletAddress) === '8HHf5FXxhmTt6dVha41RXrZwUJUoSJZNvrBnEheKzWtA');
        assert (exchange.fibeGetAccountLabelPda (walletAddress, 0) === 'HcESUNdjqVs3MACszxhSxm3D68AhaAQuFoK5tjLFE7xw');
        const initUserIx = exchange.fibeInitUserIx (walletAddress, 0);
        assert.deepStrictEqual (initUserIx['accounts'].map ((account) => account['pubkey']), [
            exchange.solanaSystemProgramId (),
            exchange.fibeGetDexConfigPda (),
            walletAddress,
            exchange.fibeGetUserIdPda (walletAddress),
            expectedPdas['userState'],
            exchange.fibeGetAccountLabelPda (walletAddress, 0),
            expectedPdas['spotSubAccountState'],
            exchange.fibeProgramId (),
            exchange.fibeProgramId (),
        ]);
        assert (initUserIx['data'] === '100000000000000078b619e3f027eb9f000000cde2c193eb2fd652d5ccceb8347e4b246df2f6cf412df506c3c51a14b997f7');
    }
    {
        const { exchange } = createExchange ();
        exchange.randomBytes = () => '0102030405060708';
        assert (exchange.fibeNewOrderId () === '72623859790382856');
    }
    {
        const { exchange } = createExchange ();
        const seedHex = testPrivateKeyHex.slice (0, 64);
        assert (exchange.solanaParsePrivateKeyHex (testPrivateKey, walletAddress) === seedHex);
        assert (exchange.solanaParsePrivateKeyHex (testPrivateKeyJson, walletAddress) === seedHex);
        assert (exchange.solanaParsePrivateKeyHex ('0x' + testPrivateKeyHex, walletAddress) === seedHex);
        assert (exchange.solanaParsePrivateKeyHex (testPrivateKeyHex, walletAddress) === seedHex);
        assert (exchange.solanaPublicKeyFromSecretKeyHex (testPrivateKeyHex) === walletAddress);
        assert (exchange.fibeIsUnsignedIntegerString ('0'));
        assert (!exchange.fibeIsUnsignedIntegerString (undefined));
        assert (!exchange.fibeIsUnsignedIntegerString (null));
        assert (!exchange.fibeIsUnsignedIntegerString (''));
        assert (!exchange.fibeIsUnsignedIntegerString ('-1'));
        assert (!exchange.fibeIsUnsignedIntegerString ('1.2'));
        assertThrowsWithName ('expected Solana private key parser to reject seed-only hex', () => exchange.solanaParsePrivateKeyHex (seedHex, walletAddress), 'ExchangeError');
        assertThrowsWithName ('expected Solana private key parser to reject seed-only base58', () => exchange.solanaParsePrivateKeyHex (exchange.binaryToBase58 (exchange.base16ToBinary (seedHex)), walletAddress), 'ExchangeError');
        assertThrowsWithName ('expected Solana private key parser to reject a spliced keypair', () => exchange.solanaParsePrivateKeyHex (seedHex + '00'.repeat (32), '11111111111111111111111111111111'), 'AuthenticationError');
        try {
            exchange.solanaParsePrivateKeyHex ('[256]');
            assert (false, 'expected Solana private key parser to reject invalid byte');
        } catch (error) {
            assert (error.constructor.name === 'ExchangeError');
        }
        assertThrowsWithName ('expected Solana private key parser to reject null byte', () => exchange.solanaParsePrivateKeyHex ('[null]'), 'ExchangeError');
        assertThrowsWithName ('expected Solana private key parser to reject non-numeric byte', () => exchange.solanaParsePrivateKeyHex ('["x"]'), 'ExchangeError');
        assertThrowsWithName ('expected Solana private key parser to reject fractional byte', () => exchange.solanaParsePrivateKeyHex ('[1.2]'), 'ExchangeError');
        try {
            exchange.solanaParsePrivateKeyHex (testPrivateKeyHex, '11111111111111111111111111111111');
            assert (false, 'expected Solana private key parser to reject mismatched user');
        } catch (error) {
            assert (error.constructor.name === 'AuthenticationError');
        }
    }
    {
        const { exchange } = createExchange ();
        assert (exchange.fibePriceToTicks ('1789.6', 6, '100000', 'B') === '17896');
        assert (exchange.fibePriceToTicks ('1789.66', 6, '100000', 'B') === '17896');
        assert (exchange.fibePriceToTicks ('1789.61', 6, '100000', 'A') === '17897');
        assert (exchange.fibePriceToTicks ('1789.6', 6, '100000', 'A', 0.05) === '17002');
        assert (exchange.fibeTicksToPrice ('17896', 6, '100000') === '1789.6');
    }
    {
        const { exchange } = createExchange ();
        const ata = exchange.solanaGetAssociatedTokenAddress (exchange.solanaNativeMint (), walletAddress, tokenProgram);
        exchange.solanaGetAccountInfo = async () => undefined;
        let instructions = await exchange.solanaWrapNativeIfNeeded (rpcUrl, walletAddress, tokenProgram, '100', 'confirmed');
        assert (instructions.length === 3);
        assert (instructions[0]['programId'] === exchange.solanaAssociatedTokenProgramId ());
        assert (instructions[1]['programId'] === exchange.solanaSystemProgramId ());
        assert (instructions[1]['accounts'][1]['pubkey'] === ata);
        assert (instructions[1]['data'] === '020000006400000000000000');
        assert (instructions[2]['programId'] === tokenProgram);
        assert (instructions[2]['data'] === '11');
        exchange.solanaGetAccountInfo = async () => ({ 'owner': tokenProgram });
        exchange.solanaRpc = async (url, method) => {
            assert (method === 'getTokenAccountBalance');
            return { 'value': { 'amount': '40' } };
        };
        instructions = await exchange.solanaWrapNativeIfNeeded (rpcUrl, walletAddress, tokenProgram, '100', 'confirmed');
        assert (instructions.length === 2);
        assert (instructions[0]['data'] === '020000003c00000000000000');
        instructions = await exchange.solanaWrapNativeIfNeeded (rpcUrl, walletAddress, tokenProgram, '40', 'confirmed');
        assert (instructions.length === 0);
    }
    {
        const { exchange } = createExchange ();
        const emptyTicks = () => {
            const ticks = [];
            for (let i = 0; i < exchange.fibeTickSizeInArray (); i++) {
                ticks.push ({ 'unfilledLots': '0', 'sideBit': 0 });
            }
            return ticks;
        };
        const bidLiquidity = emptyTicks ();
        bidLiquidity[0] = { 'unfilledLots': '2', 'sideBit': -1 };
        const askLiquidity = emptyTicks ();
        askLiquidity[149] = { 'unfilledLots': '2', 'sideBit': 1 };
        assert.deepStrictEqual (exchange.fibeFindTickArrayIndexesForOrder ([
            { 'startTick': 17850, 'ticks': emptyTicks () },
            { 'startTick': 17550, 'ticks': emptyTicks () },
            { 'startTick': 17700, 'ticks': bidLiquidity },
        ], 17896, '2', 'B'), [ 17550, 17700 ]);
        assert.deepStrictEqual (exchange.fibeFindTickArrayIndexesForOrder ([
            { 'startTick': 18150, 'ticks': emptyTicks () },
            { 'startTick': 17850, 'ticks': emptyTicks () },
            { 'startTick': 18000, 'ticks': askLiquidity },
        ], 17896, '2', 'A'), [ 18000, 18150 ]);
    }
    {
        const { exchange } = createExchange ();
        exchange.publicGetAllMids = async () => [
            { 'mi': '1', 'mt': 'S', 'mid': '1789.66' },
        ];
        const market = exchange.market ('ETH/USDC');
        assert (await exchange.fetchCreateOrderMarketReferencePrice (market) === '1789.66');
    }
    {
        const { exchange } = createExchange ();
        exchange.randomBytes = () => '0102030405060708';
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
        });
        assert (order['id'] === '72623859790382856');
        assert (order['clientOrderId'] === '72623859790382856');
    }
    {
        const { exchange } = createExchange ();
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.66, {
            'rpcUrl': rpcUrl,
            'orderId': '123456792',
        });
        assert (order['info']['priceInTicks'] === '17896');
        assert (order['price'] === 1789.6);
    }
    {
        const { exchange } = createExchange ();
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'sell', 0.00002, 1789.61, {
            'rpcUrl': rpcUrl,
            'orderId': '123456793',
        });
        assert (order['info']['priceInTicks'] === '17897');
        assert (order['price'] === 1789.7);
    }
    {
        const { exchange } = createExchange ();
        exchange.privateKey = '    ';
        try {
            await exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
                'rpcUrl': rpcUrl,
                'orderId': '123456789',
            });
            assert (false, 'expected createOrder to reject whitespace privateKey');
        } catch (error) {
            assert (error.constructor.name === 'ArgumentsRequired');
        }
    }
    {
        const { exchange } = createExchange ();
        exchange.privateKey = '    ';
        try {
            await exchange.cancelOrder ('123456789', 'ETH/USDC', {
                'rpcUrl': rpcUrl,
            });
            assert (false, 'expected cancelOrder to reject whitespace privateKey');
        } catch (error) {
            assert (error.constructor.name === 'ArgumentsRequired');
        }
    }
    {
        const { exchange } = createExchange ();
        await assertRejectsWithName ('expected createOrder to reject postOnly with FOK', () => exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'postOnly': true,
            'timeInForce': 'FOK',
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject invalid marginMode', () => exchange.createOrder ('ETH/USDC:USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'marginMode': 'bad',
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject zero amount', () => exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject negative price', () => exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, -1, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject zero tick price', () => exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 0.05, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject invalid orderId', () => exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': 'abc',
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject invalid subAccountIndex', () => exchange.createOrder ('ETH/USDC:USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'subAccountIndex': 256,
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject invalid initialLeverage', () => exchange.createOrder ('ETH/USDC:USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'initialLeverage': 0,
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject invalid computeUnitLimit', () => exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'computeUnitLimit': -1,
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected createOrder to reject invalid slippage', () => exchange.createOrder ('ETH/USDC', 'market', 'buy', 0.00002, undefined, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'timeInForce': 'IOC',
            'slippage': 'bad',
        }), 'InvalidOrder');
    }
    {
        const { exchange } = createExchange ();
        await assertRejectsWithName ('expected cancelOrder to reject invalid id', () => exchange.cancelOrder ('abc', 'ETH/USDC', {
            'rpcUrl': rpcUrl,
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected cancelOrder to reject invalid subAccountIndex', () => exchange.cancelOrder ('123456789', 'ETH/USDC:USDC', {
            'rpcUrl': rpcUrl,
            'subAccountIndex': 256,
        }), 'InvalidOrder');
        await assertRejectsWithName ('expected cancelOrder to reject invalid computeUnitPriceMicroLamports', () => exchange.cancelOrder ('123456789', 'ETH/USDC', {
            'rpcUrl': rpcUrl,
            'computeUnitPriceMicroLamports': '1.5',
        }), 'InvalidOrder');
    }
    {
        const { exchange, requests } = createExchange ();
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'timeInForce': 'GTC',
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
            'computeUnitLimit': 300000,
            'computeUnitPriceMicroLamports': 1000,
        });
        assert (order['id'] === '123456789');
        assert (order['symbol'] === 'ETH/USDC');
        assert (order['side'] === 'buy');
        assert (order['timeInForce'] === 'GTC');
        assert (order['info']['priceInTicks'] === '17896');
        assert (order['info']['blockhash'] === blockhash);
        assertSendTransaction (requests, expectedTransactions['spotCreate'], {
            'encoding': 'base64',
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
        });
    }
    {
        const { exchange, requests } = createExchange (false);
        await exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
        });
        const sendRequest = requests.filter ((request) => request['method'] === 'sendTransaction')[0];
        const instructions = transactionSemantics (exchange, sendRequest['params'][0]);
        assert (instructions.length === 3);
        assert (instructions[0]['programId'] === exchange.solanaAssociatedTokenProgramId ());
        assert (instructions[1]['programId'] === exchange.fibeProgramId ());
        assert (instructions[1]['dataHex'] === exchange.fibeInitUserIx (walletAddress, 0)['data']);
        assert (instructions[1]['accounts'].length === 9);
        assert (instructions[2]['dataHex'].slice (0, 16) === '3800000000000000');
    }
    {
        const { exchange, requests } = createExchange ();
        const order = await exchange.createOrder ('ETH/USDC', 'market', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '323456789',
            'slippage': 0.05,
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
            'computeUnitLimit': 300000,
            'computeUnitPriceMicroLamports': 1000,
        });
        assert (order['id'] === '323456789');
        assert (order['symbol'] === 'ETH/USDC');
        assert (order['type'] === 'market');
        assert (order['side'] === 'buy');
        assert (order['price'] === undefined);
        assert (order['timeInForce'] === 'IOC');
        assert (order['info']['priceInTicks'] === '18790');
        assertSendTransaction (requests, expectedTransactions['spotMarketCreate'], {
            'encoding': 'base64',
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
        });
    }
    {
        const { exchange, requests } = createExchange ();
        exchange.publicGetAllMids = async () => [
            { 'mi': '1', 'mt': 'S', 'mid': '1789.6' },
        ];
        const order = await exchange.createOrder ('ETH/USDC', 'market', 'sell', 0.00002, undefined, {
            'rpcUrl': rpcUrl,
            'orderId': '323456790',
            'slippage': 0.05,
        });
        assert (order['id'] === '323456790');
        assert (order['symbol'] === 'ETH/USDC');
        assert (order['type'] === 'market');
        assert (order['side'] === 'sell');
        assert (order['price'] === undefined);
        assert (order['timeInForce'] === 'IOC');
        assert (order['info']['priceInTicks'] === '17002');
        assertSendTransaction (requests, expectedTransactions['spotMarketCreateFromMid'], {
            'encoding': 'base64',
            'preflightCommitment': 'confirmed',
        });
    }
    {
        const { exchange, requests } = createExchange ();
        const tickArrays = [
            exchange.fibeGetTickArrayPda ('S', '1', '17550'),
            exchange.fibeGetTickArrayPda ('S', '1', '17700'),
            exchange.fibeGetTickArrayPda ('S', '1', '17850'),
        ];
        exchange.fibeGetTickArraysForOrder = async () => tickArrays;
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456789',
            'timeInForce': 'GTC',
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
            'computeUnitLimit': 300000,
            'computeUnitPriceMicroLamports': 1000,
        });
        assert.deepStrictEqual (order['info']['tickArrays'], tickArrays);
        assert (tickArrays.length > 1);
        assertSendTransaction (requests, expectedTransactions['spotCreateMultiTickArrays'], {
            'encoding': 'base64',
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
        });
    }
    {
        const { exchange, requests } = createExchange ();
        const order = await exchange.cancelOrder ('123456789', 'ETH/USDC', {
            'rpcUrl': rpcUrl,
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
            'computeUnitLimit': 300000,
            'computeUnitPriceMicroLamports': 1000,
        });
        assert (order['id'] === '123456789');
        assert (order['symbol'] === 'ETH/USDC');
        assert (order['status'] === 'canceled');
        assert (order['info']['priceInTicks'] === '17896');
        assertSendTransaction (requests, expectedTransactions['spotCancel'], {
            'encoding': 'base64',
            'preflightCommitment': 'processed',
            'skipPreflight': true,
            'maxRetries': 3,
            'minContextSlot': 99,
        });
    }
    {
        const { exchange, requests } = createExchange ();
        exchange.market ('ETH/USDC')['info']['baseMint'] = exchange.solanaNativeMint ();
        let wrappedAmount = undefined;
        exchange.solanaWrapNativeIfNeeded = async (url, owner, program, amount) => {
            wrappedAmount = amount;
            return [];
        };
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'sell', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456794',
        });
        assert (wrappedAmount === '2000');
        assert (order['symbol'] === 'ETH/USDC');
        assert (requests[requests.length - 1]['method'] === 'sendTransaction');
    }
    {
        const { exchange, requests } = createExchange ();
        exchange.market ('ETH/USDC')['info']['baseMint'] = exchange.solanaNativeMint ();
        exchange.solanaWrapNativeIfNeeded = async () => {
            assert (false, 'buying SOL must not wrap the receiving asset');
        };
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'buy', 0.00002, 1789.6, {
            'rpcUrl': rpcUrl,
            'orderId': '123456795',
        });
        assert (order['symbol'] === 'ETH/USDC');
        assert (requests[requests.length - 1]['method'] === 'sendTransaction');
    }
    {
        const { exchange, requests } = createExchange ();
        exchange.market ('ETH/USDC')['info']['baseMint'] = exchange.solanaNativeMint ();
        const order = await exchange.cancelOrder ('123456789', 'ETH/USDC', {
            'rpcUrl': rpcUrl,
        });
        assert (order['status'] === 'canceled');
        assert (requests[requests.length - 1]['method'] === 'sendTransaction');
    }
    {
        const { exchange, requests } = createExchange ();
        exchange.market ('ETH/USDC:USDC')['info']['baseMint'] = exchange.solanaNativeMint ();
        const order = await exchange.createOrder ('ETH/USDC:USDC', 'limit', 'sell', 0.00003, 1790.1, {
            'rpcUrl': rpcUrl,
            'orderId': '223456789',
            'timeInForce': 'FOK',
            'subAccountIndex': 2,
            'marginMode': 'isolated',
            'initialLeverage': 5,
            'computeUnitLimit': 400000,
        });
        assert (order['id'] === '223456789');
        assert (order['symbol'] === 'ETH/USDC:USDC');
        assert (order['side'] === 'sell');
        assert (order['timeInForce'] === 'FOK');
        assert (order['info']['priceInTicks'] === '17901');
        assertSendTransaction (requests, expectedTransactions['perpCreate'], {
            'encoding': 'base64',
            'preflightCommitment': 'confirmed',
        });
    }
    {
        const { exchange, requests } = createExchange ();
        exchange.market ('ETH/USDC:USDC')['info']['baseMint'] = exchange.solanaNativeMint ();
        const order = await exchange.cancelOrder ('223456789', 'ETH/USDC:USDC', {
            'rpcUrl': rpcUrl,
            'subAccountIndex': 2,
            'computeUnitLimit': 400000,
        });
        assert (order['id'] === '223456789');
        assert (order['symbol'] === 'ETH/USDC:USDC');
        assert (order['status'] === 'canceled');
        assert (order['info']['priceInTicks'] === '17901');
        assertSendTransaction (requests, expectedTransactions['perpCancel'], {
            'encoding': 'base64',
            'preflightCommitment': 'confirmed',
        });
    }
}

export default testFibeLocalTx;
