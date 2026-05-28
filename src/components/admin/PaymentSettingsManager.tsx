import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hexToast } from '@/components/hex/HexToast';
import { Save, Wallet } from 'lucide-react';

export function PaymentSettingsManager() {
  const [id, setId] = useState<string | null>(null);
  const [ecocash, setEcocash] = useState('');
  const [bank, setBank] = useState('');
  const [omari, setOmari] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLoading(false);
      if (error) { hexToast.error(error.message); return; }
      if (data) {
        setId(data.id);
        setEcocash(data.ecocash ?? '');
        setBank(data.bank_account ?? '');
        setOmari(data.omari ?? '');
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = { ecocash, bank_account: bank, omari };
    const { error } = id
      ? await supabase.from('payment_settings').update(payload).eq('id', id)
      : await supabase.from('payment_settings').insert(payload);
    setSaving(false);
    if (error) hexToast.error(error.message);
    else hexToast.success('Payment details updated successfully.');
  };

  return (
    <HexCard>
      <div className="flex items-center gap-2 mb-1">
        <Wallet className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-foreground">// Payment Account Details</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        These numbers appear in the client's Renew Subscription modal. Updates apply immediately.
      </p>
      <div className="space-y-4">
        <div>
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">EcoCash Number</Label>
          <Input className="mt-1" value={ecocash} onChange={(e) => setEcocash(e.target.value)} placeholder="e.g. +263 77 123 4567" disabled={loading} />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Bank Account Number</Label>
          <Input className="mt-1" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Account number" disabled={loading} />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Omari Phone Number</Label>
          <Input className="mt-1" value={omari} onChange={(e) => setOmari(e.target.value)} placeholder="e.g. +263 71 234 5678" disabled={loading} />
        </div>
        <Button onClick={save} disabled={saving || loading} className="w-full uppercase tracking-[0.2em] bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" /> Save Payment Details
        </Button>
      </div>
    </HexCard>
  );
}
