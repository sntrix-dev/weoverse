// design: create.jsx CreateScreen `posted` — the O lands, it is named live, and the ways on from here
import { PortalStage } from '@/components/flow/FlowParts';
import { Scene } from '@/components/layout/Scene';
import { Button, Orb } from '@/design-system';

export function Posted({
  name,
  img,
  tone,
  line,
  request,
  onPush,
  onExchange,
  onAsks,
  onAnother,
}: {
  name: string;
  img: string | null;
  tone: string;
  line: string;
  request: boolean;
  onPush?: () => void;
  onExchange: () => void;
  onAsks: () => void;
  onAnother: () => void;
}) {
  return (
    <Scene style={{ display: 'grid', placeItems: 'center', marginTop: 40 }}>
      <PortalStage size={220} stage="posted">
        <Orb size={128} fill={img ? 'image' : tone} src={img} ring ringColor={tone} matcap breathe />
      </PortalStage>
      <h1
        style={{
          margin: '26px 0 0',
          fontSize: 'clamp(24px,3vw,34px)',
          fontWeight: 700,
          letterSpacing: '-.032em',
          color: 'var(--text)',
          textAlign: 'center',
        }}
      >
        {name} is live
      </h1>
      <p
        style={{
          margin: '10px 0 0',
          maxWidth: '48ch',
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--text-dim)',
        }}
      >
        {line}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24, justifyContent: 'center' }}>
        {!request && onPush && (
          <Button variant="primary" tone="violet" onClick={onPush}>
            Push to a Circle
          </Button>
        )}
        {request ? (
          <Button variant="ghost" tone="blue" onClick={onAsks}>
            See the asks
          </Button>
        ) : (
          <Button variant="ghost" tone="gold" onClick={onExchange}>
            See it in Exchange
          </Button>
        )}
        <Button variant="ghost" tone="blue" onClick={onAnother}>
          Create another
        </Button>
      </div>
    </Scene>
  );
}
