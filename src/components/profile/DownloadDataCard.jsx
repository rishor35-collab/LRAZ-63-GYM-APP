import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/fitness';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { downloadPersonalData } from '@/lib/personalDataDownload';

export default function DownloadDataCard() {
  const { user } = useAuth();
  const busy = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const download = async (format) => {
    if (busy.current) return;
    busy.current = true; setExporting(true); setError('');
    try { await downloadPersonalData(user, format, setStatus); setStatus('Your download is ready. Keep this file somewhere private.'); }
    catch (failure) { setError(failure.message || 'The download could not be prepared. Please try again.'); setStatus(''); }
    finally { busy.current = false; setExporting(false); }
  };
  return (
    <Card className="mb-4" id="download-data">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Download size={16} className="text-primary" /> Download your data</h2>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">Download your profile and personal fitness records, including all history, habits, saved meals, and favorites. Photo details are included; private photo files are not.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={exporting || !user} onClick={() => download('json')}>
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {exporting ? 'Preparing…' : 'Download data (JSON)'}
        </Button>
        <Button variant="outline" disabled={exporting || !user} onClick={() => download('csv')}><Download size={16} /> Download data (CSV)</Button>
      </div>
      {status && <p role="status" aria-live="polite" className="mt-3 text-xs text-muted-foreground">{status}</p>}
      {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
    </Card>
  );
}