import { FORMATS, formatHex, type WeoFormat } from '@/lib/cardModel';
import { formatOfKind } from '@/lib/circleModel';
import type {
  AnswerDto,
  AuthorDto,
  ContributorDto,
  DraftDto,
  MyWeoDto,
  ReplyDto,
  StoryDto,
  ThreadDetailDto,
  ThreadDto,
} from '../api/community';

/** design `HUB.person(id)` — who wrote something. */
export interface Person {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  isr: number;
}

const isrOf = (n: number | null | undefined) => Math.max(0, Math.min(100, Math.round(n ?? 0)));

export function person(a: AuthorDto | null | undefined, fallbackId = ''): Person {
  const name = a?.fullName?.trim() || a?.creatorName?.trim() || 'A member';
  return {
    id: a?.id ?? fallbackId,
    name,
    handle: a?.creatorName ? `@${a.creatorName}` : name,
    avatar: a?.profileImage || null,
    isr: isrOf(a?.isr),
  };
}

/** design `HUB.THREADS` row. */
export interface ThreadModel {
  id: string;
  circleId: string;
  circleName: string | null;
  author: Person;
  title: string;
  snippet: string;
  tags: string[];
  resolved: boolean;
  /** answers and their replies — the design's one "replies" figure */
  replies: number;
  reactions: number;
  views: number;
  votes: number;
  weoId: string | null;
  /** the attached WeO's face, when the read carries it (the feed) */
  weo: { name: string; img: string | null } | null;
  pinned: boolean;
  /** an answer was accepted — the design's "Top answer" */
  pick: boolean;
  createdAt: string | null;
}

export const threadModel = (t: ThreadDto): ThreadModel => ({
  id: t.id,
  circleId: t.circleId,
  circleName: t.circleName ?? null,
  author: person(t.author, t.authorId),
  title: t.title,
  snippet: t.snippet,
  tags: t.tags,
  resolved: t.status === 'resolved',
  replies: t.answerCount + t.replyCount,
  reactions: t.reactionCount,
  views: t.viewCount,
  votes: t.voteScore,
  weoId: t.attachedWeoId,
  weo: t.attachedWeoFace ? { name: t.attachedWeoFace.title, img: t.attachedWeoFace.cover } : null,
  pinned: t.isPinned,
  pick: !!t.acceptedAnswerId,
  createdAt: t.createdAt,
});

export interface ReplyModel {
  id: string;
  author: Person;
  mine: boolean;
  body: string;
  mention: string | null;
  createdAt: string | null;
}

export interface AnswerModel {
  id: string;
  author: Person;
  mine: boolean;
  body: string;
  score: number;
  vote: -1 | 0 | 1;
  accepted: boolean;
  replies: ReplyModel[];
  createdAt: string | null;
}

const replyModel = (r: ReplyDto, me: string | undefined): ReplyModel => ({
  id: r.id,
  author: person(r.author, r.authorId),
  mine: !!me && r.authorId === me,
  body: r.body,
  mention: r.mention,
  createdAt: r.createdAt,
});

export const answerModel = (a: AnswerDto, me: string | undefined): AnswerModel => ({
  id: a.id,
  author: person(a.author, a.authorId),
  mine: !!me && a.authorId === me,
  body: a.body,
  score: a.voteScore,
  vote: a.userVote,
  accepted: a.isAccepted,
  replies: a.replies.map((r) => replyModel(r, me)),
  createdAt: a.createdAt,
});

export interface ThreadDetailModel extends ThreadModel {
  body: string;
  /** design: answers sorted by score, best first */
  answers: AnswerModel[];
  mine: boolean;
}

export function threadDetail(t: ThreadDetailDto, me: string | undefined): ThreadDetailModel {
  return {
    ...threadModel(t),
    author: person(t.author, t.authorId),
    body: t.body,
    answers: t.answers.map((a) => answerModel(a, me)).sort((x, y) => y.score - x.score),
    mine: !!me && t.authorId === me,
  };
}

/** design `HUB.STORIES` row. */
export interface StoryModel {
  id: string;
  title: string;
  img: string | null;
  type: WeoFormat;
  tone: string;
  author: string;
  duration: string;
  blurb: string;
  collectors: number;
  status: string;
  threadId: string | null;
  weoId: string;
}

