import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: 'kvv' | 'kms';
  created_at: string;
}

const STORAGE_KEY = 'admin_tasks';

const getInitialTasks = (): Task[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
  return [];
};

export default function TasksTab() {
  const [activeCategory, setActiveCategory] = useState<'kvv' | 'kms'>('kvv');
  const [tasks, setTasks] = useState<Task[]>(getInitialTasks);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }, [tasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'CheckCircle2';
      case 'in_progress': return 'Clock';
      case 'pending': return 'Circle';
      default: return 'Circle';
    }
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now(),
      title: newTaskTitle,
      description: '',
      status: 'pending',
      priority: 'medium',
      category: activeCategory,
      created_at: new Date().toISOString()
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  const toggleTaskStatus = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const statusOrder: Task['status'][] = ['pending', 'in_progress', 'completed'];
        const currentIndex = statusOrder.indexOf(task.status);
        const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const filteredTasks = tasks.filter(t => t.category === activeCategory);
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Задачи</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm md:text-base"
        >
          <Icon name="Plus" size={20} />
          <span className="hidden sm:inline">Добавить задачу</span>
          <span className="sm:hidden">Добавить</span>
        </button>
      </div>

      <div className="flex gap-2 md:gap-3">
        <button
          onClick={() => setActiveCategory('kvv')}
          className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-lg font-semibold transition-all text-sm md:text-base ${
            activeCategory === 'kvv'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          КВВ
        </button>
        <button
          onClick={() => setActiveCategory('kms')}
          className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-lg font-semibold transition-all text-sm md:text-base ${
            activeCategory === 'kms'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          КМС
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-gray-600">
            <Icon name="Circle" size={18} className="md:w-5 md:h-5" />
            <span className="font-semibold text-xs md:text-sm">К выполнению</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-800 mt-1 md:mt-2">{pendingTasks}</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 md:p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-blue-600">
            <Icon name="Clock" size={18} className="md:w-5 md:h-5" />
            <span className="font-semibold text-xs md:text-sm">В работе</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mt-1 md:mt-2">{inProgressTasks}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 md:p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 text-green-600">
            <Icon name="CheckCircle2" size={18} className="md:w-5 md:h-5" />
            <span className="font-semibold text-xs md:text-sm">Выполнено</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-green-600 mt-1 md:mt-2">{completedTasks}</div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border-2 border-blue-500 p-3 md:p-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Название задачи..."
            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={addTask}
              className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm md:text-base"
            >
              Создать
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTaskTitle('');
              }}
              className="flex-1 md:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm md:text-base"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 md:space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 md:gap-3 flex-1">
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className="mt-0.5 md:mt-1 flex-shrink-0"
                >
                  <Icon 
                    name={getStatusIcon(task.status)} 
                    size={20}
                    className={
                      task.status === 'completed' ? 'text-green-600 md:w-6 md:h-6' :
                      task.status === 'in_progress' ? 'text-blue-600 md:w-6 md:h-6' :
                      'text-gray-400 md:w-6 md:h-6'
                    }
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base md:text-lg font-semibold ${
                    task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-gray-600 text-xs md:text-sm mt-1">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 md:py-1 rounded ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' && '🔥 Высокий'}
                      {task.priority === 'medium' && '⚡ Средний'}
                      {task.priority === 'low' && '🌿 Низкий'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(task.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 p-1"
              >
                <Icon name="Trash2" size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 md:py-12 text-gray-500">
          <Icon name="CheckCircle2" size={40} className="mx-auto mb-3 md:mb-4 text-gray-300 md:w-12 md:h-12" />
          <p className="text-sm md:text-base px-4">Нет задач в категории {activeCategory === 'kvv' ? 'КВВ' : 'КМС'}. Добавьте первую задачу!</p>
        </div>
      )}
    </div>
  );
}