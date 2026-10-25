import { Brain, Eye, Grid3X3, Hash } from "lucide-react";
import type { CognitiveGameId } from "../../types";

export const games: { id: CognitiveGameId; name: string; title: string; domain: string; description: string; duration: string; icon: typeof Brain; kind: "green" | "purple" | "blue" | "orange" }[] = [
  { id: "memory", name: "Pares", title: "Memória visual", domain: "Memória", description: "Encontre os pares observando as posições e os símbolos.", duration: "2–4 min", icon: Brain, kind: "green" },
  { id: "sequence", name: "Sequência", title: "Sequência numérica", domain: "Memória de trabalho", description: "Observe uma sequência curta e tente lembrá-la na ordem.", duration: "1–2 min", icon: Hash, kind: "purple" },
  { id: "stroop", name: "Stroop", title: "Palavra e cor", domain: "Atenção seletiva", description: "Escolha a cor da tinta, mesmo quando a palavra aponta para outra.", duration: "2–3 min", icon: Eye, kind: "orange" },
  { id: "schulte", name: "Busca", title: "Busca visual", domain: "Atenção visual", description: "Encontre os números na ordem, mantendo o olhar no quadro.", duration: "1–3 min", icon: Grid3X3, kind: "blue" },
];

export const gameColors: Record<string, string> = { vermelho: "#a94845", azul: "#4478a2", verde: "#527b4a", amarelo: "#ba8b35" };
export const memorySymbolNames: Record<string, string> = { "🌿": "folha", "🍐": "pera", "🪷": "flor de lótus", "🪺": "ninho", "🍋": "limão", "🫐": "mirtilos", "🪴": "planta em vaso", "🌻": "girassol", "🍄": "cogumelo", "🪸": "coral", "🍇": "uvas", "🪻": "jacinto", "🐚": "concha", "🍉": "melancia", "🌱": "broto", "🦋": "borboleta" };

export const elapsedLabel = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
