import { useEffect, useRef } from "react";
import { HEIGHT, seatAt, walkPosition, WIDTH } from "./layout";
import type { FoodOrder, Guest, Session } from "./types";

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
function cup(c: Context, x: number, y: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  box(c, -18, -45, 36, 48, 7, "#f4edd1");
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
    if (order.item === "milk") cup(c, 43, -46 - eatingMotion, 0.58);
    else ricePaper(c, 45, -48 - eatingMotion, 0.48);
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
  const sky = c.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#223c39");
  sky.addColorStop(0.52, "#61715a");
  sky.addColorStop(1, "#c7a780");
  c.fillStyle = sky;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 35; i++)
    oval(
      c,
      (i * 173 + 80) % 1080,
      (i * 61) % 440,
      i % 3 === 0 ? 2 : 1,
      1.4,
      "#e8d6a480",
    );
  c.fillStyle = "#2a4840";
  c.fillRect(0, 340, 150, 430);
  c.fillRect(920, 290, 160, 490);
  for (let i = 0; i < 7; i++) {
    box(c, 25, 385 + i * 46, 45, 23, 2, "#e4b76e30");
    box(c, 980, 335 + i * 48, 43, 24, 2, "#e4b76e30");
  }
  c.strokeStyle = "#1a302b";
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(-20, 380);
  c.quadraticCurveTo(540, 540, 1100, 380);
  c.stroke();
  for (let i = 0; i < 8; i++) {
    const x = 50 + i * 140,
      y = 397 + Math.sin((i / 7) * Math.PI) * 66;
    const glow = c.createRadialGradient(x, y + 10, 0, x, y + 10, 85);
    glow.addColorStop(0, "#f4ce7c55");
    glow.addColorStop(1, "#f4ce7c00");
    c.fillStyle = glow;
    c.fillRect(x - 85, y - 75, 170, 170);
    box(c, x - 11, y, 22, 30, 8, "#f3d08b");
  }
  box(c, 50, 522, 980, 379, 18, "#d8bf91");
  box(c, 74, 550, 445, 213, 10, "#45634d");
  box(c, 561, 550, 445, 213, 10, "#45634d");
  label(c, "SỮA ĐẬU NÀNH", 295, 595, 35, "#f9ebcb", 700);
  label(c, "Đậu thơm · Sữa nóng", 295, 643, 24, "#d1d5b7", 400);
  label(c, "BÁNH TRÁNG NƯỚNG", 784, 595, 32, "#f9ebcb", 700);
  label(c, "Giòn rụm · Nóng hổi", 784, 643, 24, "#d1d5b7", 400);
  for (let i = 0; i < 10; i++) {
    box(c, 40 + i * 100, 480, 100, 64, 16, i % 2 ? "#f4e4b9" : "#66845c");
  }
  box(c, 31, 791, 1018, 110, 13, "#9d6241");
  box(c, 27, 774, 1026, 31, 10, "#edcc92");
  for (let i = 0; i < 15; i++) {
    c.fillStyle = "#743e2826";
    c.fillRect(65 + i * 67, 815, 3, 63);
  }
  box(c, 142, 680, 155, 92, 17, "#d9dbc9");
  oval(c, 219, 683, 77, 14, "#f0eddd");
  box(c, 184, 654, 68, 13, 6, "#b6b9a8");
  box(c, 209, 642, 20, 20, 6, "#6e7964");
  for (let i = 0; i < 3; i++) cup(c, 360 + i * 53, 768, 0.8);
  box(c, 641, 705, 292, 69, 15, "#423f38");
  oval(c, 785, 722, 119, 26, "#b66036");
  for (let i = 0; i < 6; i++) box(c, 680 + i * 41, 713, 5, 26, 1, "#463c32");
  ricePaper(c, 786, 714, 1.55);
  const cooking = session.orders.some((o) => o.state === "cooking");
  for (let i = 0; i < (cooking ? 9 : 5); i++) {
    const age = (((t * 0.35 + i * 0.17) % 1) + 1) % 1;
    c.globalAlpha = (1 - age) * 0.25;
    oval(
      c,
      770 + Math.sin(t + i) * 32,
      690 - age * 110,
      8 + age * 17,
      12 + age * 19,
      "#fff0d9",
    );
  }
  c.globalAlpha = 1;
  const floor = c.createLinearGradient(0, 920, 0, 1920);
  floor.addColorStop(0, "#d6bc91");
  floor.addColorStop(1, "#e8d0a6");
  c.fillStyle = floor;
  c.fillRect(0, 917, 1080, 1003);
  c.strokeStyle = "#9a80522b";
  c.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    c.beginPath();
    c.moveTo(i * 180 - 180, 920);
    c.lineTo(i * 210 - 240, 1920);
    c.stroke();
  }
  for (let i = 0; i < 8; i++) {
    c.beginPath();
    c.moveTo(0, 960 + i * 143);
    c.lineTo(1080, 960 + i * 143);
    c.stroke();
  }
  for (let i = 0; i < 24; i++) {
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
  for (let i = 0; i < 12; i++) {
    const x = 180 + (i % 3) * 360,
      y = 1170 + Math.floor(i / 3) * 190,
      s = 0.76 + Math.floor(i / 3) * 0.075;
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
  label(c, "MỘT CHÚT ẤM BỤNG, MỘT TỐI BÌNH YÊN", 540, 1857, 24, "#fff1cb", 500);
}

export default function Scene({
  session,
  connection,
}: {
  session: Session;
  connection: string;
}) {
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
        aria-label={`Quán ${session.settings.title}, ${session.guests.length} khách. Nhân vật đang ăn bánh tráng nướng và uống sữa đậu nành.`}
      />
      <div className="scene-brand">
        <span>QUÁN NHỎ · NIỀM VUI TO</span>
        <h2>{session.settings.title}</h2>
        <p>Sữa đậu nành & bánh tráng nướng</p>
      </div>
      <div className="scene-stats">
        <span>
          <b>{session.guests.length}/24</b> khách ghé
        </span>
        <span>
          <b>{session.stats.served}</b> món đã dùng
        </span>
        <span>
          <b>{session.stats.likes}</b> lượt tim
        </span>
      </div>
      <div className="scene-menu">
        <span>
          <b>!sua</b> một ly ấm áp
        </span>
        <i />{" "}
        <span>
          <b>!banh</b> một miếng giòn tan
        </span>
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
