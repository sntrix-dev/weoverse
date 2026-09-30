import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a QR code locally as a data URL. The design used api.qrserver.com; the
 * passport id must not leave the app, so the image is generated in the browser.
 * Matches the design's 160×160, zero-margin code.
 */
export function useQrDataUrl(data: string | null | undefined): string | null {
  const [made, setMade] = useState<{ data: string; url: string } | null>(null);
  useEffect(() => {
    if (!data) return;
    let live = true;
    QRCode.toDataURL(data, { width: 160, margin: 0 })
      .then((url) => {
        if (live) setMade({ data, url });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [data]);
  return data && made?.data === data ? made.url : null;
}
