import menuData from "../../menu.json";
import giftData from "../../gifts.json";

export const menu = menuData;
export const giftRules = giftData;
export const menuGroups = [...new Set(menu.map((item) => item.category))];
export const menuPages = menuGroups.flatMap((category) => {
  const items = menu.filter((item) => item.category === category);
  const total = Math.ceil(items.length / 4);
  return Array.from({ length: total }, (_, index) => ({
    category,
    page: index + 1,
    total,
    items: items.slice(index * 4, index * 4 + 4),
  }));
});
export const menuItem = (id: string) => menu.find((item) => item.id === id);

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
  item: string;
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
  feed: {
    id: string;
    kind: string;
    text: string;
    at: string;
    effect?: "hearts" | "fireworks" | "festival" | "flowers" | "treat" | "rush" | "swan" | "dance" | "stars" | null;
    repeatCount?: number;
    demo?: boolean;
  }[];
  stats: { served: number; likes: number; diamonds: number };
  demoRunning: boolean;
  kitchenBoostUntil?: string | null;
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
  menuItem(item)?.name ?? "Món không xác định";
export const orderName: Record<FoodOrder["state"], string> = {
  queued: "Chờ bếp",
  cooking: "Đang làm",
  serving: "Phục vụ",
  consuming: "Đang dùng",
};
