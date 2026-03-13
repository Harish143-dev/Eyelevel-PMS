import React, { useMemo } from 'react';
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

interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: Task['status'], newPosition: number) => void;
  onTaskClick: (task: Task) => void;
}

const columns: { id: Task['status']; title: string }[] = [
  { id: 'pending', title: 'Pending' },
  { id: 'ongoing', title: 'Ongoing' },
  { id: 'in_review', title: 'In Review' },
  { id: 'completed', title: 'Completed' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskMove, onTaskClick }) => {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  // Group tasks by status and sort by position
  const tasksByColumn = useMemo(() => {
    const grouped = columns.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<Task['status'], Task[]>);
    return grouped;
  }, [tasks]);

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

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Find the container we are dropping into
    const activeColumnId = activeTask.status;
    let overColumnId = overId as Task['status'];
    
    // If dropping over another task, get its status column
    if (overId !== 'pending' && overId !== 'ongoing' && overId !== 'in_review' && overId !== 'completed') {
       const overTask = tasks.find(t => t.id === overId);
       if (overTask) overColumnId = overTask.status;
    }

    if (!columns.some(c => c.id === overColumnId)) return;

    const tasksInColumn = tasksByColumn[overColumnId] || [];
    
    let newIndex = tasksInColumn.length; // Default to end
    
    // If dropping over an existing task, find its position
    if (overId !== overColumnId) {
       newIndex = tasksInColumn.findIndex(t => t.id === overId);
    }
    
    // If we're dropping in the same column at the same position, do nothing
    if (activeColumnId === overColumnId && tasksInColumn.findIndex(t => t.id === activeId) === newIndex) {
        return;
    }

    // New position calculation:
    // Simply pass the newIndex (0-indexed position within the column) to the backend
    // The backend uses a rank-based pos update, so we can just send the newIndex count where the item should go.
    onTaskMove(activeId, overColumnId, newIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        {columns.map((col) => (
          <BoardColumn 
            key={col.id} 
            column={col} 
            tasks={tasksByColumn[col.id]} 
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
