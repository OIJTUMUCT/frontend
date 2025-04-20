import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { DeckGL } from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import {
  ArrowsPointingOutIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import { fetchSegments } from '../services/api';

/* ------------------------ КОНСТАНТЫ ------------------------ */
const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  'A_Single Purchase': 'Клиенты с одной покупкой, высокий денежный объем.',
  'B_Single Purchase': 'Клиенты с одной покупкой, средний денежный объем.',
  'C_Single Purchase': 'Клиенты с одной покупкой, низкий денежный объем.',
  'A_X': 'Высокоприбыльные клиенты, низкая вариативность.',
  'B_X': 'Клиенты со средней частотой и объемом, низкая вариативность.',
  'C_X': 'Клиенты с низким объемом, низкая вариативность.',
  'A_Y': 'Высокоприбыльные клиенты с разумной вариативностью.',
  'B_Y': 'Средние клиенты с некоторой вариативностью.',
  'C_Y': 'Клиенты с низким объемом и частотой, но с вариативностью.',
  'A_Z': 'Высокоприбыльные клиенты с большой вариативностью.',
  'B_Z': 'Средние клиенты с высокой вариативностью.',
  'C_Z': 'Низкие клиенты с высокой вариативностью.',
};

const SEGMENT_COLORS: Record<string, [number, number, number]> = {
  'A_Single Purchase': [255, 99, 132],
  'B_Single Purchase': [255, 159, 64],
  'C_Single Purchase': [255, 205, 86],
  'A_X': [75, 192, 192],
  'B_X': [54, 162, 235],
  'C_X': [153, 102, 255],
  'A_Y': [201, 203, 207],
  'B_Y': [100, 149, 237],
  'C_Y': [255, 140, 0],
  'A_Z': [255, 20, 147],
  'B_Z': [0, 255, 127],
  'C_Z': [0, 206, 209],
};

const RISK_COLORS: Record<string, [number, number, number]> = {
  Low_risk: [34, 197, 94],
  Avg_risk: [234, 179, 8],
  High_risk: [239, 68, 68],
};

