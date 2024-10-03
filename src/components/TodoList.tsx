import {
  ActionGroup,
  Button,
  ButtonGroup,
  Form,
  Item,
  ListView,
  type Selection,
  Text,
  TextField,
  useAsyncList,
} from "@adobe/react-spectrum";
import Delete from "@spectrum-icons/workflow/Delete";
import { useCallback, useContext, useState } from "react";
import { SystemTrayContext } from "../context";

type TodoItem = { id: string; content: string; checked: boolean };
type TodoList = { items: TodoItem[] };

export const Todo = ({ listId }: { listId: string }) => {
  const { store } = useContext(SystemTrayContext);

  let [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

  let todo = useAsyncList({
    async load() {
      const tabsFromStore: TodoList | null = await store!.get(`data.${listId}`);
      if (!tabsFromStore) {
        const noItems = {
          items: [], // { id: "default", content: "add something please" }
        } as TodoList;
        await store!.set(`data.${listId}`, noItems);
        return noItems;
      }
      const selected = tabsFromStore.items
        .filter((item) => item.checked)
        .map((item) => item.id);
      setSelectedKeys(new Set(selected));

      return tabsFromStore;
    },
  });

  const handleSubmit = useCallback(
    async (event, previousItems) => {
      // prevent form from default server send and page refresh
      event.preventDefault();
      const todoItemText = event.target?.item?.value;
      // reset the form
      event.currentTarget.reset();

      if (todoItemText) {
        // if we need to decode then
        // new TextDecoder().decode(base64ToBytes("YSDEgCDwkICAIOaWhyDwn6aE")); // "a Ā 𐀀 文 🦄"
        const todoItem = {
          id: bytesToBase64(new TextEncoder().encode(todoItemText)),
          content: todoItemText,
          checked: false,
        };

        const storeItems: TodoItem[] = [...previousItems, todoItem];
        await store!.set(`data.${listId}`, {
          items: storeItems,
        });
        todo.append(todoItem);
      }
    },
    [store]
  );

  const handleDelete = useCallback(
    async (key, previousItems) => {
      await store!.set(`data.${listId}`, {
        items: previousItems.filter((item) => item.id !== key),
      });
      todo.remove(key);
    },
    [store]
  );

  const handleSelectionChange = useCallback(
    async (currentSet: Selection, currentItems) => {
      const updatedStoreItems = currentItems.map((item: TodoItem) => {
        const checked = currentSet === "all" || currentSet.has(item.id);
        return { ...item, checked };
      });
      await store!.set(`data.${listId}`, {
        items: updatedStoreItems,
      });
      setSelectedKeys(currentSet);
    },
    [store]
  );

  return (
    <>
      <ListView
        selectionMode="multiple"
        density="spacious"
        aria-label="Async loading ListView example"
        maxWidth="size-6000"
        items={todo.items}
        loadingState={todo.loadingState}
        selectionStyle="checkbox"
        selectedKeys={selectedKeys}
        onSelectionChange={async (change) =>
          await handleSelectionChange(change, todo.items)
        }
      >
        {(item) => (
          <Item key={item.id} textValue={item.content}>
            <Text>{item.content}</Text>
            <ActionGroup
              buttonLabelBehavior="hide"
              onAction={async (actionKey) =>
                await handleDelete(actionKey, todo.items)
              }
            >
              <Item key={item.id} textValue="Delete">
                <Delete />
                <Text>Delete</Text>
              </Item>
            </ActionGroup>
          </Item>
        )}
      </ListView>
      <Form
        validationBehavior="native"
        autoComplete="off"
        maxWidth="size-3000"
        isQuiet
        onSubmit={async (event) => await handleSubmit(event, todo.items)}
      >
        <TextField label="Item" name="item" isRequired id="enter-item" />
        <ButtonGroup>
          <Button type="submit" variant="primary">
            Add
          </Button>
          <Button type="reset" variant="secondary">
            Clear
          </Button>
        </ButtonGroup>
      </Form>
    </>
  );
};

function base64ToBytes(base64) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

function bytesToBase64(bytes) {
  const binString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte)
  ).join("");
  return btoa(binString);
}

// Usage
