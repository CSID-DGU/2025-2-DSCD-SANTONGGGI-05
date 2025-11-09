// Tab2Platform.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";

function ensureTotalPrice(d) {
  return d.total_price ?? (Number(d.price || 0) * Number(d.quantity || 0));
}

function getPlatformRatio(data) {
  if (!Array.isArray(data)) return [];
  const map = {};
  data.forEach((r) => {
    const p = r.platform || "기타";
    map[p] = (map[p] || 0) + ensureTotalPrice(r);
  });
  return Object.entries(map)
    .map(([id, value]) => ({ id, label: id, value }))
    .sort((a, b) => b.value - a.value);
}

function getMonthlyPlatformTrend(data) {
  if (!Array.isArray(data)) return [];
  const map = {};
  data.forEach((r) => {
    const d = new Date(r.purchase_date);
    if (isNaN(d)) return;
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const p = r.platform || "기타";
    map[p] = map[p] || {};
    map[p][m] = (map[p][m] || 0) + ensureTotalPrice(r);
  });
  const months = Array.from(new Set(Object.values(map).flatMap(Object.keys))).sort();
  return Object.entries(map).map(([platform, mm]) => ({
    id: platform,
    data: months.map((m) => ({ x: m, y: mm[m] || 0 })),
  }));
}

function generateInsightFromPlatform(pieData) {
  if (!pieData || pieData.length === 0) return "데이터가 없습니다.";
  const top = pieData[0];
  return `가장 많이 구매한 플랫폼은 "${top.label}"이며, 총 ${top.value.toLocaleString()}원 사용되었습니다.`;
}

export default function Tab2Platform({ data }) {
  const pieData = useMemo(() => getPlatformRatio(data), [data]);
  const trend = useMemo(() => getMonthlyPlatformTrend(data), [data]);
  const [insight, setInsight] = useState("");

  useEffect(() => {
    setInsight(generateInsightFromPlatform(pieData));
  }, [pieData]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ background: "#eafff3", padding: 12, borderRadius: 8 }}>{insight}</div>
      <div style={{ height: 360 }}>
        <ResponsivePie
          data={pieData}
          innerRadius={0.6}
          padAngle={1}
          cornerRadius={3}
          colors={{ scheme: "set2" }}
        />
      </div>
      <div style={{ height: 380 }}>
        <ResponsiveLine
          data={trend}
          margin={{ top: 30, right: 40, bottom: 50, left: 70 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear" }}
          useMesh
          axisBottom={{ tickRotation: -30 }}
          colors={{ scheme: "category10" }}
        />
      </div>
    </div>
  );
}