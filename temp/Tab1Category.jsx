// Tab1Category.jsx
// 목적: 카테고리 분석 (도넛/막대 비율 + 카테고리별 월별 추이 멀티라인)
// 라이브러리: @nivo/pie, @nivo/bar, @nivo/line

import React, { useMemo } from "react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";

// 숫자 합산용
function getTotalPrice(r) {
  const tp = Number(r.total_price);
  if (!isNaN(tp)) return tp;
  const p = Number(r.price);
  const q = Number(r.quantity);
  return !isNaN(p) && !isNaN(q) ? p * q : 0;
}

// YYYY-MM 키 생성
function toMonthKey(dateStr) {
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** 1) 카테고리별 비율 (도넛/막대 공용) */
function getCategoryShare(records) {
  const map = new Map();
  for (const r of records) {
    const cat = String(r.category ?? "기타");
    map.set(cat, (map.get(cat) ?? 0) + getTotalPrice(r));
  }
  // 내림차순 정렬
  const arr = Array.from(map, ([id, value]) => ({ id, label: id, value }));
  arr.sort((a, b) => b.value - a.value);
  return arr;
}

/** 2) 카테고리별 월별 추이 (멀티라인) - 수정/재구현된 핵심 함수 */
function getMonthlyCategoryTrend(records, topN = 5) {
  if (!records || records.length === 0) return [];

  // 2-1) 카테고리 전체 합계로 Top N 추출
  const catTotal = new Map();
  for (const r of records) {
    const cat = String(r.category ?? "기타");
    catTotal.set(cat, (catTotal.get(cat) ?? 0) + getTotalPrice(r));
  }
  const sortedCats = Array.from(catTotal.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  const topCats = new Set(sortedCats.slice(0, topN));
  const includeOthers = sortedCats.length > topN;

  // 2-2) (카테고리, 월)로 집계
  const seriesMap = new Map(); // key: category, val: Map(monthKey -> sum)

  function ensureCat(cat) {
    if (!seriesMap.has(cat)) seriesMap.set(cat, new Map());
  }

  for (const r of records) {
    const monthKey = toMonthKey(r.purchase_date);
    if (!monthKey) continue;
    const rawCat = String(r.category ?? "기타");
    const cat = topCats.has(rawCat) ? rawCat : (includeOthers ? "기타" : rawCat);
    ensureCat(cat);
    const inner = seriesMap.get(cat);
    inner.set(monthKey, (inner.get(monthKey) ?? 0) + getTotalPrice(r));
  }

  // 2-3) X축(월) 도메인 정렬
  const allMonths = new Set();
  for (const [, monthMap] of seriesMap) {
    for (const m of monthMap.keys()) allMonths.add(m);
  }
  const monthDomain = Array.from(allMonths).sort((a, b) => a.localeCompare(b));

  // 2-4) Nivo 라인 시리즈 변환
  const series = [];
  for (const [cat, monthMap] of seriesMap) {
    const points = monthDomain.map((m) => ({
      x: m,
      y: Math.round(monthMap.get(m) ?? 0),
    }));
    series.push({ id: cat, data: points });
  }

  // 정렬: Top N 우선, 기타 맨 뒤
  series.sort((a, b) => {
    if (a.id === "기타") return 1;
    if (b.id === "기타") return -1;
    return sortedCats.indexOf(a.id) - sortedCats.indexOf(b.id);
  });

  return series;
}

export default function Tab1Category({ data, topN = 5 }) {
  const categoryShare = useMemo(() => getCategoryShare(data ?? []), [data]);
  const monthlyCategorySeries = useMemo(
    () => getMonthlyCategoryTrend(data ?? [], topN),
    [data, topN]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 상단: 인사이트 배너  */}
      <div
        style={{
          background: "#f6ffed",
          border: "1px solid #d9f7be",
          borderRadius: 8,
          padding: 12,
          color: "#237804",
        }}
      >
        <strong>카테고리 인사이트</strong>
        <div style={{ marginTop: 4, fontSize: 13 }}>
          상위 {topN}개 카테고리의 월별 소비 추이를 비교합니다. (나머지는 ‘기타’로 묶음)
        </div>
      </div>

      {/* 1행: 카테고리 비율 (도넛 + 가로막대) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ height: 320, background: "white", borderRadius: 8, padding: 8, border: "1px solid #eee" }}>
          <ResponsivePie
            data={categoryShare.map(d => ({ id: d.id, label: d.label, value: Math.round(d.value) }))}
            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            innerRadius={0.6}
            padAngle={1.5}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            arcLabelsSkipAngle={10}
            valueFormat={v => `${v.toLocaleString()}원`}
            legends={[
              {
                anchor: "bottom",
                direction: "row",
                translateY: 24,
                itemWidth: 100,
                itemHeight: 14,
                symbolSize: 10,
              },
            ]}
          />
        </div>

        <div style={{ height: 320, background: "white", borderRadius: 8, padding: 8, border: "1px solid #eee" }}>
          <ResponsiveBar
            data={categoryShare.map(d => ({ category: d.id, total: Math.round(d.value) }))}
            keys={["total"]}
            indexBy="category"
            layout="horizontal"
            margin={{ top: 30, right: 30, bottom: 40, left: 100 }}
            padding={0.3}
            axisBottom={{ legend: "총액(원)", legendOffset: 30, legendPosition: "middle" }}
            axisLeft={{ legend: "카테고리", legendOffset: -85, legendPosition: "middle" }}
            valueFormat={v => `${v.toLocaleString()}원`}
            labelSkipWidth={12}
            labelSkipHeight={12}
          />
        </div>
      </div>

      {/* 2행: 카테고리별 월별 추이 (멀티라인) */}
      <div style={{ height: 360, background: "white", borderRadius: 8, padding: 8, border: "1px solid #eee" }}>
        <ResponsiveLine
          data={monthlyCategorySeries}
          margin={{ top: 30, right: 30, bottom: 40, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", stacked: false, min: "auto", max: "auto" }}
          axisBottom={{ legend: "월(YYYY-MM)", legendOffset: 30, legendPosition: "middle" }}
          axisLeft={{ legend: "총액(원)", legendOffset: -45, legendPosition: "middle" }}
          lineWidth={3}
          pointSize={6}
          pointBorderWidth={2}
          enableArea={false}
          useMesh
          legends={[
            {
              anchor: "bottom",
              direction: "row",
              translateY: 30,
              itemWidth: 100,
              itemHeight: 14,
              symbolSize: 12,
            },
          ]}
        />
      </div>
    </div>
  );
}