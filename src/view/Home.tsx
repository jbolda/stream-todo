import React from "react";
import { Layout } from "../components/Layout";
import { Tabs } from "../components/Tabs";
import { Todo } from "../components/TodoList";
import { useDispatch, useSelector } from "starfx/react";
import { schema } from "../store/schema";
import { addStream, removeStream } from "../store/thunks/stream";

export default function Home() {
  const dispatch = useDispatch();
  const tabs = useSelector(schema.streams.selectTableAsList);

  return (
    <Layout>
      <Tabs
        items={tabs.map((tab) => ({
          id: tab.id,
          title: tab.title,
          content: <Todo stream={tab} />,
        }))}
        addTab={() => dispatch(addStream())}
        removeTab={(tabValue: string) =>
          dispatch(removeStream({ id: tabValue }))
        }
      />
    </Layout>
  );
}
