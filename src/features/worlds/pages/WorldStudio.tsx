import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { FlowBar } from '@/components/shell/FlowBar';
import { OsRun } from '@/components/text/OsRun';
import { WeoTile } from '@/components/weo/WeoCards';
import { Button, CommitReview, FlowReceipt, ICO, OButton, OMark, Spinner, svg } from '@/design-system';
import { useCommunityCircles } from '@/features/community/api/community';
import { useDraft, useOPeg, useSaveDraft, type DraftWrite } from '@/features/create/api/create';
import { draftBody, formFromDraft } from '@/features/create/model/composer';
import { CREATE_TEMPLATES, createTone, type LiveKind } from '@/features/create/model/formats';
import { useInterests } from '@/features/discover/api/discover';
import { interest } from '@/features/discover/model/rails';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { useWeo, useWeos } from '@/features/weo/api/weos';
import { useWeoHandlers } from '@/features/weo/useWeoHandlers';
import { ApiError } from '@/api/client';
import { cardModel, formatHex, type WeoCardModel, type WeoFormat } from '@/lib/cardModel';
import { compact, osFmt } from '@/lib/format';
import { closeWorld, type WorldSeed } from '@/stores/flow';
import { ack, toast } from '@/stores/ui';
import {
  useRehearseDraft,
  useSettleRehearsal,
  type RehearsalDto,
  type RehearseDraftBody,
} from '../api/worlds';
import { ChainStep, type ChainCta } from '../components/ChainStep';
import { SimProjection } from '../components/SimProjection';
import { STAGE_SPOTS, type StageMarker } from '../components/WorldStage';
import { WorldStage3D } from '../components/WorldStage3D';
import {
  BOUNDS,
  COHORT_DEFAULTS,
  COHORTS,
  FIDELITY,
  SCENARIO_NOTE,
  SEASONS,
  WORLDS,
  clampTo,
  contextOf,
  crowdOf,
  pickedIds,
  rivalsWord,
  simulate,
  sweep,
  worldOf,
  type CohortPick,
  type MarketContext,
  type SeasonId,
  type SimConfig,
  type SimResult,
  type WorldId,
} from '../model/sim';
import type { WeoWorld } from '../three/world3d';
import { cssUrl } from '@/lib/cssUrl';

const ORDER = ['where', 'who', 'terms', 'forecast', 'share'] as const;
type StepKey = (typeof ORDER)[number];
type Audience = 'circle' | 'network' | 'people';
/** the formats a rehearsal can try — a Request is a buy, not an offer */
const STUDIO_KINDS = CREATE_TEMPLATES.filter((t) => !t.soon && t.mode === 'sell');

const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};
const card: CSSProperties = {
  borderRadius: 26,
  padding: 18,
  background: 'var(--surface)',
  boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};
const chip = (on: boolean, bg: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  cursor: 'pointer',
  padding: '6px 12px',
  fontSize: 11.5,
  font: 'inherit',
  fontWeight: on ? 700 : 500,
  color: on ? '#fff' : 'var(--text-dim)',
  border: '1px solid ' + (on ? 'transparent' : 'var(--border)'),
  background: on ? bg : 'var(--surface)',
});
const chipText: CSSProperties = { fontSize: 11.5 };

/** "@a, @b c" → ['a','b','c'] */
const handlesOf = (s: string) =>
  s
    .split(/[\s,]+/)
    .map((h) => h.replace(/^@+/, '').trim())
    .filter(Boolean)
    .slice(0, 20);

/** State that holds only while its key stays the same; a new key brings back the fallback. */
function useKeyed<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [s, setS] = useState<{ k: string; v: T } | null>(null);
  return [s && s.k === key ? s.v : fallback, (v: T) => setS({ k: key, v })];
}

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message || fallback : fallback);

/**
 * design: world.jsx WorldStudio — the rehearsal studio over any page. With a draft: the v3 chain
 * (Where · Who is there · Terms · Forecast · Share) and one explicit confirm that keeps the terms
 * (stage Rehearsed, D-089). Without one: the flow simulation of a live WeO, with the sweep (free,
 * D-087) and a settle to your ledger when the WeO is yours.
 */
