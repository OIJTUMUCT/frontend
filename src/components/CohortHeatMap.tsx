// src/components/CohortHeatmap.tsx
import React, { useEffect, useMemo, useState } from 'react';
import HeatMap from 'react-heatmap-grid';
import { fetchCohort } from '../services/api';

interface RegionalRow { 0: string; 1: string; 2: number; 3: number; }
interface ApiAnswer {
  xLabels: string[];
  yLabels: string[];
  stateList: string[];
  regional: RegionalRow[];
}

const CohortHeatmap: React.FC = () => {
  const [base, setBase] = useState<ApiAnswer | null>(null);
  const [selected, setSelected] = useState('Все');
  const [showPercent, setShowPercent] = useState(true);

  useEffect(() => { fetchCohort().then(setBase); }, []);

  const { xLabels, yLabels, rowsAbs, rowsPct } = useMemo(() => {
    if (!base) return { xLabels: [], yLabels: [], rowsAbs: [], rowsPct: [] };

    const w = base.xLabels.length;
    const bucket: Record<string, Record<number, number>> = {};
    for (const [st, m, idx, cnt] of base.regional) {
      if (selected !== 'Все' && st !== selected) continue;
      (bucket[m] ??= {})[idx] = (bucket[m][idx] || 0) + cnt;
    }
    const months = Object.keys(bucket).sort();
    const abs: number[][] = [], pct: number[][] = [];

    for (const m of months) {
      const rowObj = bucket[m];
      const total = rowObj[0] || 1;
      const absRow: number[] = [], pctRow: number[] = [];
      for (let i = 0; i < w; i++) {
        const val = rowObj[i] || 0;
        absRow.push(val);
        pctRow.push(val / total); // не округляем заранее
      }
      abs.push(absRow);
      pct.push(pctRow);
    }

    return { xLabels: base.xLabels, yLabels: months, rowsAbs: abs, rowsPct: pct };
  }, [base, selected]);

  const data = showPercent ? rowsPct : rowsAbs;
  const ready = xLabels.length > 0 && yLabels.length > 0 && data.length > 0;

  // высчитываем максимальное (без нулевого столбца)
  const maxVal = useMemo(() => {
    if (!ready) return 1;
    const all = data.flatMap(row => row.slice(1));
    return all.length ? Math.max(...all) : 1;
  }, [data, ready]);

  /**
   * Правильная сигнатура: (defaultBackground, value, min, max, rowIndex, colIndex)
   */
  const cellStyle = (
    defaultBg: string,
    v: number,
    _min: number,
    _max: number,
    _row: number,
    col: number
  ) => {
    // 1) прозрачные для пустых и первой колонки
    if (v === 0 || col === 0) {
      return {
        background: 'transparent',
        color: '#000',
        fontSize: '12px',
        textAlign: 'center',
      };
    }
  
    // 2) нормируем по maxVal
    const norm = maxVal ? v / maxVal : 0;
  
    // 3) для процентов усиливаем градацию в начале: sqrt дают быстрый рост цвета при малых значениях
    const scaled = showPercent
      ? Math.pow(norm, 0.42)   // степень 0.5 – sqrt
      : norm;
  
    // 4) HSL‑диапазон от 10° до 130°
    const startHue = 10;
    const endHue = 130;
    const hue = startHue + scaled * (endHue - startHue);
  
    // 5) возвращаем мягкий пастельный фон
    return {
      background: `hsl(${hue}, 60%, 75%)`,
      color: '#000',
      fontSize: '12px',
      textAlign: 'center',
    };
  };
  
  
  
  

  const cellRender = (v: number, x: number, y: number) => {
    if (!v) return '';
    // сырое значение в процентах
    const rawPct = v * 100;
    // короткий текст для показа
    const displayText = showPercent
      ? `${rawPct.toFixed(1)}%`
      : v.toString();
    // точный текст для тултипа
    const tooltipText = showPercent
      ? `${rawPct.toFixed(3)}%`
      : v.toString();
    return (
      <div
        title={tooltipText}
        style={{ width: '100%', height: '100%' }}
      >
        {displayText}
      </div>
    );
  };

  const yLabelWidth = useMemo(() => {
    const m = Math.max(4, ...yLabels.map(l => l.length));
    return Math.min(Math.max(m * 8 + 16, 70), 240);
  }, [yLabels]);

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
        Когортный анализ удержания{selected !== 'Все' && ` – регион ${selected}`}
      </h2>

      {base && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="state" className="text-sm font-medium">Регион:</label>
            <select
              id="state"
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="Все">Все</option>
              {base.stateList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setShowPercent(false)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                !showPercent
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >Абсолютные значения</button>
            <button
              onClick={() => setShowPercent(true)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                showPercent
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >Проценты</button>
          </div>
        </div>
      )}

      {ready ? (
        <div className="flex flex-col items-center">
          <div className="text-lg mb-2">Месяцы с момента первой покупки</div>
          <div className="flex items-stretch w-full justify-start">
            <div className="relative flex-shrink-0 w-[20px]">
              <span className="absolute top-1/3 right-10 text-lg -rotate-90 origin-top-right whitespace-nowrap">
                Месяц первой покупки
              </span>
            </div>
            <div className="flex-1">
              <HeatMap
                xLabels={xLabels}
                yLabels={yLabels}
                data={data}
                yLabelWidth={yLabelWidth}
                squares
                height={40}
                cellStyle={cellStyle}
                cellRender={cellRender}
              />
            </div>
          </div>
        </div>
      ) : (
        <p>Загрузка…</p>
      )}
    </div>
  );
};

export default CohortHeatmap;