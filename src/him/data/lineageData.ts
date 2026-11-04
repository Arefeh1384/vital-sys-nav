import {SITES_DATA} from './mockData';
import {occupancyDaySnapshot} from '../executive/dashboardStore';

/**
 * Synthetic end-to-end lineage for the occupancy metric (REQ-DAT-006, UI-DAT-04).
 * Every node carries scope, version, source identity, contract/transformation
 * versions, ingestion job, observation time and source-event time.
 */
export type LineageKind = 'source' | 'contract' | 'ingestion' | 'mapping' | 'snapshot' | 'transform' | 'metric' | 'result' | 'consumer';
export interface LineageNode {
  id: string; kind: LineageKind; label: string; version: string; siteId: string | null;
  sourceRecordId?: string; contractVersion?: string; transformVersion?: string; ingestionJob?: string;
  observedAt?: string; sourceEventAt?: string; records?: number; freshnessLimitSec?: number;
  quality: 'passed' | 'warning' | 'failed' | 'not_evaluated'; note?: string;
}
export interface LineageEdge {from: string; to: string; relation: string}
export interface LineageGraph {rootId: string; nodes: LineageNode[]; edges: LineageEdge[]}

export const KIND_ORDER: LineageKind[] = ['source', 'contract', 'ingestion', 'mapping', 'snapshot', 'transform', 'metric', 'result', 'consumer'];
export const KIND_LABEL: Record<LineageKind, string> = {
  source: 'منبع', contract: 'قرارداد داده', ingestion: 'کار دریافت', mapping: 'نگاشت شناسه', snapshot: 'Snapshot کانونی',
  transform: 'تبدیل', metric: 'تعریف متریک', result: 'نتیجه متریک', consumer: 'مصرف‌کننده',
};

