const mutationToastEventName = "zembra:mutation-toast";

/** Identifies the visual severity of a completed note mutation. */
export type MutationToastTone = "success" | "error";

/** Identifies a localized message rendered by the global mutation toast. */
export type MutationToastMessage =
  | "noteCreated"
  | "noteCreateFailed"
  | "noteDeleted"
  | "noteDeleteFailed";

/** Describes one completed background note mutation for global feedback. */
export interface MutationToastNotification {
  /** Duration the notification remains visible in milliseconds. */
  duration: number;
  /** Localized message identifier. */
  message: MutationToastMessage;
  /** Success or failure styling and accessibility behavior. */
  tone: MutationToastTone;
}

/** Describes the unsubscribe function returned by mutation toast subscriptions. */
export type UnsubscribeMutationToast = () => void;

/** Dispatches a completed background mutation notification to the application shell. */
export function notifyMutationCompleted(
  notification: MutationToastNotification,
): void {
  window.dispatchEvent(
    new CustomEvent<MutationToastNotification>(mutationToastEventName, {
      detail: notification,
    }),
  );
}

/** Subscribes to completed background mutation notifications. */
export function subscribeMutationToast(
  listener: (notification: MutationToastNotification) => void,
): UnsubscribeMutationToast {
  const handleNotification = (event: Event) => {
    listener((event as CustomEvent<MutationToastNotification>).detail);
  };

  window.addEventListener(mutationToastEventName, handleNotification);

  return () => window.removeEventListener(mutationToastEventName, handleNotification);
}
