import React, { useLayoutEffect, useState, useRef, useEffect } from 'react';
import type { Task } from '../../types';
import Badge from '../../components/ui/Badge';
import { Layers } from 'lucide-react';

interface DependencyGraphProps {
  tasks: Task[];
}

interface Point {
  x: number;
  y: number;
}

interface Edge {
  id: string;
  start: Point;
  end: Point;
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ tasks }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{ [taskId: string]: HTMLDivElement | null }>({});
  const [edges, setEdges] = useState<Edge[]>([]);

  // 1. Process tasks into Graph layout (Topological Sort by Depths)
  const columns: Task[][] = [];
  const taskDepth: Record<string, number> = {};

  // Initialize all with depth 0
  tasks.forEach((t) => (taskDepth[t.id] = 0));

  let changed = true;
  let iterations = 0;
  // Compute longest path from roots to each node (handle cycles conservatively by limiting iterations)
  while (changed && iterations < tasks.length * 2) {
    changed = false;
    tasks.forEach((task) => {
      // For each dependency, task's depth should be > dependency's depth
      task.dependsOn?.forEach((dep) => {
        const depDepth = taskDepth[dep.blockingTaskId];
        if (depDepth !== undefined && taskDepth[task.id] <= depDepth) {
          taskDepth[task.id] = depDepth + 1;
          changed = true;
        }
      });
    });
    iterations++;
  }

  // Group by depth
  tasks.forEach((t) => {
    const depth = taskDepth[t.id] || 0;
    while (columns.length <= depth) columns.push([]);
    columns[depth].push(t);
  });

  // Calculate coordinates for SVG lines
  const drawEdges = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newEdges: Edge[] = [];

    tasks.forEach((task) => {
      task.dependsOn?.forEach((dep) => {
        const fromNode = nodeRefs.current[dep.blockingTaskId];
        const toNode = nodeRefs.current[task.id];

        if (fromNode && toNode) {
          const fromRect = fromNode.getBoundingClientRect();
          const toRect = toNode.getBoundingClientRect();

          const startX = fromRect.right - containerRect.left;
          const startY = fromRect.top + fromRect.height / 2 - containerRect.top;

          const endX = toRect.left - containerRect.left;
          const endY = toRect.top + toRect.height / 2 - containerRect.top;

          newEdges.push({
            id: `${dep.blockingTaskId}-${task.id}`,
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
          });
        }
      });
    });

    setEdges(newEdges);
  };

  useLayoutEffect(() => {
    drawEdges();
    // Redraw on resize
    const resizeVal = () => drawEdges();
    window.addEventListener('resize', resizeVal);
    return () => window.removeEventListener('resize', resizeVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // Wait a tick and redraw to ensure layout is done if fonts/images loaded
  useEffect(() => {
    const timer = setTimeout(() => drawEdges(), 100);
    return () => clearTimeout(timer);
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-muted">
        <Layers size={48} className="opacity-20 mb-4" />
        <p>No tasks to display in the dependency graph.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-auto bg-surface border border-border rounded-xl min-h-[500px] p-8 custom-scrollbar"
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {edges.map((edge) => {
          // Bezier curve control points for a smooth S-curve horizontally
          const cpx1 = edge.start.x + (edge.end.x - edge.start.x) / 2;
          const cpy1 = edge.start.y;
          const cpx2 = edge.start.x + (edge.end.x - edge.start.x) / 2;
          const cpy2 = edge.end.y;

          return (
            <path
              key={edge.id}
              d={`M ${edge.start.x} ${edge.start.y} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${edge.end.x} ${edge.end.y}`}
              fill="none"
              stroke="var(--color-primary, #6366f1)"
              strokeWidth="2"
              strokeOpacity="0.4"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-primary, #6366f1)" opacity="0.4" />
          </marker>
        </defs>
      </svg>

      <div className="flex gap-16 min-w-max relative z-10">
        {columns.map((colTasks, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-6 w-64 flex-shrink-0">
            {colTasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => { nodeRefs.current[task.id] = el; }}
                className="bg-background border border-border shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-text-main leading-tight line-clamp-2" title={task.title}>
                    {task.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-xs mt-3">
                  <Badge
                    variant={
                      task.status === 'completed'
                        ? 'green'
                        : task.status === 'ongoing'
                        ? 'indigo'
                        : 'gray'
                    }
                  >
                    {task.status.replace('_', ' ')}
                  </Badge>
                  {task.assignee && (
                    <span className="text-text-muted truncate ml-2 text-right">
                      {task.assignee.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DependencyGraph;
