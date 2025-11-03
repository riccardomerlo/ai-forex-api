import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { Candle5m, PriceField, StatsSummary } from '../types/market.types';

/**
 * In-memory store for 5-minute XAUUSD bars parsed from CSV files.
 * - Safe against duplicates (keyed by epoch ms)
 * - Sorted ascending by time
 * - Fast lookups for latest, ranges, and technicals
 */
export class MarketDataStore {
  private candles: Candle5m[] = [];
  private indexByTs = new Map<number, number>(); // t -> index in candles[]

  constructor(public readonly symbol: string = 'XAUUSD') {}

  /** Loads every *.csv in dir (non-recursive) and merges into memory. */
  static async fromFolder(dir: string, symbol = 'XAUUSD'): Promise<MarketDataStore> {
    const store = new MarketDataStore(symbol);
    await store.updateFromFolder(dir);
    return store;
  }

  /** Scan directory for CSVs and merge. */
  async updateFromFolder(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.csv'))
      .map(e => path.join(dir, e.name));

    const batch: Candle5m[] = [];
    for (const file of files) {
      const parsed = await this.parseCsvFile(file);
      batch.push(...parsed);
    }
    this.merge(batch);
  }

  /** Parse a single CSV file with header: Date,Open,High,Low,Close,Change(Pips),Change(%) */
  private async parseCsvFile(filePath: string): Promise<Candle5m[]> {
    const rl = readline.createInterface({
      input: createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    const out: Candle5m[] = [];
    let lineNo = 0;

    for await (const rawLine of rl) {
      const line = rawLine.trim();
      lineNo++;

      if (!line) continue;

      // Skip title line commonly: "XAUUSD Historical Data"
      if (lineNo === 1 && /historical data/i.test(line)) continue;

      // Skip header line
      if (lineNo === 2 && /^date,open,high,low,close/i.test(line.toLowerCase())) continue;

      // Expect CSV with a trailing comma => last item possibly ""
      const parts = line.split(',');
      if (parts.length < 7) continue;

      // Date format example: "11/03/2025 21:40"
      const dateStr = parts[0]?.trim();
      if (!/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(dateStr)) {
        // Not a data row, skip
        continue;
      }

      const open = parseFloat(parts[1]);
      const high = parseFloat(parts[2]);
      const low = parseFloat(parts[3]);
      const close = parseFloat(parts[4]);
      const changePips = parts[5] !== undefined && parts[5] !== '' ? parseFloat(parts[5]) : null;
      const changePct = parts[6] !== undefined && parts[6] !== '' ? parseFloat(parts[6]) : null;

      if ([open, high, low, close].some(x => Number.isNaN(x))) continue;

      // Interpret as local time from the CSV (MM/DD/YYYY HH:mm)
      // Build Date safely to avoid locale ambiguities.
      const [mm, dd, yyyyTime] = dateStr.split('/');
      const [yyyy, hhmm] = [yyyyTime.slice(0, 4), yyyyTime.slice(5)];
      const [HH, MM] = hhmm.split(':');
      const year = parseInt(yyyy, 10);
      const month = parseInt(mm, 10);
      const day = parseInt(dd, 10);
      const hour = parseInt(HH, 10);
      const minute = parseInt(MM, 10);

      const time = new Date(year, month - 1, day, hour, minute, 0, 0);
      const t = time.getTime();

      out.push({
        time,
        t,
        open,
        high,
        low,
        close,
        changePips: changePips ?? undefined,
        changePct: changePct ?? undefined,
      });
    }

    return out;
  }

  /** Merge new candles into memory (dedupe by timestamp, sort ascending). */
  private merge(batch: Candle5m[]) {
    // First, insert or update by timestamp
    for (const c of batch) {
      if (this.indexByTs.has(c.t)) {
        // Update existing record (prefer the latest file's data)
        const idx = this.indexByTs.get(c.t)!;
        this.candles[idx] = c;
      } else {
        this.candles.push(c);
        this.indexByTs.set(c.t, this.candles.length - 1);
      }
    }

    // Sort ascending by time and rebuild indices
    this.candles.sort((a, b) => a.t - b.t);
    this.indexByTs.clear();
    this.candles.forEach((c, i) => this.indexByTs.set(c.t, i));
  }

  // ---------------------- Basic accessors ----------------------

  size(): number {
    return this.candles.length;
  }

  getLatest(): Candle5m | undefined {
    return this.candles[this.candles.length - 1];
  }

  getFirst(): Candle5m | undefined {
    return this.candles[0];
  }

  getLastN(n: number): Candle5m[] {
    if (n <= 0) return [];
    return this.candles.slice(-n);
  }

  /** Get candles in [start, end] inclusive by Date or epoch ms. */
  getRange(start: Date | number, end: Date | number): Candle5m[] {
    const s = typeof start === 'number' ? start : start.getTime();
    const e = typeof end === 'number' ? end : end.getTime();
    // Binary-ish search would be faster; simple filter is fine unless huge.
    return this.candles.filter(c => c.t >= s && c.t <= e);
  }

  // ---------------------- Stats & Aggregates ----------------------

  getSummary(): StatsSummary {
    const count = this.candles.length;
    if (count === 0) return { count: 0 };

    const closes = this.candles.map(c => c.close);
    const mean = meanNum(closes);
    const sd = stdNum(closes, mean);

    return {
      count,
      firstTime: this.candles[0].time,
      lastTime: this.candles[count - 1].time,
      minClose: Math.min(...closes),
      maxClose: Math.max(...closes),
      meanClose: mean,
      stdClose: sd,
    };
  }

  /** Aggregate OHLC over an arbitrary range (inclusive). */
  getAggregatedOHLC(start: Date | number, end: Date | number) {
    const rows = this.getRange(start, end);
    if (rows.length === 0) return undefined;
    const open = rows[0].open;
    const close = rows[rows.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    for (const r of rows) {
      if (r.high > high) high = r.high;
      if (r.low < low) low = r.low;
    }
    return { open, high, low, close };
  }

  // ---------------------- Technicals ----------------------

  /** Simple moving average of selected price (default close) over last `period` bars. */
  getSMA(period: number, field: PriceField = 'close'): number | undefined {
    if (period <= 0 || this.candles.length < period) return undefined;
    let sum = 0;
    for (let i = this.candles.length - period; i < this.candles.length; i++) {
      sum += this.candles[i][field];
    }
    return sum / period;
  }

  /** Exponential moving average of selected price over last `period` bars. */
  getEMA(period: number, field: PriceField = 'close'): number | undefined {
    if (period <= 0 || this.candles.length < period) return undefined;
    const k = 2 / (period + 1);
    let ema = meanNum(
      this.candles.slice(this.candles.length - period, this.candles.length).map(c => c[field])
    );
    for (let i = this.candles.length - period + 1; i < this.candles.length; i++) {
      const price = this.candles[i][field];
      ema = price * k + ema * (1 - k);
    }
    return ema;
  }

  /** Relative Strength Index (Wilder) on close. */
  getRSI(period = 14): number | undefined {
    if (this.candles.length < period + 1) return undefined;
    let gains = 0;
    let losses = 0;

    // Seed averages
    for (let i = this.candles.length - period; i < this.candles.length; i++) {
      const diff = this.candles[i].close - this.candles[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff; // add positive magnitude
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return rsi;
  }

  /** Average True Range (Wilder). */
  getATR(period = 14): number | undefined {
    if (this.candles.length < period + 1) return undefined;
    const trs: number[] = [];
    for (let i = this.candles.length - period; i < this.candles.length; i++) {
      const prevClose = this.candles[i - 1].close;
      const { high, low } = this.candles[i];
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trs.push(tr);
    }
    // Wilder's ATR = SMA of TR for seed, which is what we computed.
    return meanNum(trs);
  }

  /**
   * Standard deviation of simple returns over last `period`.
   * Returns also an annualized estimate using 5-minute bars (288 bars/day, ~365 days).
   */
  getVolatility(period = 96 /* ~8 hours */): { sd: number; annualized: number } | undefined {
    if (this.candles.length < period + 1) return undefined;
    const closes = this.getLastN(period + 1).map(c => c.close);
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }

    const mu = meanNum(returns);
    const sd = stdNum(returns, mu);

    // 5-minute bars => 12 per hour, 288 per day, ~105,120 per year (365 * 288)
    const barsPerYear = 365 * 288;
    const annualized = sd * Math.sqrt(barsPerYear);
    return { sd, annualized };
  }
}

// ---------------------- helpers ----------------------

function meanNum(arr: number[]): number {
  if (!arr.length) return NaN;
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

function stdNum(arr: number[], mean?: number): number {
  if (arr.length <= 1) return 0;
  const m = mean ?? meanNum(arr);
  let s = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i] - m;
    s += d * d;
  }
  return Math.sqrt(s / (arr.length - 1));
}
