import { useState } from 'react';
import PlanningSection from './tasks/PlanningSection';
import TCSection from './tasks/TCSection';

export default function TasksTab() {
  const [activeSection, setActiveSection] = useState<'planning' | 'tc'>('planning');

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Задачи</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection('planning')}
          className={`px-4 py-2 rounded transition-colors ${
            activeSection === 'planning'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          Планирование
        </button>
        <button
          onClick={() => setActiveSection('tc')}
          className={`px-4 py-2 rounded transition-colors ${
            activeSection === 'tc'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          ТЦ
        </button>
      </div>

      {activeSection === 'planning' && <PlanningSection />}
      {activeSection === 'tc' && <TCSection />}
    </div>
  );
}
