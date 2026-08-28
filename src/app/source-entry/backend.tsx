import { ReactNode, useEffect, useRef, useState } from "react";
import { BackendConnectionToast } from "../BackendStatusToast";
import { BackendUrlGate } from "../BackendUrlGate";
import { subscribeBackendConnectionFailed } from "../backendConnectionToast";

/** Renders the Backend-only application entry and connection feedback. */
export function SourceEntry({ children }: { children: ReactNode }) {
  const [showsConnectionToast, setShowsConnectionToast] = useState(false);
  const hideToastTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = subscribeBackendConnectionFailed(() => {
      setShowsConnectionToast(true);

      if (hideToastTimeoutRef.current !== undefined) {
        window.clearTimeout(hideToastTimeoutRef.current);
      }

      hideToastTimeoutRef.current = window.setTimeout(() => {
        setShowsConnectionToast(false);
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

  return (
    <>
      <BackendUrlGate>{children}</BackendUrlGate>
      {showsConnectionToast ? <BackendConnectionToast /> : null}
    </>
  );
}
