import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface FractalTreeProps {
  depth?: number;
  branchAngle?: number;
  branchRatio?: number;
  width?: number;
  height?: number;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose';
}

interface TreeNode {
  x: number;
  y: number;
  angle: number;
  length: number;
  depth: number;
}

const COLOR_SCHEMES = {
  indigo: ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'],
  emerald: ['#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'],
  amber: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309'],
  rose: ['#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c'],
};

export function FractalTree({
  depth = 7,
  branchAngle = 30,
  branchRatio = 0.7,
  width = 600,
  height = 500,
  colorScheme = 'indigo',
}: FractalTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const colors = COLOR_SCHEMES[colorScheme];
    const branches: Array<{ x1: number; y1: number; x2: number; y2: number; d: number }> = [];

    function buildBranches(node: TreeNode) {
      if (node.depth > depth) return;

      const rad = (node.angle * Math.PI) / 180;
      const x2 = node.x + Math.sin(rad) * node.length;
      const y2 = node.y - Math.cos(rad) * node.length;

      branches.push({ x1: node.x, y1: node.y, x2, y2, d: node.depth });

      if (node.depth < depth) {
        buildBranches({
          x: x2, y: y2,
          angle: node.angle - branchAngle,
          length: node.length * branchRatio,
          depth: node.depth + 1,
        });
        buildBranches({
          x: x2, y: y2,
          angle: node.angle + branchAngle,
          length: node.length * branchRatio,
          depth: node.depth + 1,
        });
      }
    }

    const rootLength = height * 0.22;
    buildBranches({ x: width / 2, y: height - 20, angle: 0, length: rootLength, depth: 0 });

    const g = svg.append('g');

    branches.forEach((b, i) => {
      const colorIdx = Math.min(b.d, colors.length - 1);
      const opacity = 1 - (b.d / depth) * 0.5;
      const strokeWidth = Math.max(0.5, (depth - b.d) * 0.8);

      g.append('line')
        .attr('x1', b.x1).attr('y1', b.y1)
        .attr('x2', b.x1).attr('y2', b.y1)
        .attr('stroke', colors[colorIdx])
        .attr('stroke-width', strokeWidth)
        .attr('stroke-opacity', opacity)
        .attr('stroke-linecap', 'round')
        .transition()
        .duration(600)
        .delay(i * 0.5)
        .ease(d3.easeElastic)
        .attr('x2', b.x2)
        .attr('y2', b.y2);
    });
  }, [depth, branchAngle, branchRatio, width, height, colorScheme]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: 'transparent' }}
      viewBox={`0 0 ${width} ${height}`}
    />
  );
}
