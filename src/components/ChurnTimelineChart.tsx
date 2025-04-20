import {
    ResponsiveContainer,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
    LegendProps,
  } from 'recharts';
  
  const COLORS: Record<string, string> = {
    'Низкий риск': '#14C38E',
    'Средний риск': '#F39C12',
    'Высокий риск': '#E74C3C',
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow text-sm text-gray-800">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name}>
              {entry.name.toLocaleLowerCase()} : {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const renderLegend = (props: LegendProps) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload?.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm text-gray-800 lowercase">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };
  
  export const ChurnTimelineChart = ({ data }: { data: any[] }) => {
    const grouped: Record<string, Record<string, number>> = {};
  
    data.forEach(({ order_purchase_timestamp, Churn_Risk, count }) => {
      if (!grouped[order_purchase_timestamp]) {
        grouped[order_purchase_timestamp] = {
          'Низкий риск': 0,
          'Средний риск': 0,
          'Высокий риск': 0,
        };
      }
      grouped[order_purchase_timestamp][Churn_Risk] += count;
    });
  
    const chartData = Object.entries(grouped).map(([timestamp, risks]) => ({
      name: timestamp,
      ...risks,
    }));
  
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
          {Object.keys(COLORS).map((risk) => (
            <Bar key={risk} dataKey={risk} stackId="a" fill={COLORS[risk]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };