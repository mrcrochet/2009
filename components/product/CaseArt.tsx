/**
 * Key art — drawn compositions, not gradient washes.
 *
 * Ported from the design reference exactly, symbol for symbol, so that replacing one with
 * photography later means swapping what is inside an id and nothing else moves. `KeyArtDefs`
 * renders the hidden sprite once per page; `<Art id="art-lot" />` draws from it.
 */

export type ArtId =
  | 'art-lot'
  | 'art-house'
  | 'art-screen'
  | 'art-signal'
  | 'art-corridor'
  | 'art-ledger'
  | 'art-blinds'
  | 'art-road'
  | 'art-paper'

export function Art({ id }: { id: ArtId }) {
  return (
    <svg aria-hidden="true" focusable="false">
      <use href={`#${id}`} />
    </svg>
  )
}

export function KeyArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".8"
            numOctaves="2"
            stitchTiles="stitch"
            result="n"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 .12" />
          </feComponentTransfer>
          <feBlend in2="SourceGraphic" mode="overlay" />
        </filter>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id="vig" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity=".7" />
        </radialGradient>

        {/* 01 He never came home: empty car under a sodium lamp, wet lot */}
        <symbol id="art-lot" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#0C0E12" />
          <rect y="330" width="400" height="270" fill="#111318" />
          <ellipse
            cx="300"
            cy="120"
            rx="150"
            ry="120"
            fill="#E7B25A"
            opacity=".22"
            filter="url(#soft)"
          />
          <line x1="300" y1="0" x2="300" y2="112" stroke="#8A8C90" strokeWidth="3" />
          <rect x="284" y="108" width="32" height="10" rx="2" fill="#D9D3C4" />
          <polygon points="300,118 190,330 410,330" fill="#E7B25A" opacity=".10" />
          <g stroke="#3B3F47" strokeWidth="2">
            <line x1="40" y1="330" x2="0" y2="600" />
            <line x1="140" y1="330" x2="110" y2="600" />
            <line x1="260" y1="330" x2="290" y2="600" />
            <line x1="360" y1="330" x2="400" y2="600" />
          </g>
          <g fill="#1D2027">
            <rect x="150" y="286" width="150" height="46" rx="10" />
            <path d="M175 288 q20-30 60-30 h20 q28 0 42 30z" />
          </g>
          <rect x="182" y="266" width="76" height="20" rx="4" fill="#2A2E36" />
          <g fill="#E7B25A" opacity=".55">
            <rect x="150" y="300" width="14" height="6" rx="2" />
            <rect x="286" y="300" width="14" height="6" rx="2" />
          </g>
          <g fill="#0A0B0E">
            <circle cx="180" cy="332" r="11" />
            <circle cx="270" cy="332" r="11" />
          </g>
          <g opacity=".22">
            <rect
              x="150"
              y="340"
              width="150"
              height="46"
              rx="10"
              fill="#E7B25A"
              filter="url(#soft2)"
            />
          </g>
          <rect width="400" height="600" fill="url(#vig)" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 04 No signal: a house at night, one window lit */}
        <symbol id="art-house" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#0B0D11" />
          <rect y="0" width="400" height="360" fill="#10131A" />
          <circle cx="80" cy="70" r="26" fill="#DDE3EE" opacity=".18" />
          <g fill="#0A0B0E">
            <rect x="60" y="250" width="280" height="200" />
            <polygon points="40,252 200,140 360,252" />
            <rect x="300" y="170" width="24" height="60" />
          </g>
          <g fill="#131519" stroke="#1E2128" strokeWidth="2">
            <rect x="100" y="290" width="44" height="54" />
            <rect x="256" y="290" width="44" height="54" />
            <rect x="178" y="360" width="44" height="90" />
          </g>
          <rect x="256" y="290" width="44" height="54" fill="#E7B25A" opacity=".85" />
          <rect
            x="230"
            y="260"
            width="96"
            height="110"
            fill="#E7B25A"
            opacity=".18"
            filter="url(#soft)"
          />
          <rect x="0" y="450" width="400" height="150" fill="#0D0F13" />
          <g stroke="#1B1E25" strokeWidth="2">
            <line x1="0" y1="450" x2="400" y2="450" />
          </g>
          <rect width="400" height="600" fill="url(#vig)" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 06 The other account: figure lit only by a screen */}
        <symbol id="art-screen" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#0A0C10" />
          <ellipse
            cx="200"
            cy="360"
            rx="190"
            ry="150"
            fill="#9FB4D6"
            opacity=".14"
            filter="url(#soft)"
          />
          <g fill="#14181F">
            <ellipse cx="200" cy="330" rx="62" ry="70" />
            <path d="M110 600 q10-160 90-190 q80 30 90 190z" />
          </g>
          <g fill="#9FB4D6" opacity=".5">
            <path d="M158 330 q42-40 84 0 q-42 24 -84 0z" />
          </g>
          <path d="M90 520 L310 520 L330 460 L110 460 Z" fill="#1A1E26" />
          <rect x="112" y="386" width="176" height="76" rx="2" fill="#9FB4D6" opacity=".9" />
          <rect x="120" y="394" width="160" height="60" fill="#0E1116" opacity=".85" />
          <g fill="#9FB4D6" opacity=".7">
            <rect x="128" y="404" width="60" height="4" />
            <rect x="128" y="414" width="90" height="4" />
            <rect x="128" y="424" width="44" height="4" />
            <rect x="128" y="440" width="120" height="4" />
          </g>
          <rect width="400" height="600" fill="url(#vig)" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 08 The empty house: transmitter rings over a dark field */}
        <symbol id="art-signal" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#0B0C10" />
          <rect y="380" width="400" height="220" fill="#0E1014" />
          <g fill="none" stroke="#A9514C" strokeWidth="1.5">
            <circle cx="200" cy="330" r="24" opacity=".9" />
            <circle cx="200" cy="330" r="64" opacity=".5" />
            <circle cx="200" cy="330" r="112" opacity=".28" />
            <circle cx="200" cy="330" r="170" opacity=".14" />
            <circle cx="200" cy="330" r="240" opacity=".07" />
          </g>
          <circle cx="200" cy="330" r="5" fill="#E4675F" />
          <g fill="#07080A">
            <rect x="130" y="300" width="140" height="90" />
            <polygon points="120,302 200,246 280,302" />
          </g>
          <g fill="#0B0C10" stroke="#1A1D22" strokeWidth="1.5">
            <rect x="150" y="322" width="28" height="30" />
            <rect x="222" y="322" width="28" height="30" />
          </g>
          <rect width="400" height="600" fill="url(#vig)" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 09 Room 1705: hotel corridor, one door */}
        <symbol id="art-corridor" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#0C0D11" />
          <polygon points="0,0 400,0 260,180 140,180" fill="#12141A" />
          <polygon points="0,600 400,600 260,420 140,420" fill="#15171D" />
          <polygon points="0,0 140,180 140,420 0,600" fill="#0F1116" />
          <polygon points="400,0 260,180 260,420 400,600" fill="#0F1116" />
          <g stroke="#1E2128" strokeWidth="1.5">
            <line x1="0" y1="140" x2="140" y2="238" />
            <line x1="0" y1="460" x2="140" y2="362" />
            <line x1="400" y1="140" x2="260" y2="238" />
            <line x1="400" y1="460" x2="260" y2="362" />
          </g>
          <rect x="150" y="196" width="100" height="216" fill="#0A0B0E" />
          <rect
            x="150"
            y="196"
            width="100"
            height="216"
            fill="none"
            stroke="#2A2E36"
            strokeWidth="2"
          />
          <rect x="174" y="236" width="52" height="14" fill="#C9A96A" opacity=".9" />
          <line x1="150" y1="412" x2="250" y2="412" stroke="#E7B25A" strokeWidth="3" opacity=".9" />
          <rect
            x="140"
            y="404"
            width="120"
            height="30"
            fill="#E7B25A"
            opacity=".25"
            filter="url(#soft2)"
          />
          <rect width="400" height="600" fill="url(#vig)" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 10 Paid in full: a ledger page, redactions */}
        <symbol id="art-ledger" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#0F1013" />
          <rect x="54" y="60" width="292" height="520" fill="#E3DFD4" />
          <rect x="54" y="60" width="292" height="520" fill="url(#vig)" opacity=".5" />
          <g fill="#8E8A7E" opacity=".55">
            <rect x="80" y="92" width="120" height="6" />
            <rect x="80" y="106" width="70" height="4" />
          </g>
          <g stroke="#B8B3A6" strokeWidth="1">
            <line x1="80" y1="150" x2="320" y2="150" />
            <line x1="80" y1="190" x2="320" y2="190" />
            <line x1="80" y1="230" x2="320" y2="230" />
            <line x1="80" y1="270" x2="320" y2="270" />
            <line x1="80" y1="310" x2="320" y2="310" />
            <line x1="80" y1="350" x2="320" y2="350" />
            <line x1="80" y1="390" x2="320" y2="390" />
            <line x1="80" y1="430" x2="320" y2="430" />
          </g>
          <g fill="#6A6860">
            <rect x="84" y="164" width="90" height="5" />
            <rect x="84" y="204" width="110" height="5" />
            <rect x="84" y="284" width="80" height="5" />
            <rect x="84" y="364" width="100" height="5" />
            <rect x="84" y="404" width="70" height="5" />
          </g>
          <g fill="#111214">
            <rect x="84" y="242" width="140" height="12" />
            <rect x="84" y="322" width="120" height="12" />
            <rect x="84" y="442" width="180" height="12" />
          </g>
          <g fill="#6A6860" fontFamily="Geist Mono,monospace" fontSize="11">
            <text x="250" y="170">
              4,120.00
            </text>
            <text x="250" y="210">
              4,120.00
            </text>
            <text x="250" y="250">
              4,120.00
            </text>
            <text x="250" y="290">
              4,120.00
            </text>
            <text x="250" y="330">
              4,120.00
            </text>
            <text x="250" y="370">
              4,120.00
            </text>
            <text x="250" y="410">
              4,120.00
            </text>
          </g>
          <rect x="84" y="500" width="210" height="18" fill="#C9A96A" opacity=".9" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 11 Second shift: blinds, a silhouette */}
        <symbol id="art-blinds" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#0B0C10" />
          <g fill="#DDE3EE" opacity=".16">
            {[40, 84, 128, 172, 216, 260, 304, 348, 392, 436, 480, 524].map((y) => (
              <rect key={y} y={y} width="400" height="14" />
            ))}
          </g>
          <g fill="#07080A">
            <ellipse cx="240" cy="250" rx="52" ry="62" />
            <path d="M150 600 q10-200 90-250 q80 30 100 250z" />
          </g>
          <rect width="400" height="600" fill="url(#vig)" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 12 Exit 14: highway, one sign */}
        <symbol id="art-road" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#090A0D" />
          <polygon points="180,230 220,230 400,600 0,600" fill="#14161B" />
          <g stroke="#DDD9CE" strokeWidth="3" strokeDasharray="18 26" opacity=".7">
            <line x1="200" y1="240" x2="200" y2="600" />
          </g>
          <rect x="236" y="140" width="130" height="66" rx="3" fill="#1F5E43" />
          <rect
            x="236"
            y="140"
            width="130"
            height="66"
            rx="3"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="2"
            opacity=".6"
          />
          <g fill="#DDD9CE" opacity=".8">
            <rect x="250" y="156" width="70" height="8" />
            <rect x="250" y="172" width="44" height="6" />
            <rect x="250" y="186" width="90" height="6" />
          </g>
          <rect x="298" y="206" width="6" height="90" fill="#3A3E46" />
          <ellipse
            cx="200"
            cy="560"
            rx="160"
            ry="60"
            fill="#E7B25A"
            opacity=".12"
            filter="url(#soft)"
          />
          <rect width="400" height="600" fill="url(#vig)" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>

        {/* 17 The witness list: stacked paper, names struck through */}
        <symbol id="art-paper" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="600" fill="#101114" />
          <rect
            x="70"
            y="80"
            width="260"
            height="360"
            fill="#CFCBC0"
            transform="rotate(-4 200 260)"
          />
          <rect
            x="70"
            y="100"
            width="260"
            height="360"
            fill="#DBD7CC"
            transform="rotate(2 200 280)"
          />
          <rect x="70" y="120" width="260" height="360" fill="#E8E4DA" />
          <g fill="#5C5A54">
            <rect x="96" y="160" width="110" height="7" />
            <rect x="96" y="196" width="140" height="7" />
            <rect x="96" y="232" width="96" height="7" />
            <rect x="96" y="268" width="150" height="7" />
            <rect x="96" y="304" width="120" height="7" />
            <rect x="96" y="340" width="100" height="7" />
          </g>
          <g stroke="#A9514C" strokeWidth="3" opacity=".9">
            <line x1="90" y1="199" x2="244" y2="200" />
            <line x1="90" y1="271" x2="252" y2="272" />
            <line x1="90" y1="343" x2="204" y2="344" />
            <line x1="90" y1="235" x2="200" y2="236" />
          </g>
          <rect width="400" height="600" fill="url(#vig)" opacity=".8" />
          <rect width="400" height="600" filter="url(#grain)" fill="transparent" />
        </symbol>
      </defs>
    </svg>
  )
}
