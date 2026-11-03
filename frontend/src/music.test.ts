import { describe, expect, it } from "vitest";
import { musicLink } from "./MusicPanel";

describe("music links", () => {
  it.each([
    "https://youtu.be/abcdefgh_12?t=20",
    "https://www.youtube.com/watch?v=abcdefgh_12&list=ignored",
    "https://music.youtube.com/watch?v=abcdefgh_12",
    "https://youtube.com/shorts/abcdefgh_12",
    "https://www.youtube.com/live/abcdefgh_12",
  ])("uses the official embed for %s without autoplay", (link) => {
    expect(musicLink(link)).toEqual({ kind: "youtube", url: "https://www.youtube-nocookie.com/embed/abcdefgh_12?loop=1&playlist=abcdefgh_12" });
  });

  it("preserves signed audio links and does not mistake lookalike hosts for YouTube", () => {
    expect(musicLink(" https://cdn.example.com/song.mp3?token=123 ")).toEqual({ kind: "audio", url: "https://cdn.example.com/song.mp3?token=123" });
    expect(musicLink("https://youtube.com.example.com/song.mp3").kind).toBe("audio");
  });

  it.each(["javascript:alert(1)", "file:///C:/song.mp3", "data:audio/mp3;base64,a", "ftp://example.com/song.mp3",
    "https://user:password@example.com/song.mp3", "https://youtube.com/playlist?list=123", "https://youtu.be/invalid",
    "https://open.spotify.com/track/123", "not a URL"])("rejects unusable or unsafe link %s", (link) => {
    expect(() => musicLink(link)).toThrow();
  });
});
