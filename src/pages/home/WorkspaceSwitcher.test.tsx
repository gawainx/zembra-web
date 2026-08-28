import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { i18next } from "../../i18n";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const workspace = {
  id: "workspace-1",
  name: "Personal notes",
  title: "Personal notes",
};

beforeEach(async () => {
  await i18next.changeLanguage("en-US");
});

/** Verifies the rename input selects the current name and submits it on Enter. */
test("selects and submits a renamed workspace on Enter", async () => {
  const renameWorkspace = vi.fn(async () => undefined);
  render(
    <WorkspaceSwitcher
      workspace={workspace}
      workspaces={[workspace]}
      onWorkspaceChange={() => undefined}
      onWorkspaceRename={renameWorkspace}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Rename workspace" }));
  const input = screen.getByRole("textbox", { name: "Workspace name" }) as HTMLInputElement;
  await waitFor(() => expect(input.selectionStart).toBe(0));
  expect(input.selectionEnd).toBe("Personal notes".length);

  fireEvent.change(input, { target: { value: "Renamed notes" } });
  fireEvent.keyDown(input, { key: "Enter" });

  await waitFor(() =>
    expect(renameWorkspace).toHaveBeenCalledWith("workspace-1", "Renamed notes"),
  );
});

/** Verifies focus loss submits a non-empty workspace name. */
test("submits a renamed workspace on focus loss", async () => {
  const renameWorkspace = vi.fn(async () => undefined);
  render(
    <WorkspaceSwitcher
      workspace={workspace}
      workspaces={[workspace]}
      onWorkspaceChange={() => undefined}
      onWorkspaceRename={renameWorkspace}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Rename workspace" }));
  const input = screen.getByRole("textbox", { name: "Workspace name" });
  fireEvent.change(input, { target: { value: "Renamed notes" } });
  fireEvent.blur(input);

  await waitFor(() =>
    expect(renameWorkspace).toHaveBeenCalledWith("workspace-1", "Renamed notes"),
  );
});

/** Verifies an empty workspace name remains editable without a write request. */
test("does not submit an empty workspace name on focus loss", () => {
  const renameWorkspace = vi.fn(async () => undefined);
  render(
    <WorkspaceSwitcher
      workspace={workspace}
      workspaces={[workspace]}
      onWorkspaceChange={() => undefined}
      onWorkspaceRename={renameWorkspace}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Rename workspace" }));
  const input = screen.getByRole("textbox", { name: "Workspace name" });
  fireEvent.change(input, { target: { value: "   " } });
  fireEvent.blur(input);

  expect(renameWorkspace).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "Workspace name" })).not.toBeNull();
});
