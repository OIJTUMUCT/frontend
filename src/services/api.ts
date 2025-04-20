const API_URL = import.meta.env.VITE_API_URL;

export const fetchSegments = async () => {
  const res = await fetch(`${API_URL}/segments`);
  if (!res.ok) throw new Error("Не удалось загрузить сегменты");
  return res.json();
};

export const fetchSegmentsMeta = async () => {
  const res = await fetch(`${API_URL}/segments/meta`);
  if (!res.ok) throw new Error("Не удалось загрузить метаданные");
  return res.json();
};

export const fetchCohort = async () => {
  const r = await fetch(`${API_URL}/cohort`);
  const j = await r.json();

  return {
    xLabels: j.retention.columns,
    yLabels: j.retention.index,
    data: j.retention.data,
    stateList: j.state_list,
    regional: j.regional_cohort.data as [string, string, number, number][],
  };
};

export const fetchTimeline = async () => {
  const res = await fetch(`${API_URL}/timeline`);
  if (!res.ok) throw new Error("Не удалось загрузить временные данные");
  return res.json();
};