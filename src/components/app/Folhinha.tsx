import { useId, useState, type CSSProperties } from "react";
import { FolhinhaWorld } from "./FolhinhaAmbientScene";

export type FolhinhaMood = "idle" | "happy" | "thinking" | "wave" | "listening" | "reminder" | "settling";
type FolhinhaProps = { size?: number; mood?: FolhinhaMood; animated?: boolean; hoverable?: boolean; hovered?: boolean };

const ARM_FILL = { fill: "#8fb573", stroke: "#6f9552", strokeWidth: 1.5 } as const;

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

    {/* Cenário das animações ambientes: só aparece quando o HelpAgent ganha .is-ambient-<cena> */}
    <FolhinhaWorld layer="back" />

    <ellipse className="fl-shadow" cx="80" cy="184" rx="38" ry="5" fill="#000" opacity=".18" />

    {/* fl-actor / fl-stride: poses das cenas (CSS). fl-body: respiração/flutuação de sempre. */}
    <g className="fl-actor"><g className="fl-stride"><g className="fl-body" style={bodyStyle}>
      <path d="M80 42C80 34 80 28 80 22" stroke="#6f9552" strokeWidth="4" strokeLinecap="round" fill="none" />
      <g className="fl-leaf-l"><g style={{ transformOrigin: "80px 26px", ...(hoverFx && animated ? { animation: "fl-perk-l .5s ease-in-out infinite" } : anim("fl-sway-l", "3.6s")) }}>
        <path d="M80 27C68 13 50 15 46 25 57 34 72 33 80 27Z" fill={`url(#leaf-${uid})`} stroke="#6f9552" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M78 27C68 24 59 24 52 25" stroke="#6f9552" strokeOpacity=".45" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g></g>
      <g className="fl-leaf-r"><g style={{ transformOrigin: "80px 26px", ...(hoverFx && animated ? { animation: "fl-perk-r .5s ease-in-out infinite" } : anim("fl-sway-r", "3.6s")) }}>
        <path d="M80 27C92 13 110 15 114 25 103 34 88 33 80 27Z" fill={`url(#leaf-${uid})`} stroke="#6f9552" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M82 27C92 24 101 24 108 25" stroke="#6f9552" strokeOpacity=".45" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g></g>
      <g className="fl-foot-l"><ellipse cx="62" cy="170" rx="13" ry="7" {...ARM_FILL} /></g>
      <g className="fl-foot-r"><ellipse cx="98" cy="170" rx="13" ry="7" {...ARM_FILL} /></g>
      <g className="fl-arm-l"><ellipse cx="32" cy="118" rx="8" ry="14" transform="rotate(18 32 118)" {...ARM_FILL} /></g>
      <path d="M80 40C118 48 138 86 130 124 124 152 102 166 80 166s-44-14-50-42c-8-38 12-76 50-84Z" fill={`url(#body-${uid})`} stroke="#6f9552" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="56" cy="66" rx="14" ry="8" transform="rotate(-30 56 66)" fill="#fff" opacity=".2" />
      <g className="fl-arm-r"><g style={{ transformOrigin: "126px 108px", ...(waving && animated ? { animation: "fl-wave 1.1s ease-in-out infinite" } : {}) }}>
        <ellipse cx={listening ? 107 : 130} cy={listening ? 134 : waving ? 100 : 118} rx="8" ry="14" transform={listening ? "rotate(45 107 134)" : waving ? "rotate(-25 130 100)" : "rotate(-18 130 118)"} {...ARM_FILL} />
      </g></g>

      {/* Mão esquerda "na frente": cópia do braço + o que ele segura (semente, regador). Escondida fora das cenas. */}
      <g className="fl-lhold">
        <g className="fl-lh-arm" opacity={0}><ellipse cx="32" cy="118" rx="8" ry="14" transform="rotate(18 32 118)" {...ARM_FILL} /></g>
        <ellipse className="fl-seed-held" cx="28" cy="131" rx="4.5" ry="3" transform="rotate(-25 28 131)" fill="#8a6a4a" stroke="#5f4630" strokeWidth="1" opacity={0} />
        <g className="fl-can" opacity={0}>
          <path d="M22 116Q31 100 42 116" stroke="#557e7d" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M17 138 -6 114" stroke="#557e7d" strokeWidth="6" strokeLinecap="round" />
          <path d="M17 138 -6 114" stroke="#8db8b7" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="-9" cy="111" rx="4.5" ry="6" transform="rotate(-42 -9 111)" fill="#a8d0cf" stroke="#557e7d" strokeWidth="2" />
          <path d="M14 116H48L45 144Q45 147 42 147H20Q17 147 17 144Z" fill="#8db8b7" stroke="#557e7d" strokeWidth="2" strokeLinejoin="round" />
          <path d="M21 124H42" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>

      <g className="fl-face">
        <ellipse cx="50" cy="112" rx="8" ry="5" fill="#f2b49a" opacity={hoverFx ? .9 : .55} />
        <ellipse cx="110" cy="112" rx="8" ry="5" fill="#f2b49a" opacity={hoverFx ? .9 : .55} />
        {happyEyes ? <g stroke="#14261b" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M54 98Q62 88 70 98" /><path d="M90 98Q98 88 106 98" /></g> : <g className="fl-eyes-open"><g transform={thinking ? "translate(4 -4)" : listening ? "translate(-3 -5)" : undefined}>
          {[62, 98].map((x) => <g key={x} style={{ transformBox: "fill-box", transformOrigin: "center", ...anim("fl-blink", "5s") }}>
            <circle cx={x} cy="96" r="8" fill="#14261b" /><circle cx={x + 2.5} cy="93" r="2.8" fill="#fff" />
          </g>)}
        </g></g>}
        {/* olhos alternativos das cenas: contentes (^ ^) e fechados (sono) */}
        <g className="fl-eyes-happy" opacity={0} stroke="#14261b" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M54 98Q62 88 70 98" /><path d="M90 98Q98 88 106 98" /></g>
        <g className="fl-eyes-closed" opacity={0} stroke="#14261b" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M54 96Q62 104 70 96" /><path d="M90 96Q98 104 106 96" /></g>
        {thinking && <path d="M88 82Q98 76 108 82" stroke="#14261b" strokeWidth="3" strokeLinecap="round" fill="none" />}
        <g className="fl-mouth-smile">
          {thinking ? <ellipse cx="82" cy="119" rx="4" ry="4.5" fill="#14261b" /> : happyEyes ? <g>
            <path d="M68 112Q80 132 92 112Z" fill="#14261b" /><path d="M74 122Q80 128 86 122 80 118 74 122Z" fill="#e87f7f" />
          </g> : <path d="M70 114Q80 123 90 114" stroke="#14261b" strokeWidth="3.5" strokeLinecap="round" fill="none" />}
        </g>
        <g className="fl-mouth-o" opacity={0}>
          <g className="fl-mouth-o-in"><ellipse cx="80" cy="118" rx="5" ry="6" fill="#14261b" /><ellipse cx="80" cy="121.5" rx="3" ry="2.2" fill="#e87f7f" /></g>
        </g>
        <g className="fl-glasses" opacity={0} fill="none" stroke="#3f4a38" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="62" cy="96" r="13.5" fill="#fff" fillOpacity=".16" />
          <circle cx="98" cy="96" r="13.5" fill="#fff" fillOpacity=".16" />
          <path d="M75.5 94Q80 90 84.5 94M48.5 93 40 90M111.5 93 120 90" />
        </g>
      </g>

      <g className="fl-book" opacity={0}>
        <path d="M38 128Q60 118 80 127 100 118 122 128V156Q100 148 80 157 60 148 38 156Z" fill="#7da2a0" stroke="#557e7d" strokeWidth="2" strokeLinejoin="round" />
        <path d="M42 130Q61 122 79 130V153Q61 146 42 151Z" fill="#fbf6e6" stroke="#b9a889" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M81 130Q99 122 118 130V151Q99 146 81 153Z" fill="#fbf6e6" stroke="#b9a889" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M49 135Q60 131 72 135M49 141Q60 137 72 141M49 147Q60 143 72 147M89 135Q100 131 111 135M89 141Q100 137 111 141" stroke="#b9a889" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path className="fl-page" opacity={0} d="M81 130Q99 122 118 130V151Q99 146 81 153Z" fill="#fffdf4" stroke="#b9a889" strokeWidth="1.2" strokeLinejoin="round" />
      </g>

      {hoverFx && animated && <g fill="#dcf28f">{sparkles.map(([x, y, delay], index) => <g key={index} transform={`translate(${x} ${y})`}><path className="fl-spark" d="M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" style={{ animationDelay: `${delay}s` }} /></g>)}</g>}
      {thinking && <g fill="#dcf28f">{[0, 1, 2].map((index) => <circle key={index} cx={122 + index * 10} cy={44 - index * 8} r={3 + index} style={anim("fl-dots", "1.2s")} />)}</g>}
    </g></g></g>

    <FolhinhaWorld layer="front" />
  </svg>;
}
