// design: create.jsx CreateScreen — `common`, `priceMod`, `perKind`, `EDIT_TERMS`: what each format asks for
import { OMark, Toggle } from '@/design-system';
import { oStr } from '@/lib/format';
import type { CategoryDto } from '../api/create';
import { MEDIA_MAX, NEGOTIABLE_MAX, floorPrice, type ComposerForm } from '../model/composer';
import { TAG_LIST } from '../model/formats';
import { Stepper, cField, cMicro, digits } from './bits';
import { MediaUploader } from './MediaUploader';
import type { ComposerModule } from './ModWell';

export interface ModuleCtx {
  f: ComposerForm;
  set: (patch: Partial<ComposerForm>) => void;
  tone: string;
  categories: readonly CategoryDto[];
  openMod: (key: string) => void;
  toast: (msg: string) => void;
}

const note = (s: string) => (
  <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-faint)' }}>{s}</p>
);
const dim = { fontSize: 12.5, color: 'var(--text-dim)' } as const;
const numField = (value: number, onChange: (n: number) => void, label: string, width = 160) => (
  <input
    value={value}
    inputMode="numeric"
    aria-label={label}
    onChange={(e) => onChange(digits(e.target.value))}
    style={{ ...cField, width }}
  />
);

function tagBody({ f, set, tone }: ModuleCtx) {
  const add = () => {
    const t = f.tagDraft.trim().toLowerCase().replace(/[,#]/g, '');
    if (t && !f.tags.includes(t)) set({ tags: [...f.tags, t], tagDraft: '' });
    else set({ tagDraft: '' });
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {[...TAG_LIST, ...f.tags.filter((t) => !(TAG_LIST as readonly string[]).includes(t))].map((t) => {
        const on = f.tags.includes(t);
        return (
          <button
            type="button"
            key={t}
            aria-pressed={on}
            onClick={() => set({ tags: on ? f.tags.filter((x) => x !== t) : [...f.tags, t] })}
            style={{
              border: 'none',
              cursor: 'pointer',
              borderRadius: 999,
              padding: '7px 13px',
              fontSize: 12,
              fontWeight: 600,
              color: on ? '#fff' : 'var(--text-dim)',
              background: on ? tone : 'var(--surface-2)',
              boxShadow: on ? 'none' : 'var(--nm-inset)',
            }}
          >
            {t}
          </button>
        );
      })}
      {/* your own tag: type it, Enter adds it as a lit chip */}
      <input
        value={f.tagDraft}
        onChange={(e) => set({ tagDraft: e.target.value })}
        placeholder="+ your own"
        aria-label="Your own tag"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={() => f.tagDraft.trim() && add()}
        style={{
          width: 112,
          border: 'none',
          outline: 'none',
          borderRadius: 999,
          padding: '7px 13px',
          font: 'inherit',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text)',
          background: 'var(--surface)',
          boxShadow: `var(--nm-sm), inset 0 0 0 1px color-mix(in srgb, ${tone} 30%, transparent)`,
        }}
      />
    </div>
  );
}

/** The ask, and (on a Listing) whether it takes offers and how far below. */
function priceMod(ctx: ModuleCtx, title: string, text: string, negotiable: boolean): ComposerModule {
  const { f, set } = ctx;
  const floor = floorPrice(f.price, f.negotiateOff);
  return {
    key: 'price',
    title,
    done: f.price > 0,
    summary:
      f.price > 0
        ? negotiable && f.negotiable
          ? `${oStr(f.price)} · offers to ${oStr(floor)}`
          : oStr(f.price)
        : '',
    body: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <OMark size={15} />
          <input
            value={f.price}
            inputMode="numeric"
            aria-label={title}
            onChange={(e) => set({ price: digits(e.target.value) })}
            style={{ ...cField, width: 130, fontSize: 18, fontWeight: 700 }}
          />
        </span>
        {negotiable && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle
                checked={f.negotiable}
                onChange={(v) => set({ negotiable: v })}
                aria-label="Accept offers below the ask"
              />
              <span style={dim}>Accept offers below the ask</span>
            </div>
            {f.negotiable && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={cMicro}>Negotiable up to</span>
                <Stepper
                  v={f.negotiateOff}
                  set={(v) => set({ negotiateOff: Math.max(1, Math.min(NEGOTIABLE_MAX, v)) })}
                  min={1}
                />
                <span style={dim}>
                  % off — as low as <b style={{ color: 'var(--text)' }}>{oStr(floor)}</b>
                </span>
              </div>
            )}
          </div>
        )}
        {note(text)}
      </div>
    ),
  };
}

const daysMod = (ctx: ModuleCtx, title: string, micro: string): ComposerModule => ({
  key: 'days',
  title,
  done: ctx.f.days > 0,
  summary: `${ctx.f.days} days`,
  body: (
    <div>
      <span style={cMicro}>{micro}</span>
      <Stepper v={ctx.f.days} set={(v) => ctx.set({ days: v })} min={1} />
    </div>
  ),
});

