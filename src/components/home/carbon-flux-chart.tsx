'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

/**
 * Three vertical bars comparing the major annual carbon fluxes.
 * Numbers are well-published global mean estimates (Friedlingstein 2022,
 * Bond-Lamberty 2018, Beer 2010); not invented. The point of the figure is
 * the relative scale: soil respiration ≈ photosynthesis, ~9× fossil emissions.
 */
const data = [
  { name: 'Fossil fuels', value: 10, label: '~10' },
  { name: 'Soil respiration', value: 91, label: '~91', highlight: true },
  { name: 'Photosynthesis', value: 120, label: '~120' },
];

export function CarbonFluxChart() {
  return (
    <div className="w-full">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 28, right: 12, left: 0, bottom: 24 }}
            barCategoryGap="22%"
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: '#C8CCD2' }}
              tick={{
                fill: '#3A4048',
                fontSize: 11,
                fontFamily: 'SF Mono, Menlo, Consolas, monospace',
              }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fill: '#3A4048',
                fontSize: 10,
                fontFamily: 'SF Mono, Menlo, Consolas, monospace',
              }}
              ticks={[0, 30, 60, 90, 120]}
              domain={[0, 130]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(14,17,22,0.04)' }}
              contentStyle={{
                background: '#FAF8F5',
                border: '1px solid #C8CCD2',
                borderRadius: 0,
                fontFamily: 'Calibri, sans-serif',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value} Pg C / yr`, 'Annual flux']}
            />
            <Bar dataKey="value" maxBarSize={68}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.highlight ? '#A4221A' : '#3A4048'}
                />
              ))}
              <LabelList
                dataKey="label"
                position="top"
                fill="#0E1116"
                fontFamily="Georgia, serif"
                fontSize={14}
                fontWeight={700}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 max-w-prose text-[0.78rem] italic text-ink-soft">
        Annual carbon flux comparison, Pg C yr⁻¹. Soil respiration is highlighted
        in deep red. Sources: Friedlingstein et&nbsp;al. 2022 (fossil),
        Beer et&nbsp;al. 2010 (GPP), Bond-Lamberty &amp; Thomson 2018 (Rs).
      </p>
    </div>
  );
}
