import { Time, LineData } from "lightweight-charts";

import { CandleInput, CandleModel, Candle } from "./Candle";
import { EquityInput, Equity } from "./Equity";
import { OrderInput, OrderModel, Order } from "./Order";
import { TAInput, TAModel, TA } from "./Ta";
export interface LineMode {
  value: number;
  time: Time;
}

type Account = any;

export type Type = "candle" | "ta" | "order" | "equity";

export interface Base {
  type: Type;
}

// export interface BotData {
//   [id: string]: CandleInput | EquityInput | OrderInput | TAInput;
// }

export interface BotModel {
  [id: string]: {
    data: CandleModel[] | TAModel[] | OrderModel[] | LineData[];
    options?: any;
  };
}
export type Component = Candle | Equity | Order | TA;

export interface UpdateData {
  [id: string]: CandleModel | LineData | OrderModel | TAModel;
}

export interface PaneOption {
  paneIdx: number;
  candlePaneIdx: number;
  volumePaneIdx: number;
}
