import {
  ActionGroup,
  Flex,
  Item,
  Tabs as SpectrumTabs,
  TabList,
  TabPanels,
} from "@adobe/react-spectrum";

export const Tabs = ({
  items,
  addTab,
  removeTab,
}: {
  items: { id: string; title: string; content: any }[];
  addTab: any;
  removeTab: any;
}) => {
  if (items.length === 0) return null;
  return (
    <SpectrumTabs aria-label="Items That We Will Do" items={items}>
      <Flex>
        <TabList flex="1 1 auto" minWidth="0px">
          {items.map((item) => (
            <Item key={item.id}>{item.title}</Item>
          ))}
        </TabList>
        <div
          style={{
            display: "flex",
            flex: "0 0 auto",
            borderBottom:
              "var(--spectrum-alias-border-size-thick) solid var(--spectrum-global-color-gray-300)",
          }}
        >
          <ActionGroup
            disabledKeys={items.length === 1 ? ["remove"] : undefined}
            onAction={(val) => (val === "add" ? addTab() : removeTab())}
          >
            <Item key="add">Add Tab</Item>
            <Item key="remove">Remove Tab</Item>
          </ActionGroup>
        </div>
      </Flex>
      <TabPanels>
        {items.map((item) => (
          <Item key={item.id}>{item.content}</Item>
        ))}
      </TabPanels>
    </SpectrumTabs>
  );
};
