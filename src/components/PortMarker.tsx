import { Marker } from "react-simple-maps";
import type { Port } from "../types/quiz.types";

interface PortMarkerProps {
  port: Port;
  letter: string;
  zoom: number;
  color?: 'blue' | 'green' | 'red';
}

export default function PortMarker({ port, letter, zoom, color = 'blue' }: PortMarkerProps) {
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
      <g filter="url(#glow)" transform={`scale(${scale})`}>
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
          r={12}
          fill={selectedColor.outer}
          stroke={selectedColor.stroke}
          strokeWidth={2.5}
          style={{ cursor: "default" }}
          opacity={0.95}
        />
        <circle
          r={7.5}
          fill={selectedColor.inner}
          style={{ cursor: "default" }}
        />
        <text
          textAnchor="middle"
          y={4.5}
          style={{
            fontFamily: "system-ui",
            fill: "white",
            fontSize: "12px",
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
