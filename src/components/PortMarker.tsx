import { Marker } from "react-simple-maps";
import type { Port } from "../types/quiz.types";

interface PortMarkerProps {
  port: Port;
  letter: string;
  zoom: number;
  color?: 'blue' | 'green' | 'red';
  onClick?: () => void;
  isSelected?: boolean;
}

export default function PortMarker({ port, letter, zoom, color = 'blue', onClick, isSelected = false }: PortMarkerProps) {
  // Scale markers inversely with zoom level
  const scale = 1 / zoom;

  // Color schemes for different marker states
  const colors = {
    blue: { outer: '#3b82f6', stroke: '#60a5fa', inner: '#1e40af' },
    green: { outer: '#22c55e', stroke: '#4ade80', inner: '#16a34a' },
    red: { outer: '#ef4444', stroke: '#f87171', inner: '#dc2626' },
  };

  const selectedColor = colors[color];

  return (
    <Marker coordinates={[port.lng, port.lat]}>
      <g
        filter="url(#glow)"
        transform={`scale(${scale})`}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle
          r={isSelected ? 14 : 12}
          fill={selectedColor.outer}
          stroke={selectedColor.stroke}
          strokeWidth={isSelected ? 3.5 : 2.5}
          opacity={0.95}
        />
        <circle
          r={isSelected ? 9 : 7.5}
          fill={selectedColor.inner}
        />
        <text
          textAnchor="middle"
          y={4.5}
          style={{
            fontFamily: "system-ui",
            fill: "white",
            fontSize: isSelected ? "14px" : "12px",
            fontWeight: "900",
            pointerEvents: "none",
          }}
        >
          {letter}
        </text>
      </g>
    </Marker>
  );
}
