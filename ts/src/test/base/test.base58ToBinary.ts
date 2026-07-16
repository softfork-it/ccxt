
import assert from 'assert';
import ccxt from '../../../ccxt.js';

function testBase58ToBinary () {

    const exchange = new ccxt.Exchange ({
        'id': 'sampleexchange',
    });

    // todo: can be implemented stringToBinary in future

    // @SKIP_START_GO
    // Test 1: Simple base58
    const b58_1 = 'Cn8eVZg'; // hello
    const binary1 = exchange.base58ToBinary (b58_1);
    assert (exchange.binaryToBase58 (binary1) === b58_1);

    // Test 2: String with space in original
    const b58_2 = 'StV1DL6CwTryKyV'; // hello world
    const binary2 = exchange.base58ToBinary (b58_2);
    assert (exchange.binaryToBase58 (binary2) === b58_2);

    // Test 3: Short string
    const b58_3 = '3yZe7d'; // test
    const binary3 = exchange.base58ToBinary (b58_3);
    assert (exchange.binaryToBase58 (binary3) === b58_3);

    // Test 4: Single byte
    const b58_4 = '2g'; // a
    const binary4 = exchange.base58ToBinary (b58_4);
    assert (exchange.binaryToBase58 (binary4) === b58_4);

    // Test 5: Two bytes
    const b58_5 = '8Qq'; // ab
    const binary5 = exchange.base58ToBinary (b58_5);
    assert (exchange.binaryToBase58 (binary5) === b58_5);

    // Test 6: Three bytes
    const b58_6 = 'ZiCa'; // abc
    const binary6 = exchange.base58ToBinary (b58_6);
    assert (exchange.binaryToBase58 (binary6) === b58_6);

    // Test 7: JSON-like binary
    const b58_7 = '4SoiMiEYtTt5tPdi81Fik'; // {"key":"value"}
    const binary7 = exchange.base58ToBinary (b58_7);
    assert (exchange.binaryToBase58 (binary7) === b58_7);

    // Test 8: Leading zero byte
    const binary8 = exchange.base58ToBinary ('1Cn8eVZg');
    assert (exchange.binaryToBase16 (binary8) === '0068656c6c6f');
    assert (exchange.binaryToBase58 (binary8) === '1Cn8eVZg');

    // Test 9: All zero bytes
    const binary9 = exchange.base58ToBinary ('111');
    assert (exchange.binaryToBase16 (binary9) === '000000');
    assert (exchange.binaryToBase58 (binary9) === '111');
    // @SKIP_END_GO

    assert (exchange.parseNumber (undefined) === undefined, 'GO skip trick');
}

export default testBase58ToBinary;
