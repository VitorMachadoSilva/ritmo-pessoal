import { useId, useState, type CSSProperties } from "react";

export type FolhinhaMood = "idle" | "happy" | "thinking" | "wave" | "listening" | "reminder" | "settling";
type FolhinhaProps = { size?: number; mood?: FolhinhaMood; animated?: boolean; hoverable?: boolean; hovered?: boolean };

export function Folhinha({ size = 44, mood = "idle", animated = true, hoverable = true, hovered }: FolhinhaProps) {
  const uid = useId().replace(/:/g, "");
  const [selfHover, setSelfHover] = useState(false);
  const isHover = hovered ?? (hoverable && selfHover);
  const hoverFx = isHover && mood === "idle";
  const anim = (name: string, duration: string): CSSProperties => animated ? { animation: `${name} ${duration} ease-in-out infinite` } : {};
  const listening = mood === "listening";
  const happyEyes = mood === "happy" || mood === "reminder" || hoverFx;
  const thinking = mood === "thinking";
  const waving = mood === "wave" || mood === "reminder" || hoverFx;
  const bodyStyle: CSSProperties = !animated ? {} : hoverFx
    ? { transformOrigin: "80px 176px", animation: "fl-hop .6s ease-out, fl-float 3.2s ease-in-out .6s infinite" }
    : { transformOrigin: "80px 176px", animation: listening ? "fl-listen 3s ease-in-out infinite" : mood === "reminder" ? "fl-remind 1.4s ease-in-out 2" : mood === "settling" ? "fl-settle 450ms ease-out both" : "fl-float 3.2s ease-in-out infinite" };
  const sparkles = [[20, 64, 0], [142, 70, 0.15], [124, 22, 0.3], [36, 28, 0.45]] as const;

  return <svg
    onMouseEnter={() => setSelfHover(true)}
    onMouseLeave={() => setSelfHover(false)}
    className={animated ? "folhinha fl-anim" : "folhinha"}
    data-mood={mood}
    width={size}
    height={size * (190 / 160)}
    viewBox="0 0 160 190"
    role="img"
    aria-label="Folhinha, o assistente do Ritmo"
    style={{ display: "block", overflow: "visible" }}
  >
    <defs>
      <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe3b0" /><stop offset="1" stopColor="#8fb573" /></linearGradient>
      <linearGradient id={`leaf-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dcf28f" /><stop offset="1" stopColor="#a9cc62" /></linearGradient>
    </defs>
    <ellipse cx="80" cy="184" rx="38" ry="5" fill="#000" opacity=".18" />
    <g style={bodyStyle}>
      <path d="M80 42C80 34 80 28 80 22" stroke="#6f9552" strokeWidth="4" strokeLinecap="round" fill="none" />
      <g style={{ transformOrigin: "80px 26px", ...(hoverFx && animated ? { animation: "fl-perk-l .5s ease-in-out infinite" } : anim("fl-sway-l", "3.6s")) }}>
        <path d="M80 27C68 13 50 15 46 25 57 34 72 33 80 27Z" fill={`url(#leaf-${uid})`} stroke="#6f9552" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M78 27C68 24 59 24 52 25" stroke="#6f9552" strokeOpacity=".45" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <g style={{ transformOrigin: "80px 26px", ...(hoverFx && animated ? { animation: "fl-perk-r .5s ease-in-out infinite" } : anim("fl-sway-r", "3.6s")) }}>
        <path d="M80 27C92 13 110 15 114 25 103 34 88 33 80 27Z" fill={`url(#leaf-${uid})`} stroke="#6f9552" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M82 27C92 24 101 24 108 25" stroke="#6f9552" strokeOpacity=".45" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="62" cy="170" rx="13" ry="7" fill="#8fb573" stroke="#6f9552" strokeWidth="1.5" />
      <ellipse cx="98" cy="170" rx="13" ry="7" fill="#8fb573" stroke="#6f9552" strokeWidth="1.5" />
      <ellipse cx="32" cy="118" rx="8" ry="14" transform="rotate(18 32 118)" fill="#8fb573" stroke="#6f9552" strokeWidth="1.5" />
      <path d="M80 40C118 48 138 86 130 124 124 152 102 166 80 166s-44-14-50-42c-8-38 12-76 50-84Z" fill={`url(#body-${uid})`} stroke="#6f9552" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="56" cy="66" rx="14" ry="8" transform="rotate(-30 56 66)" fill="#fff" opacity=".2" />
      <g style={{ transformOrigin: "126px 108px", ...(waving && animated ? { animation: "fl-wave 1.1s ease-in-out infinite" } : {}) }}>
        <ellipse cx={listening ? 107 : 130} cy={listening ? 134 : waving ? 100 : 118} rx="8" ry="14" transform={listening ? "rotate(45 107 134)" : waving ? "rotate(-25 130 100)" : "rotate(-18 130 118)"} fill="#8fb573" stroke="#6f9552" strokeWidth="1.5" />
      </g>
      <ellipse cx="50" cy="112" rx="8" ry="5" fill="#f2b49a" opacity={hoverFx ? .9 : .55} />
      <ellipse cx="110" cy="112" rx="8" ry="5" fill="#f2b49a" opacity={hoverFx ? .9 : .55} />
      {happyEyes ? <g stroke="#14261b" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M54 98Q62 88 70 98" /><path d="M90 98Q98 88 106 98" /></g> : <g transform={thinking ? "translate(4 -4)" : listening ? "translate(-3 -5)" : undefined}>
        {[62, 98].map((x) => <g key={x} style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("fl-blink", "5s") }}>
          <circle cx={x} cy="96" r="8" fill="#14261b" /><circle cx={x + 2.5} cy="93" r="2.8" fill="#fff" />
        </g>)}
      </g>}
      {thinking && <path d="M88 82Q98 76 108 82" stroke="#14261b" strokeWidth="3" strokeLinecap="round" fill="none" />}
      {thinking ? <ellipse cx="82" cy="119" rx="4" ry="4.5" fill="#14261b" /> : happyEyes ? <g>
        <path d="M68 112Q80 132 92 112Z" fill="#14261b" /><path d="M74 122Q80 128 86 122 80 118 74 122Z" fill="#e87f7f" />
      </g> : <path d="M70 114Q80 123 90 114" stroke="#14261b" strokeWidth="3.5" strokeLinecap="round" fill="none" />}
      {hoverFx && animated && <g fill="#dcf28f">{sparkles.map(([x, y, delay], index) => <g key={index} transform={`translate(${x} ${y})`}><path className="fl-spark" d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" style={{ animationDelay: `${delay}s` }} /></g>)}</g>}
      {thinking && <g fill="#dcf28f">{[0, 1, 2].map((index) => <circle key={index} cx={122 + index * 10} cy={44 - index * 8} r={3 + index} style={anim("fl-dots", "1.2s")} />)}</g>}
    </g>
  </svg>;
}
