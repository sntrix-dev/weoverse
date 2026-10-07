import { describe, expect, it } from 'vitest';
import { liveWeos } from '@/test/fixtures/discover';
import { categoriesFixture, templatesFixture } from '@/test/fixtures/create';
import {
  EMPTY_FORM,
  buildPayload,
  draftBody,
  formFromDraft,
  mediaRefusal,
  missingOf,
  pickForm,
  placeMedia,
  readiness,
  removeMedia,
  templateForm,
  type ComposerForm,
} from '../model/composer';
import { formFromWeo } from '../model/edit';

const NOW = Date.UTC(2026, 9, 3);
const CAT = categoriesFixture[0]!;
const listing: ComposerForm = {
  ...pickForm('Listing'),
  title: 'Signed print',
  desc: 'One of sixty',
  catId: CAT._id,
  cat: CAT.name,
  media: 'https://cdn.test/a.jpg',
  gallery: [{ kind: 'video', src: 'https://cdn.test/b.mp4' }],
  tags: ['editions'],
  price: 4950,
  qty: 1,
  circ: 60,
  days: 14,
};

describe('composer payload (D-051)', () => {
  it('a Listing posts dollars: the Os ask divided by the backend peg', () => {
    const { endpoint, body } = buildPayload(listing, { usdAgainstO: 99, now: NOW });
    expect(endpoint).toBe('weo');
    expect(body).toMatchObject({
      weoType: 'regular',
      // the creator's choice is stored, so a 60-copy Listing never reads as a Drop
      format: 'Listing',
      title: 'Signed print',
      description: 'One of sixty',
      categoryId: CAT._id,
      price: { amount: 50, priceSplit: 0, negotiableUpTo: 0 },
      quantity: { amount: 1, unitName: 'piece', negotiableUpTo: 0 },
      customerLimit: 60,
      totalWeoInCirculation: 60,
      duration: 14,
      availabilityTill: new Date(NOW + 14 * 86_400_000).toISOString(),
      isResellable: true,
      media: [
        { url: 'https://cdn.test/a.jpg', type: 'image' },
        { url: 'https://cdn.test/b.mp4', type: 'video' },
      ],
    });
  });

  it('a Listing that takes offers carries its floor as a percent', () => {
    const { body } = buildPayload({ ...listing, negotiable: true, negotiateOff: 15 }, { usdAgainstO: 99 });
    expect((body.price as { negotiableUpTo: number }).negotiableUpTo).toBe(15);
  });

  it('a Bid with a reserve holds that floor; without one it takes any offer down to the cap', () => {
    const bid = { ...listing, kind: 'Bid' as const, reserve: true, negotiateOff: 20 };
    expect(
      (buildPayload(bid, { usdAgainstO: 99 }).body.price as { negotiableUpTo: number }).negotiableUpTo,
    ).toBe(20);
    expect(
      (buildPayload({ ...bid, reserve: false }, { usdAgainstO: 99 }).body.price as { negotiableUpTo: number })
        .negotiableUpTo,
    ).toBe(90);
    expect(buildPayload(bid, { usdAgainstO: 99 }).body.format).toBe('Bid');
    // editing a WeO made as a Drop keeps it a Drop
    expect(buildPayload({ ...listing, keepFormat: 'Drop' }, { usdAgainstO: 99 }).body.format).toBe('Drop');
  });

  it('answering an ask carries its id', () => {
    expect(buildPayload(listing, { usdAgainstO: 99, requestedId: 'rq-1' }).body.requestedId).toBe('rq-1');
  });

  it('a Pool posts its goal and pledge in Os with an ISO deadline', () => {
    const pool = { ...listing, kind: 'Pool' as const, goal: 12000, minPledge: 50, days: 21 };
    const { body } = buildPayload(pool, { usdAgainstO: 99, now: NOW });
    expect(body).toMatchObject({
      weoType: 'crowdfund',
      goal: { amount: 12000 },
      contribution: { minimum: 50 },
      deadline: new Date(NOW + 21 * 86_400_000).toISOString(),
      duration: 21,
    });
    expect(body.price).toBeUndefined();
  });

  it('a Request goes to /request-weos with an Os budget and an epoch deadline', () => {
    const req = { ...listing, kind: 'Request' as const, price: 500, priceMax: 1200, days: 7, media: null };
    const { endpoint, body } = buildPayload(req, { usdAgainstO: 99, creatorName: 'surya', now: NOW });
    expect(endpoint).toBe('request');
    expect(body).toEqual({
      title: 'Signed print',
      description: 'One of sixty',
      categoryId: CAT._id,
      categoryName: CAT.name,
      creatorName: 'surya',
      price: { min: 500, max: 1200 },
      deadline: NOW + 7 * 86_400_000,
      tags: ['editions'],
    });
  });
});

