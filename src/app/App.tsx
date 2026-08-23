import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HomePage } from "../pages/home/HomePage";
import { BackendConnectionToast } from "./BackendStatusToast";
import { subscribeBackendConnectionFailed } from "./backendConnectionToast";
import { DataSourceGate } from "./DataSourceGate";
import { MutationStatusToast } from "./MutationStatusToast";
import {
  subscribeMutationToast,
  type MutationToastNotification,
} from "./mutationToast";
import { ThemeProvider } from "./ThemeProvider";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([homeRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** Renders the application router and global providers. */
export function App() {
  const [showsBackendConnectionToast, setShowsBackendConnectionToast] =
    useState(false);
  const hideToastTimeoutRef = useRef<number | undefined>(undefined);
  const [mutationToast, setMutationToast] = useState<MutationToastNotification>();
  const hideMutationToastTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = subscribeBackendConnectionFailed(() => {
      setShowsBackendConnectionToast(true);

      if (hideToastTimeoutRef.current !== undefined) {
        window.clearTimeout(hideToastTimeoutRef.current);
      }

      hideToastTimeoutRef.current = window.setTimeout(() => {
        setShowsBackendConnectionToast(false);
        hideToastTimeoutRef.current = undefined;
      }, 5000);
    });

    return () => {
      unsubscribe();

      if (hideToastTimeoutRef.current !== undefined) {
        window.clearTimeout(hideToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeMutationToast((notification) => {
      setMutationToast(notification);

      if (hideMutationToastTimeoutRef.current !== undefined) {
        window.clearTimeout(hideMutationToastTimeoutRef.current);
      }

      hideMutationToastTimeoutRef.current = window.setTimeout(() => {
        setMutationToast(undefined);
        hideMutationToastTimeoutRef.current = undefined;
      }, notification.duration);
    });

    return () => {
      unsubscribe();

      if (hideMutationToastTimeoutRef.current !== undefined) {
        window.clearTimeout(hideMutationToastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ThemeProvider>
      <DataSourceGate>
        <RouterProvider router={router} />
      </DataSourceGate>
      {showsBackendConnectionToast ? <BackendConnectionToast /> : null}
      {mutationToast ? <MutationStatusToast notification={mutationToast} /> : null}
    </ThemeProvider>
  );
}
