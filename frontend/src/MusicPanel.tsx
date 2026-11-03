import { useEffect, useState } from "react";

export function musicLink(value: string) {
  const url = new URL(value.trim());
  if (!/^https?:$/.test(url.protocol) || url.username || url.password)
    throw new Error("Dùng link http/https công khai, không chứa tài khoản hoặc mật khẩu.");
  const host = url.hostname.toLowerCase();
  if (["youtu.be", "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
    const parts = url.pathname.split("/");
    const id = host === "youtu.be" ? parts[1]
      : url.pathname === "/watch" ? url.searchParams.get("v")
      : ["embed", "shorts", "live"].includes(parts[1]) ? parts[2] : null;
    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error("Dán link một video YouTube, không dùng link playlist hoặc kênh.");
    return { kind: "youtube", url: `https://www.youtube-nocookie.com/embed/${id}?loop=1&playlist=${id}` } as const;
  }
  if (["open.spotify.com", "soundcloud.com", "music.apple.com"].includes(host))
    throw new Error("Dùng link YouTube hoặc link file âm thanh trực tiếp (MP3, WAV, OGG).");
  return { kind: "audio", url: url.href } as const;
}

type Choice = { mode: "default" | "custom"; url: string };
function savedChoice(): Choice {
  try {
    const saved = JSON.parse(localStorage.getItem("shop-music") ?? "null");
    if (saved && ["default", "custom"].includes(saved.mode) && typeof saved.url === "string") {
      if (saved.url) musicLink(saved.url);
      return saved;
    }
  } catch { /* Storage may be disabled or contain an old link. */ }
  return { mode: "default", url: "" };
}

export default function MusicPanel() {
  const [choice, setChoice] = useState(savedChoice);
  const [draft, setDraft] = useState(choice.url);
  const [file, setFile] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    try { localStorage.setItem("shop-music", JSON.stringify(choice)); } catch { /* Playback still works without storage. */ }
  }, [choice]);
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);
  const source = choice.mode === "default" ? { kind: "audio", url: "/audio/lakeside-evening.wav" }
    : file ? { kind: "audio", url: file.url } : choice.url ? musicLink(choice.url) : null;

  return (
    <fieldset className="music-panel">
      <legend>Nhạc của quán</legend>
      <div className="music-options">
        {(["default", "custom"] as const).map((mode) => (
          <label key={mode}>
            <input type="radio" name="music-mode" checked={choice.mode === mode}
              onChange={() => { setChoice({ ...choice, mode }); setError(""); }} />
            {mode === "default" ? "Nhạc mặc định" : "Nhạc tự thêm"}
          </label>
        ))}
      </div>
      {choice.mode === "custom" ? (
        <>
          <form onSubmit={(event) => {
            event.preventDefault();
            try {
              musicLink(draft);
              setChoice({ mode: "custom", url: draft.trim() });
              setFile(null); setError("");
            } catch (failure) { setError(failure instanceof TypeError ? "Link chưa hợp lệ. Dán đầy đủ https://…" : String((failure as Error).message)); }
          }}>
            <label htmlFor="music-url">Link YouTube hoặc file âm thanh</label>
            <div className="input-row">
              <input id="music-url" type="url" value={draft} onChange={(event) => setDraft(event.target.value)}
                placeholder="https://…" maxLength={2048} required />
              <button className="button" type="submit">Dùng link</button>
            </div>
          </form>
          <label className="music-file" htmlFor="music-file">Hoặc chọn nhạc từ máy
            <input id="music-file" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" onChange={(event) => {
              const selected = event.target.files?.[0];
              if (!selected) return;
              if (!selected.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(selected.name)) {
                setError("Chọn file âm thanh MP3, WAV, OGG, M4A, AAC hoặc FLAC."); return;
              }
              setFile({ name: selected.name, url: URL.createObjectURL(selected) }); setError("");
            }} />
          </label>
        </>
      ) : <p className="music-track">Đêm bên hồ · Nhạc không lời tự tạo cho quán</p>}
      {file && choice.mode === "custom" && <p className="music-track">{file.name}</p>}
      {source?.kind === "youtube" ? (
        <iframe key={source.url} className="music-youtube" src={source.url} title="Nhạc YouTube của quán"
          allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      ) : source && (
        <audio key={source.url} src={source.url} controls loop preload="none" aria-label="Nhạc nền của quán"
          onError={() => setError("Không phát được nhạc. Kiểm tra link, quyền truy cập hoặc thử file MP3/WAV khác.")} />
      )}
      {error && <p className="music-error" role="alert">{error}</p>}
      <p className="field-note">Bấm phát để nghe; nhạc tự lặp. Phát tại bảng điều khiển, bật thu âm thanh máy tính trong LIVE Studio. File từ máy cần chọn lại sau khi tải trang.</p>
    </fieldset>
  );
}
