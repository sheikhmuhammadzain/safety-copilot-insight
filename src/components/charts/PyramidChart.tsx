import React, { useState } from 'react';
import { Skull, Bandage, Heart, ShieldAlert, Eye } from 'lucide-react';

interface PyramidLayer {
  level: number;
  label: string;
  count: number;
  ratio: number;
  color: string;
}

interface PyramidChartProps {
  layers: PyramidLayer[];
  totalEvents: number;
}

export const PyramidChart: React.FC<PyramidChartProps> = ({ layers, totalEvents }) => {
  const icons = [Skull, Bandage, Heart, ShieldAlert, Eye];
  const topWidth = 10; // Fixed top width for sharp triangle
  
  // Sort layers by level (5 to 1, top to bottom)
  const sortedLayers = [...layers].sort((a, b) => b.level - a.level);
  
  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
          <svg
            viewBox="0 0 700 550"
            className="w-full h-auto"
            style={{ maxHeight: '550px' }}
          >
        <defs>
          {/* Gradients for each layer */}
          {sortedLayers.map((layer) => (
            <linearGradient
              key={`gradient-${layer.level}`}
              id={`gradient-${layer.level}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={layer.color} stopOpacity="1" />
              <stop offset="100%" stopColor={layer.color} stopOpacity="0.8" />
            </linearGradient>
          ))}
          
          {/* Shadow filter */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Pyramid layers */}
        {sortedLayers.map((layer, index) => {
          const centerX = 350;
          const layerHeight = 105;
          const yPos = 30 + index * layerHeight;
          
          // Calculate perfect trapezoid widths for pyramid shape
          const baseWidth = 600;
          const widthStep = (baseWidth - topWidth) / 4;
          
          const currentTopWidth = topWidth + (index * widthStep);
          const currentBottomWidth = topWidth + ((index + 1) * widthStep);
          
          // Calculate trapezoid points
          const x1 = centerX - currentTopWidth / 2;
          const x2 = centerX + currentTopWidth / 2;
          const x3 = centerX + currentBottomWidth / 2;
          const x4 = centerX - currentBottomWidth / 2;
          const y1 = yPos;
          const y2 = yPos + layerHeight;
          
          const Icon = icons[5 - layer.level];
          const isLeft = index % 2 === 0;
          
          return (
            <g key={layer.level} className="pyramid-layer group cursor-pointer">
              {/* Shape - Triangle for top layer, Trapezoid for others */}
              <polygon
                points={
                  index === 0 
                    ? `${centerX},${y1} ${x3},${y2} ${x4},${y2}` // Triangle for top layer
                    : `${x1},${y1} ${x2},${y1} ${x3},${y2} ${x4},${y2}` // Trapezoid for others
                }
                fill={layer.color}
                stroke="white"
                strokeWidth="3"
                className="transition-all duration-300 hover:opacity-90"
              />
              
              {/* Count text (Number - First) */}
              <text
                x={centerX}
                y={yPos + 38}
                textAnchor="middle"
                className="fill-white font-extrabold"
                style={{ fontSize: index === 0 ? '32px' : '42px', fontWeight: '900' }}
              >
                {layer.count}
              </text>
              
              {/* Label text (Text - Second) */}
              <text
                x={centerX}
                y={yPos + 65}
                textAnchor="middle"
                className="fill-white font-bold"
                style={{ fontSize: index === 0 ? '12px' : '19px', fontWeight: '700' }}
              >
                {layer.label}
              </text>
              
              {/* Percentage indicator (Percentage - Third) */}
              <text
                x={centerX}
                y={yPos + 85}
                textAnchor="middle"
                className="fill-white/90"
                style={{ fontSize: index === 0 ? '11px' : '13px' }}
              >
                {((layer.count / totalEvents) * 100).toFixed(1)}% of total
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
