export function GrowingPlant() {
  return (
    <svg className="auth-plant" viewBox="0 0 120 130" fill="none" aria-hidden="true">
      <ellipse className="plant-soil" cx="60" cy="111" rx="32" ry="5" />
      <ellipse className="plant-seed" cx="60" cy="105" rx="7" ry="5" />
      <path className="plant-stem" d="M60 103C58 82 63 61 60 33" />
      <path className="plant-leaf plant-leaf-left" d="M61 78C46 79 37 71 36 61C47 59 58 64 61 78Z" />
      <path className="plant-leaf plant-leaf-right" d="M59 63C62 48 73 42 83 44C82 55 74 64 59 63Z" />
      <path className="plant-bud" d="M60 38C53 32 53 25 60 19C67 25 67 32 60 38Z" />
      <path className="plant-flower" d="M60 24C49 20 51 12 57 13C57 3 65 4 65 13C75 12 75 20 65 24C68 33 60 35 57 25Z" />
    </svg>
  );
}
