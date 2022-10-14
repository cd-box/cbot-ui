import { DataProvider } from "./Data";
import { BotModel, UpdateData } from "./model/Common";
import { Account } from "./Account";
import React, { useEffect, useState } from "react";
import { Layout, List, Card, Row, Col } from "antd";
const { Header, Content, Footer } = Layout;

interface AccountDataModel {
  data: BotModel[];
  updateData: UpdateData;
}
type ClassifiedBotData = {
  [id: string]: AccountDataModel;
};

export const Bot: React.FC = () => {
  const [accounts, setAccounts] = useState([] as AccountDataModel[]);
  const [classified, setClassified] = useState({} as ClassifiedBotData);
  const [updateData, setUpdateData] = useState({} as UpdateData);
  const [height, setHeight] = useState(0);

  const preProcess = (data: BotModel) => {
    const classified: ClassifiedBotData = {};
    Object.keys(data).forEach((k) => {
      const [account] = k.split("|");
      if (!classified[account]) {
        classified[account] = {
          data: [],
          updateData: {},
        };
      }
      classified[account].data.push({ [k]: data[k] });
    });
    return classified;
  };
  useEffect(() => {
    setHeight(450);
  }, []);

  useEffect(() => {
    let updatedData = {} as UpdateData;
    const updateCallback = (d: UpdateData) => {
      updatedData = { ...updatedData, ...d };
      setUpdateData(updatedData);
    };
    const getData = async () => {
      const dp = new DataProvider(updateCallback);
      const data = await dp.getData();
      if (!data) return;
      const processed = preProcess(data);
      setClassified(processed);
      const values = Object.values(processed);
      setAccounts(values);
    };
    getData();
  }, []);
  useEffect(() => {
    Object.keys(updateData).map((u) => {
      const [account] = u.split("|");

      if (classified[account]) {
        const existing = classified[account].updateData;
        classified[account].updateData = {
          ...existing,
          ...updateData,
        };
      }
    });
    const processed = Object.values(classified);
    setAccounts(processed);
  }, [updateData]);

  return (
    <>
      {/* {accounts.map((d: any, i: number) => {
        return (
          <Row key={"row" + i}>
            <Col span={23}>
              <Account
                key={"col1" + i}
                getSeries={getSeries}
                data={d}
              ></Account>
            </Col>
            <Col span={11} offset={1}>
              <Account
                key={"col2" + i}
                getSeries={getSeries}
                data={d}
              ></Account>
            </Col>
          </Row>
        );
      })} */}
      <List
        grid={{ gutter: 1, column: 1 }}
        dataSource={accounts}
        bordered
        renderItem={(item) => (
          <List.Item>
            <Account
              data={item.data}
              height={height}
              updateData={item.updateData}
            ></Account>
          </List.Item>
        )}
      />
    </>
  );
};