export function buildModules(ctx: ModuleCtx): ComposerModule[] {
  const { f, set, tone, categories } = ctx;
  const common: ComposerModule[] = [
    {
      key: 'cat',
      title: 'Category',
      done: !!f.catId,
      summary: f.cat,
      body: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.length === 0 && <span style={dim}>Categories are loading…</span>}
          {categories.map((c) => {
            const on = f.catId === c._id;
            return (
              <button
                type="button"
                key={c._id}
                aria-pressed={on}
                onClick={() => {
                  set({ catId: c._id, cat: c.name });
                  ctx.openMod(f.kind === 'Request' ? 'tags' : 'media');
                }}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 999,
                  minHeight: 38,
                  padding: '0 15px',
                  font: 'inherit',
                  fontSize: 12.5,
                  fontWeight: on ? 600 : 400,
                  color: on ? '#fff' : 'var(--text-dim)',
                  background: on ? tone : 'var(--surface)',
                  boxShadow: on ? 'none' : 'var(--nm-sm)',
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      ),
    },
    // a Request carries no media on the backend, so it has no Media module (D-057)
    ...(f.kind === 'Request'
      ? []
      : [
          {
            key: 'media',
            title: 'Media',
            done: !!f.media,
            summary: f.media ? `${1 + f.gallery.length} of ${MEDIA_MAX}` : '',
            body: <MediaUploader tone={tone} f={f} toast={ctx.toast} onChange={(patch) => set(patch)} />,
          },
        ]),
    { key: 'tags', title: 'Tags', done: f.tags.length > 0, summary: f.tags.join(', '), body: tagBody(ctx) },
  ];

  const perKind: ComposerModule[] =
    f.kind === 'Pool'
      ? [
          {
            key: 'goal',
            title: 'Funding goal',
            done: f.goal > 0,
            summary: f.goal > 0 ? oStr(f.goal) : '',
            body: (
              <div>
                <span style={cMicro}>Goal</span>
                {numField(f.goal, (v) => set({ goal: v }), 'Funding goal')}
              </div>
            ),
          },
          {
            key: 'price',
            title: 'Minimum pledge',
            done: f.minPledge > 0,
            summary: f.minPledge > 0 ? oStr(f.minPledge) : '',
            body: (
              <div>
                <span style={cMicro}>Per backer</span>
                {numField(f.minPledge, (v) => set({ minPledge: v }), 'Minimum pledge')}
              </div>
            ),
          },
          daysMod(ctx, 'Deadline', 'Days open'),
        ]
      : f.kind === 'Bid'
        ? [
            priceMod(ctx, 'Opening bid', 'Bidders see the current bid, never your floor.', false),
            daysMod(ctx, 'Closes in', 'Days open'),
            {
              key: 'reserve',
              title: 'Reserve',
              done: true,
              summary: f.reserve ? 'held' : 'none',
              body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Toggle
                      checked={f.reserve}
                      onChange={(v) => set({ reserve: v })}
                      aria-label="Hold a reserve"
                    />
                    <span style={dim}>Hold a reserve — never disclosed to bidders</span>
                  </div>
                  {f.reserve && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={cMicro}>Lowest you take</span>
                      <Stepper
                        v={f.negotiateOff}
                        set={(v) => set({ negotiateOff: Math.max(1, Math.min(NEGOTIABLE_MAX, v)) })}
                        min={1}
                      />
                      <span style={dim}>
                        % under the opening bid —{' '}
                        <b style={{ color: 'var(--text)' }}>{oStr(floorPrice(f.price, f.negotiateOff))}</b>
                      </span>
                    </div>
                  )}
                </div>
              ),
            },
          ]
        : f.kind === 'Request'
          ? [
              {
                key: 'price',
                title: 'Budget range',
                done: f.price > 0 && f.priceMax >= f.price,
                summary: `${oStr(f.price)}–${oStr(f.priceMax)}`,
                body: (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <span style={cMicro}>From</span>
                      {numField(f.price, (v) => set({ price: v }), 'Budget from', 130)}
                    </div>
                    <div>
                      <span style={cMicro}>To</span>
                      {numField(f.priceMax, (v) => set({ priceMax: v }), 'Budget to', 130)}
                    </div>
                  </div>
                ),
              },
              daysMod(ctx, 'Closes in', 'Days to offer'),
            ]
          : [
              priceMod(ctx, 'Ask', 'What you receive is shown at preflight, before anything is live.', true),
              {
                key: 'qty',
                title: 'Quantity',
                done: f.qty > 0,
                summary: f.qty > 0 ? `${f.qty} × ${f.unit}` : '',
                body: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Stepper v={f.qty} set={(v) => set({ qty: v })} min={1} />
                    <input
                      value={f.unit}
                      onChange={(e) => set({ unit: e.target.value })}
                      placeholder="unit"
                      aria-label="Unit"
                      style={{ ...cField, width: 120 }}
                    />
                  </div>
                ),
              },
              {
                key: 'circ',
                title: 'Circulation',
                done: f.circ > 0,
                summary: f.circ > 0 ? String(f.circ) : '',
                body: (
                  <div>
                    <span style={cMicro}>How many exist</span>
                    <Stepper v={f.circ} set={(v) => set({ circ: v })} min={1} />
                  </div>
                ),
              },
              daysMod(ctx, 'Duration', 'Days live'),
              {
                key: 'resell',
                title: 'Resellable',
                done: true,
                summary: f.resell ? 'yes' : 'no',
                body: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Toggle checked={f.resell} onChange={(v) => set({ resell: v })} aria-label="Resellable" />
                    <span style={dim}>Collectors may pass it on</span>
                  </div>
                ),
              },
            ];
  return [...common, ...perKind];
}

/** The figures set on the WeO itself, under the description. */
export const editTerms = (kind: ComposerForm['kind']): [string, keyof ComposerForm, string][] =>
  kind === 'Pool'
    ? [
        ['Goal', 'goal', 'O'],
        ['Min pledge', 'minPledge', 'O'],
        ['Days', 'days', ''],
      ]
    : kind === 'Bid'
      ? [
          ['Opening bid', 'price', 'O'],
          ['Days', 'days', ''],
        ]
      : kind === 'Request'
        ? [
            ['From', 'price', 'O'],
            ['To', 'priceMax', 'O'],
            ['Days', 'days', ''],
          ]
        : [
            ['Ask', 'price', 'O'],
            ['Quantity', 'qty', ''],
            ['Circulation', 'circ', ''],
            ['Days', 'days', ''],
          ];
