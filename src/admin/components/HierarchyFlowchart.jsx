import React, { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import adminApi from '@/admin/services/adminApi';
import dagre from 'dagre';
import Loader from '@/shared/components/Loader.jsx';
import {
  Package,
  Building2,
  GitBranch,
  ArrowDown,
  Users,
  Layers,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  TrendingUp,
  IndianRupee,
  Tag,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  PowerOff,
} from 'lucide-react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

/** Wider cards fit packages / WL titles */
const NODE_W = 308;
const NODE_H = 172;
/** Email + phone strip on every agency card */
const AGENT_CONTACT_BLOCK_H = 54;
/** Scroll stack under metrics when any inventory exists */
const AGENT_INVENTORY_PANEL_H = 188;
const BOOKING_ROW_PX = 24;
const BOOKING_CAP = 10;

function computePackageLayoutHeight(bookings) {
  const n = Math.min(bookings?.length ?? 0, BOOKING_CAP);
  if (n === 0) return NODE_H;
  const tableHead = 26;
  const tablePad = 10;
  const moreLine = bookings.length > BOOKING_CAP ? 18 : 0;
  return NODE_H + tableHead + n * BOOKING_ROW_PX + tablePad + moreLine;
}

function formatBookingDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function computeAgentLayoutHeight(customers, packages, whitelabels) {
  const c = customers?.length ?? 0;
  const p = packages?.length ?? 0;
  const w = whitelabels?.length ?? 0;
  const base = NODE_H + AGENT_CONTACT_BLOCK_H;
  if (!c && !p && !w) return base;
  return base + AGENT_INVENTORY_PANEL_H;
}

function truncateStr(s, max) {
  if (!s || typeof s !== 'string') return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 112 });

  nodes.forEach((node) => {
    const w = node.layoutWidth ?? NODE_W;
    const h = node.layoutHeight ?? NODE_H;
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const w = node.layoutWidth ?? NODE_W;
    const h = node.layoutHeight ?? NODE_H;
    const { layoutWidth: _lw, layoutHeight: _lh, ...rest } = node;
    return {
      ...rest,
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const CustomNode = ({ data }) => {
  const metrics = data.metrics || [];
  const tone =
    data.type === 'agent'
      ? {
          ring: data.kycStatus === 'approved'
            ? 'border-primary-500'
            : data.kycStatus === 'rejected'
            ? 'border-red-400'
            : 'border-amber-400',
          iconBg: data.kycStatus === 'approved'
            ? 'bg-primary-500'
            : data.kycStatus === 'rejected'
            ? 'bg-red-400'
            : 'bg-amber-400',
          Icon: Building2,
        }
      : data.isRoot
      ? { ring: 'border-amber-500', iconBg: 'bg-amber-500', Icon: Package }
      : { ring: 'border-violet-500', iconBg: 'bg-violet-500', Icon: Layers };

  const bookings = data.type === 'package' && Array.isArray(data.bookings) ? data.bookings : [];
  const showBookings = bookings.length > 0;
  const slice = bookings.slice(0, BOOKING_CAP);

  const customersList =
    data.type === 'agent' && Array.isArray(data.customersList) ? data.customersList : [];
  const packagesList =
    data.type === 'agent' && Array.isArray(data.packagesList) ? data.packagesList : [];
  const whitelabelsList =
    data.type === 'agent' && Array.isArray(data.whitelabelsList) ? data.whitelabelsList : [];
  const showAgentInventory =
    data.type === 'agent' && Boolean(customersList.length || packagesList.length || whitelabelsList.length);

  return (
    <div
      className={`rounded-2xl border-2 bg-white px-3 py-3 shadow-lg ${tone.ring}`}
      style={{ width: NODE_W, minWidth: NODE_W }}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-300" />
      <div className="flex items-start gap-2.5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${tone.iconBg}`}
        >
          <tone.Icon size={22} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <div className="text-sm font-black leading-tight text-slate-900">{data.title}</div>
            {data.type === 'agent' && (
              <div className="flex shrink-0 flex-col items-end gap-1">
                {/* KYC badge */}
                {data.kycStatus === 'approved' ? (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-emerald-700">
                    <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
                    Verified
                  </span>
                ) : data.kycStatus === 'rejected' ? (
                  <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-red-700">
                    <ShieldX className="h-2.5 w-2.5" strokeWidth={2.5} />
                    Rejected
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-amber-700">
                    <ShieldAlert className="h-2.5 w-2.5" strokeWidth={2.5} />
                    Pending
                  </span>
                )}
                {/* Active/Inactive badge */}
                {data.isActive ? (
                  <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-slate-600">
                    <PowerOff className="h-2.5 w-2.5" strokeWidth={2.5} />
                    Inactive
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="mt-0.5 text-[9px] font-bold uppercase leading-snug tracking-wide text-slate-400">
            {data.subtitle}
          </div>
          {data.type === 'agent' && data.parentName ? (
            <div className="mt-1.5 flex items-center gap-1 rounded-lg bg-primary-50/80 px-2 py-1 text-[9px] font-semibold leading-tight text-primary-800">
              <GitBranch className="h-3 w-3 shrink-0 opacity-80" strokeWidth={2} />
              <span className="min-w-0 break-words">
                Child of <span className="font-black">{data.parentName}</span>
              </span>
            </div>
          ) : data.type === 'agent' && !data.parentName ? (
            <div className="mt-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[9px] font-semibold text-slate-600">
              Root agency — hierarchy starts here
            </div>
          ) : null}
        </div>
      </div>

      {data.type === 'agent' ? (
        <div className="mt-2 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-2.5 py-2 shadow-sm">
          <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Agency contact</div>
          <div
            className="mt-1 break-all text-[11px] font-semibold leading-snug text-slate-900"
            title={data.agentEmail || ''}
          >
            {data.agentEmail?.trim() || '—'}
          </div>
          <div className="mt-1 flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-slate-800">
            <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />
            <span className="min-w-0 break-all">{data.agentPhone?.trim() || '—'}</span>
          </div>
        </div>
      ) : null}

      {metrics.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          {metrics.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg bg-slate-50/90 px-2 py-1.5 ${metrics.length % 2 === 1 && i === metrics.length - 1 ? 'col-span-2' : ''}`}
            >
              <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{m.label}</div>
              <div className="text-lg font-black tabular-nums leading-none text-slate-900">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing chain — only on package nodes */}
      {data.type === 'package' && (
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 px-2.5 py-2 shadow-sm">
          <div className="mb-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-900">
            <IndianRupee className="h-3 w-3" strokeWidth={2.5} />
            Pricing chain
          </div>
          {data.isRoot ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-600">Base price (original)</span>
              <span className="text-sm font-black tabular-nums text-amber-900">
                ₹{Number(data.basePrice || 0).toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500">Original base price</span>
                <span className="text-[11px] font-bold tabular-nums text-slate-700">
                  ₹{Number(data.basePrice || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-700">
                  <TrendingUp className="h-3 w-3" strokeWidth={2} />
                  Commission added
                </span>
                <span className="text-[11px] font-bold tabular-nums text-violet-800">
                  {data.commissionType === 'percentage'
                    ? `${data.commissionValue}%`
                    : data.commissionType === 'flat'
                    ? `+₹${Number(data.commissionValue || 0).toLocaleString('en-IN')}`
                    : '—'}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-amber-200 pt-1.5">
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-900">
                  <Tag className="h-3 w-3" strokeWidth={2} />
                  Selling price
                </span>
                <span className="text-sm font-black tabular-nums text-amber-900">
                  ₹{Number(data.finalPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {showAgentInventory ? (
        <div className="mt-2 max-h-[184px] space-y-2 overflow-y-auto border-t border-slate-100 pt-2">
          {customersList.length > 0 ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-2 py-1.5">
              <div className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-900">
                <Users className="h-3 w-3" strokeWidth={2} />
                Travelers ({customersList.length})
              </div>
              <ul className="space-y-1">
                {customersList.map((c) => (
                  <li
                    key={String(c._id)}
                    className="text-[10px] leading-snug text-emerald-950"
                    title={c.email ? `${c.name} · ${c.email}` : c.name}
                  >
                    <span className="font-bold">{truncateStr(c.name || 'Traveler', 26)}</span>
                    {c.email ? (
                      <span className="mt-0.5 block truncate text-[9px] font-medium text-emerald-800/90">
                        {truncateStr(c.email, 34)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-md border border-slate-100 bg-slate-50/90 px-2 py-1 text-[9px] text-slate-500">
              Travelers: <span className="font-semibold text-slate-700">none assigned</span>
            </div>
          )}

          {packagesList.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <div className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-700">
                <Package className="h-3 w-3 text-slate-500" strokeWidth={2} />
                Catalog packages ({packagesList.length})
              </div>
              <ul className="space-y-1">
                {packagesList.map((p) => (
                  <li key={String(p._id)} className="text-[10px] leading-snug text-slate-900">
                    <span className="font-bold">{truncateStr(p.title || 'Package', 30)}</span>
                    {p.destination ? (
                      <span className="mt-0.5 flex items-center gap-0.5 text-[9px] text-slate-500">
                        <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={2} />
                        {truncateStr(p.destination, 28)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {whitelabelsList.length > 0 ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50/60 px-2 py-1.5">
              <div className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-violet-900">
                <Layers className="h-3 w-3" strokeWidth={2} />
                Whitelabel offers ({whitelabelsList.length})
              </div>
              <ul className="space-y-1.5">
                {whitelabelsList.map((w) => (
                  <li key={String(w._id)} className="text-[10px] leading-snug text-violet-950">
                    <span className="font-bold">{truncateStr(w.title || 'Offer', 32)}</span>
                    {w.baseTitle && w.baseTitle !== w.title ? (
                      <span className="mt-0.5 block text-[9px] font-medium text-violet-800/85">
                        From package: {truncateStr(w.baseTitle, 30)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {showBookings ? (
        <div className="mt-3 border-t border-amber-100 pt-2">
          <div className="mb-1 text-[9px] font-black uppercase tracking-widest text-amber-700/90">
            Bookings ({bookings.length})
          </div>
          <div className="max-h-[260px] overflow-y-auto rounded-lg border border-amber-100/80 bg-amber-50/40">
            <table className="w-full text-left text-[9px]">
              <thead className="sticky top-0 z-[1] bg-amber-100/95 text-amber-900/90">
                <tr>
                  <th className="px-1.5 py-1 font-bold">ID</th>
                  <th className="px-1 py-1 font-bold">Guest</th>
                  <th className="px-1 py-1 font-bold">Travel</th>
                  <th className="px-1 py-1 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60 text-slate-800">
                {slice.map((b) => (
                  <tr key={String(b._id)} className="bg-white/70">
                    <td className="max-w-[72px] truncate px-1.5 py-0.5 font-mono font-semibold" title={b.bookingId}>
                      {b.bookingId ? String(b.bookingId).slice(-8) : '—'}
                    </td>
                    <td className="max-w-[88px] truncate px-1 py-0.5" title={b.customer?.name}>
                      {b.customer?.name || '—'}
                    </td>
                    <td className="whitespace-nowrap px-1 py-0.5 text-[8px] text-slate-600">
                      {formatBookingDate(b.travelDate)}
                    </td>
                    <td className="px-1 py-0.5 text-right text-[8px] font-bold uppercase text-slate-700">
                      {b.bookingStatus || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bookings.length > BOOKING_CAP ? (
            <p className="mt-1 text-center text-[8px] font-semibold text-amber-800/80">
              +{bookings.length - BOOKING_CAP} more — full list in table below
            </p>
          ) : null}
        </div>
      ) : null}

      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-slate-300" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

function FlowLegend({ type }) {
  const isAgent = type === 'agent';
  return (
    <div className="max-w-[min(100vw-2rem,300px)] rounded-2xl border border-slate-200 bg-white/95 p-4 text-xs shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <GitBranch className="h-4 w-4 text-primary-600" strokeWidth={2} />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
          {isAgent ? 'Agency map' : 'Package map'}
        </span>
      </div>
      <div className="mt-3 space-y-3 text-slate-600">
        {isAgent ? (
          <>
            <p className="hidden sm:block leading-relaxed">
              <strong className="text-slate-800">Top → bottom</strong> is parent → child agency. Lines show
              reporting structure;               <strong className="text-slate-800">parents can have travelers and packages</strong> too — see each
              card.
            </p>
            <ul className="space-y-2 border-l-2 border-primary-200 pl-3">
              <li>
                <span className="font-semibold text-slate-800">Travelers</span> — names managed under this
                agency (parent or child).
              </li>
              <li>
                <span className="font-semibold text-slate-800">Catalog packages</span> — trips this agency
                created.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Whitelabel offers</span> — resale offers built
                from another package.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Child agencies</span> — count only; open the
                card below for names in the tree.
              </li>
            </ul>
          </>
        ) : (
          <>
            <p className="leading-relaxed">
              The <strong className="text-slate-800">root</strong> is the original package. Each branch is a
              whitelabel offer another agency created from it.
            </p>
            <ul className="space-y-2 border-l-2 border-amber-200 pl-3">
              <li>
                <span className="font-semibold text-slate-800">Bookings (direct)</span> — reservations on the
                base package (not through a whitelabel).
              </li>
              <li>
                <span className="font-semibold text-slate-800">WL branches</span> — how many downstream
                whitelabel offers exist from this package.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Bookings</span> (on a branch) — trips sold on
                that specific whitelabel offer.
              </li>
            </ul>
          </>
        )}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-2 py-2 text-[10px] text-slate-500">
        <ArrowDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          Use <strong className="text-slate-700">Hide tables</strong> (top-left on map) when lists below crowd the chart.
          Drag to pan; zoom with controls or scroll. Mini-map shows position.
        </span>
      </div>
    </div>
  );
}

function AgentInventoryOverviewTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <Layers className="h-4 w-4 text-slate-700" strokeWidth={2} />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
          Inventory by agency
        </span>
        <span className="text-[10px] font-medium text-slate-500">
          Same data as the cards — travelers, packages, and whitelabels per agency
        </span>
      </div>
      <div className="max-h-[min(260px,36vh)] overflow-auto px-2 pb-3 pt-2">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-[1] bg-white shadow-sm">
            <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Agency</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Reports to</th>
              <th className="px-3 py-2">Travelers</th>
              <th className="px-3 py-2">Packages</th>
              <th className="px-3 py-2">Whitelabel offers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white/90">
            {rows.map((r) => (
              <tr key={r.key} className="align-top hover:bg-primary-50/20">
                <td className="px-3 py-2 font-semibold text-slate-900">{r.name}</td>
                <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold uppercase text-slate-600">
                  {r.role}
                </td>
                <td className="max-w-[140px] px-3 py-2 text-slate-700">{r.reportsTo}</td>
                <td className="max-w-[220px] px-3 py-2 text-[11px] text-slate-800" title={r.travelers}>
                  {r.travelers}
                </td>
                <td className="max-w-[220px] px-3 py-2 text-[11px] text-slate-800" title={r.packages}>
                  {r.packages}
                </td>
                <td className="max-w-[240px] px-3 py-2 text-[11px] text-slate-800" title={r.whitelabels}>
                  {r.whitelabels}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ParentChildSummaryTable({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white shadow-[0_-4px_20px_-8px_rgba(15,23,42,0.12)]">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2">
        <Users className="h-4 w-4 text-primary-600" strokeWidth={2} />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-800">Parent → Child agencies</span>
        <span className="text-[10px] font-medium text-slate-500">(same links as the chart)</span>
      </div>
      <div className="max-h-[min(280px,38vh)] overflow-auto px-2 pb-3 pt-2">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-[1] bg-white shadow-sm">
            <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Parent agency</th>
              <th className="px-3 py-2">Parent email</th>
              <th className="px-3 py-2">Child agency</th>
              <th className="px-3 py-2">Child email</th>
              <th className="px-3 py-2">Child role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.key} className="hover:bg-primary-50/30">
                <td className="px-3 py-2 font-semibold text-slate-900">{r.parent}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-slate-600" title={r.parentEmail}>
                  {r.parentEmail || '—'}
                </td>
                <td className="px-3 py-2 font-bold text-primary-900">{r.child}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-slate-600" title={r.childEmail}>
                  {r.childEmail || '—'}
                </td>
                <td className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-600">{r.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PackageBookingsSheet({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="shrink-0 border-t border-amber-200/80 bg-amber-50/40 shadow-[0_-4px_20px_-8px_rgba(120,53,15,0.08)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2">
        <Package className="h-4 w-4 text-amber-700" strokeWidth={2} />
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-950">All bookings</span>
        <span className="text-[10px] font-medium text-amber-900/70">
          Original package + each whitelabel offer ({rows.length} total)
        </span>
      </div>
      <div className="max-h-[min(320px,42vh)] overflow-auto px-2 pb-3 pt-2">
        <table className="w-full min-w-[860px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-[1] bg-amber-50 shadow-sm">
            <tr className="border-b border-amber-200 text-[10px] font-bold uppercase tracking-wide text-amber-950/80">
              <th className="px-3 py-2">Layer</th>
              <th className="px-3 py-2">Offer / package</th>
              <th className="px-3 py-2">Booking ID</th>
              <th className="px-3 py-2">Guest</th>
              <th className="px-3 py-2">Travel date</th>
              <th className="px-3 py-2 text-right">Base price</th>
              <th className="px-3 py-2 text-right">Commission</th>
              <th className="px-3 py-2 text-right">Selling price</th>
              <th className="px-3 py-2 text-right">Paid</th>
              <th className="px-3 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100 bg-white/80">
            {rows.map((r) => (
              <tr key={r.rowKey} className="hover:bg-amber-50/50">
                <td className="whitespace-nowrap px-3 py-1.5 text-[10px] font-bold uppercase text-amber-800">{r.layer}</td>
                <td className="max-w-[180px] truncate px-3 py-1.5 font-medium text-slate-900" title={r.offerTitle}>
                  {r.offerTitle}
                </td>
                <td className="px-3 py-1.5 font-mono text-[11px] font-semibold text-slate-800">{r.bookingId || '—'}</td>
                <td className="max-w-[140px] truncate px-3 py-1.5 text-slate-700">{r.guest}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">{r.travel}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-slate-600">
                  {r.basePrice != null ? `₹${Number(r.basePrice).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold tabular-nums text-violet-700">
                  {r.commission}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right font-bold tabular-nums text-amber-800">
                  {r.sellingPrice != null ? `₹${Number(r.sellingPrice).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                  {r.amount != null ? `₹${Number(r.amount).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="px-3 py-1.5 text-right text-[10px] font-bold uppercase text-slate-700">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const HierarchyFlowchart = ({ type = 'agent', id }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [detailTablesExpanded, setDetailTablesExpanded] = useState(true);

  useEffect(() => {
    setDetailTablesExpanded(true);
  }, [id, type]);

  const agentParentChildRows = useMemo(() => {
    if (type !== 'agent') return [];
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n.data]));
    return edges.map((e) => ({
      key: e.id,
      parent: byId[e.source]?.title ?? '—',
      parentEmail: byId[e.source]?.agentEmail ?? '',
      child: byId[e.target]?.title ?? '—',
      childEmail: byId[e.target]?.agentEmail ?? '',
      role: byId[e.target]?.agentRole ?? '—',
    }));
  }, [nodes, edges, type]);

  const agentInventoryOverviewRows = useMemo(() => {
    if (type !== 'agent') return [];
    return nodes.map((n) => {
      const d = n.data || {};
      const travelers = (d.customersList || [])
        .map((c) => c.name || c.email)
        .filter(Boolean);
      const pkgs = (d.packagesList || []).map((p) => p.title).filter(Boolean);
      const wls = (d.whitelabelsList || []).map((w) => w.title).filter(Boolean);
      return {
        key: n.id,
        name: d.title || '—',
        role: d.agentRole || '—',
        reportsTo: d.parentName ? `“${d.parentName}”` : '— (root)',
        travelers: travelers.length ? travelers.join(' · ') : '—',
        packages: pkgs.length ? pkgs.join(' · ') : '—',
        whitelabels: wls.length ? wls.join(' · ') : '—',
      };
    });
  }, [nodes, type]);

  const packageBookingFlatRows = useMemo(() => {
    if (type !== 'package') return [];
    const out = [];
    nodes.forEach((n) => {
      const bookings = n.data?.bookings;
      if (!Array.isArray(bookings) || bookings.length === 0) return;
      const isRoot = String(n.id).startsWith('pkg-');
      const layer = isRoot ? 'Original' : 'Whitelabel';
      const offerTitle = n.data?.title ?? '—';
      const basePrice = n.data?.basePrice;
      const commissionType = n.data?.commissionType;
      const commissionValue = n.data?.commissionValue;
      const finalPrice = n.data?.finalPrice;
      const commissionStr = isRoot
        ? '—'
        : commissionType === 'percentage'
        ? `${commissionValue}%`
        : commissionType === 'flat'
        ? `+₹${Number(commissionValue || 0).toLocaleString('en-IN')}`
        : '—';
      bookings.forEach((b, i) => {
        out.push({
          rowKey: `${n.id}-${String(b._id)}-${i}`,
          layer,
          offerTitle,
          basePrice,
          commission: commissionStr,
          sellingPrice: isRoot ? basePrice : finalPrice,
          bookingId: b.bookingId ?? b._id ?? '',
          guest: b.customer?.name ?? '—',
          travel: formatBookingDate(b.travelDate),
          amount: b.totalAmount,
          status: b.bookingStatus ?? '—',
        });
      });
    });
    return out;
  }, [nodes, type]);

  useEffect(() => {
    const fetchHierarchy = async () => {
      setLoading(true);
      try {
        const res = await (type === 'agent' ? adminApi.getAgentHierarchy(id) : adminApi.getPackageHierarchy(id));
        if (res.data?.success) {
          const hierarchy = res.data.data.hierarchy;
          const newNodes = [];
          const newEdges = [];

          if (type === 'agent') {
            const buildNodes = (node, parentId = null, parentName = null) => {
              const currentId = `agent-${node._id}`;
              const childCount = node.children?.length ?? 0;
              const custArr = Array.isArray(node.customers) ? node.customers : [];
              const pkgArr = Array.isArray(node.packages) ? node.packages : [];
              const wlArr = Array.isArray(node.whitelabels) ? node.whitelabels : [];

              const customersList = custArr.map((c) => ({
                _id: c._id,
                name: c.name || 'Traveler',
                email: c.email || '',
              }));
              const packagesList = pkgArr.map((p) => ({
                _id: p._id,
                title: p.title || 'Package',
                destination: p.destination || '',
              }));
              const whitelabelsList = wlArr.map((w) => {
                const custom = typeof w.customTitle === 'string' ? w.customTitle.trim() : '';
                const baseTitle = w.originalPackage?.title || '';
                return {
                  _id: w._id,
                  title: custom || baseTitle || 'Whitelabel offer',
                  baseTitle,
                };
              });

              newNodes.push({
                id: currentId,
                type: 'custom',
                layoutWidth: NODE_W,
                layoutHeight: computeAgentLayoutHeight(custArr, pkgArr, wlArr),
                data: {
                  type: 'agent',
                  title: node.name,
                  agentRole: node.role || '—',
                  agentEmail: node.email || '',
                  agentPhone: node.phone || '',
                  kycStatus: node.kyc?.status || 'pending',
                  isActive: node.isActive !== false,
                  parentName: parentName || null,
                  subtitle: parentName
                    ? `${node.role || 'Agency'} · under “${parentName}”`
                    : `${node.role || 'Agency'} · root`,
                  metrics: [
                    { label: 'Child agencies', value: childCount },
                    { label: 'Customers', value: custArr.length },
                    { label: 'Packages', value: pkgArr.length },
                    { label: 'WL offers', value: wlArr.length },
                  ],
                  customersList,
                  packagesList,
                  whitelabelsList,
                },
              });

              if (parentId) {
                newEdges.push({
                  id: `${parentId}-${currentId}`,
                  source: parentId,
                  target: currentId,
                  type: 'smoothstep',
                  animated: true,
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
                  style: { stroke: '#94a3b8', strokeWidth: 2 },
                });
              }

              if (node.children) {
                node.children.forEach((child) => buildNodes(child, currentId, node.name));
              }
            };
            buildNodes(hierarchy);
          } else {
            const mainId = `pkg-${hierarchy._id}`;
            const wlList = hierarchy.whitelabels || [];
            const baseBookings = Array.isArray(hierarchy.bookings) ? hierarchy.bookings : [];
            const directBookings = baseBookings.length;

            newNodes.push({
              id: mainId,
              type: 'custom',
              layoutWidth: NODE_W,
              layoutHeight: computePackageLayoutHeight(baseBookings),
              data: {
                type: 'package',
                isRoot: true,
                title: hierarchy.title,
                subtitle: hierarchy.createdBy?.name ? `Owner · ${hierarchy.createdBy.name}` : 'Base package',
                basePrice: hierarchy.basePrice,
                metrics: [
                  { label: 'Bookings (direct)', value: directBookings },
                  { label: 'WL branches', value: wlList.length },
                ],
                bookings: baseBookings,
              },
            });

            wlList.forEach((wl) => {
              const wlId = `wl-${wl._id}`;
              const wlBookingsArr = Array.isArray(wl.bookings) ? wl.bookings : [];
              const wlBookingsCount = wlBookingsArr.length;
              const commissionLabel = wl.commissionType === 'percentage'
                ? `${wl.commissionValue}% markup`
                : wl.commissionType === 'flat'
                ? `+₹${Number(wl.commissionValue || 0).toLocaleString('en-IN')} flat`
                : 'No commission';
              newNodes.push({
                id: wlId,
                type: 'custom',
                layoutWidth: NODE_W,
                layoutHeight: computePackageLayoutHeight(wlBookingsArr),
                data: {
                  type: 'package',
                  isRoot: false,
                  title: wl.customTitle || hierarchy.title,
                  subtitle: wl.createdBy?.name ? `Whitelabel · ${wl.createdBy.name}` : 'Whitelabel offer',
                  basePrice: hierarchy.basePrice,
                  commissionType: wl.commissionType,
                  commissionValue: wl.commissionValue,
                  finalPrice: wl.finalPrice,
                  metrics: [
                    { label: 'Bookings on this offer', value: wlBookingsCount },
                    { label: 'Commission', value: commissionLabel },
                  ],
                  bookings: wlBookingsArr,
                },
              });
              newEdges.push({
                id: `${mainId}-${wlId}`,
                source: mainId,
                target: wlId,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: '#7c3aed' },
                style: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '6 3' },
              });
            });
          }

          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        }
      } catch (err) {
        console.error('Failed to fetch hierarchy', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHierarchy();
  }, [id, type]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-slate-50">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-100">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-none border border-slate-200/80">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.35}
          maxZoom={1.5}
          attributionPosition="bottom-right"
          className="bg-slate-50"
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls className="!m-2 !overflow-hidden !rounded-xl !border !border-slate-200 !shadow-md" />
          <MiniMap
            zoomable
            pannable
            className="!m-2 !overflow-hidden !rounded-xl !border !border-slate-200 !shadow-md"
            nodeClassName="!rounded-md !bg-primary-500"
          />
          <Panel position="top-right" className="!m-0 hidden sm:block">
            <FlowLegend type={type} />
          </Panel>
          {!loading &&
          nodes.length > 0 &&
          (type === 'agent' || (type === 'package' && packageBookingFlatRows.length > 0)) ? (
            <Panel position="top-left" className="!m-2">
              <button
                type="button"
                onClick={() => setDetailTablesExpanded((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-800 shadow-md backdrop-blur-sm transition-colors hover:bg-slate-50"
              >
                <LayoutGrid className="h-4 w-4 text-primary-600" strokeWidth={2} />
                {detailTablesExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4 text-slate-500" strokeWidth={2} />
                    Hide tables
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4 text-slate-500" strokeWidth={2} />
                    Show tables
                  </>
                )}
              </button>
            </Panel>
          ) : null}
        </ReactFlow>
      </div>
      {detailTablesExpanded && type === 'agent' ? (
        <>
          <ParentChildSummaryTable rows={agentParentChildRows} />
          <AgentInventoryOverviewTable rows={agentInventoryOverviewRows} />
        </>
      ) : null}
      {detailTablesExpanded && type === 'package' ? (
        <PackageBookingsSheet rows={packageBookingFlatRows} />
      ) : null}
    </div>
  );
};

export default HierarchyFlowchart;
