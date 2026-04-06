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
      className={`shadow-sm transition-all duration-200 hover:shadow-md hover-lift ${isOverlay ? 'rotate-2 scale-105 shadow-xl ring-2 ring-primary' : ''
        }`}
    >
      <CardContent className="p-3">
        {/* Header: Priority & Assignment */}
        <div className="flex justify-between items-start mb-2 gap-2">
          <Badge variant={(task.customPriority ? 'indigo' : priorityToColor[task.priority as keyof typeof priorityToColor]) as any}>
            {task.customPriority?.name || (task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}
          </Badge>

          {task.assignee ? (
            <div title={`Assigned to ${task.assignee.name}`} className="flex items-center gap-2">
              <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={24} />
              <p className="text-xs text-text-main" title={task.assignee.name} >{task.assignee.name}</p>
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-background border border-border border-dashed flex items-center justify-center text-text-muted text-xs"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-text-main mb-1 leading-tight line-clamp-2">
          {task.title}
        </h4>

        {/* Description Snippet/Indicators */}
        {task.description && (
          <div className="flex items-center gap-1 text-text-muted mb-2">
            <AlignLeft size={14} />
          </div>
        )}

        {/* Footer: Date & Meta */}
        <div className="flex items-center justify-between mt-3 text-xs font-medium border-t border-border pt-2">
          {task.dueDate ? (
            <div className={`flex items-center justify-center px-1.5 py-0.5 rounded gap-1 ${isOverdue ? 'bg-danger/10 text-danger' : 'bg-background text-text-muted'
              }`}>
              <Clock size={12} />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ) : (
            <span className="text-text-muted">No date</span>
          )}

          <div className="flex items-center gap-2 text-text-muted">
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
