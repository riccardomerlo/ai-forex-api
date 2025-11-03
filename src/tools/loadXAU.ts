import * as path from 'node:path';
import { MarketDataStore } from './marketDataStore';

// Usage:
//   npm run load:xau -- --dir ./data/xauusd
// or
//   node dist/tools/loadXAU.js --dir ./data/xauusd
async function main() {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) args.set(k, v);
      else if (i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--')) {
        args.set(k, process.argv[++i]);
      } else {
        args.set(k, 'true');
      }
    }
  }

  const dir =
    args.get('dir') ?? process.env.XAU_CSV_DIR ?? path.resolve(process.cwd(), 'data', 'xauusd');
  const symbol = args.get('symbol') ?? 'XAUUSD';

  const store = await MarketDataStore.fromFolder(dir, symbol);

  const latest = store.getLatest();
  const summary = store.getSummary();
  const sma20 = store.getSMA(20);
  const ema20 = store.getEMA(20);
  const rsi14 = store.getRSI(14);
  const atr14 = store.getATR(14);
  const vol = store.getVolatility(96);

  // eslint-disable-next-line no-console
  console.log(`Loaded ${summary.count} bars for ${symbol} from ${dir}`);
  // eslint-disable-next-line no-console
  console.log(
    `First: ${summary.firstTime?.toISOString()}  Last: ${summary.lastTime?.toISOString()}`
  );
  // eslint-disable-next-line no-console
  console.log(
    `Close[min=${summary.minClose}]  Close[max=${summary.maxClose}]  Mean=${summary.meanClose?.toFixed(4)}  SD=${summary.stdClose?.toFixed(4)}`
  );
  // eslint-disable-next-line no-console
  console.log(`Latest close: ${latest?.close} @ ${latest?.time.toISOString()}`);
  // eslint-disable-next-line no-console
  console.log(
    `SMA20=${sma20?.toFixed(4)}  EMA20=${ema20?.toFixed(4)}  RSI14=${rsi14?.toFixed(2)}  ATR14=${atr14?.toFixed(4)}`
  );
  if (vol)
    // eslint-disable-next-line no-console
    console.log(
      `Vol (last 96 bars): sd=${vol.sd.toExponential(3)}, annualized=${(vol.annualized * 100).toFixed(2)}%`
    );
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
