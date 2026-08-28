import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HomePage } from "../pages/home/HomePage";
import { MutationStatusToast } from "./MutationStatusToast";
import {
  subscribeMutationToast,
  type MutationToastNotification,
} from "./mutationToast";
import { ThemeProvider } from "./ThemeProvider";
import { SourceEntry } from "@zembra/source-entry";

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
  const [mutationToast, setMutationToast] = useState<MutationToastNotification>();
  const hideMutationToastTimeoutRef = useRef<number | undefined>(undefined);

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
      <SourceEntry>
        <RouterProvider router={router} />
      </SourceEntry>
      {mutationToast ? <MutationStatusToast notification={mutationToast} /> : null}
    </ThemeProvider>
  );
}
