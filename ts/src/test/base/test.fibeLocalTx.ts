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

const rawMarkets = [
    {
        'marketPubkey': 'Cwz8UtKVh4sAVQnHdeZFB3dDJfVE7Wd8idDV3Ux466dX',
        'marketIndex': '1',
        'baseMint': '22HX2NvQeuid5EUenvRtZtSN4i4wtjqGwqAyN5RJ7zHw',
        'baseDecimals': 8,
        'quoteMint': 'EM7eDa1KFZeKddqizAWur7yMJytKASPtoQmZxSDNYcKR',
        'quoteDecimals': 6,
        'sizeDecimals': 5,
        'priceDecimals': 1,
        'symbol': 'ETH/USDC',
        'tickSizeInQuoteBaseUnits': 100000,
        'lotSizeInBaseBaseUnits': 1000,
        'marketType': 'S',
    },
    {
        'marketPubkey': '8MEW7FcjkaoagB3oy8JyP4xidgSZnb7yHgbWHDsC5zSW',
        'marketIndex': '1',
        'baseMint': '22HX2NvQeuid5EUenvRtZtSN4i4wtjqGwqAyN5RJ7zHw',
        'baseDecimals': 8,
        'quoteMint': 'EM7eDa1KFZeKddqizAWur7yMJytKASPtoQmZxSDNYcKR',
        'quoteDecimals': 6,
        'sizeDecimals': 5,
        'priceDecimals': 1,
        'symbol': 'ETH-USDC',
        'tickSizeInQuoteBaseUnits': 100000,
        'lotSizeInBaseBaseUnits': 1000,
        'marketType': 'P',
    },
];

