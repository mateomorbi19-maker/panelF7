import type { ConversationLogRow } from "@/types/database";
import clsx from "clsx";

const MEDIA_PROXY = process.env.NEXT_PUBLIC_N8N_MEDIA_PROXY_URL!;

function mediaUrl(driveId: string) {
  return `${MEDIA_PROXY}?id=${encodeURIComponent(driveId)}`;
}

export function MessageBubble({ message }: { message: ConversationLogRow }) {
  const outgoing = message.direction === "out";
  const time = new Date(message.created_at).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={clsx("flex", outgoing ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[70%] rounded-2xl px-4 py-2 shadow-lg",
          outgoing
            ? "bg-f7red text-white"
            : "bg-f7panel border border-f7border text-slate-100"
        )}
      >
        {message.message_type === "image" && message.media_url && (
          <img
            src={mediaUrl(message.media_url)}
            alt={message.content ?? "imagen"}
            className="rounded-lg max-w-full mb-2"
          />
        )}
        {message.message_type === "video" && message.media_url && (
          <video
            src={mediaUrl(message.media_url)}
            controls
            className="rounded-lg max-w-full mb-2"
          />
        )}
        {(message.content || message.caption) && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.caption ?? message.content}
          </p>
        )}
        <div
          className={clsx(
            "text-[10px] mt-1",
            outgoing ? "text-red-100" : "text-slate-500"
          )}
        >
          {time} · {message.channel}
        </div>
      </div>
    </div>
  );
}
