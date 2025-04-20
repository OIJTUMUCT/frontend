import {
    ResponsiveContainer,
    BarChart,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
  } from 'recharts';
  

  const COLORS: Record<string, string> = {
    'Клиенты с одной покупкой, высокий денежный объем.': '#FF6384',
    'Клиенты с одной покупкой, средний денежный объем.': '#FF9F40',
    'Клиенты с одной покупкой, низкий денежный объем.': '#FFCD56',
    'Высокоприбыльные клиенты, низкая вариативность.': '#4BC0C0',
    'Клиенты со средней частотой и объемом, низкая вариативность.': '#36A2EB',
    'Клиенты с низким объемом, низкая вариативность.': '#9966FF',
    'Высокоприбыльные клиенты с разумной вариативностью.': '#C9CBCE',
    'Средние клиенты с некоторой вариативностью.': '#6495ED',
    'Клиенты с низким объемом и частотой, но с вариативностью.': '#FF8C00',
    'Средние клиенты с высокой вариативностью.': '#FF1493',
    'Низкие клиенты с высокой вариативностью.': '#00FF7F',
    'Высокоприбыльные клиенты с большой вариативностью.': '#00CED1',
  };  
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow text-sm text-gray-800">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name}>
              {entry.name.toLowerCase()} : {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  export const SegmentTimelineChart = ({ data }: { data: any[] }) => {
    const grouped: Record<string, Record<string, number>> = {};
  
    data.forEach(({ order_purchase_timestamp, segment_description, count }) => {
      if (!grouped[order_purchase_timestamp]) {
        grouped[order_purchase_timestamp] = {};
      }
      if (!grouped[order_purchase_timestamp][segment_description]) {
        grouped[order_purchase_timestamp][segment_description] = 0;
      }
      grouped[order_purchase_timestamp][segment_description] += count;
    });
  
    const chartData = Object.entries(grouped).map(([timestamp, segments]) => ({
      name: timestamp,
      ...segments,
    }));
  
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            content={({ payload }) => (
                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-800">
                {payload?.map((entry: any) => (
                    <li key={entry.value} className="flex items-center gap-1">
                    <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-800 lowercase">{entry.value.toLowerCase()}</span>
                    </li>
                ))}
                </ul>
            )}
            />

          {Object.keys(COLORS).map((segment) => (
            <Bar
              key={segment}
              dataKey={segment}
              stackId="a"
              fill={COLORS[segment]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };
  