export function WorldStudio({ seed }: { seed: WorldSeed }) {
  const navigate = useNavigate();
  const h = useWeoHandlers();
  const draftId = seed.draftId ?? null;
  const v3 = !!draftId;
  const draftQ = useDraft(draftId);
  // the settlement peg, for the review's dollar line
  const pegQ = useOPeg();
  const form = useMemo(() => (draftQ.data ? formFromDraft(draftQ.data) : null), [draftQ.data]);
  const me = useNavSummary().data;
  const floorQ = useWeos({ status: 'active', sort: 'trending', limit: 24 });
  const seedWeoQ = useWeo(!v3 && seed.weoId ? seed.weoId : undefined);
  const interestsQ = useInterests();
  const circlesQ = useCommunityCircles();
  const rehearse = useRehearseDraft();
  const saveDraft = useSaveDraft();
  const settleM = useSettleRehearsal();

  const contexts: MarketContext[] = useMemo(() => (interestsQ.data ?? []).map(interest), [interestsQ.data]);
  const floor: WeoCardModel[] = useMemo(
    () => (floorQ.data?.items ?? []).map((w) => cardModel(w)),
    [floorQ.data],
  );
  const seedWeo = useMemo(() => (seedWeoQ.data ? cardModel(seedWeoQ.data) : null), [seedWeoQ.data]);
  const circleList = useMemo(() => {
    const d = circlesQ.data;
    const j = d?.joined ?? [];
    const ids = new Set(j.map((c) => c.id));
    return [...j, ...(d?.suggested ?? []).filter((c) => !ids.has(c.id))].slice(0, 6);
  }, [circlesQ.data]);

  /* ---- the chain (v3) ---- */
  const [mod, setMod] = useState<StepKey | null>(v3 ? 'where' : 'terms');
  const [reached, setReached] = useState(0);
  const openStep = (k: StepKey) => {
    setMod(k);
    setReached((r) => Math.max(r, ORDER.indexOf(k)));
  };
  const [audience, setAudience] = useState<Audience>('circle');
  const [people, setPeople] = useState('');
  const [circlePick, setCircleId] = useState<string | null>(null);
  const circleId = circlePick ?? circleList[0]?.id ?? null;

  /* ---- the world and the subject ---- */
  const [worldId, setWorldId] = useState<WorldId>(worldOf(seed.worldId).id);
  const world = worldOf(worldId);
  // a world opens at its own fidelity; a level picked by hand holds while you stay in it
  const [fid, setFid] = useKeyed(worldId, world.fidelity);
  // without a seed the first WeO of yours on the floor, else the floor's first, is the subject
  const [weoPick, setWeoId] = useState<string | null>(seed.weoId ?? null);
  const weoId = v3
    ? 'draft'
    : (weoPick ?? (floor.find((w) => w.creatorId === me?.id) ?? floor[0])?.id ?? null);
  const draftKey = form ? 'draft' : 'loading';
  const [kind, setKind] = useKeyed<WeoFormat>(
    draftKey,
    form?.kind === 'Pool' || form?.kind === 'Bid' ? form.kind : 'Listing',
  );

  const draftTone = createTone(kind);
  const floorPick = !v3
    ? (floor.find((x) => x.id === weoId) ?? (seedWeo?.id === weoId ? seedWeo : null))
    : null;
  const subject: {
    id: string;
    name: string;
    type: WeoFormat;
    img: string | null;
    os: number;
    tone: string;
    mine: boolean;
  } | null =
    v3 && form
      ? {
          id: 'draft',
          name: form.title.trim() || 'Untitled WeO',
          type: kind,
          img: form.media,
          os: form.price > 0 ? form.price : 1200,
          tone: draftTone,
          mine: true,
        }
      : floorPick
        ? {
            id: floorPick.id,
            name: floorPick.name,
            type: floorPick.type,
            img: floorPick.img,
            os: floorPick.os || 1200,
            tone: floorPick.hex,
            mine: floorPick.creatorId === me?.id,
          }
        : null;
  const subjectCard = floorPick;

  /* ---- the market and the terms ---- */
  const [contextPick, setContext] = useState<string | null>(null);
  const context = contextPick ?? contexts[0]?.context ?? '';
  const [cohorts, setCohorts] = useState<CohortPick>(COHORT_DEFAULTS);
  const [season, setSeason] = useState<SeasonId>('weekend');
  const [rivals, setRivals] = useState(0.35);
  // a draft brings its own terms; a WeO brings its price (picked again when the subject changes)
  const subjectOs = subject?.os ?? 1200;
  const [price, setPrice] = useKeyed(`${subject?.id ?? ''}:${draftKey}`, clampTo('price', subjectOs));
  const [edition, setEdition] = useKeyed(
    draftKey,
    clampTo('edition', form ? form.circ || form.qty || 50 : 50),
  );
  const [days, setDays] = useKeyed(draftKey, clampTo('days', form?.days || 7));
  const [resale, setResale] = useKeyed(draftKey, form ? (form.resell ? 2 : 0) : 2);
  const [bundle, setBundle] = useState(false);

  const [stage, setStage] = useState<'act' | 'provisional' | 'settled'>('act');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [commit, setCommit] = useState(false);
  const [receipt, setReceipt] = useState<RehearsalDto | null>(null);
  const [wide, setWide] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const stageEl = useRef<WeoWorld | null>(null);
  const ctrlRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<HTMLDivElement>(null);

  const cfg: SimConfig = {
    weo: { type: subject?.type ?? kind, os: subjectOs },
    contexts,
    context,
    price,
    edition,
    days,
    bundle,
    cohorts,
    season,
    rivals,
  };
  const ctx = contextOf(cfg);
  const crowd = crowdOf(cohorts);
  const reach = COHORTS.reduce((s, c) => s + (cohorts[c.id] ? c.reach : 0), 0);
  const comparable = floor.filter((w) => w.type === cfg.weo.type).length;
  const sweepRows = result && !v3 ? sweep(cfg) : null;
  const dirty = () => {
    setResult(null);
    setStage('act');
    setConfirm(false);
  };

  const markers: StageMarker[] = (() => {
    const pool = floor.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type as string,
      img: w.img,
      os: w.os,
      tone: w.hex,
      provisional: false,
    }));
    const list = pool.slice(0, STAGE_SPOTS.length);
    if (subject && !list.some((p) => p.id === subject.id)) {
      const s = {
        id: subject.id,
        name: subject.name,
        type: subject.type as string,
        img: subject.img,
        os: subject.os,
        tone: subject.tone,
        provisional: v3,
      };
      if (list.length < STAGE_SPOTS.length) list.unshift(s);
      else list[0] = s;
    }
    return list.map((p, i) => ({
      ...p,
      subject: p.id === subject?.id,
      wx: STAGE_SPOTS[i]![0],
      wz: STAGE_SPOTS[i]![1],
      size: Math.round(STAGE_SPOTS[i]![2] * (0.82 + fid * 0.045)),
    }));
  })();

  const run = () => {
    setRunning(true);
    setResult(null);
    setStage('act');
    setConfirm(false);
    if (v3) {
      setReached((x) => Math.max(x, 3));
      setMod('forecast');
    }
    window.setTimeout(() => {
      const r = simulate(cfg);
      setResult(r);
      setRunning(false);
      setStage('provisional');
      if (v3) setReached((x) => Math.max(x, 4));
      // play it in the world: the figures that convert walk to the subject
      stageEl.current?.runSim({ through: r.through, subjectId: subject?.id ?? null });
    }, 1150);
  };
  useEffect(() => {
    if (!v3 || !result) return;
    const c = ctrlRef.current;
    const f = fcRef.current;
    if (c && f) c.scrollTo?.({ top: Math.max(0, f.offsetTop - 12), behavior: 'smooth' });
  }, [result, v3]);

  const circleName = circleList.find((c) => c.id === circleId)?.name ?? 'its Circle';
  const audName =
    audience === 'network'
      ? 'your network'
      : audience === 'circle'
        ? circleName
        : people.trim() || 'the people you pick';

  const rehearsalOf = (r: SimResult) => ({
    world: { id: world.id, name: world.name, fidelity: fid },
    context: ctx.context,
    contextRate: ctx.rate,
    season,
    rivals,
    cohorts: pickedIds(cohorts),
    terms: { price, edition, days, bundle },
    result: {
      through: r.through,
      collectors: r.collectors,
      settled: r.settled,
      firstHours: r.firstHours,
      soldOut: r.soldOut,
      verdict: r.verdict,
    },
  });

  /** Keep the terms: the rehearsal on the draft (stage Rehearsed), and the draft's own terms. */
  const keep = async () => {
    if (!draftId || !result || !form) return;
    const aud: RehearseDraftBody['audience'] =
      audience === 'circle'
        ? { kind: 'circle', circleId: circleId ?? undefined }
        : audience === 'network'
          ? { kind: 'network' }
          : { kind: 'people', handles: handlesOf(people) };
    if (audience === 'circle' && !circleId) return toast('Pick a Circle to share it with');
    if (audience === 'people' && !handlesOf(people).length) return toast('Name at least one @handle');
    const base = rehearsalOf(result);
    try {
      await rehearse.mutateAsync({
        draftId,
        body: { ...base, terms: { ...base.terms, resale }, audience: aud } as RehearseDraftBody,
      });
      // the draft carries the rehearsed terms from here on
      await saveDraft
        .mutateAsync({
          id: draftId,
          body: draftBody({
            ...form,
            kind: kind as LiveKind,
            price,
            circ: edition,
            days,
            resell: resale > 0,
          }) as DraftWrite,
        })
        .catch(() => undefined);
      setCommit(false);
      setStage('settled');
      ack('Rehearsed', '#22C55E');
      closeWorld();
      void navigate(routes.hub());
    } catch (e) {
      toast(errText(e, 'The terms could not be kept — try again'));
    }
  };

  /** Settle a live WeO's rehearsal to your ledger (yours only). */
  const settle = async () => {
    if (!result || !subject || subject.id === 'draft') return;
    try {
      const r = await settleM.mutateAsync({ weoId: subject.id, body: rehearsalOf(result) });
      setReceipt(r);
      setStage('settled');
      toast('Settled · receipt written to your ledger');
    } catch (e) {
      toast(errText(e, 'It could not settle — try again'));
    }
  };
  const canSettle = !!subject?.mine;
  const settleTap = () => {
    if (!canSettle) return toast('Only your own WeOs settle to your ledger');
    if (confirm) void settle();
    else setConfirm(true);
  };

  // Escape leaves the world (the review closes first)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (commit) setCommit(false);
      else closeWorld();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [commit]);

  const STAGES = [
    { key: 'enter', label: 'Enter', note: 'Portal in' },
    { key: 'act', label: v3 ? 'Set terms' : 'Act', note: 'Set real terms' },
    { key: 'provisional', label: v3 ? 'Forecast' : 'Provisional', note: 'Costs nothing' },
    { key: 'settled', label: v3 ? 'Kept' : 'Settled', note: v3 ? 'Back to Community' : 'Real ledger' },
  ];
  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  const slider = (
    label: string,
    value: number,
    set: (v: number) => void,
    min: number,
    max: number,
    step: number,
    fmt: (v: number) => string,
  ) => (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <OsRun text={fmt(value)} />
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => {
          set(Number(e.target.value));
          dirty();
        }}
        style={{ width: '100%', marginTop: 7, accentColor: 'var(--o-violet)' }}
      />
    </label>
  );
  const chain = (k: StepKey) => {
    const n = ORDER.indexOf(k);
    return {
      i: n,
      stepKey: k,
      state: (n < reached ? 'done' : n === reached ? 'current' : 'locked') as 'done' | 'current' | 'locked',
      open: mod === k,
      onToggle: () => setMod(mod === k ? null : k),
      tone: draftTone,
    };
  };

  /* ---- the modules ---- */
  const worldChips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {WORLDS.map((x) => (
        <button
          key={x.id}
          onClick={() => setWorldId(x.id)}
          title={SCENARIO_NOTE[x.id]}
          aria-pressed={worldId === x.id}
          style={chip(worldId === x.id, 'var(--o-violet)')}
        >
          <span style={chipText}>{x.name}</span>
        </button>
      ))}
    </div>
  );
  const fidPills = (
    <div
      style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
        width: 'fit-content',
      }}
    >
      {FIDELITY.map((f) => (
        <button
          key={f.level}
          onClick={() => setFid(f.level)}
          title={`${f.name} — ${f.purpose} · ${f.tris} tris`}
          aria-label={`Fidelity ${f.level} · ${f.name}`}
          aria-pressed={fid === f.level}
          style={{
            border: 'none',
            cursor: 'pointer',
            borderRadius: 999,
            width: 32,
            height: 28,
            fontSize: 12,
            fontWeight: 700,
            color: fid === f.level ? '#fff' : 'var(--text-dim)',
            background: fid === f.level ? 'var(--o-blue)' : 'transparent',
          }}
        >
          {f.level}
        </button>
      ))}
    </div>
  );
  const contextChips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {contexts.length ? (
        contexts.map((c) => (
          <button
            key={c.context}
            onClick={() => {
              setContext(c.context);
              dirty();
            }}
            aria-pressed={context === c.context}
            title={`${c.type} clears ${Math.round(c.rate * 100)}% here`}
            style={chip(context === c.context, 'var(--o-blue)')}
          >
            <span style={chipText}>{c.context}</span>
          </button>
        ))
      ) : (
        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
          {interestsQ.isLoading
            ? 'Reading the network…'
            : 'No category figures yet — the model runs neutral.'}
        </span>
      )}
    </div>
  );
  const cohortRows = (detail: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {COHORTS.map((c) => {
        const on = !!cohorts[c.id];
        const share = on && reach ? c.reach / reach : 0;
        return (
          <button
            key={c.id}
            title={c.note}
            aria-pressed={on}
            onClick={() => {
              setCohorts((x) => ({ ...x, [c.id]: !x[c.id] }));
              dirty();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              borderRadius: 16,
              padding: detail ? '10px 12px' : '9px 12px',
              border: '1px solid ' + (on ? 'transparent' : 'var(--border)'),
              background: on ? `color-mix(in srgb, ${c.color} 10%, var(--surface))` : 'var(--surface)',
              boxShadow: on
                ? `inset 0 0 0 1px color-mix(in srgb, ${c.color} 40%, transparent)`
                : 'var(--nm-inset)',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: detail ? 13 : 12,
                height: detail ? 13 : 12,
                borderRadius: '50%',
                background: on ? c.color : 'var(--surface)',
                boxShadow: on ? `0 0 8px ${c.color}` : 'inset 0 0 0 1px var(--border)',
              }}
            />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: on ? 700 : 500,
                    color: on ? 'var(--text)' : 'var(--text-dim)',
                  }}
                >
                  {c.name}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-faint)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {compact(c.reach)}
                  {on ? ` · ${Math.round(share * 100)}%` : ''}
                </span>
              </span>
              {detail && (
                <span style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                  <span
                    title="Wants it already"
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      background: 'var(--surface-3, var(--surface-2))',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: `${Math.round(c.intent * 100)}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: on ? c.color : 'var(--text-faint)',
                        opacity: on ? 1 : 0.4,
                      }}
                    />
                  </span>
                  <span
                    title="Price sensitivity"
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      background: 'var(--surface-3, var(--surface-2))',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: `${Math.round(c.sens * 100)}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: on ? 'var(--o-gold)' : 'var(--text-faint)',
                        opacity: on ? 0.9 : 0.4,
                      }}
                    />
                  </span>
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
  const seasonChips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {SEASONS.map((s) => (
        <button
          key={s.id}
          onClick={() => {
            setSeason(s.id);
            dirty();
          }}
          aria-pressed={season === s.id}
          style={chip(season === s.id, 'var(--o-violet)')}
        >
          <span style={chipText}>{s.label}</span>
        </button>
      ))}
    </div>
  );
  const rivalsSlider = slider('Competition on the floor', rivals, setRivals, 0, 0.9, 0.05, rivalsWord);
  const kindChips = (
    <div>
      <span
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
          marginBottom: 7,
        }}
      >
        Format
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {STUDIO_KINDS.map((t) => {
          const on = kind === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setKind(t.key as WeoFormat);
                dirty();
              }}
              title={t.blurb}
              aria-pressed={on}
              style={chip(on, createTone(t.key))}
            >
              <span style={chipText}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
  const [pLo, pHi, pStep] = BOUNDS.price;
  const [eLo, eHi, eStep] = BOUNDS.edition;
  const [dLo, dHi, dStep] = BOUNDS.days;
  const termSliders = (
    <>
      {slider('Price', price, setPrice, pLo, pHi, pStep, (v) => `O ${osFmt(v)}`)}
      {slider('Edition', edition, setEdition, eLo, eHi, eStep, (v) => `${v} units`)}
      {slider('Run', days, setDays, dLo, dHi, dStep, (v) => `${v} days`)}
    </>
  );
  const resaleSlider = slider('Resale to you', resale, setResale, 0, 10, 1, (v) =>
    v === 0 ? 'Not resellable' : `${v}% of each resale`,
  );

  const forecastBody = !result ? (
    running ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Spinner size={26} />
        <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
          The ones who&rsquo;d collect are walking to your WeO&hellip;
        </span>
      </div>
    ) : (
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
        Something changed since the last run. Run it again to refresh the forecast.
      </p>
    )
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <span
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: '-.045em',
            lineHeight: 0.9,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(result.through * 100)}%
        </span>
        <span style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--text-dim)' }}>
          collect-through
          <br />
          {edition} units · {days} days
        </span>
      </div>
      <span
        style={{
          display: 'block',
          height: 8,
          borderRadius: 999,
          background: 'var(--surface-3, var(--surface-2))',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            width: `${Math.round(result.through * 100)}%`,
            height: '100%',
            borderRadius: 999,
            background: draftTone,
            animation: 'weo-cardin .6s var(--ease-portal) both',
          }}
        />
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
        {[
          { k: 'Collectors', v: osFmt(result.collectors) as ReactNode },
          { k: 'First collect', v: `${result.firstHours}h` as ReactNode },
          {
            k: 'Settled',
            v: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <OMark size={11} />
                {osFmt(result.settled)}
              </span>
            ),
          },
        ].map((x) => (
          <div
            key={x.k}
            style={{
              borderRadius: 14,
              padding: '10px 11px',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-sm)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15.5,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {x.v}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'var(--text-faint)' }}>{x.k}</p>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text)', textWrap: 'pretty' }}>
        {result.verdict}
      </p>
      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--text-dim)' }}>
        Rehearsed in {world.name} · {ctx.context} · O {osFmt(price)}. Whoever you share it with sees this
        projection alongside the campaign.
      </p>
    </div>
  );

  const shareBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(
        [
          { k: 'circle', t: 'A Circle', n: 'The people closest to what you make' },
          { k: 'network', t: 'Your network', n: 'Everyone who follows you in the WeOverse' },
          { k: 'people', t: 'Chosen people', n: 'A few names you trust for a first read' },
        ] as const
      ).map((o) => {
        const on = audience === o.k;
        return (
          <button
            key={o.k}
            onClick={() => setAudience(o.k)}
            aria-pressed={on}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              borderRadius: 16,
              padding: '10px 12px',
              border: '1px solid ' + (on ? 'transparent' : 'var(--border)'),
              background: on ? `color-mix(in srgb, ${draftTone} 9%, var(--surface))` : 'var(--surface)',
              boxShadow: on ? `inset 0 0 0 1.5px ${draftTone}` : 'var(--nm-inset)',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--surface)',
                boxShadow: on ? `inset 0 0 0 4px ${draftTone}` : 'inset 0 0 0 1.5px var(--border)',
              }}
            />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                {o.t}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)' }}>{o.n}</span>
            </span>
          </button>
        );
      })}
      {audience === 'circle' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {circleList.length ? (
            circleList.map((c) => (
              <button
                key={c.id}
                onClick={() => setCircleId(c.id)}
                aria-pressed={circleId === c.id}
                style={chip(circleId === c.id, 'var(--o-violet)')}
              >
                <span style={chipText}>{c.name}</span>
              </button>
            ))
          ) : (
            <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>No Circles to pick from yet.</span>
          )}
        </div>
      )}
      {audience === 'people' && (
        <input
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          placeholder="@handles, separated by commas"
          aria-label="Who sees it first — @handles"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            borderRadius: 13,
            padding: '11px 14px',
            font: 'inherit',
            fontSize: 13,
            color: 'var(--text)',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-inset)',
            outline: 'none',
          }}
        />
      )}
      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--text-faint)' }}>
        Nothing sends yet. Keeping the terms returns it to Community, where it opens to {audName} for
        reactions.
      </p>
    </div>
  );

  const loading = v3 ? draftQ.isLoading : false;
  const missingDraft = v3 && draftQ.isError;
  const title = subject ? `${subject.name} · rehearsed in ${world.name}` : `Rehearsed in ${world.name}`;
  const closeBtn = (
    <OButton variant="ghost" size={42} aria-label="Leave the world" onClick={closeWorld}>
      {svg(ICO.close, 18, 'currentColor', 1.8)}
    </OButton>
  );

  const adjust = () => {
    dirty();
    if (v3) setMod('terms');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={v3 ? 'Rehearse in a world' : 'Flow simulation'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'var(--bg-a)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'weo-cardin .42s var(--ease-portal) both',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px clamp(14px,2vw,24px)',
          background: 'var(--glass)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        {closeBtn}
        <div style={{ minWidth: 0, flex: '1 1 240px' }}>
          <p
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            <button
              onClick={closeWorld}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                font: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'inherit',
                color: 'var(--o-violet)',
              }}
            >
              {v3 ? 'Community' : 'Community hub'}
            </button>
            {svg(<path d="M9 6l6 6-6 6" />, 12, 'currentColor', 1.8)}
            <span style={{ color: 'var(--text)' }}>{v3 ? 'Rehearse · step 1 of 3' : 'Flow simulation'}</span>
          </p>
          <h2
            style={{
              margin: '5px 0 0',
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: '-.02em',
              color: 'var(--text)',
            }}
          >
            {title}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-dim)' }}>
            {SCENARIO_NOTE[world.id]}
          </p>
        </div>
        {!v3 && (
          <div
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
          >
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 4,
                borderRadius: 999,
                background: 'var(--surface-2)',
                boxShadow: 'var(--nm-inset)',
              }}
            >
              {WORLDS.map((x) => (
                <button
                  key={x.id}
                  onClick={() => setWorldId(x.id)}
                  title={SCENARIO_NOTE[x.id]}
                  aria-pressed={worldId === x.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '8px 14px',
                    font: 'inherit',
                    fontSize: 12.5,
                    fontWeight: worldId === x.id ? 700 : 500,
                    color: worldId === x.id ? '#fff' : 'var(--text-dim)',
                    background: worldId === x.id ? 'var(--o-violet)' : 'transparent',
                  }}
                >
                  {x.name}
                </button>
              ))}
            </div>
            {fidPills}
          </div>
        )}
        {v3 && (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--text-dim)',
            }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px dashed var(--o-violet)' }}
            />
            Provisional · nothing posts here
          </div>
        )}
      </div>

      {loading || missingDraft ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
          {loading ? (
            <Spinner size={34} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-dim)' }}>
                That draft is not here any more.
              </p>
              <Button size="sm" variant="ghost" tone="violet" onClick={closeWorld}>
                Back to Community
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="weo-world-grid"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: wide
              ? 'minmax(0,1fr)'
              : v3
                ? '352px minmax(0,1fr)'
                : '352px minmax(0,1fr) 248px',
            gap: 16,
            padding: 'clamp(12px,1.6vw,20px)',
            paddingBottom: 'var(--flowbar-h, 92px)',
            transition: 'grid-template-columns .44s var(--ease-portal)',
          }}
        >
          <div
            className="weo-sim-panel"
            style={{
              gridColumn: wide ? '1' : '2',
              gridRow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 0,
              minHeight: 0,
              borderRadius: 30,
              padding: 'clamp(12px,1.4vw,16px)',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 260, display: 'flex' }}>
              <WorldStage3D
                world={world}
                fid={fid}
                markers={markers}
                cohorts={crowd}
                subjectId={hoverId ?? subject?.id ?? null}
                worldRef={stageEl}
                onSelect={(id) => {
                  if (!id) return setHoverId(null);
                  if (v3 || id === subject?.id) return setHoverId(id === subject?.id ? null : id);
                  setHoverId(null);
                  setWeoId(id);
                  dirty();
                }}
                onWide={() => setWide((x) => !x)}
                isWide={wide}
                note={result ? result.verdict : SCENARIO_NOTE[world.id]}
              />
            </div>
            {/* the four stages as one inset track */}
            <div
              style={{
                display: 'flex',
                gap: 3,
                padding: 4,
                borderRadius: 999,
                background: 'var(--surface-2)',
                boxShadow: 'var(--nm-inset)',
                flex: '0 0 auto',
              }}
            >
              {STAGES.map((s, i) => {
                const done = i < stageIdx;
                const cur = i === stageIdx;
                return (
                  <span
                    key={s.key}
                    title={s.note}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      minHeight: 34,
                      padding: '0 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: cur ? 700 : 500,
                      color: cur ? '#fff' : done ? 'var(--o-violet)' : 'var(--text-faint)',
                      background: cur ? 'var(--o-violet)' : 'transparent',
                      boxShadow: cur ? '0 6px 14px -6px var(--o-violet)' : 'none',
                      transition: 'background .24s, color .2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        fontSize: 9.5,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        color: cur ? 'var(--o-violet)' : done ? '#fff' : 'var(--text-faint)',
                        background: cur ? '#fff' : done ? 'var(--o-violet)' : 'var(--surface)',
                      }}
                    >
                      {done ? svg(<polyline points="20 6 9 17 4 12" />, 9, 'currentColor', 3) : i + 1}
                    </span>
                    {s.label}
                  </span>
                );
              })}
            </div>
          </div>

          {!wide && (
            <div
              ref={ctrlRef}
              className="weo-sim-ctrl"
              style={{
                position: 'relative',
                gridColumn: 1,
                gridRow: 1,
                minWidth: 0,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: v3 ? 16 : 14,
                paddingRight: 2,
                paddingBottom: v3 ? 8 : 0,
              }}
            >
              {v3 ? (
                <>
                  <ChainStep
                    {...chain('where')}
                    ask="Where does it meet people?"
                    title="Where"
                    summary={`${world.name} · fidelity ${fid}`}
                    cta={[{ label: 'Next · Who is there', act: () => openStep('who') }]}
                    body={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {worldChips}
                        {fidPills}
                      </div>
                    }
                  />
                  <ChainStep
                    {...chain('who')}
                    ask="Who walks past it, and what kind of week is it?"
                    title="Who is there"
                    summary={`${ctx.context} · ${compact(reach)}`}
                    cta={[{ label: 'Next · Terms', act: () => openStep('terms') }]}
                    body={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {contextChips}
                        {cohortRows(false)}
                        {seasonChips}
                        {rivalsSlider}
                      </div>
                    }
                  />
                  <ChainStep
                    {...chain('terms')}
                    ask="What are you offering, and on what terms?"
                    title="Terms"
                    summary={`O ${osFmt(price)} · ${edition} · ${days}d`}
                    cta={[
                      {
                        label: running ? 'Rehearsing…' : result ? 'Run it again' : 'Run the rehearsal',
                        primary: true,
                        tone: 'green',
                        act: run,
                        disabled: running,
                      },
                    ]}
                    body={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {kindChips}
                        {termSliders}
                        {resaleSlider}
                      </div>
                    }
                  />
                  <div ref={fcRef}>
                    <ChainStep
                      {...chain('forecast')}
                      open={reached >= 3}
                      onToggle={null}
                      highlight={!!result}
                      title="Forecast"
                      badge={
                        result ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 9.5,
                              fontWeight: 700,
                              letterSpacing: '.1em',
                              textTransform: 'uppercase',
                              color: '#fff',
                              background: draftTone,
                            }}
                          >
                            Projected
                          </span>
                        ) : null
                      }
                      ask={
                        result
                          ? 'This projection travels with your WeO'
                          : 'What happens if it goes out like this?'
                      }
                      cta={
                        result
                          ? ([
                              { label: 'Adjust terms', act: () => openStep('terms') },
                              {
                                label: 'Next · Who sees it first',
                                primary: true,
                                act: () => openStep('share'),
                              },
                            ] as ChainCta[])
                          : running
                            ? null
                            : [{ label: 'Run it again', primary: true, tone: 'green', act: run }]
                      }
                      body={forecastBody}
                    />
                  </div>
                  <ChainStep
                    {...chain('share')}
                    last
                    title="Share"
                    summary={audName}
                    ask="Who sees it first?"
                    cta={[
                      {
                        label: `Keep terms · share with ${audName}`,
                        primary: true,
                        tone: 'green',
                        act: () => setCommit(true),
                        disabled: !result,
                      },
                    ]}
                    body={shareBody}
                  />
                </>
              ) : (
                <>
                  <div className="weo-quiet" style={card}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <p style={eyebrow}>Market context</p>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: 'var(--text)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {osFmt(reach)} in reach
                      </span>
                    </div>
                    {contextChips}
                    {cohortRows(true)}
                    {seasonChips}
                    {rivalsSlider}
                  </div>
                  <div className="weo-quiet" style={card}>
                    <p style={eyebrow}>Terms</p>
                    {termSliders}
                  </div>
                  {running && (
                    <div style={{ display: 'grid', placeItems: 'center', padding: 22 }}>
                      <Spinner size={34} />
                    </div>
                  )}
                  {result && (
                    <div
                      style={{
                        borderRadius: 26,
                        padding: 18,
                        background: 'color-mix(in srgb, var(--o-violet) 6%, var(--surface))',
                        border: '1.5px dashed var(--o-violet)',
                        animation: 'weo-cardin .4s var(--ease-portal) both',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ ...eyebrow, color: 'var(--o-violet)' }}>Provisional · simulated</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-dim)' }}>
                          Reversible · costs nothing
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2,1fr)',
                          gap: 10,
                          marginTop: 14,
                        }}
                      >
                        {[
                          { k: 'Collect-through', v: `${Math.round(result.through * 100)}%` as ReactNode },
                          { k: 'Collectors', v: osFmt(result.collectors) as ReactNode },
                          { k: 'First collect', v: `${result.firstHours}h` as ReactNode },
                          {
                            k: 'Settled',
                            v: (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <OMark size={12} /> {osFmt(result.settled)}
                              </span>
                            ),
                          },
                        ].map((x) => (
                          <div
                            key={x.k}
                            style={{
                              borderRadius: 16,
                              padding: '12px 13px',
                              background: 'var(--surface)',
                              boxShadow: 'var(--nm-sm)',
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: 18,
                                fontWeight: 700,
                                letterSpacing: '-.02em',
                                color: 'var(--text)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {x.v}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'var(--text-faint)' }}>
                              {x.k}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p
                        style={{ margin: '13px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text)' }}
                      >
                        {result.verdict}
                      </p>
                      {!canSettle && (
                        <p
                          style={{
                            margin: '9px 0 0',
                            fontSize: 11,
                            lineHeight: 1.5,
                            color: 'var(--text-faint)',
                          }}
                        >
                          Not yours — the run is yours to read; only your own WeOs settle to your ledger.
                        </p>
                      )}
                    </div>
                  )}
                  {result && sweepRows && (
                    <div style={{ ...card, gap: 0 }}>
                      <p style={eyebrow}>Sensitivity sweep · the price ladder</p>
                      <div
                        style={{
                          display: 'grid',
                          gap: 1,
                          marginTop: 12,
                          borderRadius: 16,
                          overflow: 'hidden',
                          background: 'var(--border)',
                        }}
                      >
                        {sweepRows.map((r) => {
                          const best = r.settled === Math.max(...sweepRows.map((x) => x.settled));
                          return (
                            <div
                              key={r.price}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '9px 12px',
                                background: best
                                  ? 'color-mix(in srgb, var(--o-green) 8%, var(--surface))'
                                  : 'var(--surface)',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  width: 78,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  color: 'var(--text)',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                <OMark size={11} /> {osFmt(r.price)}
                              </span>
                              <span
                                style={{
                                  flex: 1,
                                  height: 7,
                                  borderRadius: 999,
                                  background: 'var(--surface-3)',
                                  overflow: 'hidden',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    width: `${Math.round(r.through * 100)}%`,
                                    height: '100%',
                                    borderRadius: 999,
                                    background: best ? 'var(--o-green)' : 'var(--o-violet)',
                                  }}
                                />
                              </span>
                              <span
                                style={{
                                  width: 38,
                                  textAlign: 'right',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: 'var(--text-dim)',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {Math.round(r.through * 100)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p
                        style={{
                          margin: '10px 0 0',
                          fontSize: 11,
                          lineHeight: 1.5,
                          color: 'var(--text-faint)',
                        }}
                      >
                        The same world, five prices at once. Green settles the most.
                      </p>
                    </div>
                  )}
                  {stage === 'settled' && result && receipt && subject && (
                    <FlowReceipt
                      title="Rehearsal settled"
                      status="completed"
                      amountOs={result.settled}
                      id={receipt.receiptId}
                      timestamp={
                        receipt.settledAt
                          ? new Date(receipt.settledAt).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : undefined
                      }
                      lines={[
                        { label: 'WeO', value: subject.name },
                        { label: 'Format', value: subject.type, mono: true },
                        { label: 'Context', value: ctx.context },
                        { label: 'Edition', value: `${edition} units`, mono: true },
                        { label: 'World', value: `${world.name} · fidelity ${fid}` },
                      ]}
                      onDone={() => {
                        dirty();
                        setReceipt(null);
                      }}
                    />
                  )}
                  <p style={{ margin: '0 0 6px', fontSize: 11, lineHeight: 1.6, color: 'var(--text-faint)' }}>
                    Nothing enters the ledger until you settle. This is a marketplace simulation running
                    inside the WeOverse — a model, provisional, reversible, and never a real listing.
                  </p>
                </>
              )}
            </div>
          )}

          {!wide && !v3 && (
            <div
              className="weo-sim-card"
              style={{
                gridColumn: 3,
                gridRow: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                overflowY: 'auto',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                Under test
              </span>
              {subjectCard ? (
                <WeoTile
                  w={subjectCard}
                  h={h}
                  width={228}
                  engageLabel="Open the WeO"
                  onEngage={() => {
                    closeWorld();
                    void navigate(routes.weo(subjectCard.id));
                  }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)' }}>
                  {floorQ.isLoading ? 'Finding WeOs on the floor…' : 'Nothing live on the floor to test yet.'}
                </p>
              )}
              {subject && <SimProjection cfg={cfg} world={world} comparable={comparable} live={!result} />}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {floor.slice(0, 8).map((x) => (
                  <button
                    key={x.id}
                    onClick={() => {
                      setWeoId(x.id);
                      dirty();
                    }}
                    title={x.name}
                    aria-label={x.name}
                    aria-pressed={weoId === x.id}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      background: x.img
                        ? `${cssUrl(x.img)} center/cover, var(--surface-2)`
                        : formatHex(x.type),
                      boxShadow: weoId === x.id ? '0 0 0 2px var(--o-violet)' : 'var(--nm-sm)',
                      opacity: weoId === x.id ? 1 : 0.6,
                      transition: 'opacity .2s, box-shadow .2s',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  setBundle((b) => !b);
                  dirty();
                }}
                aria-pressed={bundle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  borderRadius: 14,
                  cursor: 'pointer',
                  font: 'inherit',
                  padding: '9px 11px',
                  textAlign: 'left',
                  border: '1px solid ' + (bundle ? 'var(--o-violet)' : 'var(--border)'),
                  background: bundle
                    ? 'color-mix(in srgb, var(--o-violet) 9%, var(--surface))'
                    : 'var(--surface)',
                  boxShadow: bundle ? 'none' : 'var(--nm-inset)',
                }}
              >
                <span
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: '50%',
                    flex: '0 0 auto',
                    boxShadow: bundle
                      ? 'inset 0 0 0 4px var(--o-violet), inset 0 0 0 5px var(--surface)'
                      : 'inset 0 0 0 1px var(--border)',
                    background: 'var(--surface)',
                  }}
                />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                    Bundle as a remix
                  </span>
                  <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-dim)' }}>
                    +42% modelled lift
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {v3 ? (
        <FlowBar
          overlay
          screen="create"
          tone={draftTone}
          step={1}
          of={3}
          back={{ label: 'Community', go: closeWorld }}
          label={
            result
              ? `Forecast in: ${Math.round(result.through * 100)}% collect-through on ${edition} units`
              : `Set the terms, then run it · O ${osFmt(price)} · ${edition} units · ${days} days`
          }
          note={
            result
              ? 'Keep them and go back to Community — nothing posts yet'
              : 'You get a tested price and a collect-through forecast. Costs nothing, posts nothing.'
          }
          primary={
            result
              ? { label: `Keep · share with ${audName}`, act: () => setCommit(true) }
              : { label: running ? 'Rehearsing…' : 'Run the rehearsal', act: run }
          }
          secondary={
            result ? { label: 'Adjust', act: adjust } : { label: 'Leave without running', act: closeWorld }
          }
          disabled={running || loading}
        />
      ) : (
        <FlowBar
          overlay
          screen="hub"
          tone="#3A95F2"
          back={{ label: 'Leave the world', go: closeWorld }}
          label={
            result
              ? `${Math.round(result.through * 100)}% collect-through · O ${osFmt(result.settled)} settled`
              : 'Set the terms, then run the simulation'
          }
          note={
            result
              ? stage === 'settled'
                ? 'Settled · receipt written'
                : canSettle
                  ? 'Provisional — settle it to your ledger, or discard'
                  : 'Provisional — a read, not a listing'
              : 'Provisional, reversible, never a real listing until you say so'
          }
          primary={
            result
              ? stage === 'settled'
                ? { label: 'Run again', act: dirty }
                : canSettle
                  ? confirm
                    ? { label: settleM.isPending ? 'Settling…' : 'Confirm · settle', act: settleTap }
                    : { label: 'Settle to ledger', act: settleTap }
                  : { label: 'Run it again', act: run }
              : { label: running ? 'Simulating…' : 'Run the simulation', act: run }
          }
          secondary={
            result && stage !== 'settled'
              ? { label: 'Discard', act: dirty }
              : { label: 'Leave the world', act: closeWorld }
          }
          disabled={running || !subject || settleM.isPending}
        />
      )}

      {/* the one explicit confirm: keep the rehearsed terms (nothing posts, nothing moves) */}
      {commit && subject && (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCommit(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'grid',
            placeItems: 'start center',
            alignContent: 'center',
            overflowY: 'auto',
            padding: 20,
            background: 'color-mix(in srgb, var(--bg-a) 55%, transparent)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            animation: 'weo-cardin .3s var(--ease-portal) both',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Keep the rehearsed terms"
            style={{ width: 'min(440px, 100%)', animation: 'weo-cardin .42s var(--ease-settle) both' }}
          >
            <CommitReview
              title="Keep the rehearsed terms"
              what={
                <span>
                  {subject.name} · {kind} returns to Community, rehearsed
                </span>
              }
              amountOs={price}
              rate={pegQ.data?.usdPerO}
              when={`Nothing posts yet · when it does, it runs ${days} days`}
              to={
                <span>
                  You receive <OMark size={11} /> {osFmt(price)} per collect
                  {resale > 0 ? ` · ${resale}% of each resale` : ''}
                </span>
              }
              next={`Next in Community: open it to 12 reactions from ${audName}, then 20 pledges post it validated — or post it now. Rehearsed in ${world.name}: ${result ? Math.round(result.through * 100) : 0}% collect-through on ${edition} units.`}
              recover="Adjust the terms any time before it posts. Nothing has moved."
              confirmLabel={rehearse.isPending ? 'Keeping…' : 'Keep · back to Community'}
              busy={rehearse.isPending}
              onConfirm={() => void keep()}
              onEdit={() => setCommit(false)}
              onCancel={() => setCommit(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WorldStudio;
