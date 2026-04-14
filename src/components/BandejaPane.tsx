"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import clsx from "clsx";
import { ChatList } from "./ChatList";

type Conversation = {
  telefono: string;
  conversation_id: string | null;
  last_content: string | null;
  last_direction: "in" | "out";
  last_at: string;
  message_count: number;
  labels: string[];
};

export function BandejaPane({
  conversations,
  children,
}: {
  conversations: Conversation[];
  children: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const hasSelection = segment !== null && segment !== "__PAGE__";

  return (
    <div className="flex flex-1 min-w-0 h-full">
      <div
        className={clsx(
          "w-full md:w-[360px] md:shrink-0 md:block",
          hasSelection ? "hidden" : "block"
        )}
      >
        <ChatList conversations={conversations} />
      </div>
      <section
        className={clsx(
          "flex-1 min-w-0 flex flex-col bg-f7black",
          hasSelection ? "flex" : "hidden md:flex"
        )}
      >
        {children}
      </section>
    </div>
  );
}
