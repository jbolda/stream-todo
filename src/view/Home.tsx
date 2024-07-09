import React, { useCallback, useContext } from "react";
import "./App.css";
import { SystemTrayContext } from "../context";
import { Layout } from "../components/Layout";
import { Tabs } from "../components/Tabs";
import { Todo } from "../components/TodoList";
import { useAsyncList } from "react-stately";

import { Form, ButtonGroup, Button, TextField } from "@adobe/react-spectrum";

type TabListItem = { id: string; title: string };
type TabList = { items: TabListItem[] };

export default function Home() {
  const { store } = useContext(SystemTrayContext);

  const tabs = useAsyncList({
    async load() {
      const tabsFromStore: TabList | null = await store!.get("tabs");
      if (!tabsFromStore) throw new Error(`tabsFromStore: ${tabsFromStore}`);
      return tabsFromStore;
    },
  });

  const addTab = useCallback(
    async (tabValue) => {
      const newTab = {
        id: Date.now().toString(),
        title: Date.now().toString(),
      };
      await store!.set("tabs", { items: [...tabs.items, newTab] });
      tabs.append(newTab);
    },
    [tabs]
  );
  const removeTab = useCallback(
    async (tabValue) => {
      console.dir({ tabValue, tabs });
      await store!.set("tabs", {
        items: tabs.items.filter((item) => item.id !== tabValue),
      });
      tabs.remove(tabValue);
    },
    [tabs]
  );

  return (
    <Layout>
      {tabs.isLoading ? (
        <div>Loading...</div>
      ) : (
        <Tabs
          items={tabs.items.map((tab) => ({
            id: tab.id,
            title: tab.title,
            content: <Todo listId={tab.id} />,
          }))}
          addTab={addTab}
          removeTab={removeTab}
        />
      )}
    </Layout>
  );
}
