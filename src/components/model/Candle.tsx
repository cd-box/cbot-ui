import {
  IChartApi,
  ISeriesApi,
  LineData,
  SeriesType,
  Time,
} from "lightweight-charts";

export interface CandleModel {
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: string;
  time: Time;
}

export interface CandleInput {
  [id: string]: {
    data: CandleModel[];
    options?: any;
  };
}

export type CandleModelWithTime = CandleModel & { time: Time };
export class Candle {
  key: string;
  account: string;
  pair: string;
  timeframe: string;
  interval: string;
  type: string;
  header: string;
  volumeHeader: string;
  title: string;
  data: CandleModelWithTime[];
  volumeData: LineData[];
  options?: any;
  series: ISeriesApi<SeriesType>;
  volumeSeries: ISeriesApi<SeriesType>;
  ready: boolean;

  constructor(input: CandleInput) {
    const key = Object.keys(input)[0] as string;
    const keys = key.split("|");
    this.account = keys[0];
    this.pair = keys[1];
    this.timeframe = keys[2];
    this.interval = keys[3];
    this.type = keys[4];

    this.key = key;

    this.header = `${this.pair}`;
    this.volumeHeader = `volume`;
    this.title = this.interval;
    this.options = Object.values(input)[0].options;
    const data = Object.values(input)[0].data;
    this.parseData(data);
  }
  parseData(data: CandleModel[]) {
    this.data = data.map((c) => {
      const d: CandleModelWithTime = {
        ...c,
        time: (new Date(c.openTime).getTime() / 1000) as Time,
      };
      return d;
    });
    this.volumeData = data.map((c) => {
      return {
        value: c.volume,
        time: (new Date(c.openTime).getTime() / 1000) as Time,
      };
    });
  }
  addSeries(
    chart: IChartApi,
    paneIdx: number,
    _candlePaneIdx?: number,
    _volumePaneIdx?: number
  ) {
    this.series = chart.addCandlestickSeries({
      title: this.interval,
      // upColor: getColor(),
      // downColor: getColor(),
      borderVisible: true,
      // wickUpColor: getColor(),
      // wickDownColor: getColor(),
      pane: paneIdx,
    });
    this.series.setData(this.data);
    this.volumeSeries = chart.addHistogramSeries({
      pane: paneIdx + 1,
    });
    this.volumeSeries.setData(this.volumeData);
    this.ready = true;
  }
  update(d: CandleModel) {
    const time = (new Date(d.openTime).getTime() / 1000) as Time;
    this.series.update({ ...d, time });
    this.volumeSeries.update({ value: d.volume, time });
  }
}
