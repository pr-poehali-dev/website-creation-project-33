import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Проверить новые заявки',
      description: 'Обработать заявки за сегодня',
      status: 'pending',
      priority: 'high',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Обновить график работы',
      description: 'Внести изменения в расписание',
      status: 'in_progress',
      priority: 'medium',
      created_at: new Date().toISOString()
    }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Задачи</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Icon name="Plus" size={20} />
          Добавить задачу
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Icon name="Circle" size={20} />
            <span className="font-semibold">К выполнению</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mt-2">{pendingTasks}</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Icon name="Clock" size={20} />
            <span className="font-semibold">В работе</span>
          </div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{inProgressTasks}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600">
            <Icon name="CheckCircle2" size={20} />
            <span className="font-semibold">Выполнено</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mt-2">{completedTasks}</div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border-2 border-blue-500 p-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Название задачи..."
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={addTask}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Создать
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTaskTitle('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => toggleTaskStatus(task.id)}
                  className="mt-1"
                >
                  <Icon 
                    name={getStatusIcon(task.status)} 
                    size={24}
                    className={
                      task.status === 'completed' ? 'text-green-600' :
                      task.status === 'in_progress' ? 'text-blue-600' :
                      'text-gray-400'
                    }
                  />
                </button>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
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
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Icon name="Trash2" size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Icon name="CheckCircle2" size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Нет задач. Добавьте первую задачу!</p>
        </div>
      )}
    </div>
  );
}
