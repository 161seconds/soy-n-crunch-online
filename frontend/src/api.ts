import { useEffect, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import type { Session } from "./types";

export function newerSession(current: Session | null, next: Session): Session {
  return current && current.revision > next.revision ? current : next;
}

export async function post<T>(path: string, body: unknown = {}): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.message ?? data?.title ?? `HTTP ${response.status}`);
  return data as T;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [connection, setConnection] = useState("connecting");
  useEffect(() => {
    let disposed = false;
    let retry: ReturnType<typeof setTimeout>;
    const accept = (next: Session) => {
      if (!disposed) setSession((current) => newerSession(current, next));
    };
    const sync = async () => {
      const response = await fetch("/api/session", {
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      accept(await response.json());
    };
    const hub = new HubConnectionBuilder()
      .withUrl("/hubs/live")
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000])
      .configureLogging(LogLevel.Error)
      .build();
    hub.on("session", accept);
    hub.onreconnecting(() => {
      if (!disposed) setConnection("reconnecting");
    });
    hub.onreconnected(() => {
      if (!disposed) {
        setConnection("connected");
        void sync().catch(() => setConnection("reconnecting"));
      }
    });
    async function start() {
      try {
        await sync();
        if (disposed) return;
        await hub.start();
        if (!disposed) setConnection("connected");
      } catch {
        if (!disposed) {
          setConnection("offline");
          retry = setTimeout(start, 3_000);
        }
      }
    }
    hub.onclose(() => {
      if (!disposed) {
        setConnection("offline");
        retry = setTimeout(start, 3_000);
      }
    });
    void start();
    return () => {
      disposed = true;
      clearTimeout(retry);
      void hub.stop();
    };
  }, []);
  return {
    session,
    connection,
    accept: (next: Session) =>
      setSession((current) => newerSession(current, next)),
  };
}