/* ------------------------ КОМПОНЕНТ ------------------------ */
export const DeckMap = () => {
  /* ---------- STATE ---------- */
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(4);
  const [segments, setSegments] = useState<any[]>([]);
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [clusterMode, setClusterMode] = useState<'risk' | 'segment'>('risk');
  const [viewMode, setViewMode] = useState<'points' | 'heatmap'>('points');
  const [activeRisks, setActiveRisks] = useState({
    Low_risk: true,
    Avg_risk: true,
    High_risk: true,
  });
  const [activeSegments, setActiveSegments] = useState(() => {
    const init: Record<string, boolean> = {};
    Object.keys(SEGMENT_DESCRIPTIONS).forEach((k) => (init[k] = true));
    return init;
  });

  /* ---- FETCH ---- */
  useEffect(() => {
    fetchSegments().then((raw) =>
      setSegments(
        raw.map((d: any) => ({
          ...d,
          Churn_Risk: d.Churn_Risk === 'Avg_risg' ? 'Avg_risk' : d.Churn_Risk,
          pos: [d.geolocation_lng, d.geolocation_lat],
        })),
      ),
    );
  }, []);

  /* ---- ГРУППИРОВКА ---- */
  const { riskGroups, segmentGroups } = useMemo(() => {
    const risk: Record<string, any[]> = {
      Low_risk: [],
      Avg_risk: [],
      High_risk: [],
    };
    const seg: Record<string, any[]> = {};
    Object.keys(SEGMENT_DESCRIPTIONS).forEach((k) => (seg[k] = []));

    segments.forEach((d) => {
      risk[d.Churn_Risk].push(d);
      seg[d.segment].push(d);
    });

    return { riskGroups: risk, segmentGroups: seg };
  }, [segments]);

  /* ---- ФИЛЬТР ---- */
  const filteredData = useMemo(() => {
    if (clusterMode === 'risk') {
      if (filterRisk) return riskGroups[filterRisk];
      return (['Low_risk', 'Avg_risk', 'High_risk'] as const).flatMap((key) =>
        activeRisks[key] ? riskGroups[key] : [],
      );
    }
    return Object.keys(segmentGroups).flatMap((key) =>
      activeSegments[key] ? segmentGroups[key] : [],
    );
  }, [
    clusterMode,
    filterRisk,
    activeRisks,
    activeSegments,
    riskGroups,
    segmentGroups,
  ]);

  /* ---- HELPERS ---- */
  const getRadius = (z: number) => Math.max(2, Math.min(20 - z * 2, 3));
  const getColor = useCallback(
    (d: any) =>
      clusterMode === 'risk'
        ? [...(RISK_COLORS[d.Churn_Risk] || [120, 120, 120]), 160]
        : [...(SEGMENT_COLORS[d.segment] || [180, 180, 180]), 160],
    [clusterMode],
  );

  /* ---- LAYERS ---- */
  const layers = useMemo(() => {
    if (viewMode === 'points') {
      return [
        new ScatterplotLayer({
          id: 'scatter',
          data: filteredData,
          pickable: false,
          getPosition: (d) => d.pos,
          getFillColor: getColor,
          getRadius: () => getRadius(zoom),
          radiusUnits: 'pixels',
          opacity: 0.9,
          coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
          updateTriggers: {
            getRadius: zoom,
            getFillColor: clusterMode,
          },
        }),
      ];
    }

    if (clusterMode === 'risk') {
      return Object.entries(RISK_COLORS)
        .filter(([risk]) => activeRisks[risk])
        .map(
          ([risk, color]) =>
            new HeatmapLayer({
              id: `heatmap-${risk}`,
              data: riskGroups[risk],
              getPosition: (d) => d.pos,
              getWeight: () => 1,
              colorRange: [color, color],
              radiusPixels: 30,
              intensity: 2,
              threshold: 0.05,
            }),
        );
    }

    return Object.entries(SEGMENT_COLORS)
      .filter(([seg]) => activeSegments[seg])
      .map(
        ([seg, color]) =>
          new HeatmapLayer({
            id: `heatmap-${seg}`,
            data: segmentGroups[seg],
            getPosition: (d) => d.pos,
            getWeight: () => 1,
            colorRange: [color, color],
            radiusPixels: 30,
            intensity: 2,
            threshold: 0.05,
          }),
      );
  }, [
    viewMode,
    clusterMode,
    zoom,
    filteredData,
    activeRisks,
    activeSegments,
    riskGroups,
    segmentGroups,
    getColor,
  ]);

  /* ---- ЛЕГЕНДА ---- */
  const legendItems = useMemo(
    () =>
      clusterMode === 'risk'
        ? [
            { key: 'Low_risk', label: 'Низкий риск', color: RISK_COLORS.Low_risk },
            { key: 'Avg_risk', label: 'Средний риск', color: RISK_COLORS.Avg_risk },
            { key: 'High_risk', label: 'Высокий риск', color: RISK_COLORS.High_risk },
          ]
        : Object.entries(SEGMENT_DESCRIPTIONS).map(([key, label]) => ({
            key,
            label,
            color: SEGMENT_COLORS[key] || [180, 180, 180],
          })),
    [clusterMode],
  );

  /* ---- TOGGLES ---- */
  const toggleLegendItem = (key: string) => {
    if (clusterMode === 'risk') {
      setActiveRisks((p) => ({ ...p, [key]: !p[key] }));
    } else {
      setActiveSegments((p) => ({ ...p, [key]: !p[key] }));
    }
  };

  const allVisible =
    clusterMode === 'risk'
      ? Object.values(activeRisks).every(Boolean)
      : Object.values(activeSegments).every(Boolean);

  const toggleAll = () => {
    if (clusterMode === 'risk') {
      const ns: any = {};
      Object.keys(RISK_COLORS).forEach((k) => (ns[k] = !allVisible));
      setActiveRisks(ns);
    } else {
      const ns: any = {};
      Object.keys(SEGMENT_DESCRIPTIONS).forEach((k) => (ns[k] = !allVisible));
      setActiveSegments(ns);
    }
  };

  /* -------------------------- JSX -------------------------- */
  return (
    <div
      className={`rounded-xl shadow-xl overflow-hidden transform transition duration-300 ease-in-out ${
        fullscreen ? 'fixed inset-0 z-50 w-screen h-screen bg-white' : 'relative'
      } hover:scale-[1.01]`}
      style={
        fullscreen
          ? {}
          : { height: 'calc(100vh - 96px)', width: '100%', maxHeight: '100vh' }
      }
    >
      {/* --- Fullscreen --- */}
      <button
        onClick={() => setFullscreen(!fullscreen)}
        className="absolute top-3 right-3 z-50 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition"
      >
        {fullscreen ? (
          <XMarkIcon className="h-6 w-6 text-gray-800" />
        ) : (
          <ArrowsPointingOutIcon className="h-6 w-6 text-gray-800" />
        )}
      </button>

      {/* --- Панель режимов --- */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-3 bg-white p-2 rounded-xl shadow">
        {/* выбор кластеризации */}
        <button
          onClick={() => setClusterMode('risk')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            clusterMode === 'risk'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          По&nbsp;риску
        </button>
        <button
          onClick={() => setClusterMode('segment')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            clusterMode === 'segment'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          По&nbsp;сегменту
        </button>

        {/* --- Ползунок --- */}
        <label className="relative inline-block w-10 h-6 cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={viewMode === 'heatmap'}
            onChange={(e) => setViewMode(e.target.checked ? 'heatmap' : 'points')}
          />
          <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors" />
          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
        </label>

        {/* --- Индикатор состояния --- */}
        <span className="px-3 py-1 rounded-lg text-sm font-semibold border border-gray-300 bg-white/80 text-gray-800 cursor-default select-none">
          {viewMode === 'points' ? 'Точки' : 'Тепловая карта'}
        </span>
      </div>

      {/* --- Легенда --- */}
      <div className="absolute bottom-3 left-3 z-50 bg-white bg-opacity-90 p-2 rounded-xl shadow text-sm text-gray-800 max-h-64 overflow-y-auto">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold">Легенда:</span>
          <button
            onClick={toggleAll}
            className="px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition shadow"
          >
            {allVisible ? 'Сбросить всё' : 'Выбрать всё'}
          </button>
        </div>
        <ul className="space-y-1">
          {legendItems.map((item) => (
            <li key={item.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  clusterMode === 'risk'
                    ? activeRisks[item.key]
                    : activeSegments[item.key]
                }
                onChange={() => toggleLegendItem(item.key)}
                className="accent-blue-600"
              />
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: `rgb(${item.color.join(',')})` }}
              />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* --- DeckGL Map --- */}
      <DeckGL
        initialViewState={{ longitude: -51.9253, latitude: -14.235, zoom: 4 }}
        controller
        onViewStateChange={({ viewState }) => setZoom(viewState.zoom)}
        layers={layers}
        style={{ width: '100%', height: '100%' }}
      >
        <Map
          reuseMaps
          mapLib={import('maplibre-gl')}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        />
      </DeckGL>
    </div>
  );
};