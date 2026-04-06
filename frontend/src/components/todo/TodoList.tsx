import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../../store/slices/todoSlice';
import { Check, Trash2, Plus, Calendar as CalendarIcon, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import CustomSelect from '../ui/CustomSelect';
import { 
  TODO_PRIORITY, 
  TODO_PRIORITY_CONFIG, 
  TODO_PRIORITY_OPTIONS 
} from '../../constants/statusConstants';
import type { TodoPriorityValue } from '../../constants/statusConstants';

const TodoList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { todos, isLoading } = useAppSelector((state) => state.todos);
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<TodoPriorityValue>(TODO_PRIORITY.MEDIUM);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    dispatch(createTodo({
      title: newTodo,
      priority,
      dueDate: dueDate || null,
    }));
    setNewTodo('');
    setPriority(TODO_PRIORITY.MEDIUM);
    setDueDate('');
  };

  const handleToggleTodo = (id: string, isDone: boolean) => {
    dispatch(updateTodo({ id, data: { isDone } }));
  };

  const handleDeleteTodo = (id: string) => {
    dispatch(deleteTodo(id));
  };

  const priorityColors = Object.entries(TODO_PRIORITY_CONFIG).reduce((acc, [key, val]) => {
    acc[key as TodoPriorityValue] = val.textColor;
    return acc;
  }, {} as Record<TodoPriorityValue, string>);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border flex-none">
        <CardTitle className="flex items-center gap-2">
          <Check className="text-primary" size={18} />
          Personal To-Do
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col p-4 bg-background/30">
        <form onSubmit={handleAddTodo} className="mb-4 bg-surface p-3 rounded-lg border border-border shadow-sm">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="w-full text-sm border-none bg-transparent focus:ring-0 p-0 mb-3 placeholder:text-text-muted/50 text-text-main"
          />
          <div className="flex items-center justify-between border-t border-border pt-2">
            <div className="flex gap-2">
              <CustomSelect
                value={priority}
                onChange={val => setPriority(val as TodoPriorityValue)}
                options={TODO_PRIORITY_OPTIONS}
                className="w-24"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs border-none bg-background text-text-muted py-1 px-2 rounded focus:ring-0 cursor-pointer w-32"
              />
            </div>
            <Button type="submit" size="sm" disabled={!newTodo.trim()} className="px-3 h-7 text-xs">
               <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isLoading && todos.length === 0 ? (
            <div className="text-center py-4"><span className="animate-pulse w-4 h-4 rounded-full bg-indigo-400 inline-block"></span></div>
          ) : todos.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm italic">All caught up!</p>
            </div>
          ) : (
            todos.map((todo) => (
            <div 
                key={todo.id} 
                className={`group flex items-start gap-3 p-3 bg-surface rounded-lg border transition-all ${
                  todo.isDone ? 'border-border/50 bg-background/50' : 'border-border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => handleToggleTodo(todo.id, !todo.isDone)}
                  className={`shrink-0 w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                    todo.isDone ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary'
                  }`}
                >
                  {todo.isDone && <Check size={12} strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm tracking-tight leading-tight ${todo.isDone ? 'text-text-muted line-through' : 'text-text-main'}`}>
                    {todo.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                     <span className={`flex items-center gap-1 text-[10px] font-medium ${priorityColors[todo.priority]}`}>
                       <Flag size={10} />
                       {todo.priority}
                     </span>
                     {todo.dueDate && (
                       <span className={`flex items-center gap-1 text-[10px] ${new Date(todo.dueDate) < new Date() && !todo.isDone ? 'text-danger font-medium' : 'text-text-muted'}`}>
                         <CalendarIcon size={10} />
                         {new Date(todo.dueDate).toLocaleDateString()}
                       </span>
                     )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoList;
