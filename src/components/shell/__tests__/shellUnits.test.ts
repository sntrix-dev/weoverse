import { shortWeoId } from '../IdSheet';
import { markAt } from '../SearchSuggest';

describe('passport number', () => {
  it('prints an O-Wallet id in the design’s short form', () => {
    expect(shortWeoId('69ef6c505e802880cab5b63a')).toBe('WEO-B5B63A');
  });

  it('leaves any other id as it is', () => {
    expect(shortWeoId('OW-4F82C1')).toBe('OW-4F82C1');
    expect(shortWeoId('')).toBe('');
  });
});

describe('search mark', () => {
  it('marks the typed part where it starts a word, before a match inside one', () => {
    const ask = 'Looking for a ceramicist to throw 40 mugs';
    // no word starts with "st": the first match anywhere
    expect(markAt(ask, 'st')).toBe(ask.indexOf('st'));
    expect(markAt('Studio Gear Hunt', 'st')).toBe(0);
    expect(markAt('See the Crowds', 'cro')).toBe(8);
    expect(markAt('Microphone crowd', 'cro')).toBe(11);
    expect(markAt('anything', '  ')).toBe(-1);
  });
});
