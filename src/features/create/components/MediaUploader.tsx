// design: create.jsx MediaUploader — slot 1 is the cover (an image); slots 2 and 3 an image or one video.
// The design keeps files in the browser; here each one uploads (`POST /frontend/media`) and the
// slot holds the URL the WeO will carry.
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/client';
import { Spinner, svg } from '@/design-system';
import { uploadMedia } from '../api/create';
import {
  MEDIA_MAX,
  mediaRefusal,
  placeMedia,
  removeMedia,
  type ComposerForm,
  type MediaItem,
  type MediaKind,
} from '../model/composer';

const kindOf = (file: File): MediaKind | null =>
  file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : null;

export function MediaUploader({
  tone,
  f,
  optional,
  onChange,
  toast,
}: {
  tone: string;
  f: ComposerForm;
  optional?: boolean;
  onChange: (patch: Pick<ComposerForm, 'media' | 'gallery'>) => void;
  toast: (msg: string) => void;
}) {
  const hasVideo = f.gallery.some((g) => g.kind === 'video');
  const inputs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [over, setOver] = useState(-1);
  /** the slot uploading now, with a local preview until the URL lands */
  const [busy, setBusy] = useState<{ i: number; preview: string; kind: MediaKind } | null>(null);
  useEffect(
    () => () => {
      if (busy) URL.revokeObjectURL(busy.preview);
    },
    [busy],
  );

  const slots: (MediaItem | null)[] = [
    f.media ? { kind: 'image', src: f.media } : null,
    f.gallery[0] ?? null,
    f.gallery[1] ?? null,
  ];
  const accepts = (i: number) =>
    i === 0 ? 'image/*' : hasVideo && slots[i]?.kind !== 'video' ? 'image/*' : 'image/*,video/*';

  const put = async (i: number, file: File | undefined | null) => {
    if (!file || busy) return;
    const kind = kindOf(file);
    const no = mediaRefusal(f, i, kind, file.size);
    if (no || !kind) return toast(no ?? 'That file is not an image or a video');
    setBusy({ i, preview: URL.createObjectURL(file), kind });
    try {
      const up = await uploadMedia(file);
      onChange(placeMedia(f, i, { kind: up.type, src: up.url, name: file.name }));
    } catch (e) {
      toast(
        e instanceof ApiError && e.status < 500
          ? e.message
          : 'Uploads aren’t working on our side right now — your draft is kept, try again later.',
      );
    } finally {
      setBusy(null);
    }
  };

  // a slot opens only once the one before it is filled — the cover always comes first
  const openAt = f.media ? 1 + f.gallery.length : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
        {slots.map((it0, i) => {
          const up = busy?.i === i ? busy : null;
          const it = up ? { kind: up.kind, src: up.preview } : it0;
          const live = (!!it || i === openAt) && !busy;
          const label =
            i === 0
              ? 'Cover'
              : it
                ? it.kind === 'video'
                  ? 'Video'
                  : 'Image'
                : hasVideo
                  ? 'Image'
                  : 'Image/video';
          const open = () => {
            if (live) inputs[i]!.current?.click();
          };
          return (
            <div
              key={i}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 0 }}
            >
              <div
                role="button"
                tabIndex={live ? 0 : -1}
                aria-label={it ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
                aria-disabled={!live}
                onClick={open}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                  }
                }}
                onDragOver={(e) => {
                  if (!live) return;
                  e.preventDefault();
                  setOver(i);
                }}
                onDragLeave={() => setOver(-1)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(-1);
                  if (live) void put(i, e.dataTransfer.files?.[0]);
                }}
                title={
                  it
                    ? `${(it0 as MediaItem | null)?.name ?? label} · click to replace`
                    : live
                      ? `Upload ${label.toLowerCase()} — or drop it here`
                      : 'Add the one before first'
                }
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: live ? 'pointer' : 'default',
                  display: 'grid',
                  placeItems: 'center',
                  background: it
                    ? 'var(--surface-2)'
                    : over === i
                      ? `color-mix(in srgb, ${tone} 12%, var(--surface))`
                      : 'var(--surface)',
                  boxShadow: it ? (i === 0 ? `0 0 0 2px ${tone}` : 'var(--nm-sm)') : 'none',
                  outline: it
                    ? 'none'
                    : `1.5px dashed ${live ? `color-mix(in srgb, ${tone} 60%, var(--border))` : 'var(--border)'}`,
                  outlineOffset: -1.5,
                  opacity: live || it || up ? 1 : 0.45,
                  transition: 'background .2s, opacity .2s',
                }}
              >
                {it?.kind === 'image' && (
                  <img src={it.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {it?.kind === 'video' && (
                  <video
                    src={it.src}
                    muted
                    loop
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {it?.kind === 'video' && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 5,
                      bottom: 5,
                      display: 'grid',
                      placeItems: 'center',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,.55)',
                      color: '#fff',
                    }}
                  >
                    {svg(<path d="M9 7l8 5-8 5z" fill="currentColor" />, 9, 'currentColor', 1)}
                  </span>
                )}
                {up && (
                  <span
                    aria-label="Uploading"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'color-mix(in srgb, var(--surface) 55%, transparent)',
                    }}
                  >
                    <Spinner size={30} tone={tone} />
                  </span>
                )}
                {!it && (
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      gap: 2,
                      color: live ? tone : 'var(--text-faint)',
                    }}
                  >
                    {svg(
                      <>
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </>,
                      18,
                      'currentColor',
                      2,
                    )}
                  </span>
                )}
                {it && !up && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(removeMedia(f, i));
                    }}
                    aria-label={`Remove ${i === 0 ? 'cover' : `media ${i + 1}`}`}
                    title="Remove"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      display: 'grid',
                      placeItems: 'center',
                      width: 20,
                      height: 20,
                      padding: 0,
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      color: '#fff',
                      background: 'rgba(0,0,0,.55)',
                    }}
                  >
                    {svg(
                      <>
                        <path d="M7 7l10 10" />
                        <path d="M17 7L7 17" />
                      </>,
                      10,
                      'currentColor',
                      2.4,
                    )}
                  </button>
                )}
                <input
                  ref={inputs[i]}
                  type="file"
                  accept={accepts(i)}
                  hidden
                  data-testid={`media-input-${i}`}
                  onChange={(e) => {
                    void put(i, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.02em',
                  color: i === 0 ? tone : 'var(--text-faint)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <span style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--text-faint)' }}>
        {optional ? 'Optional for a request — add a picture of what you’re after if it helps. ' : ''}Up to{' '}
        {MEDIA_MAX}. The first is an image and becomes the cover; the other two can be images or one video.
      </span>
    </div>
  );
}
