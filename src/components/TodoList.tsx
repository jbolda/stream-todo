import React from "react";
import {
  ActionGroup,
  Button,
  ButtonGroup,
  Checkbox,
  Form,
  Item,
  ListView,
  Text,
  TextField,
  useDragAndDrop,
} from "@adobe/react-spectrum";
import Delete from "@spectrum-icons/workflow/Delete";
import {
  getLocalTimeZone,
  now,
  parseAbsoluteToLocal,
} from "@internationalized/date";
import { useDispatch, useSelector } from "starfx/react";
import { Stream } from "../store/schema";
import {
  addToDo,
  removeToDo,
  setToDoOrder,
  setToDoSelection,
} from "../store/thunks";
import { todosByStreamFilenameWithOrder } from "../store/selectors/todo";
import { AnyState } from "starfx";

export const Todo = ({ stream }: { stream: Stream }) => {
  const dispatch = useDispatch();
  const todos = useSelector((s: AnyState) =>
    todosByStreamFilenameWithOrder(s, stream.filename)
  );

  let { dragAndDropHooks } = useDragAndDrop({
    getItems(keys) {
      return [...keys].map((key) => {
        let item = todos.find((todo) => todo.id === key);
        return {
          "custom-app-type-reorder": JSON.stringify(item),
          "text/plain": item?.content ?? "",
        };
      });
    },
    acceptedDragTypes: ["custom-app-type-reorder"],
    onReorder: async (e) => {
      let { keys, target } = e;
      dispatch(setToDoOrder({ keys, target }));
    },
    getAllowedDropOperations: () => ["move"],
  });

  return (
    <>
      <ListView
        selectionMode="single"
        selectionStyle="highlight"
        aria-label="Async loading ListView example"
        maxWidth="size-6000"
        items={todos}
        overflowMode="wrap"
        dragAndDropHooks={dragAndDropHooks}
      >
        {(item) => (
          <Item textValue={item.content}>
            <Checkbox
              aria-label="completion status"
              isSelected={item.checked}
              onChange={(isSelected: boolean) =>
                dispatch(setToDoSelection({ isSelected, id: item.id }))
              }
            />
            <Text>{item.content}</Text>
            {item?.finishedAt ? (
              <Text slot="description">
                {humanizeDuration(item.finishedAt)}
              </Text>
            ) : null}
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
          dispatch(addToDo({ filename: stream.filename, content }));
          event?.target?.reset();
          event?.target?.item?.focus();
        }}
      >
        <TextField
          label="Item"
          name="item"
          isRequired
          id="enter-item"
          spellCheck="true"
        />
        <ButtonGroup>
          <Button type="submit" variant="primary">
            Add
          </Button>
        </ButtonGroup>
      </Form>
    </>
  );
};

const formatDuration = new Intl.DurationFormat("en", { style: "narrow" });
function humanizeDuration(finishedAtDateTime: string) {
  const secondsFromDT =
    now(getLocalTimeZone()).compare(parseAbsoluteToLocal(finishedAtDateTime)) /
    1000;

  if (secondsFromDT > 24 * 60 * 60) {
    return `completed some time ago`;
  } else {
    const hours = Math.floor(secondsFromDT / 3600);
    const minutes = Math.floor((secondsFromDT % 3600) / 60);
    const seconds = Math.round(secondsFromDT % 60);
    const duration = { hours, minutes, seconds };
    return `completed ${formatDuration.format(duration)} ago`;
  }
}
