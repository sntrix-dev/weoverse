// design: create.jsx CreateScreen — the steps: 1 the O (formats, drafts, templates), 2 the composer,
// 3 preflight; posting asks where (PostSheet); a Request posts straight to the asks board.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { SuccessMoment } from '@/components/flow/FlowParts';
import { FlowBar, FlowFoot } from '@/components/shell/FlowBar';
import { PathBar } from '@/components/shell/PathBar';
import { useCommunityCircles, useDrafts, type DraftDto } from '@/features/community/api/community';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { sentence } from '@/features/requests/model/briefs';
import { osFmt } from '@/lib/format';
import { usePref } from '@/stores/prefs';
import { openPush } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useAsks, useCategories, useOPeg, useTemplates, type TemplateDto } from '../api/create';
import { useAutosave } from '../api/useAutosave';
import { usePublish } from '../api/usePublish';
import { circleLine, circlesFor, draftCardProps, priceLabelOf } from '../model/card';
import {
  EMPTY_FORM,
  canPost as canPostOf,
  missingOf,
  pickForm,
  templateForm,
  type ComposerForm,
} from '../model/composer';
import { CREATE_SOON, createTone, isLive, labelOf, toneNameOf, type CreateKind } from '../model/formats';
import { Composer } from './Composer';
import { CreateHero } from './CreateHero';
import { buildModules } from './modules';
import { PostSheet, type PostAsk, type PostCircle, type PostDest } from './PostSheet';
import { Posted } from './Posted';
import { Preflight } from './Preflight';
import { TemplateSheet, lockedLine } from './TemplateSheet';

const page = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
} as const;
const top = () => window.scrollTo(0, 0);
const daysLeft = (iso: string | undefined, now: number) =>
  iso ? `${Math.max(0, Math.ceil((Date.parse(iso) - now) / 86_400_000))}d` : '—';

