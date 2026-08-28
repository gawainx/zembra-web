import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { i18next } from "../i18n";
import { SupabaseEntry } from "./SupabaseEntry";

const mocks = vi.hoisted(() => ({
  activateDataSource: vi.fn(),
  getSession: vi.fn(),
  listSupabaseWorkspaces: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("../api/client", () => ({
  activateDataSource: mocks.activateDataSource,
}));

vi.mock("../api/supabase.client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mocks.getSession,
      signInWithOtp: mocks.signInWithOtp,
    },
  }),
  getSupabasePublicConfig: () => ({
    publishableKey: "publishable-key",
    url: "https://project.supabase.co",
  }),
  listSupabaseWorkspaces: mocks.listSupabaseWorkspaces,
  renameSupabaseWorkspace: vi.fn(),
  SupabaseConfigurationError: class SupabaseConfigurationError extends Error {},
}));

beforeEach(async () => {
  await i18next.changeLanguage("zh-CN");
  mocks.activateDataSource.mockReset();
  mocks.getSession.mockReset();
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.listSupabaseWorkspaces.mockReset();
  mocks.listSupabaseWorkspaces.mockResolvedValue([]);
  mocks.signInWithOtp.mockReset();
  mocks.signInWithOtp.mockResolvedValue({ error: null });
});

afterEach(() => {
  window.localStorage.clear();
});

/** Verifies the Supabase-only entry sends a Magic Link without a source selector. */
test("sends a Magic Link with the entered email", async () => {
  render(
    <SupabaseEntry>
      <div>应用内容</div>
    </SupabaseEntry>,
  );

  const emailInput = await screen.findByLabelText("邮箱地址");
  expect(screen.queryByLabelText("数据源")).toBeNull();
  fireEvent.change(emailInput, { target: { value: "me@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "发送 Magic Link" }));

  expect(mocks.signInWithOtp).toHaveBeenCalledWith({
    email: "me@example.com",
    options: { emailRedirectTo: window.location.origin },
  });
});

/** Verifies an authenticated session selects only RLS-authorized workspaces. */
test("activates an authorized workspace after Supabase login", async () => {
  mocks.getSession.mockResolvedValue({ data: { session: {} }, error: null });
  mocks.listSupabaseWorkspaces.mockResolvedValue([
    { id: "workspace-a", name: "Personal notes" },
    { id: "workspace-b", name: "Work notes" },
  ]);
  render(
    <SupabaseEntry>
      <div>应用内容</div>
    </SupabaseEntry>,
  );

  const workspaceSelect = await screen.findByLabelText("Workspace");
  fireEvent.change(workspaceSelect, { target: { value: "workspace-b" } });
  fireEvent.click(screen.getByRole("button", { name: "进入 Zembra" }));

  await act(async () => undefined);
  expect(mocks.activateDataSource).toHaveBeenCalledWith(
    expect.anything(),
    "workspace-b",
  );
});