const expectedTransactions = {
    'spotCreate': 'AfJlA4Boznv5ZjrmnzbmrW0nHOf/v2N0O2lyriOn5LlZEjNbSnhQ27ZW+OHbFxpTt5pOuMFDgIqL8hkdmzhSTg2AAQAHEQjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3fc4vQnuI90tbVKeufzQo5Yepag4XAaCEC2Kk8hgAdo7t4FaYf8TfIxVKShNwnYEg+0dbxlmcttDIhBR+FGcLUqms/qgHPfBFxCsBhNHwzvgyjkDvJYS3dODKC8Df51MI70ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0exhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEhOf+7ubABPWzie3NHiWDmti8f3Pccu4E+ohxy89qzJSSAsJm2jQr8T9p+jxFDOeW+2izRpjjC2MRh9YbB2wCm2aYJWGaWQjEKciRn/ld6J0r9qK91rwRZVF+utcEhhWljZfT9fMG2MUytE7a+mAaPPFsz8UgFmuqWh6iSDznuyLAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAADgMEVSNrHitRX5lDclciT5WaeBsL3U9OA4hAX24q006wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWEdrLArxLJyHJCW37FtYOvsWWE/ATf1nVLgYDhpLdaIPL/G91oof0T6fP4YiI+3BisuhNjRKFQckM2ZBiDKKWsZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKmFrMno+TNerQK9he3Jl7WFeYc5ugQDnxs/2l/GZbSUFgMKAAUC4JMEAAoACQPoAwAAAAAAAAsVDAABAgsLCwsLAwQFBgcNCA4PEBAJJTgAAAAAAAAA6EUAAAAAAAAVzVsHAAAAAAAB0AcAAAAAAAAAAAAA',
    'spotMarketCreate': 'ASeG38KVa/n1WHx23ZvCqqzDnUWtwe0UAEmBQahTae03eqygHP4kfsh4idHd5MHYsDh4EbDrjZoyU+lBc3E+Fg2AAQAHEQjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3fc4vQnuI90tbVKeufzQo5Yepag4XAaCEC2Kk8hgAdo5gRfBkH6FT6ug9J1sNYUzCoHHXvaky6pU/aOOoq6N2PKms/qgHPfBFxCsBhNHwzvgyjkDvJYS3dODKC8Df51MI70ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0exhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEhOf+7ubABPWzie3NHiWDmti8f3Pccu4E+ohxy89qzJSSAsJm2jQr8T9p+jxFDOeW+2izRpjjC2MRh9YbB2wCm2aYJWGaWQjEKciRn/ld6J0r9qK91rwRZVF+utcEhhWljZfT9fMG2MUytE7a+mAaPPFsz8UgFmuqWh6iSDznuyLAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAADgMEVSNrHitRX5lDclciT5WaeBsL3U9OA4hAX24q006wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWEdrLArxLJyHJCW37FtYOvsWWE/ATf1nVLgYDhpLdaIPL/G91oof0T6fP4YiI+3BisuhNjRKFQckM2ZBiDKKWsZPDlTK0hFobK0S0yBAzXIdCce15S5fozQxIYCdieKABt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKmFrMno+TNerQK9he3Jl7WFeYc5ugQDnxs/2l/GZbSUFgMKAAUC4JMEAAoACQPoAwAAAAAAAAsVDAABAgsLCwsLAwQFBgcNCA4PEBAJJTgAAAAAAAAAZkkAAAAAAAAVj0cTAAAAAAAB0AcAAAAAAAAAAQAA',
    'spotMarketCreateFromMid': 'ASs7CWGaa1BbrFHvLRHeFE0rAsoaXD7V4eUN6F3AfX1ItMqMU61BVkT1SnvHbcm5A/QI0tCmw3DYw4Q02y8E9wKAAQAGEAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3fc4vQnuI90tbVKeufzQo5Yepag4XAaCEC2Kk8hgAdo7X7zeVUxg+rBAELiQOzjttR5/UeFq1c0egfQv1pkCN06ms/qgHPfBFxCsBhNHwzvgyjkDvJYS3dODKC8Df51MI70ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0exhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEhOf+7ubABPWzie3NHiWDmti8f3Pccu4E+ohxy89qzJSSAsJm2jQr8T9p+jxFDOeW+2izRpjjC2MRh9YbB2wCm2aYJWGaWQjEKciRn/ld6J0r9qK91rwRZVF+utcEhhWljZfT9fMG2MUytE7a+mAaPPFsz8UgFmuqWh6iSDznuyL4DBFUjax4rUV+ZQ3JXIk+VmngbC91PTgOIQF9uKtNOsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhHaywK8SychyQlt+xbWDr7FlhPwE39Z1S4GA4aS3WiDy/xvdaKH9E+nz+GIiPtwYrLoTY0ShUHJDNmQYgyilrGTw5UytIRaGytEtMgQM1yHQnHteUuX6M0MSGAnYnigAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCphazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYBChULAAECCgoKCgoDBAUGBwwIDQ4PDwklOAAAAAAAAABqQgAAAAAAABaPRxMAAAAAAQHQBwAAAAAAAAABAAA=',
    'spotCreateMultiTickArrays': 'AQm4Q+NAxOU+WHnMRe775VzMG8IaLCkEoE0oTWZJLsCH2feX7alPGQXMxErnQg6yFd4G8Ipbxd7FIgwP9XC1iQ2AAQAHEwjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3fc4vQnuI90tbVKeufzQo5Yepag4XAaCEC2Kk8hgAdo7t4FaYf8TfIxVKShNwnYEg+0dbxlmcttDIhBR+FGcLUqms/qgHPfBFxCsBhNHwzvgyjkDvJYS3dODKC8Df51MI70ucvvSX1FQQAC1vnVAEFvVfJ33xzxXUUKeZwDLdX0exhoQM7QzHXGgehn+aAnPm6gAGT8HRYdjkBTyFOe4TEhOf+7ubABPWzie3NHiWDmti8f3Pccu4E+ohxy89qzJSSAsJm2jQr8T9p+jxFDOeW+2izRpjjC2MRh9YbB2wCm2aYJWGaWQjEKciRn/ld6J0r9qK91rwRZVF+utcEhhWloDpRHhAj2rlmxPAcr1K0aOvFKkVg69EEK7q4feqPY6f8Wu4+8MfSA0SxhWtZMAeqwL4eEH5KfkUbVsGuMQHi3oOfrvZB+0MTw/oUqEPX3IvSba27UjickxCeQ7DPe0QbAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAA4DBFUjax4rUV+ZQ3JXIk+VmngbC91PTgOIQF9uKtNOsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhHaywK8SychyQlt+xbWDr7FlhPwE39Z1S4GA4aS3WiDy/xvdaKH9E+nz+GIiPtwYrLoTY0ShUHJDNmQYgyilrGTw5UytIRaGytEtMgQM1yHQnHteUuX6M0MSGAnYnigAbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCphazJ6PkzXq0CvYXtyZe1hXmHOboEA58bP9pfxmW0lBYDDAAFAuCTBAAMAAkD6AMAAAAAAAANFw4AAQINDQ0NDQMEBQYHDwgQERISCQoLJTgAAAAAAAAA6EUAAAAAAAAVzVsHAAAAAAAB0AcAAAAAAAAAAAAA',
    'spotCancel': 'ATPeGl4XCFM+ki75x2bcQx+WNbqHdDCsB39mmz6HAyhkIqmgqRFToyaHJ/qK/bp8rqno4h/Z7OkNFWMlhE0w0Q+AAQAGDwjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3sYaEDO0Mx1xoHoZ/mgJz5uoABk/B0WHY5AU8hTnuExJ9zi9Ce4j3S1tUp65/NCjlh6lqDhcBoIQLYqTyGAB2ju3gVph/xN8jFUpKE3CdgSD7R1vGWZy20MiEFH4UZwtSDn672QftDE8P6FKhD19yL0m2tu1I4nJMQnkOwz3tEGyprP6oBz3wRcQrAYTR8M74Mo5A7yWEt3TgygvA3+dTCO9LnL70l9RUEAAtb51QBBb1Xyd98c8V1FCnmcAy3V9HE5/7u5sAE9bOJ7c0eJYOa2Lx/c9xy7gT6iHHLz2rMlJICwmbaNCvxP2n6PEUM55b7aLNGmOMLYxGH1hsHbAKbQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAA4DBFUjax4rUV+ZQ3JXIk+VmngbC91PTgOIQF9uKtNOtYR2ssCvEsnIckJbfsW1g6+xZYT8BN/WdUuBgOGkt1og8v8b3Wih/RPp8/hiIj7cGKy6E2NEoVByQzZkGIMopaxk8OVMrSEWhsrRLTIEDNch0Jx7XlLl+jNDEhgJ2J4oAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqYWsyej5M16tAr2F7cmXtYV5hzm6BAOfGz/aX8ZltJQWAwkABQLgkwQACQAJA+gDAAAAAAAACg4BAAIDBAUGBwgLDA0ODhA5AAAAAAAAABXNWwcAAAAAAA==',
    'perpCreate': 'AUvL2m02D60HodDPgQ9e5uT9PZZiinOjtomuEmEh8FyyUUNTppR2OxF2nS94NjINBbxdArYMyGyz1kqxkWjBWgiAAQAHEgjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3bTCw9s/I41LopvmD+6cXd8Jz4mA/Hf2/0mrppF+wZFt9zi9Ce4j3S1tUp65/NCjlh6lqDhcBoIQLYqTyGAB2jmKFgajRL5U9BuulwJa30nHXmngyTQOjwtHnTrInWiL4IpGpZcRlZBg46aVsbYBSgqg6AN+yBbFxdxp0yZ6H5//vS5y+9JfUVBAALW+dUAQW9V8nffHPFdRQp5nAMt1fRxLl8iCHnLCarasB6MvBGF1rK5Y0IPg5zGLRCTl1kQqz5LIEcXvGJYyFAoQVNTJmKXGIrvWsoI5fCbBE/rXIAqIJL/+Zm8mvDePizsde0eClOR9lrXoGnGAPjKDm0y+bjePHCLNY3sjLnxTfABI9jFc1RqJ/Fx78qDA3SMk5FF3M0plscDZY3X4vskaUqtF6rOmldTIiT5fiyq5ua0BoXtUDBkZv5SEXMv/srbpyw5vnvIzlu8X3EmssQ5s6QAAAAOAwRVI2seK1FfmUNyVyJPlZp4GwvdT04DiEBfbirTTrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACoWrkkctn4j87SWZfHVFcW2AkURNezGWxA9CWi4MMb3VhHaywK8SychyQlt+xbWDr7FlhPwE39Z1S4GA4aS3Wixk8OVMrSEWhsrRLTIEDNch0Jx7XlLl+jNDEhgJ2J4oAG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqYWsyej5M16tAr2F7cmXtYV5hzm6BAOfGz/aX8ZltJQWAgsABQKAGgYADBUNAQ4AAgMEBQwMDAwMBgcIDwkQEQophgAAAAAAAADtRQAAAAAAABWuUQ0AAAAAAQABAQUBuAsAAAAAAAAAAwAA',
    'perpCancel': 'ASnMM+V/hf+3RbZzgWhc1n8diMYXbhsVo408IWS0butSTpYO4nj9zCWdxLWEH5aYWieCuMRdQ/TN78x5Labwnw2AAQAFDAjN4sGT6y/WUtXMzrg0fkskbfL2z0Et9QbDxRoUuZf3bTCw9s/I41LopvmD+6cXd8Jz4mA/Hf2/0mrppF+wZFt9zi9Ce4j3S1tUp65/NCjlh6lqDhcBoIQLYqTyGAB2jmKFgajRL5U9BuulwJa30nHXmngyTQOjwtHnTrInWiL4IpGpZcRlZBg46aVsbYBSgqg6AN+yBbFxdxp0yZ6H5/8JL/+Zm8mvDePizsde0eClOR9lrXoGnGAPjKDm0y+bjV0mX5t1UeV9pQnfxQQR73uMSi59iDLac1g0/PTYMh/UAwZGb+UhFzL/7K26csOb57yM5bvF9xJrLEObOkAAAADgMEVSNrHitRX5lDclciT5WaeBsL3U9OA4hAX24q0066hauSRy2fiPztJZl8dUVxbYCRRE17MZbED0JaLgwxvdEuXyIIecsJqtqwHoy8EYXWsrljQg+DnMYtEJOXWRCrNYR2ssCvEsnIckJbfsW1g6+xZYT8BN/WdUuBgOGkt1ooWsyej5M16tAr2F7cmXtYV5hzm6BAOfGz/aX8ZltJQWAgcABQKAGgYACAoBCQACAwQKBQsGEYcAAAAAAAAAFa5RDQAAAAAAAA==',
};