function siteGraph(siteId: string): {nodes: LineageNode[]; edges: LineageEdge[]; resultId: string} | null {
  const site = SITES_DATA.find(s => s.id === siteId);
  const snap = occupancyDaySnapshot(siteId);
  if (!site || !snap) return null;
  const c = site.code.replace('SITE-', '');
  const day = snap.localDay.replace(/-/g, '');
  const obs = snap.syntheticIngestedAt;
  const evt = snap.syntheticSourceEventAt;
  const n = (x: Omit<LineageNode, 'siteId'>): LineageNode => ({siteId, ...x});
  const nodes: LineageNode[] = [
    n({id: `SRC-HIS-BED-${c}`, kind: 'source', label: `سامانه HIS — مدیریت تخت (${site.name})`, version: 'adapter hl7v2@1.4', sourceRecordId: `HIS/${c}/bed-board`, quality: 'passed', note: 'منبع مرجع (source of record) وضعیت تخت'}),
    n({id: `SRC-ADT-${c}`, kind: 'source', label: `ADT پذیرش و ترخیص (${site.name})`, version: 'adapter fhir-r4@2.0', sourceRecordId: `ADT/${c}/encounters`, quality: 'passed', note: 'منبع مرجع بستری‌ها'}),
    n({id: `CTR-HIS-BED@4`, kind: 'contract', label: 'قرارداد داده وضعیت تخت', version: 'v4', contractVersion: 'CTR-HIS-BED@4', freshnessLimitSec: 3600, quality: 'passed'}),
    n({id: `CTR-ADT-ENC@2`, kind: 'contract', label: 'قرارداد داده بستری', version: 'v2', contractVersion: 'CTR-ADT-ENC@2', freshnessLimitSec: 3600, quality: 'passed'}),
    n({id: `JOB-BED-${c}-${day}`, kind: 'ingestion', label: 'دریافت Snapshot وضعیت تخت', version: 'run 1', ingestionJob: `JOB-BED-${c}-${day}`, contractVersion: 'CTR-HIS-BED@4', observedAt: obs, sourceEventAt: evt, records: snap.staffed, quality: 'passed'}),
    n({id: `JOB-ENC-${c}-${day}`, kind: 'ingestion', label: 'دریافت دلتای بستری', version: 'run 3', ingestionJob: `JOB-ENC-${c}-${day}`, contractVersion: 'CTR-ADT-ENC@2', observedAt: obs, sourceEventAt: evt, records: snap.occupied, quality: 'warning', note: '۱ رکورد قرنطینه شد (کد بخش ناشناخته)؛ در شمارش وارد نشده است.'}),
    n({id: 'MAP-WARD-BED@5', kind: 'mapping', label: 'نگاشت بخش/تخت به شناسه کانونی', version: 'v5', quality: 'passed', note: 'نسخه مؤثر از ۲۰۲۶-۱۰-۰۱'}),
    n({id: `SNAP-BED-${c}-${day}`, kind: 'snapshot', label: 'Snapshot کانونی وضعیت تخت', version: snap.snapshot, transformVersion: 'TRF-BED-STATE@3.2', ingestionJob: `JOB-BED-${c}-${day}`, contractVersion: 'CTR-HIS-BED@4', observedAt: obs, sourceEventAt: evt, records: snap.staffed, quality: 'passed'}),
    n({id: `SNAP-ENC-${c}-${day}`, kind: 'snapshot', label: 'Snapshot کانونی بستری‌های فعال', version: `SYN-ENC-${c}-${day}-v1`, transformVersion: 'TRF-ENCOUNTER@2.1', ingestionJob: `JOB-ENC-${c}-${day}`, contractVersion: 'CTR-ADT-ENC@2', observedAt: obs, sourceEventAt: evt, records: snap.occupied, quality: 'warning'}),
    n({id: 'TRF-BED-STATE@3.2', kind: 'transform', label: 'تبدیل وضعیت تخت فعال دارای نیرو', version: '3.2', transformVersion: 'TRF-BED-STATE@3.2', quality: 'passed'}),
    n({id: 'TRF-ENCOUNTER@2.1', kind: 'transform', label: 'تبدیل بستری فعال', version: '2.1', transformVersion: 'TRF-ENCOUNTER@2.1', quality: 'passed'}),
    n({id: snap.metricVersion, kind: 'metric', label: 'تعریف متریک اشغال تخت فعال دارای نیروی انسانی', version: '1', quality: 'passed', note: 'صورت: تخت اشغال‌شده واجدشرایط · مخرج: تخت فعال دارای نیروی انسانی'}),
    n({id: `OCC-${c}-${day}`, kind: 'result', label: `نتیجه اشغال تخت ${snap.localDay}`, version: snap.metricVersion, observedAt: snap.asOf, sourceEventAt: evt, records: 1, quality: 'passed', note: snap.staffed > 0 ? `${snap.occupied} / ${snap.staffed} = ${Math.round(snap.occupied / snap.staffed * 10000) / 100}٪` : 'مخرج صفر؛ قابل محاسبه نیست'}),
  ];
  const e = (from: string, to: string, relation: string): LineageEdge => ({from, to, relation});
  const edges: LineageEdge[] = [
    e(`SRC-HIS-BED-${c}`, `JOB-BED-${c}-${day}`, 'خوانده‌شده توسط'), e(`CTR-HIS-BED@4`, `JOB-BED-${c}-${day}`, 'اعتبارسنجی با'),
    e(`SRC-ADT-${c}`, `JOB-ENC-${c}-${day}`, 'خوانده‌شده توسط'), e(`CTR-ADT-ENC@2`, `JOB-ENC-${c}-${day}`, 'اعتبارسنجی با'),
    e(`JOB-BED-${c}-${day}`, `SNAP-BED-${c}-${day}`, 'تولید'), e(`JOB-ENC-${c}-${day}`, `SNAP-ENC-${c}-${day}`, 'تولید'),
    e('MAP-WARD-BED@5', `SNAP-BED-${c}-${day}`, 'نگاشت شناسه'), e('MAP-WARD-BED@5', `SNAP-ENC-${c}-${day}`, 'نگاشت شناسه'),
    e(`SNAP-BED-${c}-${day}`, 'TRF-BED-STATE@3.2', 'ورودی'), e(`SNAP-ENC-${c}-${day}`, 'TRF-ENCOUNTER@2.1', 'ورودی'),
    e('TRF-BED-STATE@3.2', `OCC-${c}-${day}`, 'مخرج'), e('TRF-ENCOUNTER@2.1', `OCC-${c}-${day}`, 'صورت'),
    e(snap.metricVersion, `OCC-${c}-${day}`, 'تعریف'),
  ];
  return {nodes, edges, resultId: `OCC-${c}-${day}`};
}

