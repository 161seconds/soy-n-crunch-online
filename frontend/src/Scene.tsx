import { useEffect, useRef, useState } from "react";
import {
  CAPACITY,
  HEIGHT,
  seatAt,
  tableAt,
  TABLE_COUNT,
  walkPosition,
  WIDTH,
} from "./layout";
import type { FoodOrder, Guest, Session } from "./types";
import { menu, menuItem, menuPages } from "./types";

type Context = CanvasRenderingContext2D;
const palette = [
  "#477663",
  "#be735d",
  "#647a9c",
  "#b29354",
  "#886c91",
  "#568c8b",
];

function box(
  c: Context,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function oval(
  c: Context,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
function label(
  c: Context,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 600,
) {
  c.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(value, x, y);
}
function cup(c: Context, x: number, y: number, s = 1, color = "#f4edd1") {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  box(c, -18, -45, 36, 48, 7, color);
  box(c, -18, -45, 36, 8, 4, "#fffbea");
  c.strokeStyle = "#598367";
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(4, -25);
  c.lineTo(10, -66);
  c.stroke();
  box(c, -13, -20, 26, 12, 4, "#c3c8a4");
  c.restore();
}
function ricePaper(c: Context, x: number, y: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  oval(c, 0, 0, 55, 32, "#ae672c");
  oval(c, 0, -4, 52, 30, "#edc66f");
  for (let i = 0; i < 15; i++) {
    const a = i * 2.4,
      r = 10 + (i % 4) * 9;
    oval(
      c,
      Math.cos(a) * r,
      Math.sin(a) * r * 0.5 - 5,
      5,
      3,
      i % 2 ? "#678452" : "#d66f45",
    );
  }
  c.restore();
}
function heart(c: Context, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = "#e28c8a";
  c.beginPath();
  c.moveTo(0, 7);
  c.bezierCurveTo(-32, -10, -20, -34, 0, -19);
  c.bezierCurveTo(20, -34, 32, -10, 0, 7);
  c.fill();
  c.restore();
}
export function drawDish(
  c: Context,
  id: string,
  x: number,
  y: number,
  s: number,
) {
  const item = menuItem(id);
  if (!item) return;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  switch (item.visual) {
    case "cup":
      cup(c, 0, 0, 1, item.color);
      break;
    case "iced-cup":
      cup(c, 0, 0, 1, item.color);
      for (let i = 0; i < 3; i++)
        box(c, -13 + i * 9, -38 + (i % 2) * 8, 9, 9, 2, "#ffffffb3");
      break;
    case "jar":
      box(c, -22, -42, 44, 45, 10, item.color);
      box(c, -24, -47, 48, 10, 4, "#8cae9b");
      box(c, -15, -27, 30, 15, 4, "#fffaf0");
      break;
    case "pudding":
      oval(c, 0, 5, 46, 12, "#f8f3e5");
      box(c, -27, -35, 54, 36, 13, "#fff0cf");
      oval(c, 0, -32, 27, 9, item.color);
      oval(c, 9, -37, 7, 5, item.color);
      break;
    case "rice-paper":
      ricePaper(c, 0, 0, 0.82);
      break;
    case "pastry":
      oval(c, 0, -16, 38, 27, item.color);
      for (let i = 0; i < 9; i++)
        oval(
          c,
          -24 + (i % 5) * 11,
          -28 + Math.floor(i / 5) * 14,
          2,
          1,
          "#fff0c6",
        );
      break;
    case "cruller":
      box(c, -28, -48, 24, 60, 10, item.color);
      box(c, -3, -48, 24, 60, 10, item.color);
      break;
    case "drumstick":
      box(c, -35, -15, 37, 17, 8, item.color);
      oval(c, 9, -21, 28, 25, item.color);
      break;
    case "toast":
      box(c, -33, -48, 66, 54, 10, "#ae733f");
      box(c, -27, -42, 54, 42, 7, item.color);
      for (let i = 0; i < 3; i++)
        box(c, -21 + i * 16, -36, 4, 29, 2, "#b1874a");
      break;
    case "fries":
      for (let i = 0; i < 5; i++)
        box(c, -23 + i * 10, -47 + (i % 2) * 7, 8, 48, 2, item.color);
      box(c, -28, -16, 56, 30, 5, "#b76b4d");
      break;
  }
  c.restore();
}
function person(
  c: Context,
  guest: Guest,
  order: FoodOrder | undefined,
  now: number,
  reduced: boolean,
) {
  const seat = seatAt(guest.seat),
    arrival = (now - Date.parse(guest.joinedAt)) / 1700;
  const walking = !reduced && arrival < 1;
  const p = walking ? walkPosition(seat, arrival) : seat;
  const hash = Array.from(guest.id).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const phase = reduced ? 0 : now / 1000 + hash;
  const consuming = order?.state === "consuming";
  const bob = reduced
    ? 0
    : Math.sin(phase * (walking ? 10 : 2)) * (walking ? 4 : 1.4);
  c.save();
  c.translate(p.x, p.y + bob);
  c.scale(seat.scale, seat.scale);
  oval(c, 0, 5, 41, 12, "#00000023");
  if (
    guest.reaction === "gift" &&
    guest.reactionAt &&
    now - Date.parse(guest.reactionAt) < 6000
  ) {
    const glow = c.createRadialGradient(0, -80, 10, 0, -80, 100);
    glow.addColorStop(0, "#f7d77f99");
    glow.addColorStop(1, "#f7d77f00");
    c.fillStyle = glow;
    c.fillRect(-110, -190, 220, 220);
  }
  c.strokeStyle = "#3c3939";
  c.lineWidth = 13;
  c.lineCap = "round";
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(side * 15, -23);
    c.lineTo(side * 20 + (walking ? Math.sin(phase * 10 + side) * 9 : 0), 0);
    c.stroke();
  }
  box(c, -30, -92, 60, 70, 18, palette[hash % palette.length]);
  const eatingMotion =
    consuming && !reduced ? (Math.sin(phase * 4) + 1) * 12 : 0;
  c.strokeStyle = "#eac0a0";
  c.lineWidth = 11;
  c.beginPath();
  c.moveTo(-29, -75);
  c.lineTo(-42, -43);
  c.stroke();
  c.beginPath();
  c.moveTo(29, -75);
  c.lineTo(42, -52 - eatingMotion);
  c.stroke();
  oval(c, 0, -119, 31, 35, "#eac0a0");
  c.fillStyle = hash % 3 ? "#3c302c" : "#514036";
  c.beginPath();
  c.ellipse(0, -132, 32, 25, 0, Math.PI, Math.PI * 2);
  c.fill();
  if (hash % 2 === 0) oval(c, -28, -117, 7, 24, "#3c302c");
  oval(c, -10, -119, 2.7, 3.4, "#46342e");
  oval(c, 10, -119, 2.7, 3.4, "#46342e");
  c.strokeStyle = "#a26d55";
  c.lineWidth = 2.5;
  c.beginPath();
  c.arc(0, -111, 7, 0.2, Math.PI - 0.2);
  c.stroke();
  if (consuming) {
    drawDish(c, order.item, 43, -46 - eatingMotion, 0.58);
  } else if (order) {
    box(c, 35, -99, 42, 27, 13, "#fff5dc");
    label(
      c,
      order.state === "queued" ? "···" : order.state === "cooking" ? "≈" : "✓",
      56,
      -87,
      24,
      "#a57438",
    );
  }
  const name =
    Array.from(guest.name).slice(0, 13).join("") +
    (Array.from(guest.name).length > 13 ? "…" : "");
  c.font = '600 23px "Segoe UI", Arial, sans-serif';
  const width = Math.min(210, c.measureText(name).width + 24);
  box(
    c,
    -width / 2,
    -190,
    width,
    32,
    12,
    guest.diamonds ? "#8d613a" : "#fffae8",
  );
  label(c, name, 0, -174, 23, guest.diamonds ? "#fff3d5" : "#4d4338");
  if (guest.text && guest.textUntil && now < Date.parse(guest.textUntil)) {
    const message =
      Array.from(guest.text).slice(0, 19).join("") +
      (Array.from(guest.text).length > 19 ? "…" : "");
    const width = Math.min(270, message.length * 12 + 26);
    box(c, -width / 2, -242, width, 42, 14, "#fffdf3");
    label(c, message, 0, -222, 21, "#534333", 500);
  }
  if (guest.reaction === "like" && guest.reactionAt) {
    const age = (now - Date.parse(guest.reactionAt)) / 1000;
    if (age < 2 && age >= 0) {
      c.globalAlpha = 1 - age / 2;
      heart(c, 42, -205 - age * 40, 1);
    }
  }
  c.restore();
}

function draw(c: Context, session: Session, now: number, reduced: boolean) {
  const t = reduced ? 0 : now / 1000;
  c.clearRect(0, 0, WIDTH, HEIGHT);
  const cooking = session.orders.some((o) => o.state === "cooking");
  for (let i = 0; i < (cooking ? 9 : 5); i++) {
    const age = (((t * 0.35 + i * 0.17) % 1) + 1) % 1;
    c.globalAlpha = (1 - age) * 0.25;
    oval(
      c,
      812 + Math.sin(t + i) * 12,
      809 - age * 65,
      5 + age * 10,
      8 + age * 12,
      "#fff0d9",
    );
  }
  c.globalAlpha = 1;
  for (let i = 0; i < CAPACITY; i++) {
    const seat = seatAt(i);
    box(
      c,
      seat.x - 26 * seat.scale,
      seat.y - 3,
      52 * seat.scale,
      34 * seat.scale,
      8,
      "#7a593d",
    );
    oval(c, seat.x, seat.y - 3, 31 * seat.scale, 11 * seat.scale, "#ae7c50");
  }
  for (let i = 0; i < TABLE_COUNT; i++) {
    const { x, y, scale: s } = tableAt(i);
    oval(c, x, y + 48, 101 * s, 22 * s, "#755c2b20");
    box(c, x - 8 * s, y, 16 * s, 56 * s, 5, "#68563d");
    oval(c, x, y + 5, 87 * s, 37 * s, "#af7b47");
    oval(c, x, y - 4, 87 * s, 37 * s, "#f0d399");
    oval(c, x, y - 3, 76 * s, 28 * s, "#e8c98d");
    box(c, x - 12, y - 25, 24, 20, 3, "#e8e5cd");
    label(c, String(i + 1).padStart(2, "0"), x, y - 14, 12, "#6e654d");
  }
  if (!session.guests.length)
    label(c, "Bình luận để ghé quán nhé", 540, 1098, 29, "#816b4a", 500);
  for (const guest of [...session.guests].sort((a, b) => a.seat - b.seat))
    person(
      c,
      guest,
      session.orders.find((o) => o.guestId === guest.id),
      now,
      reduced,
    );
  box(c, 38, 1827, 1004, 58, 20, "#48634c");
  label(c, "SỮA ẤM BÊN HỒ · BÁNH GIÒN ĐÀ LẠT", 540, 1857, 24, "#fff1cb", 500);
}

export default function Scene({
  session,
  connection,
  menuPaused,
}: {
  session: Session;
  connection: string;
  menuPaused: boolean;
}) {
  const pages = menuPages.length;
  const [menuPage, setMenuPage] = useState(
    () => Math.floor(Date.now() / 8000) % pages,
  );
  const currentMenu = menuPages[menuPage];
  useEffect(() => {
    if (menuPaused) return;
    const timer = setInterval(
      () => setMenuPage(Math.floor(Date.now() / 8000) % pages),
      1000,
    );
    return () => clearInterval(timer);
  }, [menuPaused, pages]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef(session),
    offset = useRef(Date.parse(session.serverTime) - Date.now());
  useEffect(() => {
    state.current = session;
    offset.current = Date.parse(session.serverTime) - Date.now();
  }, [session]);
  useEffect(() => {
    const context = canvas.current!.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame: number,
      last = 0;
    const render = (time: number) => {
      if (time - last >= 30) {
        draw(context, state.current, Date.now() + offset.current, reduced);
        last = time;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);
  const gift = session.feed.filter((entry) => entry.kind === "gift").at(-1);
  const simulated = session.demoRunning || session.guests.some((g) => g.demo);
  return (
    <div className="scene">
      <canvas
        ref={canvas}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={`Quán ${session.settings.title} bên Hồ Xuân Hương, Đà Lạt, ${TABLE_COUNT} bàn, ${CAPACITY} chỗ, ${session.guests.length} khách, ${menu.length} món sữa hạt, bánh và món lạnh.`}
      />
      <div className="scene-brand">
        <span>HỒ XUÂN HƯƠNG · ĐÀ LẠT</span>
        <h2>{session.settings.title}</h2>
        <p>Sữa hạt · Bánh giòn · Ngọt mát</p>
      </div>
      <div className="scene-stats">
        <span>
          <b>
            {session.guests.length}/{CAPACITY}
          </b>{" "}
          khách ghé
        </span>
        <span>
          <b>{session.stats.served}</b> món đã dùng
        </span>
        <span>
          <b>{session.stats.likes}</b> lượt tim
        </span>
      </div>
      <div
        className="scene-menu"
        aria-label={`Thực đơn ${currentMenu.category}`}
        aria-live="off"
      >
        <div className="scene-menu-title">
          {currentMenu.category.toLocaleUpperCase("vi-VN")} · GÕ TÊN MÓN ĐỂ GỌI{" "}
          <span>
            {currentMenu.page}/{currentMenu.total}
          </span>
        </div>
        <div className="scene-menu-items">
          {currentMenu.items.map((item) => (
            <span key={item.id}>
              <b>{item.name}</b>
            </span>
          ))}
        </div>
      </div>
      <div
        className={`scene-badge ${connection !== "connected" ? "disconnected" : ""}`}
      >
        <i />
        {connection !== "connected"
          ? "ĐANG NỐI LẠI SERVER"
          : simulated
            ? "MÔ PHỎNG"
            : session.connector.status === "connected"
              ? "TIKTOK LIVE"
              : "CHỜ KHÁCH GHÉ"}
      </div>
      {!session.settings.acceptingOrders && (
        <div className="scene-closed">Quán tạm ngưng nhận món mới</div>
      )}
      {gift && (
        <div className="gift-toast" key={gift.id}>
          {gift.text}
        </div>
      )}
    </div>
  );
}
