import {
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
  LineData,
} from "lightweight-charts";

export interface EquityInput {
  [id: string]: {
    data: LineData[];
    options?: any;
  };
}

export class Equity {
  key: string;
  account: string;
  pair: string;
  timeframe: string;
  interval: string;
  type: string;
  header: string;
  title: string;
  data: LineData[];
  options?: any;
  series: ISeriesApi<SeriesType>;
  ready: boolean;

  constructor(input: EquityInput) {
    const key = Object.keys(input)[0] as string;
    const keys = key.split("|");
    this.account = keys[0];
    this.pair = keys[1];
    this.timeframe = keys[2];
    this.interval = keys[3];
    this.type = keys[4];

    this.key = key;
    this.data = [];

    this.header = `equity`;
    this.title = "equity";
    this.options = Object.values(input)[0]?.options;
    const data = Object.values(input)[0]?.data;
    data && this.parseData(data);
  }
  parseData(data: LineData[]) {
    this.data = data.map((e) => {
      return {
        value: e.value,
        time: (new Date(e.time as string).getTime() / 1000) as Time,
      };
    });
  }
  addSeries(chart: IChartApi, paneIdx: number) {
    this.series = chart.addLineSeries({
      title: this.title,
      pane: paneIdx,
    });
    this.series.setData(this.data);
    this.ready = true;
  }
  update(e: LineData) {
    const equity = {
      value: e.value,
      time: (new Date(e.time as string).getTime() / 1000) as Time,
    };
    this.series.update(equity);
  }
}
