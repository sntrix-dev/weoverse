import { useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  CommitReview,
  FeeDisclosure,
  FlowReceipt,
  OButton,
  OMark,
  Orb,
  svg,
  type ReceiptLine,
  type ToneInput,
} from '@/design-system';
import { osFmt } from '@/lib/format';
import { Dial, PortalStage, StageRail, SuccessMoment, type DialRange, type FlowStage } from './FlowParts';

export interface FlowFee {
  label: string;
  os: number;
  enables: string;
  basis: string;
  to: string;
  when: string;
}

/**
 * Everything one flow sheet shows. design: screens-flows.jsx CardFlow `spec`, except that every
 * figure (amount, net, fees, what stops you) arrives from the caller's quote — the sheet does
 * not compute money (M04, D-032).
 */
export interface CardFlowSpec {
  tone: string;
  toneName: ToneInput;
  title: string;
  sub: string;
  img?: string | null;
  cta: string;
  priceLabel: string;
  /** the footer's label on the review step (default "You pay · they receive") */
  commitLabel?: string;
  front: (advance: () => void) => ReactNode;
  dial: { V: DialRange; value: number; onValue: (v: number) => void; note: ReactNode };
  /** under the dial: the hunt's bundle choice, the bid's attempt notice */
  deal?: ReactNode;
  terms?: { label: string; value: ReactNode }[];
  /** what this quote prices, Os */
  amount: number;
  /** what the seller receives, Os */
  net: number;
  fees: FlowFee[];
  feeTotal: number;
  /** dollars per O (backend usdAgainstO) for the review's fiat line */
  rate?: number;
  commit: {
    what: ReactNode;
    to: ReactNode;
    when: ReactNode;
    next: ReactNode;
    recover: ReactNode;
    /** blockers and warnings from the quote, said in the review */
    notices?: ReactNode;
    /** the quote says this cannot proceed */
    blocked?: boolean;
    /** Os short of the amount; shows the Top up row */
    shortBy?: number | null;
    available?: number;
    onTopUp?: () => void;
  };
  error?: string | null;
  /** resolves true once the server has taken it */
  confirm: () => Promise<boolean>;
  moment: { verb: string; dest?: string; destTone?: string };
  done?: {
    title: string;
    body?: ReactNode;
    amountOs: number;
    lines: ReceiptLine[];
    id: string;
    onDone: () => void;
    onSupport?: () => void;
    cta?: { label: string; tone: ToneInput; go: () => void };
  } | null;
  onClose: () => void;
}

