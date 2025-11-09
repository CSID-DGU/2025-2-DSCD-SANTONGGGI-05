// Tab3Pattern.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveLine } from "@nivo/line";

function ensureTotalPrice(d) {
  return d.total_price ?? (Number(d.price || 0) * Number(d.quantity || 0));
}

function getHourlyTrend(data) {
  if (!Array.isArray(data)) return [];
  const hours = Array.from({ length: 24 }, (_, h) => ({ x: `${h}시`, y: 0 }));
  data.forEach((r) => {
    const d = new Date(r.purchase_date);
    if (isNaN(d)) return;
    const h = d.getHours();
    hours[h].y += ensureTotalPrice(r);
  });
  return [{ id: "시간대별", data: hours }];
}

function getMonthlyTotalTrend(data) {
  if (!Array.isArray(data)) return [];
  const months = {};
  data.forEach((r) => {
    const d = new Date(r.purchase_date);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = (months[key] || 0) + ensureTotalPrice(r);
  });
  const sorted = Object.entries(months)
    .map(([x, y]) => ({ x, y }))
    .sort((a, b) => a.x.localeCompare(b.x));
  return [{ id: "월별 총액", data: sorted }];
}

function generateInsightFromPattern(data) {
  if (!Array.isArray(data) || data.length === 0) return "데이터가 없습니다.";
  const total = data.reduce((s, r) => s + ensureTotalPrice(r), 0);
  const hourMap = Array(24).fill(0);
  data.forEach((r) => {
    const d = new Date(r.purchase_date);
    if (!isNaN(d)) hourMap[d.getHours()] += ensureTotalPrice(r);
  });
  const peakHour = hourMap.indexOf(Math.max(...hourMap));
  return `총 ${total.toLocaleString()}원의 소비가 발생했으며, 피크 시간대는 ${peakHour}시입니다.`;
}

export default function Tab3Pattern({ data }) {
  const hourly = useMemo(() => getHourlyTrend(data), [data]);
  const monthly = useMemo(() => getMonthlyTotalTrend(data), [data]);
  const [insight, setInsight] = useState("");

  useEffect(() => {
    setInsight(generateInsightFromPattern(data));
  }, [data]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ background: "#fff7e6", padding: 12, borderRadius: 8 }}>{insight}</div>
      <div style={{ height: 340 }}>
        <ResponsiveLine
          data={hourly}
          margin={{ top: 30, right: 40, bottom: 50, left: 70 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear" }}
          useMesh
          colors={{ scheme: "paired" }}
        />
      </div>
      <div style={{ height: 360 }}>
        <ResponsiveLine
          data={monthly}
          margin={{ top: 30, right: 40, bottom: 50, left: 70 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear" }}
          useMesh
          colors={{ scheme: "category10" }}
        />
      </div>
    </div>
  );
}