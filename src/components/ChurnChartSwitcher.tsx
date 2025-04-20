import { useState } from 'react';
import { CustomTooltip } from './CustomTooltip';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DATA = {
  day: [
    { date: '2025-04-01', churn: 22 },
    { date: '2025-04-02', churn: 25 },
    { date: '2025-04-03', churn: 27 },
    { date: '2025-04-04', churn: 24 },
    { date: '2025-04-05', churn: 29 },
  ],
  week: [
    { date: 'Неделя 1', churn: 130 },
    { date: 'Неделя 2', churn: 150 },
    { date: 'Неделя 3', churn: 120 },
    { date: 'Неделя 4', churn: 170 },
  ],
  month: [
    { date: 'Янв', churn: 550 },
    { date: 'Фев', churn: 610 },
    { date: 'Мар', churn: 580 },
    { date: 'Апр', churn: 640 },
  ],
};

export const ChurnChartSwitcher = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  return (
    <div>
      {/* Переключатели */}
      <div className="flex justify-center gap-3 mb-4">
        {(['day', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
      </div>

      {/* График */}
      <div className="transition-all duration-500 ease-in-out opacity-100 translate-y-0 animate-fade">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={DATA[period]}
            key={period}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="churn"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#fff', stroke: '#3B82F6', strokeWidth: 2 }}
              activeDot={{
                r: 6,
                stroke: '#1D4ED8',
                strokeWidth: 3,
                fill: '#fff',
              }}
              isAnimationActive={true}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

  
  
  