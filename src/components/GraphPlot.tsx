import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

interface GraphPlotProps {
  data: any[];
  type: 'line' | 'pie';
  title: string;
  xAxisKey?: string;
  yAxisKey?: string;
  className?: string;
}

const GraphPlot: React.FC<GraphPlotProps> = ({
  data,
  type,
  title,
  xAxisKey = 'x',
  yAxisKey = 'y',
  className
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-4 rounded-lg shadow-lg border border-border">
          <p className="font-medium text-foreground mb-2">{`Year ${label}`}</p>
          {payload.map((pld: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground">{pld.name}:</span>
              <span className="font-bold" style={{ color: pld.color }}>
                {formatCurrency(pld.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card p-4 rounded-lg shadow-lg border border-border">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="font-bold text-primary">{formatCurrency(data.value)}</p>
          <p className="text-sm text-muted-foreground">
            {((data.value / data.payload.totalValue) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (type === 'line') {
    return (
      <div className={cn("space-y-4", className)}>
        <h4 className="text-lg font-semibold text-center text-foreground">{title}</h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xAxisKey}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatCurrency}
                label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary-hover))' }}
                name="Total Amount"
              />
              {data.length > 0 && data[0].principal && (
                <Line
                  type="monotone"
                  dataKey="principal"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Principal"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    // Calculate total for percentage
    const totalValue = data.reduce((sum, entry) => sum + entry.value, 0);
    const dataWithTotal = data.map(item => ({ ...item, totalValue }));

    return (
      <div className={cn("space-y-4", className)}>
        <h4 className="text-lg font-semibold text-center text-foreground">{title}</h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value}: {formatCurrency(entry.payload?.value || 0)}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {dataWithTotal.map((item, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">{item.name}</p>
              <p className="font-bold text-lg" style={{ color: item.fill }}>
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-muted-foreground">
                {((item.value / totalValue) * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default GraphPlot;