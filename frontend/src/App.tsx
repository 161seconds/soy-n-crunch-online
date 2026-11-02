import { useEffect, useState } from "react";
import { post, useSession } from "./api";
import { useShopAudio } from "./audio";
import Scene from "./Scene";
import { CAPACITY } from "./layout";
import {
  itemName,
  menu,
  menuGroups,
  menuItem,
  orderName,
  type LiveEvent,
  type Session,
} from "./types";

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    cup: "M6 7h12l-2 14H8L6 7Zm7 5 2-10M6 7h12",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    screen: "M3 3h18v14H3zM8 21h8M12 17v4",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    play: "m8 4 12 8-12 8V4Z",
    audio: "M3 9h4l5-4v14l-5-4H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16",
    link: "m9 15 6-6M8 17l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1",
    reset: "M3 10a9 9 0 1 1 1 8M3 4v6h6",
    heart: "M12 21 3 12C-4 4 7-1 12 6 17-1 28 4 21 12l-9 9Z",
    people:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-7a4 4 0 0 1 0 8m2 3a4 4 0 0 1 3 4v2",
    bowl: "M3 11h18a9 9 0 0 1-18 0Zm4-8v4m5-5v5m5-4v4M7 22h10",
    diamond: "m3 8 4-5h10l4 5-9 13L3 8Zm0 0h18M8 8l4 13 4-13",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.cup} />
    </svg>
  );
}

