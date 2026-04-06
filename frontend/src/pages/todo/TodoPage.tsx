import React from 'react';
import TodoList from '../../components/todo/TodoList';

const TodoPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal To-Do List</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your personal tasks and daily goals. These are private to you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 max-w-4xl">
        <div className="h-[calc(100vh-250px)] min-h-[500px]">
          <TodoList />
        </div>
      </div>
    </div>
  );
};

export default TodoPage;
