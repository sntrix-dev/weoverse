import { useState } from 'react';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Chip,
  CommitReview,
  EmptyState,
  FeeDisclosure,
  FlowReceipt,
  ICO,
  Icon,
  Input,
  ISRRing,
  OButton,
  OMark,
  OPortal,
  OPower,
  Orb,
  PassportIcon,
  PortalJump,
  Progress,
  RingNav,
  O_SECTION_ICONS,
  SICO,
  Skeleton,
  Spinner,
  StatGrid,
  Tabs,
  Toggle,
  Tooltip,
  ValueLadder,
  WeOCard,
  WeODrawnO,
  WeOLettering,
  WeOverseLettering,
} from '@/design-system';
import styles from './DsGalleryPage.module.css';
import { KitGallery } from './KitGallery';

const IMG = '/brand/orb-market.png';

/**
 * `/dev/ds` (dev builds only) — every ported design-system component with sample props,
 * for side-by-side parity checks against the design bundle. Not a product screen.
 */
export function DsGalleryPage() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light');
  const [tab, setTab] = useState('All');
  const [on, setOn] = useState(true);
  const [play, setPlay] = useState(0);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>Design system</h1>
        <Button tone="blue" onClick={toggleTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'} theme
        </Button>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Marks & icons</h2>
        <div className={styles.row}>
          <WeOverseLettering h={36} />
          <WeOLettering h={36} />
          <WeODrawnO h={36} o="#D946EF" />
          <OMark size={28} />
          <OMark size={28} spin />
          <PassportIcon size={28} />
          {Object.entries(ICO).map(([k, g]) => (
            <span key={k} title={k}>
              <Icon>{g}</Icon>
            </span>
          ))}
          {Object.entries(SICO).map(([k, g]) => (
            <span key={k} title={k}>
              <Icon>{g}</Icon>
            </span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Core</h2>
        <div className={styles.row}>
          <Button tone="blue">Primary</Button>
          <Button tone="violet" selected dot>
            Selected
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost" tone="green" size="sm">
            Ghost sm
          </Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <OButton aria-label="Search">
            <Icon>{ICO.search}</Icon>
          </OButton>
          <OButton variant="raised" aria-label="Bell">
            <Icon>{ICO.bell}</Icon>
          </OButton>
          <OButton variant="solid" tone="violet" aria-label="Chat">
            <Icon>{ICO.chat}</Icon>
          </OButton>
          <OButton active tone="gold" aria-label="Ring">
            <Icon>{ICO.ring}</Icon>
          </OButton>
        </div>
        <div className={styles.row} style={{ marginTop: 20 }}>
          <Orb size={96} />
          <Orb size={96} fill="#D946EF" ring ringColor="#D946EF" />
          <Orb size={96} fill="image" src={IMG} matcap />
          <Orb size={96} fill="logo" breathe />
          <Orb size={96} fill="#22C55E" label="+12" />
        </div>
        <div className={styles.portalStage} style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <OPortal size={260} logoVideoSrc="/media/WEO_Logo.webm" />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data</h2>
        <div className={styles.row}>
          <Avatar src={IMG} size={48} />
          <Avatar initials="MK" size={48} />
          <Avatar src={IMG} size={56} isr={86} />
          <AvatarGroup extra={4}>
            <Avatar initials="A" size={34} />
            <Avatar initials="B" size={34} />
            <Avatar initials="C" size={34} />
          </AvatarGroup>
          <Badge>3</Badge>
          <Badge variant="status" tone="#22C55E">
            Live
          </Badge>
          <Badge variant="dot" />
          <Chip>Tag</Chip>
          <Chip selected dot tone="#D946EF">
            Selected
          </Chip>
          <Chip onRemove={() => undefined}>Removable</Chip>
        </div>
        <div className={styles.row} style={{ marginTop: 20 }}>
          <ISRRing value={18} size={96} />
          <ISRRing value={40} size={96} />
          <ISRRing value={70} size={96} />
          <ISRRing value={88} size={96} />
          <ISRRing value={100} size={96} />
        </div>
        <div className={styles.col} style={{ marginTop: 20 }}>
          <StatGrid
            items={[
              { k: 'Ticket', v: 'O 40' },
              { k: 'Left', v: 312 },
              { k: 'Draw in', v: '2d 4h' },
            ]}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Exchange</h2>
        <div className={styles.row} style={{ alignItems: 'flex-start' }}>
          <div className={styles.col}>
            <OPower power={1.4} format="pip" />
            <OPower power={1.4} format="inline" />
            <OPower power={1.4} format="chip" />
            <OPower power={1.4} format="panel" os={1200} note="Across 14 networks that accept Os." />
            <ValueLadder balances={{ available: 12480, protected: 2400, pending: 640, locked: 1200 }} />
          </div>
          <div className={styles.col}>
            <FeeDisclosure
              subtotal={2400}
              fees={[
                {
                  label: 'Flow fee',
                  os: 48,
                  enables: 'Settlement + passport',
                  basis: '2%',
                  to: 'WeO',
                  when: 'On collect',
                },
              ]}
            />
            <CommitReview
              what="Collect Field recordings Vol. 2"
              amountOs={2400}
              power={1.4}
              when="Now"
              to="@mirak"
              next="It lands in Collect with its passport."
              recover="Resell any time; 2% resale."
            />
            <FlowReceipt
              amountOs={2400}
              power={1.4}
              id="WEO-223FEE"
              timestamp="28 Jul 2026 · 12:00"
              lines={[
                { label: 'WeO', value: 'Field recordings Vol. 2' },
                { label: 'Passport', value: 'WEO-4417AC', mono: true },
              ]}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Feedback & forms</h2>
        <div className={styles.col}>
          <Alert status="success">Posted to your circle.</Alert>
          <Alert status="warning">Your draft is missing a price.</Alert>
          <Alert status="error">Couldn’t reach the network.</Alert>
          <Alert status="info">Collect settles in Os.</Alert>
          <div className={styles.row}>
            <Progress value={64} />
            <Progress indeterminate />
            <Spinner />
            <Tooltip label="Hello from the tooltip">
              <Button size="sm">Hover me</Button>
            </Tooltip>
            <Toggle checked={on} onChange={setOn} aria-label="Toggle" />
          </div>
          <Progress value={42} variant="linear" />
          <Skeleton />
          <Skeleton shape="circle" />
          <Skeleton shape="block" />
          <Input label="Title" placeholder="Name your WeO" />
          <Input label="Price" prefix={<OMark />} error="Price is required" />
          <EmptyState
            title="Nothing here yet"
            description="WeOs you collect land here."
            action={<Button>Discover</Button>}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Navigation & motion</h2>
        <div className={styles.col}>
          <Tabs tabs={['All', 'Closing', 'Moving']} value={tab} onChange={setTab} />
          <Button tone="violet" onClick={() => setPlay((p) => p + 1)}>
            Play PortalJump
          </Button>
        </div>
        <PortalJump play={play} color="#D946EF" variant="complete" label="Collected" />
        <div className={styles.portalStage} style={{ marginTop: 20 }}>
          <RingNav
            device="mobile"
            active="discover"
            style={{ position: 'absolute' }}
            items={[
              {
                key: 'discover',
                label: 'Discover',
                color: '#3A95F2',
                icon: <Icon stroke="#fff">{O_SECTION_ICONS.top}</Icon>,
              },
              {
                key: 'collect',
                label: 'Collect',
                color: '#D946EF',
                icon: <Icon stroke="#fff">{O_SECTION_ICONS.right}</Icon>,
              },
              {
                key: 'create',
                label: 'Create',
                color: '#22C55E',
                icon: <Icon stroke="#fff">{O_SECTION_ICONS.bottom}</Icon>,
              },
              {
                key: 'earn',
                label: 'Exchange',
                color: '#F7C62B',
                icon: <Icon stroke="#fff">{O_SECTION_ICONS.left}</Icon>,
              },
            ]}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Surfaces</h2>
        <div className={styles.row} style={{ alignItems: 'flex-start' }}>
          <Card style={{ width: 220 }}>Raised card</Card>
          <Card elevation="flat" style={{ width: 220 }}>
            Flat card
          </Card>
          <Card elevation="inset" style={{ width: 220 }}>
            Inset well
          </Card>
          <Card elevation="glass" style={{ width: 220 }}>
            Glass
          </Card>
        </div>
        <div className={styles.row} style={{ alignItems: 'flex-start', marginTop: 20 }}>
          <WeOCard
            w={272}
            name="Field recordings Vol. 2"
            typeLabel="Listing · Digital arts"
            id="# WEO-4417AC"
            tone="#22C55E"
            src={IMG}
            edition="12 / 50"
            timer="2d 4h"
            creator={{ name: 'Mira Kaya', isr: 86, summary: 'Sound designer.', trades: 12, joined: 'ISR 86' }}
            terms={[
              { k: 'Price', v: 'O 2,400' },
              { k: 'Left', v: 38 },
              { k: 'Resale', v: '2%' },
            ]}
            points={['Lossless WAV pack', 'Commercial licence', 'Passport + provenance']}
            watchers="1.2k"
            likes={340}
            activeNow={14}
            trend="+12%"
            passport={{ label: 'Verified original', resale: '2%' }}
            backFacts={[
              { k: 'Format', v: 'Listing' },
              { k: 'Collectors', v: 12 },
            ]}
          />
          <WeOCard
            w={272}
            name="Collected card"
            tone="#D946EF"
            src={IMG}
            collected
            qrData="WEO-4417AC"
            initialFace="back"
          />
          <WeOCard
            w={240}
            format="orb"
            name="Orb format"
            tone="#3A95F2"
            src={IMG}
            price={{ os: '2,400', fiat: '$24' }}
          />
        </div>
      </section>
      <KitGallery />
    </main>
  );
}
