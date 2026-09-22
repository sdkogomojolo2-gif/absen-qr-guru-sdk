import React from 'react';

interface ParigiMoutongLogoProps {
  className?: string;
  size?: number;
}

/**
 * High-definition vector SVG representation of the Official Emblem of
 * PEMERINTAH KABUPATEN PARIGI MOUTONG (Sulawesi Tengah)
 */
export const ParigiMoutongLogo: React.FC<ParigiMoutongLogoProps> = ({
  className = '',
  size = 56,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Logo Kabupaten Parigi Moutong"
    >
      <title>Lambang Kabupaten Parigi Moutong</title>
      <defs>
        <linearGradient id="parigiShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* Outer Golden Pentagon Shield Frame */}
      <polygon
        points="60,4 114,24 100,118 60,136 20,118 6,24"
        fill="url(#goldBorderGrad)"
        stroke="#854d0e"
        strokeWidth="1.5"
      />

      {/* Inner Black Contour Line */}
      <polygon
        points="60,8 109,26 96,114 60,131 24,114 11,26"
        fill="#ffffff"
        stroke="#1e293b"
        strokeWidth="1.2"
      />

      {/* Main Shield Body (Blue/Green gradient) */}
      <polygon
        points="60,12 105,28 92,110 60,126 28,110 15,28"
        fill="url(#parigiShieldGrad)"
      />

      {/* Top Banner Ribbon for "KABUPATEN PARIGI MOUTONG" */}
      <path
        d="M 22 28 Q 60 18 98 28 L 96 38 Q 60 28 24 38 Z"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="0.8"
      />
      <text
        x="60"
        y="32.5"
        textAnchor="middle"
        fontSize="5"
        fontFamily="sans-serif"
        fontWeight="bold"
        fill="#0f172a"
        letterSpacing="0.4"
      >
        PARIGI MOUTONG
      </text>

      {/* Golden Star at the Top Center */}
      <polygon
        points="60,37 62.5,43 68.5,43 63.5,47 65.5,53 60,49.5 54.5,53 56.5,47 51.5,43 57.5,43"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="0.6"
      />

      {/* Laurel Wreath / Padi & Kapas Outer Arc */}
      <path
        d="M 32 50 C 26 70 28 92 46 106"
        stroke="#fde047"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      <path
        d="M 88 50 C 94 70 92 92 74 106"
        stroke="#22c55e"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />

      {/* Mountain Silhouettes */}
      <polygon points="60,60 76,82 44,82" fill="url(#mountainGrad)" />
      <polygon points="46,65 62,82 30,82" fill="#047857" opacity="0.9" />
      <polygon points="74,67 88,82 60,82" fill="#064e3b" opacity="0.8" />

      {/* Coconut Palm Tree (Pohon Kelapa) */}
      <path d="M 76 82 Q 74 72 72 65" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="72" cy="64" r="1.5" fill="#ca8a04" />
      <path d="M 72 64 Q 67 62 64 64" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 72 64 Q 70 59 69 57" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 72 64 Q 76 59 78 60" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 72 64 Q 78 65 80 67" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />

      {/* Sea Waves (Teluk Tomini) */}
      <path
        d="M 32 82 Q 46 80 60 82 Q 74 84 88 82 L 84 104 Q 60 114 36 104 Z"
        fill="url(#seaGrad)"
      />
      {/* Wave Crests */}
      <path
        d="M 36 86 Q 44 84 52 86 Q 60 88 68 86 Q 76 84 84 86"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <path
        d="M 38 92 Q 46 90 54 92 Q 62 94 70 92 Q 78 90 82 92"
        stroke="#e0f2fe"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Traditional Sailboat (Perahu Katinting / Layar Bercadik) */}
      <polygon points="56,76 60,86 52,86" fill="#f8fafc" />
      <line x1="60" y1="74" x2="60" y2="86" stroke="#1e293b" strokeWidth="1" />
      <polygon points="60,75 67,82 60,84" fill="#ef4444" />
      <path d="M 48 86 Q 60 88 72 86 L 70 89 Q 60 91 50 89 Z" fill="#b45309" stroke="#78350f" strokeWidth="0.5" />
      <line x1="44" y1="88" x2="74" y2="88" stroke="#facc15" strokeWidth="0.8" />

      {/* Bottom Motto Ribbon: "SONGGULARA MBANUA" */}
      <path
        d="M 32 110 Q 60 116 88 110 L 86 119 Q 60 126 34 119 Z"
        fill="#f8fafc"
        stroke="#0f172a"
        strokeWidth="0.8"
      />
      <text
        x="60"
        y="117"
        textAnchor="middle"
        fontSize="4.2"
        fontFamily="sans-serif"
        fontWeight="bold"
        fill="#0f172a"
        letterSpacing="0.4"
      >
        SONGGULARA MBANUA
      </text>
    </svg>
  );
};
