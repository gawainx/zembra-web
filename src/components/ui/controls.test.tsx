import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "./dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "./alert-dialog";

function MenuExample({
  onSelect = () => undefined,
}: {
  onSelect?: () => void;
}) {
  return (
    <>
      <Button>Outside</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>Edit</DropdownMenuItem>
          <DropdownMenuItem disabled>Unavailable</DropdownMenuItem>
          <DropdownMenuItem>Reference</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

test("menu opens by pointer, selects an action once and returns focus", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();
  render(<MenuExample onSelect={onSelect} />);
  await user.click(screen.getByRole("button", { name: "Actions" }));
  await user.click(screen.getByRole("menuitem", { name: "Edit" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("menu")).toBeNull();
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Actions" }),
    ),
  );
});

test("menu arrow navigation skips disabled items and Escape restores the trigger", async () => {
  const user = userEvent.setup();
  render(<MenuExample />);
  screen.getByRole("button", { name: "Actions" }).focus();
  await user.keyboard("{Enter}");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Edit" }),
  );
  await user.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Reference" }),
  );
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Actions" }),
    ),
  );
});

test("dialog traps Tab navigation and restores focus after Escape", async () => {
  const user = userEvent.setup();
  render(
    <>
      <Button>Background</Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Settings</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false} aria-describedby={undefined}>
          <DialogTitle>Settings panel</DialogTitle>
          <Button>First action</Button>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>,
  );
  await user.click(screen.getByRole("button", { name: "Settings" }));
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "First action" }),
  );
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Done" }),
  );
  await user.tab();
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "First action" }),
  );
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Settings" }),
    ),
  );
});

test("confirmation starts on Cancel and only explicit confirmation performs the action", async () => {
  const user = userEvent.setup();
  const confirm = vi.fn();
  function Example() {
    const [open, setOpen] = useState(false);
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button>Remove category</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Remove empty category?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the empty category.
          </AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>Remove</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Remove category" }));
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Cancel" }),
  );
  await user.keyboard("{Enter}");
  expect(confirm).not.toHaveBeenCalled();
  expect(screen.queryByRole("alertdialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Remove category" }));
  await user.click(screen.getByRole("button", { name: "Remove" }));
  expect(confirm).toHaveBeenCalledTimes(1);
});
