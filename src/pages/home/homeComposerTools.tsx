import { AtSign, Bold, Hash, List } from "lucide-react";
import type { ComposerTool } from "./homeTypes";

/** Creates toolbar definitions for the composer insertion buttons. */
export function createComposerTools(
  t: (key: string) => string,
): ComposerTool[] {
  return [
    {
      id: "tag",
      label: t("composer.tools.tag"),
      icon: <Hash className="size-5" aria-hidden="true" />,
      before: "#",
      cursorOffset: 1,
    },
    {
      id: "field",
      label: t("composer.tools.field"),
      icon: <AtSign className="size-5" aria-hidden="true" />,
      before: "@",
      cursorOffset: 1,
    },
    {
      id: "bold",
      label: t("composer.tools.bold"),
      icon: <Bold className="size-4" aria-hidden="true" />,
      before: "**",
      after: "**",
      cursorOffset: 2,
    },
    {
      id: "list",
      label: t("composer.tools.list"),
      icon: <List className="size-5" aria-hidden="true" />,
      before: "- ",
      cursorOffset: 2,
    },
  ];
}
