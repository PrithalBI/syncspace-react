import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { TASK_COLUMNS, PRIORITY_STYLES } from '../utils/helpers';

export default function KanbanBoard({
  tasks,
  onOpenNewTask,
  onEditTask,
  onMoveTask,
  onRequestDeleteTask,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (task.title || '').toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q) ||
        (task.assignee || '').toLowerCase().includes(q);
      return matchesPriority && matchesSearch;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onMoveTask(taskId, colId);
    }
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Board Controls */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or assignees..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {['all', 'high', 'medium', 'low'].map((level) => (
              <button
                key={level}
                onClick={() => setPriorityFilter(level)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                  priorityFilter === level
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onOpenNewTask('todo')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Columns Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-full">
          {TASK_COLUMNS.map((col, colIndex) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.id);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-xl border p-3 transition-colors min-h-[300px] ${
                  isOver
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.accent}`} />
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenNewTask(col.id)}
                    title={`Add task to ${col.label}`}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center text-xs text-slate-400">
                      Drop tasks here
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                              PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                            }`}
                          >
                            {task.priority || 'medium'}
                          </span>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTask(task)}
                              title="Edit task"
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onRequestDeleteTask(task)}
                              title="Delete task"
                              className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2.5">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[110px]">
                              {task.assignee || 'Unassigned'}
                            </span>
                          </div>

                          {/* Touch-friendly move buttons */}
                          <div className="flex items-center gap-1">
                            {colIndex > 0 && (
                              <button
                                onClick={() =>
                                  onMoveTask(task.id, TASK_COLUMNS[colIndex - 1].id)
                                }
                                title={`Move to ${TASK_COLUMNS[colIndex - 1].label}`}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-slate-600 dark:text-slate-300 cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {colIndex < TASK_COLUMNS.length - 1 && (
                              <button
                                onClick={() =>
                                  onMoveTask(task.id, TASK_COLUMNS[colIndex + 1].id)
                                }
                                title={`Move to ${TASK_COLUMNS[colIndex + 1].label}`}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-slate-600 dark:text-slate-300 cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
