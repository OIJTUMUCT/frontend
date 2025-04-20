import { useState, useEffect } from 'react';
import { ChurnBarChart } from './ChurnBarChart';
import { ChartBarIcon } from '@heroicons/react/24/solid';
import { DeckMap } from './Map';
import CohortHeatmap from './CohortHeatMap';
import { fetchSegments, fetchTimeline } from '../services/api';
import { ChurnTimelineChart } from './ChurnTimelineChart';
import { SegmentTimelineChart } from './SegmentTimelineChart';

export const Dashboard = () => {
  const [timelineData, setTimelineData] = useState([]);
  const [segmentTimelineData, setSegmentTimelineData] = useState([]);
  const [barDataRaw, setBarDataRaw] = useState([
    { risk: 'Low_risk', value: 0 },
    { risk: 'Avg_risk', value: 0 },
    { risk: 'High_risk', value: 0 },
  ]);
  const [showPercent, setShowPercent] = useState(false);

  useEffect(() => {
    fetchSegments().then((data) => {
      const grouped = { Low_risk: 0, Avg_risk: 0, High_risk: 0 };
      data.forEach((d: any) => {
        const key = d.Churn_Risk === 'Avg_risg' ? 'Avg_risk' : d.Churn_Risk;
        if (grouped[key] !== undefined) grouped[key]++;
      });
      setBarDataRaw([
        { risk: 'Low_risk', value: grouped.Low_risk },
        { risk: 'Avg_risk', value: grouped.Avg_risk },
        { risk: 'High_risk', value: grouped.High_risk },
      ]);
    });

    fetchTimeline().then((d) => {
      setTimelineData(d.by_churn || []);
      setSegmentTimelineData(d.by_segment || []);
    });
  }, []);


  const total = barDataRaw.reduce((s, d) => s + d.value, 0);
  const barData = showPercent
    ? barDataRaw.map((d) => ({ ...d, value: +(d.value / total * 100).toFixed(1) }))
    : barDataRaw;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10 flex items-center justify-center gap-3">
        <ChartBarIcon className="h-10 w-10 text-blue-500" />
        Дашборд оттока клиентов
      </h1>

      <div className="space-y-8">

        {/* Временная динамика оттока */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
            Динамика оттока клиентов по месяцам
          </h2>
          <ChurnTimelineChart data={timelineData} />
        </div>
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
            Динамика клиентских сегментов
          </h2>
          <SegmentTimelineChart data={segmentTimelineData} />
        </div>
        {/* Соотношение групп риска */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">
            Соотношение групп риска
          </h2>

          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => setShowPercent(false)}
              className={`min-w-[160px] px-4 py-2 rounded-lg text-sm font-medium transition ${
                !showPercent
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Абсолютные значения
            </button>

            <button
              onClick={() => setShowPercent(true)}
              className={`min-w-[160px] px-4 py-2 rounded-lg text-sm font-medium transition ${
                showPercent
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Проценты
            </button>
          </div>

          <ChurnBarChart data={barData} showPercent={showPercent} />
        </div>

        {/* Карта оттока */}
        <div className="bg-white rounded-xl shadow-xl py-6 px-0">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
            Карта оттока клиентов
          </h2>
          <DeckMap />
        </div>

        {/* Когортный анализ */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <CohortHeatmap />
        </div>

      </div>
    </div>
  );
};