export default function App() {
  const { session, connection, accept } = useSession();
  const audio = useShopAudio(session);
  const overlay = location.pathname === "/overlay";
  const [username, setUsername] = useState("one61secondz");
  const [name, setName] = useState("Bảo Ngọc");
  const [text, setText] = useState("sữa đậu xanh");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [title, setTitle] = useState("Sữa & Giòn");
  const [showGuests, setShowGuests] = useState(false);
  const [menuGroup, setMenuGroup] = useState(menuGroups[0]);
  const [menuPaused, setMenuPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (session) setTitle(session.settings.title);
  }, [session?.settings.title]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  async function action(
    work: () => Promise<Session | { session: Session; message: string }>,
    success?: string,
  ) {
    setWorking(true);
    try {
      const result = await work();
      if ("session" in result) {
        accept(result.session);
        setMessage(result.message);
      } else {
        accept(result);
        if (success) setMessage(success);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể gửi lệnh");
    } finally {
      setWorking(false);
    }
  }
  function simulate(type: LiveEvent["type"], extra: Partial<LiveEvent> = {}) {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Nhập tên khách trước");
      return;
    }
    const event: LiveEvent = {
      eventId: crypto.randomUUID(),
      viewerId: `sim-${trimmed.toLocaleLowerCase().replace(/\s+/g, "-")}`,
      name: trimmed,
      type,
      demo: true,
      ...extra,
    };
    void action(() => post("/api/events", event));
  }
  if (!session)
    return (
      <main className="loading">
        <span className="brand-mark">
          <Icon name="cup" size={32} />
        </span>
        <h1>Sữa & Giòn</h1>
        <p>
          {connection === "offline"
            ? "Chưa nối được backend. Đang thử lại…"
            : "Đang mở cửa quán…"}
        </p>
        <code>Backend: http://127.0.0.1:5186</code>
      </main>
    );

  const seconds = Math.max(
    0,
    Math.floor((now - Date.parse(session.startedAt)) / 1000),
  );
  const uptime = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const disabled = working || connection !== "connected";
  const connectedTikTok = session.connector.status === "connected";
  const cooking = session.orders.find((order) => order.state === "cooking");
  const audioButton = (
    <button
      className={`button ${audio.enabled ? "soft" : ""}`}
      onClick={() =>
        void audio.toggle().catch((error) => setMessage(String(error)))
      }
    >
      <Icon name="audio" />
      {audio.enabled ? "Tắt tiếng" : "Bật tiếng"}
    </button>
  );
  const menuButton = (
    <button
      className="button soft"
      aria-pressed={menuPaused}
      onClick={() => setMenuPaused(!menuPaused)}
    >
      <Icon name="bowl" /> {menuPaused ? "Chạy menu" : "Dừng menu"}
    </button>
  );

  if (overlay)
    return (
      <main className="overlay-page">
        <Scene
          session={session}
          connection={connection}
          menuPaused={menuPaused}
        />
        <div className="overlay-audio">
          {menuButton}
          {audioButton}
        </div>
        {message && (
          <div className="toast" role="status">
            {message}
          </div>
        )}
      </main>
    );

  return (
    <div className="studio">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Icon name="cup" size={27} />
          </span>
          <span>
            Sữa & Giòn<small>LIVE STUDIO</small>
          </span>
        </a>
        <span className="nav-caption">KHÔNG GIAN CỦA BẠN</span>
        <a className="nav-item active" href="/" aria-current="page">
          <Icon name="grid" /> Tổng quan
        </a>
        <a
          className="nav-item"
          href="/overlay"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="screen" /> Màn hình phát{" "}
          <span className="nav-arrow">↗</span>
        </a>
        <div className="sidebar-note">
          <span className="mini-label">HÔM NAY BÁN GÌ?</span>
          <Icon name="cup" size={36} />
          <strong>
            Sữa thơm. Bánh giòn.
            <br />
            Thêm chút ngọt mát.
          </strong>
          <p>
            Khách gọi bằng bình luận.
            <br />
            Quán vui nhờ mọi người.
          </p>
          <div className="menu-chips">
            <code>sữa đậu nành</code>
            <code>đậu xanh</code>
            <code>panna cotta</code>
            <code>bánh tráng nướng</code>
          </div>
        </div>
        <div className="sidebar-footer">
          <span
            className={`dot ${connection === "connected" ? "green" : ""}`}
          />{" "}
          {connection === "connected"
            ? "Đã nối máy chủ"
            : "Đang nối lại máy chủ"}
          <small>Phiên lưu trong RAM · bản đầu</small>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            Không gian làm việc <span>/</span> <b>Tổng quan</b>
          </div>
          <span className="operator-avatar">SG</span>
        </header>
        <div className="page-heading">
          <div>
            <div className="eyebrow">QUÁN ĐÃ LÊN ĐÈN</div>
            <h1>Một tối ấm áp ở quán.</h1>
            <p>Chăm chút từng món, giữ nhịp cho buổi live của bạn.</p>
          </div>
          <a
            className="button primary"
            href="/overlay"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="screen" /> Mở màn hình phát <span>↗</span>
          </a>
        </div>
        <section className="stats-grid" aria-label="Thống kê phiên">
          {[
            {
              icon: "people",
              label: "KHÁCH TRONG QUÁN",
              value: session.guests.length,
              suffix: `/ ${CAPACITY}`,
              hint: "Chỗ ngồi trong phiên",
            },
            {
              icon: "bowl",
              label: "MÓN ĐÃ PHỤC VỤ",
              value: session.stats.served,
              suffix: "món",
              hint: `${session.orders.length} món đang xử lý`,
            },
            {
              icon: "heart",
              label: "LƯỢT THẢ TIM",
              value: session.stats.likes,
              suffix: "tim",
              hint: "Tình cảm từ người xem",
            },
            {
              icon: "diamond",
              label: "ĐIỂM ỦNG HỘ",
              value: session.stats.diamonds,
              suffix: "điểm",
              hint: "Điểm quà trong phiên",
            },
          ].map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span className="stat-icon">
                <Icon name={stat.icon} />
              </span>
              <span className="stat-label">{stat.label}</span>
              <div className="stat-value">
                {stat.value.toLocaleString("vi-VN")}{" "}
                <small>{stat.suffix}</small>
              </div>
              <p>{stat.hint}</p>
            </article>
          ))}
        </section>

        <div className="main-grid">
          <section className="preview-panel panel">
            <div className="panel-heading">
              <div>
                <h2>Góc quán đang phát</h2>
                <p>Khung dọc 9:16 · 1080 × 1920</p>
              </div>
              <span className="live-pill">
                <i />{" "}
                {session.guests.some((g) => g.demo)
                  ? "MÔ PHỎNG"
                  : connectedTikTok
                    ? "LIVE"
                    : "SẴN SÀNG"}
              </span>
            </div>
            <div className="preview-frame">
              <Scene
                session={session}
                connection={connection}
                menuPaused={menuPaused}
              />
            </div>
            <div className="preview-footer">
              <span>
                <span className="dot green" /> Phiên {uptime}
              </span>
              <div className="preview-actions">
                {menuButton}
                {audioButton}
              </div>
            </div>
          </section>

          <div className="controls-column">
            <section className="panel connection-panel">
              <div className="panel-heading">
                <div>
                  <h2>Kết nối TikTok LIVE</h2>
                  <p>Đón khách từ kênh của bạn</p>
                </div>
                <span
                  className={`status-pill ${connectedTikTok ? "online" : ""}`}
                >
                  {connectedTikTok
                    ? "Đã kết nối"
                    : session.connector.status === "connecting"
                      ? "Đang kết nối"
                      : "Chưa kết nối"}
                </span>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void action(() => post("/api/tiktok/connect", { username }));
                }}
              >
                <label htmlFor="username">Tên người dùng TikTok</label>
                <div className="input-row">
                  <div className="prefix-input">
                    <span>@</span>
                    <input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      maxLength={80}
                      required
                    />
                  </div>
                  <button
                    className="button primary"
                    disabled={
                      disabled || session.connector.status === "connecting"
                    }
                    type="submit"
                  >
                    <Icon name="link" /> Kết nối
                  </button>
                </div>
              </form>
              <p className="field-note">
                Bật LIVE trên TikTok trước. Chỉ đọc tương tác công khai.
              </p>
              <div
                className={`connector-message ${session.connector.status === "error" ? "error" : ""}`}
                role="status"
              >
                {session.connector.message}
              </div>
              {session.connector.lastEventAt && (
                <p className="field-note">
                  Đã nhận: {session.connector.chatEvents} bình luận ·{" "}
                  {session.connector.likeEvents} sự kiện tim ·{" "}
                  {session.connector.giftEvents} sự kiện quà.
                </p>
              )}
              {session.connector.status !== "idle" && (
                <button
                  className="text-button"
                  disabled={disabled}
                  onClick={() =>
                    void action(() => post("/api/tiktok/disconnect"))
                  }
                >
                  Ngắt kết nối
                </button>
              )}
            </section>

            <section className="panel simulator">
              <div className="panel-heading">
                <div>
                  <h2>Mời một vị khách</h2>
                  <p>Thử tương tác trước giờ lên sóng</p>
                </div>
                <span className="tag">MÔ PHỎNG</span>
              </div>
              <label htmlFor="guest-name">Tên khách</label>
              <input
                id="guest-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={24}
              />
              <div className="menu-toolbar">
                <h3>
                  Thực đơn <small>{menu.length} món</small>
                </h3>
                <select
                  aria-label="Nhóm món"
                  value={menuGroup}
                  onChange={(event) => setMenuGroup(event.target.value)}
                >
                  {menuGroups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div className="food-buttons" role="group" aria-label={menuGroup}>
                {menu
                  .filter((item) => item.category === menuGroup)
                  .map((item) => (
                    <button
                      key={item.id}
                      disabled={disabled}
                      onClick={() => simulate("chat", { text: item.name })}
                    >
                      <span
                        className="menu-dish"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      >
                        <Icon
                          name={item.category === "Sữa hạt" ? "cup" : "bowl"}
                          size={25}
                        />
                      </span>
                      <strong>{item.name}</strong>
                      <small>Nhấn để gọi món</small>
                      <span className="food-plus" aria-hidden="true">
                        +
                      </span>
                    </button>
                  ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  simulate("chat", { text });
                }}
              >
                <label htmlFor="comment">Bình luận thử</label>
                <div className="input-row">
                  <input
                    id="comment"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={120}
                    aria-describedby="comment-hint"
                    required
                  />
                  <button
                    className="button"
                    disabled={disabled}
                    aria-label="Gửi bình luận"
                  >
                    <Icon name="arrow" />
                  </button>
                </div>
                <p className="field-note" id="comment-hint">
                  Gõ tên món để gọi, có dấu hoặc không dấu. Không cần dấu !.
                </p>
              </form>
              <div className="quick-actions">
                <button
                  className="button soft"
                  disabled={disabled}
                  onClick={() => simulate("like", { likeCount: 5 })}
                >
                  <Icon name="heart" size={17} /> 5 tim
                </button>
                <button
                  className="button soft"
                  disabled={disabled}
                  onClick={() =>
                    simulate("gift", {
                      giftName: "Hoa hồng",
                      diamondCount: 1,
                      repeatCount: 1,
                    })
                  }
                >
                  <Icon name="diamond" size={17} /> Thử quà
                </button>
                <button
                  className="button soft"
                  disabled={disabled}
                  onClick={() =>
                    void action(
                      () =>
                        post("/api/demo", { enabled: !session.demoRunning }),
                      session.demoRunning
                        ? "Đã dừng bot; khách mô phỏng vẫn ở quán"
                        : "Đã bật tương tác mô phỏng",
                    )
                  }
                >
                  <Icon name="play" size={16} />
                  {session.demoRunning ? "Dừng bot" : "Mời 12 khách"}
                </button>
              </div>
            </section>

            <section className="panel kitchen">
              <div className="panel-heading">
                <div>
                  <h2>Nhịp bếp tối nay</h2>
                  <p>Một bếp nhỏ, phục vụ lần lượt</p>
                </div>
                <span className={`kitchen-indicator ${cooking ? "busy" : ""}`}>
                  {cooking ? "Đang làm món" : "Bếp đang rảnh"}
                </span>
              </div>
              <div className="order-list">
                {session.orders.length ? (
                  session.orders.slice(0, 5).map((order) => (
                    <div className="order-row" key={order.id}>
                      <span
                        className="order-dot"
                        style={{ backgroundColor: menuItem(order.item)?.color }}
                        aria-hidden="true"
                      >
                        <Icon
                          name={
                            menuItem(order.item)?.category === "Sữa hạt"
                              ? "cup"
                              : "bowl"
                          }
                          size={18}
                        />
                      </span>
                      <div>
                        <strong>{itemName(order.item)}</strong>
                        <small>
                          {
                            session.guests.find((g) => g.id === order.guestId)
                              ?.name
                          }
                        </small>
                      </div>
                      <span className={`order-state ${order.state}`}>
                        {orderName[order.state]}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-kitchen">
                    <Icon name="bowl" size={27} />
                    <span>Bếp sẵn sàng nhận món đầu tiên.</span>
                  </div>
                )}
                {session.orders.length > 5 && (
                  <p className="field-note">
                    Còn {session.orders.length - 5} món trong quán
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="bottom-grid">
          <section className="panel activity">
            <div className="panel-heading">
              <div>
                <h2>{showGuests ? "Khách trong quán" : "Chuyện ở quán"}</h2>
                <p>
                  {showGuests
                    ? "Chỗ ngồi và điểm ủng hộ trong phiên"
                    : "Những tương tác mới nhất trong phiên"}
                </p>
              </div>
              <div className="mini-tabs">
                <button
                  aria-pressed={!showGuests}
                  onClick={() => setShowGuests(false)}
                >
                  Nhật ký
                </button>
                <button
                  aria-pressed={showGuests}
                  onClick={() => setShowGuests(true)}
                >
                  Khách ({session.guests.length})
                </button>
              </div>
            </div>
            <div
              className="activity-list"
              role={showGuests ? undefined : "log"}
              aria-live="polite"
            >
              {showGuests
                ? session.guests.map((guest) => (
                    <div className="activity-row" key={guest.id}>
                      <span className="activity-icon">
                        <Icon name="people" size={16} />
                      </span>
                      <span>
                        {guest.name}
                        <small className="guest-detail">
                          Chỗ {guest.seat + 1}
                          {guest.demo ? " · Mô phỏng" : " · TikTok"}
                        </small>
                      </span>
                      <time>{guest.diamonds} điểm</time>
                    </div>
                  ))
                : [...session.feed]
                    .reverse()
                    .slice(0, 8)
                    .map((entry) => (
                      <div className="activity-row" key={entry.id}>
                        <span className={`activity-icon ${entry.kind}`}>
                          <Icon
                            name={
                              entry.kind === "gift"
                                ? "diamond"
                                : entry.kind === "join"
                                  ? "people"
                                  : "cup"
                            }
                            size={16}
                          />
                        </span>
                        <span>{entry.text}</span>
                        <time>
                          {new Date(entry.at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </time>
                      </div>
                    ))}
              {!(showGuests ? session.guests.length : session.feed.length) && (
                <p className="empty-note">
                  Quán vừa mở cửa. Mời vị khách đầu tiên ghé chơi.
                </p>
              )}
            </div>
          </section>
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <h2>Chăm chút góc quán</h2>
                <p>Điều chỉnh cho phiên đang chạy</p>
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void action(
                  () =>
                    post("/api/session/settings", {
                      ...session.settings,
                      title,
                    }),
                  "Đã cập nhật biển hiệu",
                );
              }}
            >
              <label htmlFor="shop-title">Tên trên biển hiệu</label>
              <div className="input-row">
                <input
                  id="shop-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={40}
                  required
                />
                <button className="button" disabled={disabled}>
                  Lưu
                </button>
              </div>
            </form>
            <label className="switch-row">
              <span>
                Nhận món mới<small>Khách đang ăn vẫn được phục vụ</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={session.settings.acceptingOrders}
                disabled={disabled}
                onChange={(event) =>
                  void action(() =>
                    post("/api/session/settings", {
                      ...session.settings,
                      acceptingOrders: event.target.checked,
                    }),
                  )
                }
              />
            </label>
            <label className="switch-row">
              <span>
                Đọc lời cảm ơn quà
                <small>Cần bật tiếng và có giọng Việt trên máy</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={audio.voice}
                onChange={(event) => audio.setVoice(event.target.checked)}
              />
            </label>
            <div className="reset-row">
              <p>Bắt đầu lại sẽ xóa dữ liệu phiên này.</p>
              <button
                className="text-button danger"
                disabled={disabled}
                onClick={() => {
                  if (
                    confirm(
                      "Xóa toàn bộ khách, đơn và thống kê của phiên hiện tại?",
                    )
                  )
                    void action(
                      () => post("/api/session/reset"),
                      "Đã bắt đầu phiên mới",
                    );
                }}
              >
                <Icon name="reset" size={16} /> Phiên mới
              </button>
            </div>
          </section>
        </div>
        <footer className="page-footer">
          Sữa & Giòn <span>Quán ảo · Tương tác thật · Tối nay thật vui</span>
          <a href="/api/health" target="_blank" rel="noreferrer">
            Trạng thái máy chủ ↗
          </a>
        </footer>
      </main>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
