import React from 'react';
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../Avatar';
import { Clock, MessageSquare, Paperclip, AlignLeft } from 'lucide-react';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

const priorityToColor = {
  low: 'gray',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
} as const;

const TaskCard: React.FC<TaskCardProps> = ({ task, isOverlay }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card
      className={`bg-white shadow-sm hover:shadow transition-shadow ${isOverlay ? 'rotate-2 scale-105 shadow-xl ring-2 ring-indigo-500' : ''
        }`}
    >
      <CardContent className="p-3">
        {/* Header: Priority & Assignment */}
        <div className="flex justify-between items-start mb-2 gap-2">
          <Badge variant={priorityToColor[task.priority as keyof typeof priorityToColor]}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>

          {task.assignee ? (
            <div title={`Assigned to ${task.assignee.name}`} className="flex items-center gap-2">
              <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={24} />
              <p className="text-xs" title={task.assignee.name} >{task.assignee.name}</p>
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-xs"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-gray-900 mb-1 leading-tight line-clamp-2">
          {task.title}
        </h4>

        {/* Description Snippet/Indicators */}
        {task.description && (
          <div className="flex items-center gap-1 text-gray-400 mb-2">
            <AlignLeft size={14} />
          </div>
        )}

        {/* Footer: Date & Meta */}
        <div className="flex items-center justify-between mt-3 text-xs font-medium border-t border-gray-100 pt-2">
          {task.dueDate ? (
            <div className={`flex items-center justify-center px-1.5 py-0.5 rounded gap-1 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
              }`}>
              <Clock size={12} />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">No date</span>
          )}

          <div className="flex items-center gap-2 text-gray-400">
            {(task._count?.comments ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare size={12} />
                <span>{task._count?.comments}</span>
              </div>
            )}
            {(task._count?.attachments ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip size={12} />
                <span>{task._count?.attachments}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
