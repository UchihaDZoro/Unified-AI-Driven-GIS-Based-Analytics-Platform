
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LandCoverData } from '../types';
import Card from './ui/Card';

interface LandCoverChartProps {
  data: LandCoverData[];
}

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded-md shadow-lg">
        <p className="text-gray-800">{`${payload[0].name} : ${payload[0].value.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};

const LandCoverChart: React.FC<LandCoverChartProps> = ({ data }) => {
  return (
    <Card className="w-full lg:w-1/3 h-[500px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Land Cover Distribution</h3>
      <div className="flex-grow">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius="80%"
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default LandCoverChart;