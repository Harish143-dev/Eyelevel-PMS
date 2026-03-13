import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import type { Task } from '../../types';

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-indigo-400 border-dashed rounded-lg bg-indigo-50"
      >
        <TaskCard task={task} />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
         // Do not fire click event if dragging
         if (!isDragging) {
            onClick();
         }
      }}
      className="cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-indigo-500 rounded-lg outline-none transition-shadow"
    >
      <TaskCard task={task} />
    </div>
  );
};

export default SortableTaskCard;