describe('what is still needed (D-052, D-053)', () => {
  it('names what is missing, a cover included for anything but a Request', () => {
    expect(missingOf(pickForm('Listing'))).toEqual(['a name', 'a line', 'a category', 'a figure', 'a cover']);
    expect(missingOf(listing)).toEqual([]);
    expect(missingOf({ ...listing, kind: 'Request', media: null, price: 900, priceMax: 400 })).toEqual([
      'a budget that ends above where it starts',
    ]);
    expect(missingOf({ ...listing, kind: 'Pool', price: 0, goal: 0 })).toEqual(['a figure']);
  });

  it('a format pick starts with nothing priced and no media', () => {
    expect(pickForm('Pool')).toMatchObject({ kind: 'Pool', media: null, price: 0, goal: 0, qty: 0 });
    expect(pickForm('Bid')).toMatchObject({ reserve: true, negotiateOff: 20 });
  });

  it('readiness is the share of the five checks a draft records', () => {
    expect(readiness(EMPTY_FORM)).toBe(0);
    expect(readiness(listing)).toBe(1);
  });
});

describe('media rules', () => {
  it('the cover is an image, one video per WeO, and size limits per kind', () => {
    expect(mediaRefusal(listing, 0, 'video', 10)).toBe('The cover has to be an image');
    expect(mediaRefusal(listing, 2, 'video', 10)).toBe('One video per WeO — this one already has it');
    expect(mediaRefusal(listing, 1, 'video', 10)).toBeNull(); // replacing the video itself
    expect(mediaRefusal(listing, 2, 'image', 11 * 1024 * 1024)).toBe('Images up to 10 MB');
    expect(mediaRefusal(listing, 2, null, 1)).toBe('That file is not an image or a video');
  });

  it('removing the cover promotes the next image', () => {
    const f = {
      ...listing,
      gallery: [
        { kind: 'video' as const, src: 'v' },
        { kind: 'image' as const, src: 'i' },
      ],
    };
    expect(removeMedia(f, 0)).toEqual({ media: 'i', gallery: [{ kind: 'video', src: 'v' }] });
    expect(placeMedia(f, 3, { kind: 'image', src: 'n' }).gallery).toHaveLength(3);
  });
});

describe('templates, drafts and edits', () => {
  it('a template fills every module its format asks for', () => {
    const tp = templatesFixture().templates[0]!;
    expect(templateForm(tp, EMPTY_FORM)).toMatchObject({
      kind: 'Listing',
      title: 'Signed edition',
      desc: 'A capped run, each one numbered',
      catId: CAT._id,
      cat: 'Creating',
      media: tp.image,
      price: 4200,
      qty: 60,
      circ: 60,
      days: 14,
      resell: true,
    });
  });

  it('a template for a format that is not live yet fills nothing', () => {
    expect(templateForm(templatesFixture().templates[1]!, EMPTY_FORM)).toBeNull();
  });

  it('a draft round-trips through its payload', () => {
    const body = draftBody({ ...listing, tagDraft: 'half' });
    expect(body).toMatchObject({
      weoType: 'regular',
      format: 'Listing',
      title: 'Signed print',
      coverUrl: listing.media,
      ready: 1,
    });
    expect(formFromDraft({ ...body, format: body.format })).toEqual(listing);
    // an old draft with only the row fields still opens
    expect(formFromDraft({ format: 'Pool', title: 'Fund', coverUrl: 'x' })).toMatchObject({
      kind: 'Pool',
      title: 'Fund',
      media: 'x',
    });
  });

  it('a live WeO reopens with its Os price and category', () => {
    const w = liveWeos()[0]!;
    const f = formFromWeo(w, [{ _id: 'c1', name: w.categoryName }]);
    expect(f.title).toBe(w.title);
    expect(f.catId).toBe('c1');
    expect(f.kind === 'Listing' || f.kind === 'Bid' || f.kind === 'Pool').toBe(true);
  });
});
