import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import BoardColumn from './BoardColumn';
import TaskCard from './TaskCard';
import type { Task } from '../../types';
import { useWorkflowStatuses } from '../../hooks/useWorkflowStatuses';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status'], newPosition: number, newCustomStatusId?: string) => void;
  onTaskClick: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskMove, onTaskClick }) => {
  const { kanbanColumns, isLoading } = useWorkflowStatuses();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Group tasks by custom column
  const tasksByColumn = useMemo(() => {
    const grouped = kanbanColumns.reduce((acc, col) => {
      const colId = col.standardStatus ? col.standardStatus : col.id;
      acc[colId] = tasks.filter((t: any) => {
        if (col.standardStatus) return t.status === col.standardStatus;
        return t.customStatusId === col.id;
      }).sort((a: any, b: any) => a.position - b.position);
      return acc;
    }, {} as Record<string, Task[]>);
    return grouped;
  }, [tasks, kanbanColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentTask = tasks.find((t) => t.id === activeId);
    if (!currentTask) return;

    // Find the container we are dropping into
    let activeColumnId = currentTask.customStatusId;
    if (!activeColumnId && kanbanColumns[0]?.standardStatus) {
      activeColumnId = currentTask.status;
    }

    let overColumnId = overId;

    // If dropping over another task, get its column id
    if (!kanbanColumns.some(c => (c.standardStatus ? c.standardStatus === overId : c.id === overId))) {
      const overTask: any = tasks.find(t => t.id === overId);
      if (overTask) {
        overColumnId = overTask.customStatusId || (kanbanColumns[0]?.standardStatus ? overTask.status : overColumnId);
      }
    }

    if (!kanbanColumns.some(c => c.id === overColumnId || (c.standardStatus && c.standardStatus === overColumnId))) return;

    const tasksInColumn = tasksByColumn[overColumnId] || [];

    let newIndex = tasksInColumn.length; // Default to end

    if (overId !== overColumnId) {
      newIndex = tasksInColumn.findIndex((t: any) => t.id === overId);
    }

    if (activeColumnId === overColumnId && tasksInColumn.findIndex((t: any) => t.id === activeId) === newIndex) {
      return;
    }

    const destCol = kanbanColumns.find(c => c.id === overColumnId || (c.standardStatus && c.standardStatus === overColumnId));
    if (destCol) {
       const finalStatus = destCol.standardStatus ? destCol.standardStatus : destCol.id;
       onTaskMove(activeId, finalStatus as any, newIndex);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        Loading workflow...
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        {kanbanColumns.map((col) => (
          <BoardColumn
            key={col.id}
            column={{ id: col.standardStatus ? col.standardStatus : col.id, title: col.name }}
            tasks={tasksByColumn[col.standardStatus ? col.standardStatus : col.id] || []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
