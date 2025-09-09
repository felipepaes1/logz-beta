"use client";

import React from "react";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DashboardPanoramaResource } from "@/resources/Dashboard/dashboard.resource";

const chartConfig = {
  valor: { label: "Valor", color: "var(--primary)" },
  label: { color: "var(--background)" },
} satisfies ChartConfig;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmt = (n: number) => brl.format(n ?? 0);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Consumo de Máquinas</CardTitle>
        <CardDescription>5 Máquinas mais consumistas</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={rows} layout="vertical" margin={{ right: 16 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="nome" type="category" tick={false} tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)}
                            hide />
            <XAxis dataKey="valor" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent valueFormatter={(v) => fmt(Number(v))} />} />
            <Bar dataKey="valor" layout="vertical" fill="var(--color-valor)" radius={4}>
              <LabelList dataKey="nome" position="insideLeft" offset={8} className="fill-(--color-label)" fontSize={12} />
              <LabelList dataKey="valor" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(v: number) => fmt(v)} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}