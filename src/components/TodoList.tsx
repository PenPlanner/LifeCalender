import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div
      className={`rounded p-1 transition-all ${
        todo.done 
          ? 'bg-success/10' 
          : 'bg-base-200/30 hover:bg-base-200/50'
      }`}
    >
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          className="checkbox checkbox-primary checkbox-xs flex-shrink-0"
        />
        
        <span className={`text-[10px] flex-1 ${
          todo.done ? 'line-through opacity-60' : ''
        }`}>
          {todo.text}
        </span>
        
        <button
          onClick={() => onDelete(todo.id)}
          className="btn btn-ghost btn-circle btn-xs opacity-60 hover:opacity-100 hover:text-error"
          title="Ta bort uppgift"
        >
          <Trash2 size={10} />
        </button>
      </label>
    </div>
  );
}

interface TodoListProps {
  todos: Todo[];
  date: string;
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoList({ todos, date, onAdd, onToggle, onDelete }: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const dayTodos = todos.filter(todo => todo.date === date);
  const completedCount = dayTodos.filter(todo => todo.done).length;
  
  const handleAdd = () => {
    if (newTodo.trim()) {
      onAdd(newTodo.trim());
      setNewTodo('');
      setIsAdding(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTodo('');
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        {dayTodos.length > 0 && (
          <div className="badge badge-primary badge-xs">{completedCount}/{dayTodos.length}</div>
        )}
        
        <button
          onClick={() => setIsAdding(true)}
          className="btn btn-circle btn-ghost btn-xs ml-auto"
          title="Lägg till uppgift"
        >
          <Plus size={10} />
        </button>
      </div>
      
      <div className="space-y-0.5">
        {dayTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
        
        {isAdding && (
          <div className="rounded p-1 bg-base-200/50 border border-primary/50">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                disabled
                className="checkbox checkbox-primary checkbox-xs opacity-50"
              />
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleAdd}
                placeholder="Uppgift..."
                className="input input-ghost input-xs flex-1 p-0 h-auto min-h-0"
                autoFocus
              />
            </label>
          </div>
        )}
        
        {dayTodos.length === 0 && !isAdding && (
          <div className="text-center py-2 text-xs text-base-content/50">
            📝 Lägg till uppgift
          </div>
        )}
      </div>
    </div>
  );
}