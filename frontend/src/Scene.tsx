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
import { giftRules, menu, menuItem, menuPages } from "./types";

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

export function activeGifts(feed: Session["feed"], now: number) {
  // shortcut: show three recent gifts; add a queue if busy streams need every animation.
  return feed.filter((entry) => {
    const age = now - Date.parse(entry.at);
    return (entry.kind === "gift" || entry.kind === "milestone") && age >= 0 && age < 7000;
  }).slice(-3);
}

export function drawGiftEffects(c: Context, feed: Session["feed"], now: number, reduced: boolean) {
  if (reduced) return;
  const colors = ["#ffe09a", "#ff9fb4", "#a5edcb", "#afd0ff"];
  for (const gift of activeGifts(feed, now)) {
    const age = (now - Date.parse(gift.at)) / 1000;
    const seed = Array.from(gift.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const density = Math.min(18, 7 + Math.floor(Math.log2(Math.max(1, gift.repeatCount ?? 1))) * 2);
    c.save();
    c.globalAlpha = Math.min(1, (7 - age) / 1.2);
    if (!gift.effect || gift.effect === "hearts") {
      for (let i = 0; i < density; i++)
        heart(c, 100 + i * (880 / Math.max(1, density - 1)) + Math.sin(age * 2 + i) * 12,
          820 - age * 40 - (i % 3) * 55, 0.55 + (i % 3) * 0.1);
    } else if (gift.effect === "flowers") {
      for (let i = 0; i < density; i++) {
        const x = 90 + ((seed + i * 137) % 900) + Math.sin(age + i) * 25;
        const y = 440 + ((age * 45 + i * 53) % 390);
        for (let petal = 0; petal < 5; petal++) {
          const angle = petal * Math.PI * 2 / 5 + age * 0.4;
          oval(c, x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, 7, 6, colors[1]);
        }
        oval(c, x, y, 4, 4, colors[0]);
      }
    } else if (gift.effect === "treat") {
      for (let i = 0; i < 3; i++) {
        const x = 210 + i * 330;
        const y = 760 - age * 18 + Math.sin(age * 2 + i) * 12;
        drawDish(c, "iced-yogurt", x, y, 1);
        heart(c, x + 40, y - 65, 0.6);
      }
    } else if (gift.effect === "rush") {
      label(c, "BẾP ×2", 540, 665, 36, colors[0]);
      for (let i = 0; i < density; i++) {
        const rise = (age * 90 + i * 43) % 150;
        oval(c, 435 + ((seed + i * 31) % 210), 810 - rise,
          4 + (i % 3), 9, i % 2 ? "#ffb171" : colors[0]);
      }
    } else if (gift.effect === "swan") {
      for (let i = 0; i < 2; i++) {
        c.save();
        c.translate(110 + age * 100 + i * 135, 655 + i * 55);
        oval(c, -5, 26, 62, 7, "#cde9e52b");
        oval(c, 0, 0, 43, 20, "#fffae8");
        oval(c, -8, -5, 28, 12, "#dfdfd2");
        c.strokeStyle = "#fffae8";
        c.lineWidth = 13;
        c.beginPath();
        c.moveTo(24, -3);
        c.bezierCurveTo(62, -43, 15, -64, 38, -70);
        c.stroke();
        oval(c, 40, -70, 12, 10, "#fffae8");
        oval(c, 46, -73, 2, 2, "#384a42");
        box(c, 50, -71, 15, 6, 2, "#e8ad6c");
        c.restore();
      }
    } else if (gift.effect === "dance") {
      for (let i = 0; i < density; i++)
        label(c, i % 2 ? "♪" : "♫", 100 + ((seed + i * 137) % 880),
          780 - ((age * 50 + i * 37) % 320), 32 + (i % 3) * 9, colors[i % colors.length]);
    } else if (gift.effect === "stars") {
      for (let i = 0; i < 6; i++) {
        const phase = ((age + i * 0.5) % 3) / 3;
        const x = 110 + i * 132 + phase * 130, y = 445 + (i % 2) * 85 + phase * 110;
        c.strokeStyle = colors[i % colors.length];
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x - 70, y - 45);
        c.lineTo(x, y);
        c.stroke();
        oval(c, x, y, 5, 5, colors[0]);
      }
    } else {
      for (let burst = 0; burst < (gift.effect === "festival" ? 6 : 3); burst++) {
        const life = age - burst * 0.7;
        if (life < 0 || life > 2) continue;
        const x = 180 + ((seed + burst * 283) % 720), y = 540 + (burst % 2) * 85;
        c.globalAlpha = 1;
        if (life < 0.35) {
          c.strokeStyle = colors[burst % colors.length];
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(x, y + (1 - life / 0.35) * 220);
          c.lineTo(x, y + (1 - life / 0.35) * 220 + 25);
          c.stroke();
        } else {
          const t = life - 0.35;
          c.globalAlpha = Math.max(0, 1 - t / 1.65);
          for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2 + seed;
            const distance = 125 * Math.sqrt(t) * (0.7 + (i % 3) * 0.15);
            oval(c, x + Math.cos(angle) * distance,
              y + Math.sin(angle) * distance + t * t * 35, 3, 3, colors[i % colors.length]);
          }
        }
      }
      if (gift.effect === "festival") {
        c.globalAlpha = Math.min(1, (7 - age) / 1.2);
        for (let i = 0; i < 20; i++) {
          c.fillStyle = colors[i % colors.length];
          c.fillRect(60 + ((seed + i * 137) % 960) + Math.sin(age * 2 + i) * 12,
            410 + ((age * 80 + i * 37) % 470), 5, 11);
        }
      }
    }
    c.restore();
  }
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
  celebrating: boolean,
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
    : celebrating ? -Math.abs(Math.sin(phase * 5)) * 18
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
  const giftAge = guest.reactionAt ? now - Date.parse(guest.reactionAt) : -1;
  if (guest.reaction === "gift" && giftAge >= 0 && giftAge < 7000) {
    oval(c, 0, -119, 42, 46, "#ffe09a55");
    label(c, "★", 46, -154, 29, "#ffe09a");
  }
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
  const gifts = activeGifts(session.feed, now);
  const celebrating = gifts.some((gift) => gift.effect === "festival" || gift.effect === "dance");
  drawGiftEffects(c, gifts, now, reduced);
  const cooking = session.orders.some((o) => o.state === "cooking");
  for (let i = 0; i < (cooking ? 9 : 5); i++) {
    const age = (((t * 0.35 + i * 0.17) % 1) + 1) % 1;
    c.globalAlpha = (1 - age) * 0.25;
    oval(
      c,
      456 + Math.sin(t + i) * 12,
      768 - age * 65,
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
  for (const guest of [...session.guests].sort((a, b) => a.seat - b.seat))
    person(
      c,
      guest,
      session.orders.find((o) => o.guestId === guest.id),
      now,
      reduced,
      celebrating,
    );
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
  const gift = activeGifts(session.feed, Date.now() + offset.current).at(-1);
  const nextGoal = (Math.floor(session.stats.diamonds / 100) + 1) * 100;
  const boostSeconds = session.kitchenBoostUntil
    ? Math.max(0, Math.ceil((Date.parse(session.kitchenBoostUntil) - Date.now() - offset.current) / 1000)) : 0;
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
      <div className="scene-header">
        <div className="scene-brand">
          <span>HỒ XUÂN HƯƠNG · ĐÀ LẠT</span>
          <h2>{session.settings.title}</h2>
          <p>Sữa hạt · Bánh giòn · Ngọt mát</p>
        </div>
        <div className="scene-stats">
          <span>
            <b>
              {session.guests.length}/{CAPACITY}
            </b>
            khách ghé
          </span>
          <span>
            <b>{session.stats.served}</b> món đã dùng
          </span>
          <span>
            <b>{session.stats.likes}</b> lượt tim
          </span>
        </div>
        <p className="scene-invite">hãy comment để đặt món và vào bàn nhé</p>
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
      <div className="scene-goal">
        <span>MỐC QUÀ {nextGoal} ĐIỂM · {session.stats.diamonds % 100}/100</span>
        <span>{boostSeconds > 0 ? `Bếp ×2 · còn ${boostSeconds}s` : "Đủ mốc: lễ hội + bếp ×2"}</span>
        <progress max={100} value={session.stats.diamonds % 100}
          aria-label={`Tiến trình đến mốc ${nextGoal} điểm quà`} />
      </div>
      {gift && (
        <div className="gift-toast" key={gift.id} role="status">
          {gift.demo && <small className="gift-demo">MÔ PHỎNG</small>}
          <strong>{giftRules.find((rule) => rule.effect === gift.effect)?.title ?? "TRÁI TIM GỬI BẠN"}
            {(gift.repeatCount ?? 1) > 1 && <span className="gift-combo">×{gift.repeatCount}</span>}
          </strong>
          <span>{gift.text}</span>
        </div>
      )}
    </div>
  );
}
