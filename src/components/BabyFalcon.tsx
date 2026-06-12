'use client'

const SPEECH_BUBBLES = [
  "Squawk! Great deal detected! 🎉",
  "68% off to Bangkok! Book fast! ✈",
  "This one's a steal! 🦅",
  "Tokyo for ₹45K? Yes please!",
  "Deal alert! Grab it now! 🔥",
]

export default function BabyFalcon({
  size = 180,
  showBubble = true,
  bubbleText,
}: {
  size?: number
  showBubble?: boolean
  bubbleText?: string
}) {
  const bubble = bubbleText ?? SPEECH_BUBBLES[Math.floor(Math.random() * SPEECH_BUBBLES.length)]

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <style>{`
        @keyframes falcon-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes falcon-blink {
          0%, 88%, 100% { transform: scaleY(1); }
          93% { transform: scaleY(0.08); }
        }
        @keyframes wing-flap-l {
          0%, 100% { transform: rotate(-8deg) translateX(0); }
          50% { transform: rotate(-22deg) translateX(-3px); }
        }
        @keyframes wing-flap-r {
          0%, 100% { transform: rotate(8deg) translateX(0); }
          50% { transform: rotate(22deg) translateX(3px); }
        }
        @keyframes bubble-pop {
          0% { transform: scale(0.8); opacity: 0; }
          15% { transform: scale(1.05); opacity: 1; }
          20% { transform: scale(1); opacity: 1; }
          85% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        .falcon-bob { animation: falcon-bob 2.2s ease-in-out infinite; }
        .falcon-blink { animation: falcon-blink 3.5s ease-in-out infinite; transform-origin: center; }
        .wing-l { transform-origin: 85% 50%; animation: wing-flap-l 0.9s ease-in-out infinite; }
        .wing-r { transform-origin: 15% 50%; animation: wing-flap-r 0.9s ease-in-out infinite; }
        .speech-bubble { animation: bubble-pop 4s ease-in-out infinite; }
      `}</style>

      {/* Speech bubble */}
      {showBubble && (
        <div className="speech-bubble mb-2 bg-white border-2 border-amber-400 rounded-2xl px-4 py-2 shadow-lg relative max-w-[200px] text-center">
          <p className="text-xs font-bold text-gray-800 leading-tight">{bubble}</p>
          {/* Bubble tail */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #fbbf24' }} />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid white' }} />
        </div>
      )}

      {/* Baby Falcon SVG */}
      <svg
        viewBox="0 0 130 145"
        xmlns="http://www.w3.org/2000/svg"
        className="falcon-bob drop-shadow-lg"
        width={size}
        height={size}
      >
        {/* Left wing */}
        <ellipse cx="20" cy="85" rx="20" ry="13" fill="#92650a" className="wing-l" />
        <ellipse cx="20" cy="85" rx="15" ry="9" fill="#b07d12" className="wing-l" />

        {/* Right wing */}
        <ellipse cx="110" cy="85" rx="20" ry="13" fill="#92650a" className="wing-r" />
        <ellipse cx="110" cy="85" rx="15" ry="9" fill="#b07d12" className="wing-r" />

        {/* Body */}
        <ellipse cx="65" cy="98" rx="33" ry="37" fill="#c9901c" />

        {/* Belly (cream) */}
        <ellipse cx="65" cy="106" rx="21" ry="26" fill="#fef3c7" />

        {/* Fluffy chest feather lines */}
        <path d="M58 92 Q65 96 72 92" stroke="#f6d860" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <path d="M54 100 Q65 105 76 100" stroke="#f6d860" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <path d="M55 110 Q65 115 75 110" stroke="#f6d860" strokeWidth="1.5" fill="none" opacity="0.6"/>

        {/* Head */}
        <circle cx="65" cy="55" r="32" fill="#c9901c" />

        {/* Head cap (darker) */}
        <ellipse cx="65" cy="36" rx="24" ry="18" fill="#7a5209" />
        <path d="M41 45 Q65 28 89 45" fill="#7a5209" />

        {/* Eye whites — large & expressive */}
        <circle cx="50" cy="56" r="13" fill="white" />
        <circle cx="80" cy="56" r="13" fill="white" />

        {/* Pupils with blink */}
        <g className="falcon-blink">
          <circle cx="52" cy="58" r="8" fill="#1a1a2e" />
          <circle cx="82" cy="58" r="8" fill="#1a1a2e" />
          {/* Iris */}
          <circle cx="52" cy="58" r="5" fill="#2d4a8a" />
          <circle cx="82" cy="58" r="5" fill="#2d4a8a" />
          {/* Eye shine */}
          <circle cx="55" cy="54" r="3" fill="white" />
          <circle cx="85" cy="54" r="3" fill="white" />
          <circle cx="49" cy="62" r="1.5" fill="white" opacity="0.5" />
          <circle cx="79" cy="62" r="1.5" fill="white" opacity="0.5" />
        </g>

        {/* Cheek blush */}
        <circle cx="40" cy="65" r="7" fill="#f87171" opacity="0.3" />
        <circle cx="90" cy="65" r="7" fill="#f87171" opacity="0.3" />

        {/* Beak */}
        <path d="M65 68 L57 80 L73 80 Z" fill="#f59e0b" />
        <path d="M65 72 L59 80 L71 80 Z" fill="#d97706" />
        <path d="M57 80 Q65 77 73 80" stroke="#92400e" strokeWidth="1" fill="none" />

        {/* Legs */}
        <rect x="52" y="130" width="5" height="14" rx="2.5" fill="#f59e0b" />
        <rect x="73" y="130" width="5" height="14" rx="2.5" fill="#f59e0b" />

        {/* Talons */}
        <path d="M44 144 Q52 140 57 144" stroke="#d97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M52 144 L52 148" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        <path d="M65 144 Q73 140 78 144" stroke="#d97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M73 144 L73 148" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