function createExchange () {
    const exchange: any = new fibe ({
        'walletAddress': walletAddress,
        'privateKey': testPrivateKey,
    });
    exchange.setMarkets (exchange.parseMarkets (rawMarkets));
    const orderAccountData = (priceInTicks) => {
        const hex = '00'.repeat (64) + exchange.solanaU64leHex (priceInTicks) + '00'.repeat (8);
        return exchange.binaryToBase64 (exchange.base16ToBinary (hex));
    };
    const orderAccountDataByPubkey: { [key: string]: string } = {};
    orderAccountDataByPubkey[exchange.fibeGetOrderPda (walletAddress, 0, '123456789')] = orderAccountData ('17896');
    orderAccountDataByPubkey[exchange.fibeGetOrderPda (walletAddress, 2, '223456789')] = orderAccountData ('17901');
    const requests = [];
    exchange.solanaRpc = async (url, method, params) => {
        requests.push ({
            'url': url,
            'method': method,
            'params': params,
        });
        if (method === 'getAccountInfo') {
            const data = orderAccountDataByPubkey[params[0]];
            assert (data !== undefined);
            return {
                'value': {
                    'owner': exchange.fibeProgramId (),
                    'data': [ data, 'base64' ],
                },
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
    exchange.solanaAccountExists = async () => true;
    exchange.fibeGetTickArraysForOrder = async (url, market) => {
        if (market['marketType'] === 'P') {
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
    }
    {
        const { exchange } = createExchange ();
        exchange.publicGetAllMids = async () => [
            { 'marketIndex': '1', 'marketType': 'S', 'mid': '1789.66' },
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
    }
    {
        const { exchange } = createExchange ();
        const order = await exchange.createOrder ('ETH/USDC', 'limit', 'sell', 0.00002, 1789.61, {
            'rpcUrl': rpcUrl,
            'orderId': '123456793',
        });
        assert (order['info']['priceInTicks'] === '17897');
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
            { 'marketIndex': '1', 'marketType': 'S', 'mid': '1789.6' },
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
            exchange.fibeGetTickArrayPda ('S', '1', '17600'),
            exchange.fibeGetTickArrayPda ('S', '1', '17700'),
            exchange.fibeGetTickArrayPda ('S', '1', '17800'),
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