export function CardFlow({ spec }: { spec: CardFlowSpec }) {
  const [stage, setStage] = useState<FlowStage>('card');
  const [moment, setMoment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const { onClose } = spec;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const { tone } = spec;
  const amount = spec.amount;
  const advance = () => setStage('deal');
  const complete = async () => {
    setBusy(true);
    const ok = await spec.confirm();
    setBusy(false);
    if (ok) setMoment(true);
  };

  const body =
    stage === 'card' ? (
      <div
        key="card"
        style={{
          display: 'grid',
          placeItems: 'center',
          animation: 'weo-cardin .46s var(--ease-portal) both',
        }}
      >
        {spec.front(advance)}
      </div>
    ) : stage === 'deal' ? (
      <div key="deal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <PortalStage size={286} stage="deal">
          <Dial V={spec.dial.V} cur={spec.dial.value} onValue={spec.dial.onValue} tone={tone} size={258} />
        </PortalStage>
        {spec.deal}
      </div>
    ) : stage === 'commit' ? (
      <div
        key="commit"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'weo-cardin .42s var(--ease-settle) both',
        }}
      >
        <CommitReview
          what={spec.commit.what}
          amountOs={amount}
          rate={spec.rate}
          power={null}
          when={spec.commit.when}
          to={spec.commit.to}
          next={spec.commit.next}
          recover={spec.commit.recover}
          confirmLabel="Confirm"
          busy={busy}
          disabled={!!spec.commit.blocked}
          onConfirm={() => void complete()}
          onEdit={() => setStage('deal')}
          onCancel={onClose}
        />
        {spec.commit.notices}
        {spec.error && <Alert status="error">{spec.error}</Alert>}
        {spec.commit.shortBy != null && spec.commit.shortBy > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 18,
              background: 'color-mix(in srgb, var(--o-gold) 10%, var(--surface))',
              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--o-gold) 45%, transparent)',
            }}
          >
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--text)' }}>
              Short by{' '}
              <b style={{ fontVariantNumeric: 'tabular-nums' }}>
                <OMark size={11} /> {osFmt(spec.commit.shortBy)}
              </b>{' '}
              ·{' '}
              <span style={{ color: 'var(--text-dim)' }}>
                available <OMark size={10} /> {osFmt(spec.commit.available ?? 0)}
              </span>
            </span>
            {spec.commit.onTopUp && (
              <Button size="sm" variant="primary" tone="gold" onClick={spec.commit.onTopUp}>
                Top up
              </Button>
            )}
          </div>
        )}
        {/* Fees are disclosed at rest as a figure; the itemisation is the reveal. Settlement
            withholds nothing today, so there is no fee row to print (the quote says so). */}
        {spec.fees.length > 0 && (
          <div
            style={{
              borderRadius: 22,
              overflow: 'hidden',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setFeeOpen((o) => !o)}
              aria-expanded={feeOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                font: 'inherit',
                padding: '13px 16px',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-dim)' }}>Fees</span>
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 5,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <OMark size={12} />
                {osFmt(spec.feeTotal)}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                {feeOpen ? 'Hide' : 'Itemise'}
              </span>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--text-faint)',
                  transform: feeOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform .3s var(--ease-portal)',
                }}
              >
                {svg(<polyline points="6 9 12 15 18 9" />, 13, 'currentColor', 2.2)}
              </span>
            </button>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: feeOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows .42s var(--ease-portal)',
              }}
            >
              <div style={{ overflow: 'hidden', minHeight: 0 }}>
                <div style={{ padding: '0 10px 10px' }}>
                  <FeeDisclosure subtotal={amount} fees={spec.fees} rate={spec.rate} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div
        key="done"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'weo-cardin .42s var(--ease-portal) both',
        }}
      >
        {spec.done?.body && (
          <p
            style={{
              margin: 0,
              padding: '12px 14px',
              borderRadius: 18,
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text)',
              background: `color-mix(in srgb, ${tone} 9%, var(--surface))`,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tone} 35%, transparent)`,
              textWrap: 'pretty',
            }}
          >
            {spec.done.body}
          </p>
        )}
        {spec.done && (
          <FlowReceipt
            title={spec.done.title}
            status="completed"
            amountOs={spec.done.amountOs}
            rate={spec.rate}
            power={null}
            lines={spec.done.lines}
            id={spec.done.id}
            timestamp="just now"
            onDone={spec.done.onDone}
            onSupport={spec.done.onSupport}
          />
        )}
        {spec.done?.cta && (
          <Button variant="primary" tone={spec.done.cta.tone} onClick={spec.done.cta.go} dot>
            {spec.done.cta.label}
          </Button>
        )}
      </div>
    );

  // a step must never depend on hover alone: the foot keeps a control at rest
  const foot =
    stage === 'card' ? (
      <Button variant="primary" tone={spec.toneName} onClick={advance} dot>
        {spec.cta}
      </Button>
    ) : stage === 'deal' ? (
      <Button variant="primary" tone={spec.toneName} onClick={() => setStage('commit')}>
        Review it
      </Button>
    ) : null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background: 'rgba(10,16,32,.46)',
        backdropFilter: 'blur(7px)',
        WebkitBackdropFilter: 'blur(7px)',
        overflowY: 'auto',
      }}
    >
      {moment && (
        <SuccessMoment
          tone={tone}
          verb={spec.moment.verb}
          name={spec.title}
          img={spec.img}
          dest={spec.moment.dest}
          destTone={spec.moment.destTone}
          onDone={() => {
            setMoment(false);
            setStage('done');
          }}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={spec.title}
        style={{
          width: 'min(376px,100%)',
          borderRadius: 32,
          padding: 20,
          background: 'var(--surface)',
          boxShadow: 'var(--nm-hero), inset 0 0 0 1px var(--border)',
          animation: 'weo-cardin .46s var(--ease-portal) both',
          margin: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Orb
            size={38}
            fill={spec.img ? 'image' : tone}
            src={spec.img}
            ring
            ringColor={tone}
            matcap
            breathe
            style={{ flex: '0 0 auto' }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 14.5,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {spec.title}
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              {spec.sub}
            </p>
          </div>
          <OButton variant="ghost" size={32} aria-label="Close" onClick={onClose}>
            {svg(<path d="M18 6L6 18M6 6l12 12" />, 15, 'currentColor', 1.8)}
          </OButton>
        </div>

        <div style={{ margin: '14px 0 4px' }}>
          <StageRail stage={stage} tone={tone} />
        </div>

        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300, padding: '10px 0' }}>{body}</div>

        {stage !== 'done' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingTop: 14,
              borderTop: '1px solid var(--border)',
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                {stage === 'commit' ? (spec.commitLabel ?? 'You pay · they receive') : spec.priceLabel}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <OMark size={13} />
                  {osFmt(amount)}
                </span>
                {stage === 'commit' && (
                  <span
                    style={{
                      fontSize: 11.5,
                      color: 'var(--o-green)',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    O {osFmt(spec.net)} to them
                  </span>
                )}
              </span>
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {stage === 'deal' && (
                <Button size="sm" variant="ghost" tone="blue" onClick={() => setStage('card')}>
                  Back
                </Button>
              )}
              {foot}
            </span>
          </div>
        )}
        {stage === 'deal' && (
          <p
            style={{
              margin: '12px 0 0',
              textAlign: 'center',
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--text-faint)',
            }}
          >
            {spec.dial.note}
          </p>
        )}
        {/* KEY TERMS at rest — the format's own rules, where the decision is made */}
        {stage === 'deal' && spec.terms && spec.terms.length > 0 && (
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gap: 1,
              borderRadius: 18,
              overflow: 'hidden',
              background: 'var(--border)',
              boxShadow: 'inset 0 0 0 1px var(--border)',
            }}
          >
            {spec.terms.map((tm) => (
              <div
                key={tm.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  padding: '8px 12px',
                  background: 'var(--surface)',
                }}
              >
                <span
                  style={{
                    flex: '0 0 92px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-faint)',
                  }}
                >
                  {tm.label}
                </span>
                <span
                  style={{
                    minWidth: 0,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: 'var(--text-dim)',
                    textWrap: 'pretty',
                  }}
                >
                  {tm.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
