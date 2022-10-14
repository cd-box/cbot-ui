import { BotModel, UpdateData } from "./model/Common";
type UpdateCallback = (data: UpdateData) => void;

declare var data: BotModel;
declare var SERVER: string;

export class DataProvider {
  update: UpdateCallback;
  server: string;
  constructor(update: UpdateCallback) {
    this.update = update;
    this.server = SERVER || "";
  }
  async getData() {
    if (data === undefined) {
      const data = await this.getLiveData();
      setTimeout(() => {
        this.setupUpdater();
      }, 1000);
      return data;
    }

    return this.getLocalData();
  }

  setupUpdater() {
    const stream = new EventSource(`${this.server}/stream`);
    window.onbeforeunload = function () {
      stream.close();
      // return "Do you really want to close?";
    };
    stream.addEventListener("open", (e) => {
      console.log("stream connected");
    });
    stream.addEventListener("error", (e) => {
      console.log("stream connection has error", e);
      stream.close();
    });
    stream.addEventListener("message", (d) => {
      try {
        const data = JSON.parse(d.data);
        this.update(data);
      } catch {}
    });
  }
  async getLiveData(): Promise<BotModel | undefined> {
    // fetch data from server
    const initData = await fetch(`${this.server}/init`);
    const data = await initData.json();
    try {
      const json = JSON.parse(data);
      // console.log(JSON.stringify(json));
      return json;
    } catch {}
  }
  validate() {}
  async getLocalData(): Promise<BotModel | undefined> {
    if (data === undefined) {
      console.log("have NO local data");
      return;
    }
    return data;
  }
}
