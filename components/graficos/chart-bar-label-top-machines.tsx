"use client";

import React from "react";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DashboardPanoramaResource } from "@/resources/Dashboard/dashboard.resource";

const chartConfig = {
  valor: { label: "Valor", color: "var(--primary)" },
  label: { color: "var(--background)" },
} satisfies ChartConfig;

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmt = (n: number) => brl.format(Number.isFinite(n) ? n : 0);

const NAME_MAX_CHARS = 30
  const ellipsize = (s: string, max = NAME_MAX_CHARS) =>
    !s ? "" : s.length <= max ? s : s.slice(0, Math.max(0, max - 1)) + "…"

  const renderToolNameAbove = (props: any) => {
    const { value, viewBox } = props
    if (!viewBox) return null
    const x = viewBox.x + 4         
    const y = viewBox.y - 6        
    return (
      <text
        x={x}
        y={y}
        textAnchor="start"
        dominantBaseline="ideographic"
        className="fill-foreground"
        fontSize={12}
        pointerEvents="none"
      >
        {ellipsize(String(value))}
      </text>
    )
  }

type Props = { tenantId: number };
export function ChartBarLabelTopMachines({ tenantId }: Props) {
  const [rows, setRows] = React.useState<{ nome: string; valor: number }[]>([]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await DashboardPanoramaResource.panorama();
      if (!mounted) return;
      setRows((res.tops_mes_atual.machines_top5 ?? []).map(r => ({ nome: r.name ?? r.key, valor: r.valor })));
    })();
    return () => { mounted = false };
  }, [tenantId]);

  const rightMargin = React.useMemo(() => {
    if (!rows.length) return 80;
    const maxLabelLen = Math.max(...rows.map(r => fmt(r.valor).length));
    return Math.max(72, Math.min(16 + maxLabelLen * 8, 168));
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Consumo de Máquinas</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 16, right: rightMargin }}
            barCategoryGap={20} 
            barSize={12}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="nome"
              type="category"
              tick={false}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis
              dataKey="valor"
              type="number"
              hide
              domain={[0, 'dataMax']}
              allowDataOverflow={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent valueFormatter={(v) => fmt(Number(v))} />}
            />
            <Bar dataKey="valor" layout="vertical" fill="var(--color-valor)" radius={4}>
              <LabelList dataKey="nome" content={renderToolNameAbove} isAnimationActive={false} />
              <LabelList
                dataKey="valor"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(v: number) => fmt(v)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}