"use client";

import { UNITS, UNIT_MAX, type PublicBoard, type UnitId } from "@/lib/game";

function zoneOpacity(score: number) {
  return 0.18 + (score / UNIT_MAX) * 0.42;
}

export function MapView({ board }: { board: PublicBoard }) {
  const fill = (id: UnitId) => {
    const unit = UNITS.find((item) => item.id === id);
    return { color: unit?.color ?? "#fff", opacity: zoneOpacity(board.units[id]) };
  };
  const f1 = fill("f1");
  const mid = fill("234");
  const senior = fill("56");

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-gold uppercase">Aerial yard</p>
          <h2 className="font-display text-4xl leading-none sm:text-5xl">Who owns which ground</h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Colour grows as the tidy track fills. Not to scale, built for the window TV.
        </p>
      </header>

      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#d7e7c4] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <svg viewBox="0 0 1200 820" className="h-auto w-full" role="img" aria-label="School yard map">
          <defs>
            <pattern id="grass-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="3" r="1.1" fill="#7da86a" opacity="0.45" />
              <circle cx="12" cy="11" r="1" fill="#6e9a58" opacity="0.35" />
            </pattern>
            <pattern id="deck" width="14" height="14" patternUnits="userSpaceOnUse">
              <rect width="14" height="14" fill="#c9844a" />
              <path d="M0 7h14" stroke="#a56732" strokeWidth="1" />
            </pattern>
            <pattern id="sand" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="#e6c27a" />
              <circle cx="3" cy="4" r="0.7" fill="#c9a15a" />
              <circle cx="9" cy="8" r="0.6" fill="#c9a15a" />
            </pattern>
            <pattern id="softfall" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#e7b1cf" />
              <circle cx="4" cy="5" r="1" fill="#d98fba" />
            </pattern>
          </defs>

          <rect width="1200" height="820" fill="#c5ddb0" />
          <rect width="1200" height="820" fill="url(#grass-dots)" />

          <polygon
            points="36,250 430,236 456,470 410,786 36,786"
            fill={f1.color}
            fillOpacity={f1.opacity}
            stroke={f1.color}
            strokeWidth="6"
          />
          <polygon
            points="468,236 804,228 822,786 452,774"
            fill={mid.color}
            fillOpacity={mid.opacity}
            stroke={mid.color}
            strokeWidth="6"
          />
          <polygon
            points="836,232 1164,244 1164,786 846,786"
            fill={senior.color}
            fillOpacity={senior.opacity}
            stroke={senior.color}
            strokeWidth="6"
          />

          <g>
            <rect x="70" y="36" width="1060" height="168" rx="18" fill="#e7d2bc" stroke="#b88868" strokeWidth="4" />
            <rect x="70" y="36" width="1060" height="28" rx="18" fill="#c96b4a" />
            <rect x="70" y="52" width="1060" height="12" fill="#c96b4a" />
            {Array.from({ length: 14 }, (_, index) => (
              <rect
                key={index}
                x={110 + index * 72}
                y={88}
                width="42"
                height="36"
                rx="4"
                fill="#9fd7ef"
                stroke="#6e5648"
                strokeWidth="3"
              />
            ))}
            <rect x="560" y="132" width="80" height="72" rx="6" fill="#6e5648" />
            <text x="110" y="168" fill="#6e5648" fontSize="26" fontFamily="Nunito, sans-serif" fontWeight="800">
              Classrooms
            </text>
          </g>

          <rect x="48" y="214" width="1104" height="22" rx="8" fill="#efe4cc" />

          <g>
            <ellipse cx="220" cy="430" rx="150" ry="108" fill="#7fbf62" stroke="#f7f3ea" strokeWidth="10" />
            <ellipse cx="220" cy="430" rx="118" ry="80" fill="none" stroke="#f7f3ea" strokeWidth="3" strokeDasharray="8 6" />
            <rect x="206" y="360" width="28" height="140" rx="4" fill="#d8c39a" />
            <text x="220" y="436" textAnchor="middle" fill="#21401a" fontSize="22" fontFamily="Nunito, sans-serif" fontWeight="800">
              Oval
            </text>
            <rect x="78" y="590" width="300" height="150" rx="16" fill="url(#sand)" stroke="#b8893e" strokeWidth="4" />
            <path d="M120 650 h70 v-28 h18 v48 h-88 z" fill="#d07a45" stroke="#8a4b22" strokeWidth="3" />
            <polygon points="300,640 314,668 286,668" fill="#ff6b3d" />
            <polygon points="330,628 344,656 316,656" fill="#ffb703" />
            <text x="228" y="700" textAnchor="middle" fill="#5c3b12" fontSize="20" fontFamily="Nunito, sans-serif" fontWeight="800">
              Construction yard
            </text>
          </g>

          <g>
            <rect x="500" y="280" width="150" height="110" rx="10" fill="#f3efe6" stroke="#8d8174" strokeWidth="4" />
            <rect x="524" y="318" width="28" height="48" rx="3" fill="#7eb0d8" />
            <rect x="598" y="318" width="28" height="48" rx="3" fill="#f0a3c2" />
            <text x="575" y="304" textAnchor="middle" fill="#4d453c" fontSize="18" fontFamily="Nunito, sans-serif" fontWeight="800">
              Toilets
            </text>
            <rect x="670" y="268" width="110" height="78" rx="8" fill="#d9c3a4" stroke="#8d6b45" strokeWidth="3" />
            <rect x="660" y="340" width="140" height="70" rx="8" fill="url(#deck)" stroke="#8a552c" strokeWidth="3" />
            <text x="730" y="382" textAnchor="middle" fill="#4a2c12" fontSize="18" fontFamily="Nunito, sans-serif" fontWeight="800">
              BER deck
            </text>
            <rect x="500" y="470" width="280" height="250" rx="22" fill="url(#softfall)" stroke="#c47aa6" strokeWidth="4" />
            <line x1="560" y1="520" x2="560" y2="610" stroke="#5c4a42" strokeWidth="6" />
            <line x1="530" y1="545" x2="590" y2="545" stroke="#5c4a42" strokeWidth="6" />
            <path d="M530 545 q15 28 0 46" stroke="#5c4a42" strokeWidth="3" fill="none" />
            <path d="M590 545 q-15 28 0 46" stroke="#5c4a42" strokeWidth="3" fill="none" />
            <path d="M680 560 h70 l-20 70 h-30 z" fill="#6ec8e0" stroke="#2f6f86" strokeWidth="3" />
            <text x="640" y="680" textAnchor="middle" fill="#6a3158" fontSize="22" fontFamily="Nunito, sans-serif" fontWeight="800">
              Playground
            </text>
          </g>

          <g>
            <rect x="870" y="280" width="70" height="86" rx="8" fill="#e24b4b" />
            <rect x="950" y="286" width="70" height="80" rx="8" fill="#f2c14e" />
            <rect x="1030" y="292" width="70" height="74" rx="8" fill="#3dae6a" />
            <rect x="888" y="268" width="36" height="16" rx="4" fill="#9a2f2f" />
            <rect x="968" y="274" width="36" height="16" rx="4" fill="#b88920" />
            <rect x="1048" y="280" width="36" height="16" rx="4" fill="#1f7a45" />
            <text x="985" y="390" textAnchor="middle" fill="#2d2a4a" fontSize="18" fontFamily="Nunito, sans-serif" fontWeight="800">
              Bin area
            </text>

            <rect x="868" y="430" width="260" height="90" rx="12" fill="#efe4cc" stroke="#cbb892" strokeWidth="3" />
            <rect x="890" y="452" width="70" height="28" rx="4" fill="#8d6b45" />
            <rect x="980" y="452" width="70" height="28" rx="4" fill="#8d6b45" />
            <rect x="1070" y="458" width="36" height="22" rx="4" fill="#d7d2ea" />
            <text x="998" y="508" textAnchor="middle" fill="#5c4630" fontSize="18" fontFamily="Nunito, sans-serif" fontWeight="800">
              Eating area
            </text>

            <rect x="868" y="540" width="270" height="150" rx="8" fill="#d98546" stroke="#f4efe4" strokeWidth="4" />
            <rect x="900" y="568" width="70" height="94" fill="none" stroke="#f4efe4" strokeWidth="3" />
            <circle cx="1003" cy="615" r="18" fill="none" stroke="#f4efe4" strokeWidth="3" />
            <line x1="868" y1="615" x2="1138" y2="615" stroke="#f4efe4" strokeWidth="2" />
            <rect x="1124" y="590" width="8" height="50" fill="#ded7ea" />
            <text x="1003" y="668" textAnchor="middle" fill="#fff7ea" fontSize="18" fontFamily="Nunito, sans-serif" fontWeight="800">
              Basketball
            </text>

            <ellipse cx="990" cy="740" rx="120" ry="28" fill="#8fcb73" />
            <circle cx="900" cy="724" r="16" fill="#3e7a3a" />
            <rect x="896" y="724" width="8" height="22" fill="#6b4a2a" />
            <text x="1040" y="746" fill="#245024" fontSize="18" fontFamily="Nunito, sans-serif" fontWeight="800">
              Grass
            </text>
          </g>
        </svg>

        <MapChip
          unitId="f1"
          score={board.units.f1}
          className="left-[3%] top-[32%] w-[30%]"
        />
        <MapChip
          unitId="234"
          score={board.units["234"]}
          className="left-[39%] top-[30%] w-[28%]"
        />
        <MapChip
          unitId="56"
          score={board.units["56"]}
          className="left-[70%] top-[31%] w-[27%]"
        />
      </div>
    </div>
  );
}

function MapChip({
  unitId,
  score,
  className,
}: {
  unitId: UnitId;
  score: number;
  className: string;
}) {
  const unit = UNITS.find((item) => item.id === unitId);
  if (!unit) return null;
  return (
    <div
      className={`absolute rounded-2xl border border-white/10 bg-[#070b18]/82 p-2 shadow-lg backdrop-blur-sm sm:p-3 ${className}`}
    >
      <p
        className="font-display text-[clamp(1rem,2.6vw,2rem)] leading-none"
        style={{ color: unit.color }}
      >
        {unit.code}
      </p>
      <p className="mt-1 text-[clamp(0.65rem,1.3vw,0.95rem)] leading-snug font-bold text-[#f6f1e6]">
        {unit.zoneLine}
      </p>
      <p className="font-display text-[clamp(1.1rem,2.4vw,2rem)] leading-none tabular-nums text-white">
        {score}
        <span className="text-[0.55em] text-white/60">/{UNIT_MAX}</span>
      </p>
    </div>
  );
}