export function storyModel(s: StoryDto): StoryModel {
  const type = formatOfKind(s.type) ?? 'Listing';
  return {
    id: s.id,
    title: s.title,
    img: s.cover || null,
    type,
    tone: formatHex(type),
    author: s.authorName,
    duration: s.duration,
    blurb: s.blurb,
    collectors: s.backerCount,
    status: s.fundedStatus,
    threadId: s.threadId,
    weoId: s.weoId,
  };
}

/** design `HUB.PEOPLE` steward row — here, a top contributor (D-036). */
export interface StewardModel {
  id: string;
  name: string;
  avatar: string | null;
  isr: number;
  bio: string | null;
  circles: number;
  weos: number;
  answers: number;
  /** 0..1 */
  accept: number;
  /** what they make most: Pool, Hunt or a listing's category */
  focus: string | null;
  following: boolean;
  you: boolean;
}

export const stewardModel = (c: ContributorDto): StewardModel => ({
  id: c.userId,
  name: c.fullName?.trim() || c.creatorName?.trim() || 'A member',
  avatar: c.profileImage || null,
  isr: isrOf(c.isr),
  bio: c.bio,
  circles: c.circleCount,
  weos: c.weoCount,
  answers: c.answersWritten,
  accept: c.acceptedRate ?? 0,
  focus: c.focus,
  following: c.isFollowing,
  you: c.isYou,
});

/**
 * design `V3` item — a WeO of yours on its way. A draft carries its stage on the way to live
 * (`vetting`, M11): draft → rehearsed → reacting (12) → reacted → pledging (20) → live; a WeO on
 * the floor is live.
 */
export interface FlightItem {
  id: string;
  name: string;
  img: string | null;
  format: WeoFormat;
  stage: 'draft' | 'rehearsed' | 'reacting' | 'reacted' | 'pledging' | 'live';
  /** the draft's id, or the WeO's */
  ref: string;
  /** a draft (its id is `ref`) rather than a WeO */
  isDraft: boolean;
  /** a Request draft — a buy: it posts, it is not vetted */
  buy: boolean;
  reactions: number;
  pledges: number;
  promisedOs: number;
  /** the world it was rehearsed in */
  world: string | null;
  /** who it opens to (the Share step) */
  audience: string | null;
  /** the rehearsed price, when there is one */
  os: number | null;
  /** live, and posted itself after twenty pledges — the validated mark (M12) */
  validated: boolean;
}

const VET_STAGES = new Set(['rehearsed', 'reacting', 'reacted', 'pledging']);

export function flightItems(drafts: DraftDto[], mine: MyWeoDto[]): FlightItem[] {
  const d: FlightItem[] = drafts.map((x) => {
    const v = x.vetting ?? null;
    const raw = v?.stage === 'posting' ? 'pledging' : (v?.stage ?? 'draft');
    const stage = (VET_STAGES.has(raw) ? raw : 'draft') as FlightItem['stage'];
    const r = (v?.rehearsal ?? null) as { world?: { name?: string }; terms?: { price?: number } } | null;
    return {
      id: `draft:${x._id}`,
      name: x.title?.trim() || 'Untitled WeO',
      img: x.coverUrl || null,
      format: (FORMATS as readonly string[]).includes(x.format ?? '')
        ? (x.format as WeoFormat)
        : (formatOfKind(x.weoType) ?? 'Listing'),
      stage,
      ref: x._id,
      isDraft: true,
      buy: x.format === 'Request',
      reactions: v?.reactions ?? 0,
      pledges: v?.pledges ?? 0,
      promisedOs: v?.promisedOs ?? 0,
      world: r?.world?.name ?? null,
      audience: v?.audience?.label ?? null,
      os: typeof r?.terms?.price === 'number' ? r.terms.price : null,
      validated: false,
    };
  });
  const live: FlightItem[] = mine
    .filter((w) => w.status === 'active')
    .map((w) => ({
      id: w.id,
      name: w.title,
      img: w.cover || null,
      format: formatOfKind(w.weoType) ?? 'Listing',
      stage: 'live',
      ref: w.id,
      isDraft: false,
      buy: false,
      reactions: 0,
      pledges: 0,
      promisedOs: 0,
      world: null,
      audience: null,
      os: null,
      validated: w.validated === true,
    }));
  return [...d, ...live];
}

// design: community.jsx ReportModal reasons → backend reportType (D-041)
export const REPORT_REASONS = [
  { label: 'Spam or scam', type: 'spam' },
  { label: 'Harassment or hate', type: 'harassment' },
  { label: 'Off-topic or misleading', type: 'misleading' },
  { label: 'Something else', type: 'other' },
] as const;
