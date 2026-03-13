import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskCard from './SortableTaskCard';
import type { Task } from '../../types';

interface BoardColumnProps {
  column: { id: Task['status']; title: string };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({ column, tasks, onTaskClick }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col w-80 shrink-0 bg-gray-50/50 rounded-xl" style={{ minHeight: '500px' }}>
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <h3 className="font-semibold text-gray-700">{column.title}</h3>
        <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="p-3 flex-1 flex flex-col gap-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardColumn;
