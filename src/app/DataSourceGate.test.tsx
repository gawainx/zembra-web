import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { i18next } from "../i18n";
import { DataSourceGate } from "./DataSourceGate";

const mocks = vi.hoisted(() => ({
  activateDataSource: vi.fn(),
  getSession: vi.fn(),
  listSupabaseWorkspaces: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("../api/client", () => ({
  createSupabaseDataSourceClients: vi.fn(() => ({ notes: {}, taxonomy: {} })),
}));

vi.mock("../api/data-source-client", () => ({
  activateDataSource: mocks.activateDataSource,
  getStoredDataSourceMode: () => "backend",
  setStoredDataSourceMode: vi.fn(),
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

/** Verifies that unauthenticated Supabase entry uses a user-provided Magic Link email. */
test("sends a Magic Link with the entered email before workspace selection", async () => {
  render(
    <DataSourceGate>
      <div>应用内容</div>
    </DataSourceGate>,
  );

  fireEvent.change(await screen.findByLabelText("数据源"), {
    target: { value: "supabase" },
  });

  const emailInput = await screen.findByLabelText("邮箱地址");
  const submitButton = screen.getByRole("button", { name: "发送 Magic Link" });
  expect((submitButton as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(emailInput, { target: { value: "me@example.com" } });
  fireEvent.click(submitButton);

  expect(mocks.signInWithOtp).toHaveBeenCalledWith({
    email: "me@example.com",
    options: { emailRedirectTo: window.location.origin },
  });
});

/** Verifies that Magic Link feedback remains visible while sending and after success. */
test("shows Magic Link sending and success labels without graying out the button", async () => {
  let resolveSignIn: (value: { error: null }) => void;
  mocks.signInWithOtp.mockImplementation(
    () =>
      new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve;
      }),
  );
  render(
    <DataSourceGate>
      <div>应用内容</div>
    </DataSourceGate>,
  );

  fireEvent.change(await screen.findByLabelText("数据源"), {
    target: { value: "supabase" },
  });
  fireEvent.change(await screen.findByLabelText("邮箱地址"), {
    target: { value: "me@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "发送 Magic Link" }));

  const sendingButton = screen.getByRole("button", { name: "正在发送…" });
  expect((sendingButton as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(sendingButton);
  expect(mocks.signInWithOtp).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolveSignIn!({ error: null });
  });

  expect(screen.getByRole("button", { name: "发送成功" })).not.toBeNull();
});

/** Verifies that an authenticated session selects from its RLS-authorized workspaces. */
test("lists authorized workspaces after Supabase login", async () => {
  mocks.getSession.mockResolvedValue({ data: { session: {} }, error: null });
  mocks.listSupabaseWorkspaces.mockResolvedValue([
    { id: "workspace-a", name: "Personal notes" },
    { id: "workspace-b", name: "Work notes" },
  ]);
  render(
    <DataSourceGate>
      <div>应用内容</div>
    </DataSourceGate>,
  );

  fireEvent.change(await screen.findByLabelText("数据源"), {
    target: { value: "supabase" },
  });

  const workspaceSelect = await screen.findByLabelText("Workspace");
  expect(screen.getByText("Personal notes")).not.toBeNull();
  expect(screen.getByText("Work notes")).not.toBeNull();

  fireEvent.change(workspaceSelect, { target: { value: "workspace-b" } });
  fireEvent.click(screen.getByRole("button", { name: "进入 Zembra" }));

  expect(mocks.activateDataSource).toHaveBeenCalledWith(
    expect.objectContaining({ mode: "supabase", workspaceId: "workspace-b" }),
  );
});
