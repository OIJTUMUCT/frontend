import { TooltipProps } from 'recharts';

export const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];

  return (
    <div className="bg-white rounded-lg shadow-md px-4 py-2 border border-gray-200 text-sm text-gray-800">
      <p className="font-semibold">{label}</p>
      <p>
        {item.name} : {item.value}
      </p>
    </div>
  );
};
