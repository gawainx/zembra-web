import { getConfiguredSupabaseWorkspaceId, setConfiguredSupabaseWorkspaceId } from "../api/backendConfig";
import { SupabaseConfigurationError } from "../api/supabase.client";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { i18next } from "../i18n";
import { SupabaseEntry } from "./SupabaseEntry";

const mocks = vi.hoisted(() => ({
  activateDataSource: vi.fn(),
  getSession: vi.fn(),
  getSupabasePublicConfig: vi.fn(),
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
  getSupabasePublicConfig: mocks.getSupabasePublicConfig,
  listSupabaseWorkspaces: mocks.listSupabaseWorkspaces,
  renameSupabaseWorkspace: vi.fn(),
  SupabaseConfigurationError: class SupabaseConfigurationError extends Error { name = "SupabaseConfigurationError"; },
}));

beforeEach(async () => {
  await i18next.changeLanguage("zh-CN");
  mocks.getSupabasePublicConfig.mockReset();
  mocks.getSupabasePublicConfig.mockReturnValue({ publishableKey: "publishable-key", url: "https://project.supabase.co" });
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
  vi.restoreAllMocks();
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function expectNoEntryForms() {
  expect(screen.queryByLabelText("邮箱地址")).toBeNull();
  expect(screen.queryByLabelText("Workspace")).toBeNull();
}

test("keeps both forms hidden throughout session and workspace restoration", async () => {
  const session = deferred<{ data: { session: object }; error: null }>();
  const workspaces = deferred<{ id: string; name: string }[]>();
  mocks.getSession.mockReturnValue(session.promise);
  mocks.listSupabaseWorkspaces.mockReturnValue(workspaces.promise);
  setConfiguredSupabaseWorkspaceId("workspace-a");
  render(<SupabaseEntry><div>笔记独立加载中</div></SupabaseEntry>);
  expect(screen.getByRole("status").textContent).toBe("正在加载…");
  expectNoEntryForms();
  await act(async () => session.resolve({ data: { session: {} }, error: null }));
  expect(screen.getByRole("status").textContent).toBe("正在加载…");
  expectNoEntryForms();
  await act(async () => workspaces.resolve([{ id: "workspace-a", name: "Notes" }]));
  expect(screen.getByText("笔记独立加载中")).toBeTruthy();
  expect(screen.queryByRole("status")).toBeNull();
  expectNoEntryForms();
  expect(mocks.activateDataSource).toHaveBeenCalledWith(expect.anything(), "workspace-a");
});

test.each([undefined, "removed-workspace"])("preserves manual selection with saved workspace %s", async (saved) => {
  if (saved) setConfiguredSupabaseWorkspaceId(saved);
  mocks.getSession.mockResolvedValue({ data: { session: {} }, error: null });
  mocks.listSupabaseWorkspaces.mockResolvedValue([{ id: "workspace-a", name: "Notes" }]);
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  const select = await screen.findByLabelText("Workspace");
  expect((select as HTMLSelectElement).value).toBe("");
  expect(getConfiguredSupabaseWorkspaceId()).toBeUndefined();
  expect(mocks.activateDataSource).not.toHaveBeenCalled();
});

test("preserves the no-workspaces result", async () => {
  mocks.getSession.mockResolvedValue({ data: { session: {} }, error: null });
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  expect((await screen.findByRole("alert")).textContent).toContain("当前账号没有可用 workspace");
  expect(screen.queryByLabelText("邮箱地址")).toBeNull();
});

test.each(["refresh_token_not_found", "refresh_token_already_used", "session_expired", "session_not_found"])("shows email only after confirmed session invalidation: %s", async (code) => {
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: { code, status: 400 } });
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  expect(await screen.findByLabelText("邮箱地址")).toBeTruthy();
  expect(mocks.listSupabaseWorkspaces).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("handles the SDK missing-session error", async () => {
  mocks.getSession.mockRejectedValue({ name: "AuthSessionMissingError", status: 400 });
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  expect(await screen.findByLabelText("邮箱地址")).toBeTruthy();
});

test.each([
  ["session", new TypeError("Failed to fetch"), "恢复登录会话", "网络请求未获得可用响应"],
  ["workspaces", { code: "", message: "TypeError: Failed to fetch", details: "secret-stack" }, "加载 workspace", "网络请求未获得可用响应"],
  ["workspaces", { code: "42501", message: "secret-stack" }, "加载 workspace", "服务拒绝访问"],
  ["session", { status: 503, message: "secret-stack" }, "恢复登录会话", "服务暂时无法处理请求"],
  ["session", { status: 401, message: "secret-stack" }, "恢复登录会话", "尚不能确认登录会话已失效"],
  ["session", { status: 429 }, "恢复登录会话", "请求过于频繁"],
  ["workspaces", { code: "PGRST205" }, "加载 workspace", "找不到可访问的 workspace 数据表"],
  ["session", new Error("secret-stack token=secret"), "恢复登录会话", "返回信息不足以确认具体原因"],
])("shows actionable %s failures without exposing exceptions", async (stage, error, label, reason) => {
  setConfiguredSupabaseWorkspaceId("workspace-a");
  if (stage === "session") mocks.getSession.mockRejectedValue(error);
  else {
    mocks.getSession.mockResolvedValue({ data: { session: {} }, error: null });
    mocks.listSupabaseWorkspaces.mockRejectedValue(error);
  }
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("加载失败");
  expect(alert.textContent).toContain(label);
  expect(alert.textContent).toContain(reason);
  expect(alert.textContent).not.toContain("secret");
  expectNoEntryForms();
  expect(screen.queryByRole("status")).toBeNull();
  expect(getConfiguredSupabaseWorkspaceId()).toBe("workspace-a");
});

test("reports missing deployment configuration instead of showing email", async () => {
  mocks.getSupabasePublicConfig.mockImplementationOnce(() => { throw new SupabaseConfigurationError(); });
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  expect((await screen.findByRole("alert")).textContent).toContain("缺少 Supabase 地址或公开连接密钥");
  expectNoEntryForms();
});

test.each([
  ["en-US", "Loading failed", "Restoring sign-in session"],
  ["zh-TW", "載入失敗", "還原登入工作階段"],
])("localizes startup failures in %s", async (language, title, stage) => {
  await i18next.changeLanguage(language);
  mocks.getSession.mockRejectedValue(new TypeError("Failed to fetch"));
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain(title);
  expect(alert.textContent).toContain(stage);
  expect(alert.textContent).not.toContain("dataSource.");
});


test("explains an offline failure without logging raw exception details", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  mocks.getSession.mockRejectedValue({ name: "AuthRetryableFetchError", status: 0, message: "secret", stack: "secret-stack" });
  render(<SupabaseEntry><div>应用内容</div></SupabaseEntry>);
  expect((await screen.findByRole("alert")).textContent).toContain("浏览器报告当前已离线");
  expect(JSON.stringify(warn.mock.calls)).not.toContain("secret");
  expectNoEntryForms();
});
