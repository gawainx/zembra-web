import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { i18next } from "../i18n";
import { DataSourceGate } from "./DataSourceGate";

const mocks = vi.hoisted(() => ({
  activateDataSource: vi.fn(),
  getSession: vi.fn(),
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
    workspaces: [
      { id: "workspace-a", name: "Personal notes", email: "a@example.com" },
      { id: "workspace-b", name: "Work notes", email: "b@example.com" },
    ],
  }),
  SupabaseConfigurationError: class SupabaseConfigurationError extends Error {},
}));

beforeEach(async () => {
  await i18next.changeLanguage("zh-CN");
  mocks.activateDataSource.mockReset();
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.signInWithOtp.mockResolvedValue({ error: null });
  window.sessionStorage.clear();
});

/** Verifies that selecting a workspace exposes its bound email and sends its Magic Link. */
test("fills the bound email after selecting a Supabase workspace", async () => {
  render(
    <DataSourceGate>
      <div>应用内容</div>
    </DataSourceGate>,
  );

  fireEvent.change(await screen.findByLabelText("数据源"), {
    target: { value: "supabase" },
  });

  const workspaceSelect = await screen.findByLabelText("Workspace");
  const emailInput = screen.getByLabelText("邮箱地址") as HTMLInputElement;
  const submitButton = screen.getByRole("button", { name: "发送 Magic Link" });

  expect((workspaceSelect as HTMLSelectElement).value).toBe("");
  expect(emailInput.value).toBe("");
  expect(emailInput.readOnly).toBe(true);
  expect((submitButton as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(workspaceSelect, { target: { value: "workspace-b" } });

  expect(emailInput.value).toBe("b@example.com");
  expect((submitButton as HTMLButtonElement).disabled).toBe(false);

  fireEvent.click(submitButton);

  expect(mocks.signInWithOtp).toHaveBeenCalledWith({
    email: "b@example.com",
    options: { emailRedirectTo: window.location.origin },
  });
  expect(window.sessionStorage.getItem("zembra.supabaseWorkspaceId")).toBe(
    "workspace-b",
  );
});
