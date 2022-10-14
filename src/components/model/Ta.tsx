import {
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
  LineData,
} from "lightweight-charts";
import { LineMode } from "./Common";
import { getColor } from "../Utils";

export interface TAModel {
  ta: {
    [id: string]: number;
  };
  time: string | Time;
}

export interface TAInput {
  [id: string]: {
    data: TAModel[];
    options?: any;
  };
}

export class TA {
  key: string;
  account: string;
  pair: string;
  timeframe: string;
  interval: string;
  type: string;
  indicatorKey: string;
  indicator: string;
  period: string;
  header: string;
  title: string;
  data: TAModel[];
  options?: any;
  childData: {
    [id: string]: LineData[];
  };
  childSeries: {
    [id: string]: ISeriesApi<SeriesType>;
  };
  ready: boolean;

  constructor(input: TAInput) {
    const key = Object.keys(input)[0] as string;
    const keys = key.split("|");
    this.account = keys[0];
    this.pair = keys[1];
    this.timeframe = keys[2];
    this.interval = keys[3];
    this.type = keys[4];
    this.indicatorKey = keys[5];
    this.indicator = keys[6];
    this.period = keys[7];

    this.key = key;

    this.header = `${this.pair}`;
    this.title = `${this.indicator}:${this.period}`;

    this.childData = {};
    this.childSeries = {};

    this.options = Object.values(input)[0]?.options;
    const data = Object.values(input)[0]?.data;
    data && this.parseData(data);
  }
  parseData(data: TAModel[]) {
    data.map((d) => {
      Object.keys(d.ta).map((k) => {
        if (!this.childData[k]) {
          this.childData[k] = [];
        }
        this.childData[k].push({
          value: d.ta[k],
          time: (new Date(d.time as string).getTime() / 1000) as Time,
        });
      });
    });
  }
  addSeries(
    chart: IChartApi,
    paneIdx: number,
    volumeSeries?: ISeriesApi<SeriesType>
  ) {
    let counter = paneIdx;
    Object.keys(this.childData).map((k) => {
      const key = `${this.key}|${k}`;
      let color = localStorage.getItem(key);
      if (!color) {
        color = getColor();
        localStorage.setItem(key, color);
      }
      this.childSeries[k] = chart.addLineSeries({
        title: this.title,
        pane: counter,
      });
      this.childSeries[k].setData(this.childData[k]);
      counter++;
    });
    this.ready = true;
  }
  update(d: TAModel) {
    Object.keys(d.ta).map((k) => {
      this.childSeries[k].update({
        value: d.ta[k],
        time: (new Date(d.time as string).getTime() / 1000) as Time,
      });
    });
  }
}
