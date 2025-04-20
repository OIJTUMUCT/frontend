import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

const RISK_COLORS = {
  Low_risk: '#10B981',
  Avg_risk: '#F59E0B',
  High_risk: '#EF4444',
};
const RISK_LABELS = {
  Low_risk: 'низкий',
  Avg_risk: 'средний',
  High_risk: 'высокий',
};

export const ChurnBarChart = ({
  data,
  showPercent,
}: {
  data: { risk: string; value: number }[];
  showPercent: boolean;
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const translated = data.map((d) => ({
    ...d,
    name: RISK_LABELS[d.risk] || d.risk,
    displayValue: showPercent ? +(d.value / total * 100).toFixed(1) : d.value,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={translated}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          /* ——— ключевые параметры ——— */
          barCategorySize={80}     /* ширина «слота» под категорию */
          barCategoryGap="20%"     /* зазор между слотами */
        >
          <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 14 }} />
          <YAxis
            tick={{ fill: '#374151', fontSize: 14 }}
            domain={[0, showPercent ? 100 : 'auto']}
            tickFormatter={(v) => (showPercent ? `${v}%` : v)}
          />
          <Tooltip
            formatter={(val: number) =>
              showPercent ? [`${val}%`, 'Доля клиентов'] : [val, 'Количество']
            }
            labelFormatter={(label) => `Тип риска: ${label}`}
          />

          <Bar
            dataKey="displayValue"
            /* узкая сама колонка, даже если слот шире */
            maxBarSize={60}
            radius={[4, 4, 0, 0]}
          >
            {translated.map((e, i) => (
              <Cell key={i} fill={RISK_COLORS[e.risk] || '#9CA3AF'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
