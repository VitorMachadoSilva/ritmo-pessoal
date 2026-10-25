import type { AmbientSceneId } from "./useFolhinhaAmbient";

/**
 * Cenário das cenas ambientes do Folhinha.
 *
 * Tudo é desenhado DENTRO do <svg> do Folhinha, nas mesmas unidades dele (viewBox 160×190, chão em y≈177).
 * Assim o cenário nunca desalinha do personagem, qualquer que seja o `size` do gatilho.
 * Cada grupo começa escondido (display="none") e o CSS mostra só o da cena ativa
 * (.help-agent.is-ambient-<cena> .fl-w-<cena>). Nenhuma prop nova é necessária.
 *
 * Camadas: "back" é desenhada atrás do personagem, "front" na frente dele.
 */

const SPARKLE = "M0-7 2-2 7 0 2 2 0 7-2 2-7 0-2-2Z";

function Glint({ x, y, delay }: { x: number; y: number; delay: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path className="fl-glint" d={SPARKLE} fill="#dcf28f" stroke="#6f9552" strokeWidth=".6" opacity={0} style={{ animationDelay: `${delay}s` }} />
  </g>;
}

function Back() {
  return <g className="fl-world" aria-hidden="true">
    <g className="fl-w fl-w-plant" display="none">
      <ellipse cx="-125" cy="178" rx="19" ry="3.2" fill="#a88a66" opacity=".5" />
      <g className="fl-mound" opacity={0}>
        <path d="M-143 178Q-143 164 -125 163Q-107 164 -107 178Z" fill="#8a6a4a" stroke="#6b4f35" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-135 171Q-128 167 -120 169" stroke="#a88a66" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
      <g className="fl-sprout">
        <path d="M-125 166V142" stroke="#6f9552" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M-125 146C-136 134-150 137-153 146-142 154-131 153-125 146Z" fill="#a9cc62" stroke="#6f9552" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M-125 146C-114 134-100 137-97 146-108 154-119 153-125 146Z" fill="#a9cc62" stroke="#6f9552" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {[0, 1, 2].map((i) => <circle key={i} className="fl-drop" cx={-123 + i * 2.5} cy="140" r="2.4" fill="#78b7cc" opacity={0} style={{ animationDelay: `${9.7 + i * 0.16}s` }} />)}
    </g>

    <g className="fl-w fl-w-read" display="none">
      <ellipse cx="80" cy="179" rx="62" ry="11" fill="#e3d3a8" stroke="#b8a273" strokeWidth="2" />
      <ellipse cx="80" cy="175" rx="46" ry="6" fill="#efe3c0" />
      <circle cx="80" cy="175" r="2" fill="#b8a273" />
    </g>

    <g className="fl-w fl-w-nap" display="none">
      <rect className="fl-mat" x="-34" y="168" width="228" height="16" rx="8" fill="#d9d5bf" stroke="#a4ae94" strokeWidth="2" />
      <ellipse cx="22" cy="142" rx="32" ry="24" fill="#f2ead5" stroke="#cdbf9b" strokeWidth="2" />
      <path d="M2 142Q22 134 42 142" stroke="#cdbf9b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </g>
  </g>;
}

function Front() {
  return <g className="fl-world" aria-hidden="true">
    <g className="fl-w fl-w-plant" display="none">
      <Glint x={-152} y={126} delay={14.2} />
      <Glint x={-98} y={120} delay={14.4} />
    </g>

    <g className="fl-w fl-w-nap" display="none">
      <g className="fl-blanket" opacity={0}>
        <path d="M110 98Q102 120 108 138 100 156 108 178H162Q170 140 160 104 136 92 110 98Z" fill="#b7d19c" stroke="#8fb573" strokeWidth="2" strokeLinejoin="round" />
        <path d="M112 118Q136 112 160 120M110 142Q136 136 164 144" stroke="#8fb573" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".6" />
      </g>
      <g className="fl-zs" opacity={0}>
        {[[98, 84, 24, 0], [108, 68, 30, 1.1], [120, 50, 36, 2.2]].map(([x, y, size, delay]) =>
          <g key={delay} transform={`translate(${x} ${y})`}>
            <text className="fl-z" style={{ fontSize: size, animationDelay: `${delay}s` }} opacity={0}>z</text>
          </g>)}
      </g>
    </g>

    <g className="fl-w fl-w-stretch" display="none">
      <Glint x={20} y={64} delay={10.4} />
      <Glint x={142} y={70} delay={10.55} />
      <Glint x={124} y={22} delay={10.7} />
      <Glint x={36} y={28} delay={10.85} />
    </g>

    <g className="fl-w fl-w-butterfly" display="none">
      <g className="fl-bf" opacity={0}>
        <g className="fl-bf-in">
          <g className="fl-bf-wl">
            <path d="M0-1C-6-16-22-17-20-4-19 2-8 2 0-1Z" fill="#e6b8e0" stroke="#9c80a9" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M0 1C-6 8-14 13-16 7-16 2-6 0 0 1Z" fill="#f2cc8e" stroke="#b08a57" strokeWidth="1.4" strokeLinejoin="round" />
          </g>
          <g className="fl-bf-wr">
            <path d="M0-1C6-16 22-17 20-4 19 2 8 2 0-1Z" fill="#e6b8e0" stroke="#9c80a9" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M0 1C6 8 14 13 16 7 16 2 6 0 0 1Z" fill="#f2cc8e" stroke="#b08a57" strokeWidth="1.4" strokeLinejoin="round" />
          </g>
          <ellipse cx="0" cy="1" rx="1.8" ry="6" fill="#746582" />
          <path d="M-.5-5-4-11M.5-5 4-11" stroke="#746582" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </g>
  </g>;
}

export function FolhinhaWorld({ layer }: { layer: "back" | "front" }) {
  return layer === "back" ? <Back /> : <Front />;
}

/**
 * @deprecated O cenário agora vive dentro do <Folhinha />. Pode remover este componente do HelpAgent;
 * ele fica aqui (renderizando nada) só para o código antigo não quebrar.
 */
export function FolhinhaAmbientScene(_props: { scene: AmbientSceneId; exiting: boolean }) {
  return null;
}
