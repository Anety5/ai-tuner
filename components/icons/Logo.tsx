// Provides the SVG implementation for the Logo component.
import React from 'react';

export const Logo: React.FC = () => (
  <svg
    height="32"
    width="32"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="bulbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" /> {/* Lighter Purple */}
        <stop offset="100%" stopColor="#6366f1" /> {/* Indigo */}
      </linearGradient>
    </defs>
    {/* Main lightbulb/palette shape */}
    <path 
      d="M12 2a7 7 0 0 0-7 7c0 3.07 1.48 5.69 3.5 6.84V18a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-2.16c2.02-1.15 3.5-3.77 3.5-6.84a7 7 0 0 0-7-7z"
      fill="url(#bulbGradient)"
      stroke="#9ca3af"
      strokeWidth="0.5"
    />
    {/* Screw base */}
    <rect x="8" y="19" width="8" height="2.5" rx="1" fill="#9ca3af" />
    <path d="M8 20.5 H16" stroke="#e5e7eb" strokeWidth="0.5" />
    <path d="M8 21.5 H16" stroke="#e5e7eb" strokeWidth="0.5" />
    {/* Icons representing functions inside the bulb */}
    <g fill="none" stroke="#f0f0f0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, -1.5)">
        {/* Pen Icon for Text */}
        <g transform="translate(6, 8) scale(0.35)">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </g>
        {/* Paintbrush for Image Generation */}
        <g transform="translate(13, 11) scale(0.35)">
            <path d="M3 21v-4a2 2 0 0 1 2-2h1"/>
            <path d="m15 5-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 2"/>
            <path d="M15 13H5"/>
            <path d="M22 21H3"/>
        </g>
        {/* Eye for Analysis */}
        <g transform="translate(6, 15) scale(0.4)">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </g>
    </g>
  </svg>
);
