import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { Scene } from '@/components/layout/Scene';
import { SectionMark } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { useHubPath } from '@/components/shell/useHubPath';
import { Badge, Button, Card, Chip, EmptyState, OMark, Orb } from '@/design-system';
import { toast } from '@/stores/ui';
import { useMarkAllRead, useMarkRead, useNotifications, type NotificationRowDto } from '../api/notifications';
import { atLabel, byDay, NOTIF_CATS, pictureOf, routeOf, TONE_STATUS, toneOf } from '../model/notifications';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

/** design: notifications.jsx NotificationsScreen */
export function NotificationsPage() {
  const navigate = useNavigate();
  const path = useHubPath([{ label: 'Notifications' }]);
  const [cat, setCat] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const q = useNotifications(cat, unreadOnly);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const first = q.data?.pages[0];
  const cats = first?.categories;
  const list = useMemo(() => (q.data?.pages ?? []).flatMap((p) => p.notifications), [q.data]);
  const days = useMemo(() => byDay(list), [list]);
  const unreadCount = cats ? Object.values(cats).reduce((a, c) => a + c.unread, 0) : 0;
  const totalCount = cats ? Object.values(cats).reduce((a, c) => a + c.total, 0) : 0;
  const isUnread = (n: NotificationRowDto) => !n.read;

  const open = (n: NotificationRowDto) => {
    if (!n.read) markRead.mutate(String(n._id));
    const to = routeOf(n.target);
    if (to) void navigate(to);
  };

  const chips = NOTIF_CATS.filter((c) => !c.optional || (cats?.[c.k]?.total ?? 0) > 0);

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <Scene lead style={{ display: 'block' }}>
        <SectionMark
          icon={
            <>
              <path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5" />
              <path d="M10.3 19.5a2 2 0 0 0 3.4 0" />
            </>
          }
          label="Notifications"
          tone="var(--o-violet)"
          rule={false}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14, marginTop: 10 }}>
          <h1
            style={{
              margin: 0,
              flex: '1 1 320px',
              fontSize: 'clamp(24px,3.2vw,34px)',
              fontWeight: 700,
              letterSpacing: '-.035em',
              color: 'var(--text)',
            }}
          >
            {!first ? 'Notifications' : unreadCount ? `${unreadCount} waiting on you` : 'Nothing waiting'}
          </h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant={unreadOnly ? 'primary' : 'ghost'}
              tone="violet"
              aria-pressed={unreadOnly}
              onClick={() => setUnreadOnly((u) => !u)}
            >
              Unread only
            </Button>
            <Button
              size="sm"
              variant="ghost"
              tone="blue"
              disabled={!unreadCount || markAll.isPending}
              onClick={() =>
                markAll.mutate(undefined, { onError: () => toast('That did not go through — try again') })
              }
            >
              Mark all read
            </Button>
            <Button
              size="sm"
              variant="ghost"
              tone="green"
              onClick={() => void navigate(routes.settings('notifications'))}
            >
              Settings
            </Button>
          </div>
        </div>
        <div
          className="weo-scroll-hide"
          role="group"
          aria-label="Categories"
          style={{ display: 'flex', gap: 7, marginTop: 18, overflowX: 'auto', padding: '2px 2px 6px' }}
        >
          {chips.map((c) => {
            const n = c.k === 'all' ? totalCount : (cats?.[c.k]?.total ?? 0);
            return (
              <Chip
                key={c.k}
                role="button"
                tabIndex={0}
                aria-pressed={cat === c.k}
                selected={cat === c.k}
                tone="var(--o-violet)"
                onClick={() => setCat(c.k)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCat(c.k);
                  }
                }}
                style={{ flex: '0 0 auto', cursor: 'pointer' }}
              >
                {c.label} <span style={{ opacity: 0.65, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
              </Chip>
            );
          })}
        </div>
      </Scene>

      <Scene style={{ display: 'block', marginTop: 34 }}>
        {q.isPending && (
          <p style={{ margin: '40px 0', textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
            Opening your notifications…
          </p>
        )}
        {q.isError && (
          <p style={{ margin: '40px 0', textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
            Your notifications did not load — try again in a moment.
          </p>
        )}
        {q.isSuccess && list.length === 0 && (
          <EmptyState
            title="Nothing under this lens"
            description="Try another category, or turn off unread only."
            action={
              <Button
                size="sm"
                variant="ghost"
                tone="violet"
                onClick={() => {
                  setCat('all');
                  setUnreadOnly(false);
                }}
              >
                Show everything
              </Button>
            }
          />
        )}
        {days.map(([day, rows]) => (
          <section key={day} aria-label={day} style={{ marginBottom: 26 }}>
            <span
              style={{
                display: 'block',
                marginBottom: 10,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              {day}
            </span>
            <Card
              elevation="raised"
              radius={26}
              padding={0}
              style={{ display: 'grid', gap: 1, overflow: 'hidden', background: 'var(--border)' }}
            >
              {rows.map((n, i) => {
                const tone = TONE_STATUS[toneOf(n)];
                const img = pictureOf(n);
                const unread = isUnread(n);
                return (
                  <button
                    type="button"
                    key={String(n._id)}
                    onClick={() => open(n)}
                    aria-label={`${unread ? 'Unread: ' : ''}${n.title}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: 'left',
                      border: 'none',
                      padding: '15px 18px',
                      cursor: 'pointer',
                      font: 'inherit',
                      background: unread
                        ? 'color-mix(in srgb, var(--o-violet) 4%, var(--surface))'
                        : 'var(--surface)',
                      animation: `weo-cardin .42s var(--ease-settle) ${Math.min(i, 12) * 0.05}s both`,
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        alignSelf: 'stretch',
                        borderRadius: 999,
                        flex: '0 0 auto',
                        background: tone,
                      }}
                    />
                    {img ? (
                      <Orb
                        size={44}
                        fill="image"
                        src={img}
                        ring
                        ringColor={tone}
                        matcap
                        style={{ flex: '0 0 auto' }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          flex: '0 0 auto',
                          color: tone,
                          background: 'var(--surface-2)',
                        }}
                      >
                        <OMark size={16} />
                      </span>
                    )}
                    <span style={{ flex: '1 1 240px', minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: unread ? 700 : 600,
                          color: 'var(--text)',
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          marginTop: 3,
                          fontSize: 12.5,
                          lineHeight: 1.45,
                          color: 'var(--text-dim)',
                        }}
                      >
                        {n.message}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-faint)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {atLabel(n.createdAt)}
                      </span>
                      {unread && <Badge variant="dot" tone="var(--o-violet)" />}
                    </span>
                  </button>
                );
              })}
            </Card>
          </section>
        ))}
        {q.hasNextPage && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              size="sm"
              variant="ghost"
              tone="violet"
              disabled={q.isFetchingNextPage}
              onClick={() => void q.fetchNextPage()}
            >
              {q.isFetchingNextPage ? 'Loading…' : 'Show earlier'}
            </Button>
          </div>
        )}
      </Scene>
    </main>
  );
}

export default NotificationsPage;
