import React from "react";
import {
  ActionGroup,
  Button,
  ButtonGroup,
  Form,
  Item,
  ListView,
  Text,
  TextField,
} from "@adobe/react-spectrum";
import Delete from "@spectrum-icons/workflow/Delete";
import { FileOpts } from "./types";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useDispatch, useSelector } from "starfx/react";
import { schema } from "../store/schema";
import { addToDo, removeToDo, setToDoSelection } from "../store/thunks";

type TodoItem = { id: string; content: string; checked: boolean };
type TodoList = { items: TodoItem[] };

export const Todo = ({
  listId,
  fileOpts,
}: {
  listId: string;
  fileOpts: FileOpts;
}) => {
  const dispatch = useDispatch();
  // TODO only show todos for this tab
  const todos = useSelector(schema.todos.selectTableAsList);

  return (
    <>
      <ListView
        selectionMode="multiple"
        density="spacious"
        aria-label="Async loading ListView example"
        maxWidth="size-6000"
        items={todos}
        selectionStyle="checkbox"
        selectedKeys={todos.flatMap((todo) => (todo.checked ? [todo.id] : []))}
        onSelectionChange={(selection) =>
          dispatch(setToDoSelection({ selection }))
        }
      >
        {(item) => (
          <Item key={item.id} textValue={item.content}>
            <Text>{item.content}</Text>
            <ActionGroup
              buttonLabelBehavior="hide"
              onAction={(id) => dispatch(removeToDo({ id }))}
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
        onSubmit={(event) => {
          event.preventDefault();
          const content = event?.target?.item?.value;
          dispatch(addToDo({ content }));
        }}
      >
        <TextField label="Item" name="item" isRequired id="enter-item" />
        <ButtonGroup>
          <Button type="submit" variant="primary">
            Add
          </Button>
          <Button type="reset" variant="secondary">
            Clear
            {
              // TODO fix the clear
            }
          </Button>
        </ButtonGroup>
      </Form>
    </>
  );
};