/**
 * Graph for the current site's occupancy result, filtered to the sites the user may see.
 * Nodes and edges of other sites are dropped entirely: no labels, ids or counts leak.
 */
export function occupancyLineage(siteId: string, permittedSiteIds: string[]): LineageGraph | null {
  if (!permittedSiteIds.includes(siteId)) return null;
  const own = siteGraph(siteId);
  if (!own) return null;
  const nodes = [...own.nodes];
  const edges = [...own.edges];
  const consumers: LineageNode[] = [
    {id: 'UI-EXE-01:occupancy-card', kind: 'consumer', label: 'کارت اشغال داشبورد مدیریتی', version: 'UI-EXE-01', siteId, quality: 'passed'},
    {id: 'AIM:copilot-occupancy-evidence', kind: 'consumer', label: 'شواهد پاسخ کوپایلت (اشغال، آخرین روز کامل)', version: 'answer evidence', siteId, quality: 'passed'},
  ];
  nodes.push(...consumers);
  consumers.forEach(cn => edges.push({from: own.resultId, to: cn.id, relation: 'مصرف در'}));
  // Network comparison consumes every permitted site's result; unauthorized inputs never appear.
  const peers = permittedSiteIds.filter(id => id !== siteId).map(id => siteGraph(id)).filter((g): g is NonNullable<typeof g> => !!g);
  if (peers.length) {
    const cmp: LineageNode = {id: 'EXE-002:network-comparison', kind: 'consumer', label: 'مقایسه چندسایتی اشغال (EXE-002)', version: 'fixture comparison', siteId: null, quality: 'warning', note: 'فقط سایت‌های مجاز کاربر؛ وزن‌دهی بر اساس مخرج'};
    nodes.push(cmp);
    edges.push({from: own.resultId, to: cmp.id, relation: 'ورودی مقایسه'});
    for (const p of peers) {
      const r = p.nodes.find(x => x.id === p.resultId)!;
      nodes.push({...r, label: `${r.label} — ${SITES_DATA.find(s => s.id === r.siteId)?.name ?? ''}`});
      edges.push({from: r.id, to: cmp.id, relation: 'ورودی مقایسه'});
    }
  }
  return {rootId: own.resultId, nodes, edges};
}

/** Nodes within `depth` hops (both directions) of the root. */
export function withinDepth(g: LineageGraph, depth: number): LineageGraph {
  const keep = new Set([g.rootId]);
  let frontier = [g.rootId];
  for (let i = 0; i < depth; i++) {
    const next: string[] = [];
    for (const e of g.edges) {
      if (frontier.includes(e.to) && !keep.has(e.from)) { keep.add(e.from); next.push(e.from); }
      if (frontier.includes(e.from) && !keep.has(e.to)) { keep.add(e.to); next.push(e.to); }
    }
    frontier = next;
  }
  return {rootId: g.rootId, nodes: g.nodes.filter(n => keep.has(n.id)), edges: g.edges.filter(e => keep.has(e.from) && keep.has(e.to))};
}

/** Freshness of a node relative to its contract limit; null when the node has no observation time or limit. */
export function nodeFreshness(n: LineageNode, contractLimitSec: number | undefined, now = Date.now()): 'fresh' | 'stale' | 'unknown' {
  if (!n.observedAt || !contractLimitSec) return 'unknown';
  return now - Date.parse(n.observedAt) <= contractLimitSec * 1000 ? 'fresh' : 'stale';
}
