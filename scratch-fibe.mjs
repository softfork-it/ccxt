// scratch runner for the `fibe` exchange.
//
// Build first (fast inner loop, JS only):
//     cd ccxt
//     npm install            # once
//     npm run tsBuild        # tsc -> js/   (re-run after each edit to ts/src/fibe.ts)
//     node scratch-fibe.mjs
//
// If `js/ccxt.js` doesn't exist yet, run a full `npm run build` once.

import ccxt from './js/ccxt.js';

const fibe = new ccxt.fibe ({});

async function main () {
    // loadMarkets() calls fetchMarkets() and indexes them, so fibe.market() works.
    const markets = await fibe.loadMarkets ();
    const symbols = Object.keys (markets);
    console.log ('fetched', symbols.length, 'markets\n');
    for (let i = 0; i < Math.min (5, symbols.length); i++) {
        const m = markets[symbols[i]];
        console.log ({
            id: m['id'],
            symbol: m['symbol'],
            type: m['type'],
            base: m['base'],
            quote: m['quote'],
            spot: m['spot'],
            swap: m['swap'],
            precision: m['precision'],
        });
    }

    if (symbols.length) {
        const sym = symbols[0];
        console.log ('\nmarket(' + sym + ').id =', fibe.market (sym)['id']);

        const ob = await fibe.fetchOrderBook (sym);
        console.log ('\norder book for', sym);
        console.log ('  bids[0..2]:', ob['bids'].slice (0, 3));
        console.log ('  asks[0..2]:', ob['asks'].slice (0, 3));
    }
}

main ().catch ((e) => { console.error (e); process.exit (1); });
