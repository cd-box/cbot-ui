import {
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
  SeriesMarker,
  SeriesMarkerPosition,
  SeriesMarkerShape,
} from "lightweight-charts";

type Side = "BUY" | "SELL";
type Status = "FILLED";
type Type = "STOP_LOSS" | "LIMIT";

export interface OrderModel {
  side: Side;
  type: Type;
  status: Status;
  price: number;
  volume: number;
  stopPrice: number;
  quantity: number;
  latestPrice: number;
  executionType: string;
  created_at: string;
  updated_at: string;
  rejectReason: string;
}
export interface OrderInput {
  [id: string]: {
    data: OrderModel[];
    options?: any;
  };
}
export class Order {
  key: string;
  account: string;
  pair: string;
  timeframe: string;
  interval: string;
  type: string;
  headerDesc: string;
  title: string;
  data: SeriesMarker<Time>[];
  options?: any;
  ready: boolean;

  candleSeries: ISeriesApi<SeriesType>;

  constructor(input: OrderInput) {
    const key = Object.keys(input)[0] as string;
    const keys = key.split("|");
    this.account = keys[0];
    this.pair = keys[1];
    this.timeframe = keys[2];
    this.interval = keys[3];
    this.type = keys[4];

    this.key = key;
    this.data = [];

    this.headerDesc = `${this.account}/${this.pair}`;
    this.title = this.interval;
    this.options = Object.values(input)[0]?.options;
    const data = Object.values(input)[0]?.data;
    data && this.parseData(data);
  }
  parseData(data: OrderModel[]) {
    this.data = data
      .filter((o) => {
        return o.status === "FILLED";
      })
      .map((o) => {
        const isBuy = o.side === "BUY";
        const shape: SeriesMarkerShape = isBuy ? "arrowUp" : "arrowDown";
        const position: SeriesMarkerPosition = isBuy ? "belowBar" : "aboveBar";
        const marker = {
          time: (new Date(o.updated_at).getTime() / 1000) as Time,
          position,
          color: "#f68410",
          shape,
          text: o.side,
        };
        return marker;
      });
  }
  addSeries(chart: IChartApi, candleSeries: ISeriesApi<SeriesType>) {
    this.candleSeries = candleSeries;
    candleSeries.setMarkers(this.data);
    this.ready = true;
  }
  update(o: OrderModel) {
    const isBuy = o.side === "BUY";
    const shape: SeriesMarkerShape = isBuy ? "arrowUp" : "arrowDown";
    const position: SeriesMarkerPosition = isBuy ? "belowBar" : "aboveBar";
    const marker = {
      time: (new Date(o.updated_at).getTime() / 1000) as Time,
      position,
      color: "#f68410",
      shape,
      text: o.side,
    };
    this.data.push(marker);
    if (this.candleSeries) {
      this.candleSeries.setMarkers(this.data);
    }
  }
}
