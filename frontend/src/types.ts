export interface Guest {
  id: string;
  name: string;
  seat: number;
  demo: boolean;
  diamonds: number;
  joinedAt: string;
  lastSeenAt: string;
  text: string | null;
  textUntil: string | null;
  reaction: string | null;
  reactionAt: string | null;
}
export interface FoodOrder {
  id: string;
  guestId: string;
  item: "milk" | "rice-paper";
  state: "queued" | "cooking" | "serving" | "consuming";
  queuedAt: string;
  until: string | null;
}
export interface Session {
  revision: number;
  startedAt: string;
  serverTime: string;
  settings: { title: string; acceptingOrders: boolean };
  guests: Guest[];
  orders: FoodOrder[];
  feed: { id: string; kind: string; text: string; at: string }[];
  stats: { served: number; likes: number; diamonds: number };
  demoRunning: boolean;
  connector: {
    status: string;
    username: string;
    message: string;
    lastEventAt: string | null;
    chatEvents: number;
    likeEvents: number;
    giftEvents: number;
    joinEvents: number;
  };
}
export interface LiveEvent {
  eventId: string;
  viewerId: string;
  name: string;
  type: "chat" | "join" | "like" | "gift";
  text?: string;
  likeCount?: number;
  diamondCount?: number;
  repeatCount?: number;
  giftName?: string;
  demo?: boolean;
}
export const itemName = (item: string) =>
  item === "milk" ? "Sữa đậu nành" : "Bánh tráng nướng";
export const orderName: Record<FoodOrder["state"], string> = {
  queued: "Chờ bếp",
  cooking: "Đang làm",
  serving: "Phục vụ",
  consuming: "Đang dùng",
};