export function CreateFlow({
  seed,
  draftId,
  editId,
  forRequest = null,
}: {
  seed: ComposerForm | null;
  draftId: string | null;
  editId: string | null;
  /** made for a brief (M08): the post sheet opens on "One person", that ask chosen */
  forRequest?: PostAsk | null;
}) {
  const navigate = useNavigate();
  const dark = usePref('theme') === 'dark';
  const me = useNavSummary().data;
  const peg = useOPeg().data;
  const templates = useTemplates().data?.templates ?? [];
  const categories = useCategories().data ?? [];
  const asksQ = useAsks().data;
  const circlesQ = useCommunityCircles().data;
  const drafts = (useDrafts().data?.items ?? []).filter((d) => !CREATE_SOON.has(d.format as CreateKind));

  const [step, setStep] = useState<1 | 2 | 3>(seed ? 2 : 1);
  const [f, setF] = useState<ComposerForm>(seed ?? EMPTY_FORM);
  const set = (patch: Partial<ComposerForm>) => setF((x) => ({ ...x, ...patch }));
  const [openMod, setOpenMod] = useState<string | null>('cat');
  const [tplBig, setTplBig] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [moment, setMoment] = useState<{ verb: string; dest: string; destTone: string } | null>(null);
  const [posted, setPosted] = useState<{ id: string } | null>(null);
  const [showReq, setShowReq] = useState(false);
  const [nudge, setNudge] = useState(0);
  // the clock the open asks are read against (one reading per visit is enough for "closes in 3d")
  const [now] = useState(() => Date.now());

  const autosave = useAutosave(f, step > 1 && !editId && !posted, draftId);
  const pub = usePublish({
    usdAgainstO: peg?.usdAgainstO,
    creatorName: me?.handle?.replace(/^@/, '') || me?.name || '',
    editId,
    draftId: autosave.id,
    onPosted: autosave.stop,
  });

  const circles = useMemo(
    () =>
      [...(circlesQ?.joined ?? []), ...(circlesQ?.suggested ?? [])].filter(
        (c, i, a) => a.findIndex((x) => x.id === c.id) === i,
      ),
    [circlesQ],
  );
  const tone = createTone(f.kind ?? 'Listing');
  const mods = buildModules({ f, set, tone, categories, openMod: setOpenMod, toast });
  const missing = missingOf(f);
  const canPost = canPostOf(f);
  const openMods = mods.filter((m) => !m.done && !m.optional).map((m) => m.title);
  const done = mods.filter((m) => m.done || m.optional).length;
  const card = draftCardProps(f, me, circles, () => toast('This is your preview — post it to make it real'));
  const receive = f.kind === 'Pool' ? f.minPledge : f.kind === 'Request' ? 0 : f.price;
  const name = f.title.trim() || 'Your WeO';

  // CRE-04: preflight is always pressable; if a required field is empty the empty fields shake and turn red
  useEffect(() => {
    if (!nudge) return;
    const t = requestAnimationFrame(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('.weo-req-miss'));
      els.forEach((el) => {
        el.classList.remove('weo-shake');
        void el.offsetWidth;
        el.classList.add('weo-shake');
      });
      if (els[0] && els[0].getBoundingClientRect().top < 80)
        els[0].scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(t);
  }, [nudge]);
  const needTitle = f.title.trim().length <= 2;
  const reqMiss = (key: string) =>
    showReq &&
    ((key === 'cat' && !f.catId) ||
      (key === 'title' && needTitle) ||
      (key === 'desc' && !f.desc.trim()) ||
      (key === 'media' && f.kind !== 'Request' && !f.media) ||
      ((key === 'price' || key === 'goal') && missing.includes('a figure')));
  const goPreflight = () => {
    if (!canPost) {
      setShowReq(true);
      setNudge((n) => n + 1);
      if (!f.catId) setOpenMod('cat');
      else if (f.kind !== 'Request' && !f.media) setOpenMod('media');
      toast(`Still needed: ${missing.join(', ')}`);
      return;
    }
    setStep(3);
    top();
  };

  const soonGuard = (k: string) => {
    if (!CREATE_SOON.has(k as CreateKind)) return false;
    toast(`${k} is coming soon — not yet open to create`);
    return true;
  };
  const pick = (k: string) => {
    if (soonGuard(k) || !isLive(k)) return;
    setF(pickForm(k));
    setOpenMod('cat');
    setStep(2);
    top();
  };
  const applyTemplate = (tp: TemplateDto) => {
    if (soonGuard(tp.format)) return;
    const next = templateForm(tp, f);
    if (!next) return;
    setF(next);
    if (step === 1) {
      setStep(2);
      setOpenMod(tp.os ? 'price' : 'cat');
      top();
    }
    toast(`${tp.name} · filled in, yours to change — preflight is one press away`);
  };
  const locked = (tp: TemplateDto) => toast(lockedLine(tp));
  const backToHero = () => {
    setStep(1);
    top();
  };

  const tryPost = () => {
    if (!canPost) return goPreflight();
    if (f.kind === 'Request' || editId) {
      void pub
        .publish(f, null, null)
        .then((res) => {
          if (editId) {
            toast(`${name} · saved`);
            void navigate(routes.weo(res?._id || editId));
            return;
          }
          setPosted({ id: res._id });
          setMoment({ verb: 'Asked', dest: 'The asks board', destTone: '#3A95F2' });
        })
        .catch(() => {});
      return;
    }
    setSheet(true);
  };

  const postCircles: PostCircle[] = useMemo(() => {
    const mine = (circlesQ?.joined ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      img: c.coverImage || null,
      joined: true,
    }));
    const sug = circlesFor(f, circles)
      .filter((c) => !mine.some((m) => m.id === c.id))
      .map((c) => ({ id: c.id, name: c.name, img: c.coverImage || null, joined: c.isJoined }));
    return [...mine, ...sug].slice(0, 6);
  }, [circlesQ, circles, f]);
  const openAsks: PostAsk[] = (asksQ?.requestOffers ?? [])
    .filter(
      (r) =>
        (r.status ?? 'active') === 'active' &&
        (!r.deadline || Date.parse(r.deadline) > now) &&
        !r.mine &&
        r.userId !== me?.id &&
        r._id !== forRequest?.id,
    )
    .map((r) => ({
      id: r._id,
      title: sentence(r.title),
      who: r.by?.name || r.creator?.name || 'Someone',
      avatar: r.by?.avatarUrl ?? r.creator?.profileImage ?? null,
      budget: r.price?.max ?? r.price?.min ?? 0,
      closes: daysLeft(r.deadline, now),
    }));
  const postAsks: PostAsk[] = (forRequest ? [forRequest, ...openAsks] : openAsks).slice(0, 4);
  const onSheetPost = async (_d: PostDest, circleId: string | null, askId: string | null) => {
    const res = await pub.publish(f, circleId, askId);
    setPosted({ id: res._id });
  };
  const onSheetDone = (d: PostDest, circleId: string | null, askId: string | null) => {
    setSheet(false);
    if (d === 'circle' && circleId) void navigate(routes.circle(circleId));
    else if (d === 'direct') void navigate(routes.requests(askId ?? undefined));
    else void navigate(routes.listed());
    toast(d === 'direct' ? `${name} sent` : `${name} is live`);
  };

  const another = () => {
    if (draftId || editId) return void navigate(routes.create());
    setPosted(null);
    setF(EMPTY_FORM);
    setShowReq(false);
    setStep(1);
    top();
  };
  const pathItems = [
    { label: 'WeOverse', onClick: () => void navigate(routes.discover()) },
    { label: 'Create', onClick: step > 1 || posted ? (posted ? another : backToHero) : undefined },
    ...(posted
      ? [{ label: 'Posted' }]
      : step > 1
        ? [{ label: labelOf(f.kind), onClick: step > 2 ? () => setStep(2) : undefined }]
        : []),
    ...(!posted && step > 2 ? [{ label: 'Preflight' }] : []),
  ];

  return (
    <div style={page}>
      {moment && (
        <SuccessMoment
          tone={tone}
          verb={moment.verb}
          name={name}
          img={f.media}
          dest={moment.dest}
          destTone={moment.destTone}
          onDone={() => setMoment(null)}
        />
      )}
      <PathBar onHub={() => void navigate(routes.hub())} items={pathItems} />

      {posted && !sheet ? (
        <Posted
          name={name}
          img={f.media}
          tone={tone}
          request={f.kind === 'Request'}
          line={
            f.kind === 'Request'
              ? 'Your ask is on the board — makers answer it with a WeO, and you choose.'
              : circleLine(f, circles)
          }
          onExchange={() => void navigate(routes.listed())}
          onAsks={() => void navigate(routes.requests())}
          onAnother={another}
          onPush={() =>
            openPush({
              id: posted.id,
              name,
              img: f.media,
              type: f.kind ?? 'Listing',
              category: f.cat,
              hex: tone,
              creatorId: me?.id ?? '',
              circleIds: [],
            })
          }
        />
      ) : (
        <>
          {step === 1 && (
            <CreateHero
              dark={dark}
              drafts={drafts}
              templates={templates}
              asks={asksQ?.total ?? 0}
              onPick={(t) => pick(t.key)}
              onBlank={() => pick('Listing')}
              onDraft={(d: DraftDto) => void navigate(routes.create(d._id))}
              onTemplate={applyTemplate}
              onLocked={locked}
              onAllTemplates={() => setTplBig(true)}
              onEdge={(e) =>
                void navigate(
                  e.key === 'collect'
                    ? routes.collected()
                    : e.key === 'discover'
                      ? routes.discover()
                      : routes.listed(),
                )
              }
              onAsks={() => void navigate(routes.requests())}
              onTrack={() => void navigate(routes.listed())}
              toast={toast}
            />
          )}
          {step === 2 && (
            <Composer
              f={f}
              set={set}
              tone={tone}
              mods={mods}
              openMod={openMod}
              setOpenMod={setOpenMod}
              reqMiss={reqMiss}
              missing={missing}
              canPost={canPost}
              card={card}
              priceLabel={priceLabelOf(f.kind)}
              templates={templates}
              onTemplate={applyTemplate}
              onLocked={locked}
              onBrowseTemplates={() => setTplBig(true)}
              onPreflight={goPreflight}
            />
          )}
          {step === 3 && (
            <Preflight
              f={f}
              mods={mods}
              card={card}
              toneName={toneNameOf(f.kind)}
              busy={pub.busy}
              editing={!!editId}
              onBack={() => setStep(2)}
              onPost={tryPost}
            />
          )}
        </>
      )}

      {!posted && step === 2 && (
        <FlowBar
          screen="create"
          tone={tone}
          step={2}
          of={3}
          back={{ label: 'Formats', go: backToHero }}
          label={canPost ? `${name} is ready for preflight` : `Still needed: ${missing.join(', ')}`}
          note={
            canPost
              ? openMods.length
                ? `${openMods.length} still open: ${openMods.join(' · ')}`
                : receive > 0
                  ? `You receive O ${osFmt(receive)} per collect · nothing taken at settlement`
                  : 'Ready to review'
              : `${done} of ${mods.length} modules set — a name, a line, a category and a figure open preflight`
          }
          primary={{ label: 'Preflight', act: goPreflight }}
        />
      )}
      {!posted && !sheet && step === 3 && (
        <FlowBar
          screen="create"
          tone={tone}
          step={3}
          of={3}
          back={{ label: 'Composer', go: () => (setStep(2), top()) }}
          label={`${name} · preflight`}
          note={
            receive > 0
              ? `You receive O ${osFmt(receive)} per collect · nothing taken at settlement`
              : f.kind === 'Request'
                ? 'Free to ask'
                : 'Free to collect'
          }
          primary={{ label: editId ? 'Save it' : 'Post it', act: tryPost }}
        />
      )}
      {!posted && step === 1 && (
        <FlowFoot
          screen="create"
          back={{ label: 'Community', go: () => void navigate(routes.hub()) }}
          next={{
            label: 'Templates',
            lead: 'Start from one that works',
            go: () => setTplBig(true),
            tone: '#22C55E',
          }}
        />
      )}
      {tplBig && (
        <TemplateSheet
          templates={templates}
          onClose={() => setTplBig(false)}
          onPick={applyTemplate}
          onLocked={locked}
        />
      )}
      {sheet && (
        <PostSheet
          it={{ name, img: f.media, os: receive }}
          tone={tone}
          circles={postCircles}
          asks={postAsks}
          direct={f.kind === 'Listing' || f.kind === 'Bid'}
          initial={forRequest && (f.kind === 'Listing' || f.kind === 'Bid') ? 'direct' : undefined}
          onPost={onSheetPost}
          onDone={onSheetDone}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
}
