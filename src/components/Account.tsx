import React, { useEffect, useRef, useState, CSSProperties } from "react";

import {
  Candle,
  CandleInput,
  CandleModel,
  CandleModelWithTime,
} from "./model/Candle";
import { TA, TAInput, TAModel } from "./model/Ta";
import { Order, OrderInput, OrderModel } from "./model/Order";
import { Equity, EquityInput } from "./model/Equity";
import { BotModel, Component, UpdateData } from "./model/Common";

import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  SeriesType,
  TickMarkType,
} from "lightweight-charts";

// todo: in style
// need to set .ant-list-item.min-height to totalHeight

export interface Props {
  data: BotModel[];
  height: number;
  updateData: UpdateData;
}

export interface AccountModel {
  [id: string]: Candle | TA | Order | Equity;
}

const parse = (data: BotModel[]) => {
  const parsed: AccountModel[] = [];
  let candleMainKey = "";
  let hasOrder = false;
  let hasEquity = false;
  data.forEach((d) => {
    const key = Object.keys(d)[0];
    let component: Component;
    const [_account, _pair, tf, _interval, type, _id, _taName, _period] =
      key.split("|");
    if (type === "candle") {
      if (tf === "main") {
        candleMainKey = key;
      }
      const candleInput = d as CandleInput;
      component = new Candle(candleInput);
    } else if (type === "ta") {
      const taInput = d as TAInput;
      component = new TA(taInput);
    } else if (type === "order") {
      hasOrder = true;
      const orderInput = d as OrderInput;
      component = new Order(orderInput);
    } else if (type === "equity") {
      hasEquity = true;
      const equityInput = d as EquityInput;
      component = new Equity(equityInput);
    } else {
      return;
    }
    parsed.push({ [key]: component });
  });
  if (!hasOrder) {
    const orderKey = candleMainKey.replace("candle", "order");
    const orderInput = { [orderKey]: { data: [] } };
    const component = new Order(orderInput);
    parsed.push({ [orderKey]: component });
  }
  if (!hasEquity) {
    const equityKey = candleMainKey.replace("candle", "equity");
    const equityInput = { [equityKey]: { data: [] } };
    const component = new Equity(equityInput);
    parsed.push({ [equityKey]: component });
  }
  return parsed;
};

const sort = (data: AccountModel[]) => {
  return data.sort((aa, bb) => {
    const a = Object.values(aa)[0];
    const b = Object.values(bb)[0];
    if (a.timeframe === "main" && b.timeframe === "reference") {
      return -1;
    } else if (a.timeframe == "reference" && b.timeframe === "main") {
      return 1;
    } else {
      if (a.type === "candle" && b.type === "ta") {
        return -1;
      } else if (a.type === "ta" && b.type == "candle") {
        return 1;
      }
      if (a.type == "candle" && b.type === "equity") {
        return -1;
      } else if (a.type === "equity" && b.type === "candle") {
        return 1;
      }
      if (a.type === "ta" && b.type === "equity") {
        return -1;
      } else if (a.type === "equity" && b.type === "ta") {
        return 1;
      }
      if (a.type === "order") {
        return 1;
      }
      if (b.type === "order") {
        return -1;
      }
      return 0;
    }
  });
};

interface SeriesWithData {
  series: ISeriesApi<SeriesType>;
  data: LineData[] | CandleModelWithTime[];
  header?: string;
}

// const Legend = (props: any) => {
//   const { meta, paneRef } = props;
//   return ReactDOM.createPortal(<div style={style}>{meta.title}</div>, paneRef);
// };

const draw = (
  seriesWithData: SeriesWithData[],
  chart: IChartApi,
  sorted: AccountModel[]
) => {
  let candleSeries: ISeriesApi<SeriesType> | undefined;
  let volumeSeries: ISeriesApi<SeriesType> | undefined;
  for (const d of sorted) {
    const model = Object.values(d)[0];
    if (model.type === "candle") {
      const candle = model as Candle;
      candle.addSeries(chart, seriesWithData.length);
      seriesWithData.push({
        series: candle.series,
        data: candle.data,
        header: candle.header,
      });
      seriesWithData.push({
        series: candle.volumeSeries,
        data: candle.volumeData,
        header: candle.volumeHeader,
      });
      candleSeries = candle.series;
      volumeSeries = candle.volumeSeries;
    } else if (model.type === "ta") {
      const ta = model as TA;
      ta.addSeries(chart, seriesWithData.length, volumeSeries);
      for (const k in ta.childSeries) {
        if (ta.childSeries.hasOwnProperty(k)) {
          seriesWithData.push({
            series: ta.childSeries[k],
            data: ta.childData[k],
            header: ta.header,
          });
        }
      }
    } else if (model.type === "equity") {
      const equity = model as Equity;
      equity.addSeries(chart, seriesWithData.length);
      seriesWithData.push({
        series: equity.series,
        data: equity.data,
        header: equity.header,
      });
    } else if (model.type === "order" && candleSeries !== undefined) {
      const order = model as Order;
      order.addSeries(chart, candleSeries);
    }
  }
};

