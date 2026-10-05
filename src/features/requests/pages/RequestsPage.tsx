// design: requests.jsx RequestsScreen — `/requests`, `/requests/:requestId` opens that brief
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { SectionHero } from '@/components/hero/SectionHero';
import { Scene } from '@/components/layout/Scene';
import { IconSegs, SectionHead, type SegItem } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { WeoList } from '@/components/weo/WeoCards';
import { useWeoView } from '@/components/weo/WeoView';
import { Button, ICO } from '@/design-system';
import { useWeos } from '@/features/weo/api/weos';
import { useWeoHandlers } from '@/features/weo/useWeoHandlers';
import { cardModel } from '@/lib/cardModel';
import { openCollect, openCompose, openOffer } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useBrief, useBriefs, useCloseBrief } from '../api/requests';
import { RequestCard, RequestPanel, RequestRecord, type RequestPanelHandlers } from '../components/Briefs';
import { briefModel, circlesAsking, type BriefModel } from '../model/briefs';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

type ReqView = 'cards' | 'list';
const REQ_VIEWS: SegItem<ReqView>[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'list', label: 'List' },
];

export default function RequestsPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const h = useWeoHandlers();
  const q = useBriefs(48);
  const answering = useWeos({ status: 'active', limit: 12 });
  const close = useCloseBrief();
  const [rqView, setRqView] = useWeoView<ReqView>('requests.open', REQ_VIEWS, 'cards');
  const [now] = useState(() => Date.now());

  const list = useMemo(() => (q.data?.requestOffers ?? []).map((r) => briefModel(r, now)), [q.data, now]);
  // a brief in the URL that is not on the open board (closed, or yours past its deadline) still opens
  const inList = !!requestId && list.some((r) => r.id === requestId);
  const single = useBrief(requestId && q.isSuccess && !inList ? requestId : null);
  const openBrief: BriefModel | null = requestId
    ? (list.find((r) => r.id === requestId) ?? (single.data ? briefModel(single.data, now) : null))
    : null;
  const answer = useMemo(() => (answering.data?.items ?? []).map((w) => cardModel(w)), [answering.data]);
  const offersIn = list.reduce((n, r) => n + r.offers, 0);

  const openId = openBrief?.id;
  useEffect(() => {
    if (!openId) return;
    const t = window.setTimeout(
      () =>
        document.getElementById(`rq-${openId}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }),
      120,
    );
    return () => window.clearTimeout(t);
  }, [openId]);

  const setOpen = (id: string | null) =>
    void navigate(id ? routes.requests(id) : routes.requests(), { replace: true, preventScrollReset: true });
  const postRequest = () => void navigate(`${routes.create()}?kind=Request`);
  const ph: RequestPanelHandlers = {
    onOffer: (r) => openOffer(r.id),
    onAsk: (r) => {
      openCompose(r.circle?.id ?? null);
      toast(`Ask in ${r.circle?.name ?? 'a Circle'} — your Circle answers with offers`);
    },
    onMake: (r) => {
      void navigate(`${routes.create()}?forRequest=${encodeURIComponent(r.id)}`);
      toast(`Making one for "${r.title.slice(0, 34)}${r.title.length > 34 ? '…' : ''}"`);
    },
    onCloseBrief: (r) =>
      close.mutate(r.id, {
        onSuccess: () => {
          toast(`${r.title} · no longer taking offers`);
          setOpen(null);
        },
        onError: (e) => toast(e instanceof ApiError ? e.message : 'That did not go through — try again'),
      }),
    onCollect: (weoId) => openCollect(weoId),
    onCollapse: () => setOpen(null),
  };
  const panel = (r: BriefModel) => <RequestPanel key={r.id} r={r} h={ph} closing={close.isPending} />;
  const outside = openBrief && !inList ? openBrief : null;

  return (
    <main style={page}>
      <PathBar
        onHub={() => void navigate(routes.hub())}
        items={[{ label: 'WeOverse', onClick: () => void navigate(routes.hub()) }, { label: 'Requests' }]}
      />

      <SectionHero
        id="requests"
        tone="#3A95F2"
        icon={ICO.requests}
        eyebrow="01 — Requests"
        title="Someone wants it made"
        bleedArt="/media/weo-wellness.jpg"
        lede="Open to all: anyone can post, anyone can offer. A brief freezes the moment an offer is accepted, so what you read is what you build."
        stats={[
          { value: String(q.data?.total ?? list.length), label: 'Open briefs' },
          { value: String(offersIn), label: 'Offers in' },
          {
            value: String(answering.data?.pagination.total ?? answer.length),
            label: 'WeOs that could answer',
          },
          { value: String(circlesAsking(list)), label: 'Circles asking' },
        ]}
        priorities={[
          { id: 'rq-open', label: 'Read the briefs', note: `${list.length} open — open one to offer` },
          { id: 'rq-answer', label: 'Offer a WeO you hold', note: 'Or make one for the brief' },
          { label: 'Post a request', note: 'Say what you want made', onClick: postRequest },
        ]}
        foot={
          <div id="rq-open">
            <div
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, marginBottom: 12 }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                Open briefs
              </span>
              <IconSegs items={REQ_VIEWS} value={rqView} onChange={setRqView} tone="var(--o-blue)" />
              <Button
                size="sm"
                variant="primary"
                tone="violet"
                onClick={() => openCompose()}
                style={{ marginLeft: 'auto' }}
                dot
              >
                Ask in a Circle
              </Button>
            </div>
            {outside && <div style={{ marginBottom: 14 }}>{panel(outside)}</div>}
            {!list.length ? (
              <p
                style={{
                  margin: 0,
                  padding: 40,
                  textAlign: 'center',
                  fontSize: 13.5,
                  color: 'var(--text-dim)',
                  borderRadius: 26,
                  background: 'var(--surface-2)',
                  boxShadow: 'var(--nm-inset)',
                }}
              >
                {q.isLoading
                  ? 'Reading the briefs…'
                  : 'No open briefs right now — post one and makers answer it.'}
              </p>
            ) : rqView === 'cards' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(min(288px,100%),1fr))',
                  gap: 14,
                }}
              >
                {list.map((r) => (
                  <RequestCard key={r.id} r={r} onOpen={() => setOpen(r.id)} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {list.map((r) =>
                  requestId === r.id ? (
                    panel(r)
                  ) : (
                    <RequestRecord key={r.id} r={r} onOpen={() => setOpen(r.id)} />
                  ),
                )}
              </div>
            )}
            {rqView === 'cards' && openBrief && inList && (
              <div style={{ marginTop: 14 }}>{panel(openBrief)}</div>
            )}
          </div>
        }
        directory={[
          { id: 'rq-open', label: 'Open briefs', count: q.data?.total ?? list.length },
          {
            id: 'rq-answer',
            label: 'WeOs that could answer',
            count: answering.data?.pagination.total ?? answer.length,
          },
          {
            label: 'Creators',
            note: 'Who could take this on',
            onClick: () => void navigate(routes.creators()),
          },
        ]}
      />

      <Scene id="rq-answer" style={{ display: 'block', marginTop: 56 }}>
        <SectionHead
          eyebrow="02 — Answering"
          title="WeOs that could answer these"
          note="Offer an existing WeO, or make one for the brief."
        />
        <WeoList list={answer} h={h} />
      </Scene>
    </main>
  );
}
