import { FC } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '../utils/cn'

interface ChartProps {
  title: string
  data: any[]
  type: 'line' | 'bar' | 'pie'
  dataKey: string | string[]
  xAxisKey?: string
  colors?: string[]
  className?: string
}

export const Chart: FC<ChartProps> = ({
  title,
  data,
  type,
  dataKey,
  xAxisKey,
  colors = ['#0284c7', '#16a34a', '#ef4444', '#f59e0b'],
  className,
}) => {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6',
          className,
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Sem dados disponíveis
        </div>
      </div>
    )
  }

  const renderChart = () => {
    if (type === 'line') {
      return (
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xAxisKey || 'name'} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          {Array.isArray(dataKey) ? (
            dataKey.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
            />
          )}
        </LineChart>
      )
    }

    if (type === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xAxisKey || 'name'} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          {Array.isArray(dataKey) ? (
            dataKey.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[idx % colors.length]}
                radius={[8, 8, 0, 0]}
              />
            ))
          ) : (
            <Bar
              dataKey={dataKey}
              fill={colors[0]}
              radius={[8, 8, 0, 0]}
            />
          )}
        </BarChart>
      )
    }

    if (type === 'pie') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={Array.isArray(dataKey) ? dataKey[0] : dataKey}
            nameKey={xAxisKey || 'name'}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {colors.map((color, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      )
    }

    return null
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6',
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        {renderChart() as any}
      </ResponsiveContainer>
    </div>
  )
}