export const Account = (props: Props) => {
  const { data, height, updateData } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi>();
  const [paneRefs, setPaneRefs] = useState<HTMLElement[]>();
  const [series, setSeries] = useState({} as AccountModel);
  const [seriesWithData, setSeriesWithData] = useState([] as SeriesWithData[]);

  useEffect(() => {
    if (!containerRef || !containerRef.current) {
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`timeZone=${timeZone}`);
    // create chart with chart options
    const chartOptions = {
      height,
      timeScale: {
        timeVisible: true,
        // borderColor: getColor(),
        tickMarkFormatter: (
          time: number,
          tickMarkType: TickMarkType,
          locale: string
        ) => {
          const date = new Date(time * 1000).toLocaleString("en-AU", {
            timeZone,
            hour12: false,
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            formatMatcher: "basic",
          });
          return date;
        },
      },

      localization: {
        timeFormatter: (timestamp: number) => {
          return new Date(timestamp * 1000).toLocaleString("en-AU", {
            timeZone,
            hour12: false,
          });
        },
      },
      overlayPriceScales: {
        scaleMargins: {
          top: 0.6,
          bottom: 0,
        },
      },
      rightPriceScale: {
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.08,
        },
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
    };
    const chart = createChart(containerRef.current, chartOptions);
    setChart(chart);

    return () => {
      setChart(undefined);
      chart?.remove();
    };
  }, []);
  useEffect(() => {
    const resizeHandler = () => {
      if (!containerRef || !containerRef.current) {
        return;
      }
      chart?.resize(
        containerRef.current.offsetWidth,
        containerRef.current.offsetHeight
      );
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [chart, height]);

  useEffect(() => {
    if (!chart || !data?.length) return;

    console.log("updateData in Account");
    console.log(JSON.stringify(updateData));

    const parsed = parse(data);
    const sorted = sort(parsed);
    const sd: SeriesWithData[] = [];
    draw(sd, chart, sorted);
    setSeriesWithData(sd);
    const series = {} as AccountModel;

    sorted.forEach((a) => {
      const k = Object.keys(a)[0];
      series[k] = a[k];
    });
    setSeries(series);
  }, [chart, data]);

  useEffect(() => {
    if (!chart) return;
    setTimeout(() => {
      setPaneRefs(chart.getPaneElements());
    }, 0);
  }, [chart, series]);
  useEffect(() => {
    Object.keys(updateData).forEach((u) => {
      const [_account, _pair, _tf, _intl, type] = u.split("|");
      if (type === "candle") {
        const candle = series[u] as Candle;
        const data = updateData[u] as CandleModel;
        candle.update(data);
      } else if (type === "ta") {
        const ta = series[u] as TA;
        const data = updateData[u] as TAModel;
        ta?.update(data);
      } else if (type === "order") {
        const order = series[u] as Order;
        const data = updateData[u] as OrderModel;
        order?.update(data);
      } else if (type === "equity") {
        const equity = series[u] as Equity;
        const data = updateData[u] as LineData;
        equity?.update(data);
      }
    });
  }, [chart, series, updateData]);
  useEffect(() => {
    const innerHTMLs: HTMLDivElement[] = [];
    function showLatestData() {
      chart?.getPaneElements().map((pane, i) => {
        const data = seriesWithData[i]?.data;
        const last = data[data.length - 1];
        let model = last as CandleModelWithTime;
        let content = "";
        if (model.high !== undefined) {
          content =
            "O" +
            model.open +
            " H" +
            model.high +
            " L" +
            model.low +
            " C" +
            model.close;
        } else {
          const lineData = last as LineData;
          content = `${lineData.value}`;
        }
        innerHTMLs[i].innerHTML = seriesWithData[i].header + " " + content;
      });
    }
    if (!chart) return;
    setTimeout(() => {
      chart.getPaneElements().map((pane, i) => {
        const legend = document.createElement("div");
        legend.setAttribute(
          "style",
          `position: absolute; left: 12px; top: 10px; z-index: 1; font-size: 12px; font-family: sans-serif; line-height: 16px; font-weight: 300;`
        );
        pane.appendChild(legend);

        const firstRow = document.createElement("div");
        innerHTMLs.push(firstRow);
        firstRow.style.color = "black";
        legend.appendChild(firstRow);
      });
      showLatestData();

      chart.subscribeCrosshairMove((params) => {
        if (params.seriesData && params.paneIndex !== undefined) {
          const v = params.seriesData.get(
            seriesWithData[params.paneIndex].series
          );
          if (!v) return;

          let content = "";
          const model = v as CandleModelWithTime;
          if (model.high !== undefined) {
            content =
              "O" +
              model.open +
              " H" +
              model.high +
              " L" +
              model.low +
              " C" +
              model.close;
          } else {
            const lineData = v as LineData;
            content = `${lineData.value}`;
          }
          innerHTMLs[params.paneIndex].innerHTML =
            seriesWithData[params.paneIndex].header + " " + content;
          return;
        }
        // showLatestData();
      });
    }, 0);
  }, [chart, paneRefs, seriesWithData, updateData]);

  let key = 0;
  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: height,
      }}
    ></div>
  );
};

const style = {
  color: "blue",
  position: "absolute",
  padding: "0px",
  top: "5px",
  left: "5px",
  zIndex: 1,
} as CSSProperties;
