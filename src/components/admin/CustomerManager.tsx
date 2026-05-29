import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { HexBadge } from '@/components/hex/HexBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hexToast } from '@/components/hex/HexToast';
import {
  UserPlus, RefreshCw, ShieldCheck, ChevronDown, ChevronUp,
  Eye, EyeOff, Save, X, Trash2,
} from 'lucide-react';
import {
  autoStateFromDay, daysRemaining, isManual, nextBillingDate, currentCycleStart, formatDate,
} from '@/lib/billing';

interface BillingRow {
  account_id: string | null;
  billing_day: number | null;
  account_state: string;
  balance: number;
  monthly_fee: number;
  password_plain: string | null;
  last_paid_date: string | null;
}
interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}
interface UserRow {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  profile: ProfileRow | null;
  billing: BillingRow | null;
}

export function CustomerManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [listing, setListing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // create form
  const [cEmail, setCEmail] = useState('');
  const [cName, setCName] = useState('');
  const [cPwd, setCPwd] = useState('');

  const invoke = async (body: Record<string, unknown>) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('manage-roles', { body });
    setBusy(false);
    if (error || data?.error) {
      hexToast.error(data?.error ?? error?.message ?? 'Failed');
      return null;
    }
    return data;
  };

  const refresh = async () => {
    setListing(true);
    const data = await invoke({ action: 'list' });
    setListing(false);
    if (data) setUsers(data.users ?? []);
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await invoke({ action: 'create', email: cEmail, password: cPwd, full_name: cName, role: 'customer' });
    if (ok) {
      hexToast.success(`Created ${cEmail}`);
      setCEmail(''); setCName(''); setCPwd('');
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <HexCard>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Create Customer Account</h3>
        </div>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
          <Input type="text" placeholder="Full name (optional)" value={cName} onChange={(e) => setCName(e.target.value)} />
          <Input type="email" placeholder="client@email.com" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
          <Input type="text" placeholder="Password (min 8 chars)" value={cPwd} onChange={(e) => setCPwd(e.target.value)} required minLength={8} className="sm:col-span-2" />
          <Button type="submit" disabled={busy || !cEmail || cPwd.length < 8} className="sm:col-span-2">
            <UserPlus className="w-4 h-4 mr-2" /> Create Account
          </Button>
        </form>
      </HexCard>

      <HexCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">All Customers</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {users.length}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={listing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${listing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="space-y-2">
          {users.map((u) => (
            <CustomerRow
              key={u.id}
              user={u}
              open={expanded === u.id}
              onToggle={() => setExpanded(expanded === u.id ? null : u.id)}
              onChanged={refresh}
              invoke={invoke}
              busy={busy}
            />
          ))}
          {users.length === 0 && !listing && (
            <div className="py-6 text-center text-xs text-muted-foreground">No users yet.</div>
          )}
        </div>
      </HexCard>
    </div>
  );
}

function CustomerRow({
  user, open, onToggle, onChanged, invoke, busy,
}: {
  user: UserRow;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
  invoke: (b: Record<string, unknown>) => Promise<any>;
  busy: boolean;
}) {
  const isAdmin = user.roles.includes('admin');
  const isCustomer = user.roles.includes('customer');

  return (
    <div className="border border-border rounded-md bg-card/40">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs text-foreground truncate">{user.email}</span>
          <div className="flex gap-1 flex-wrap">
            {user.roles.map((r) => (
              <HexBadge key={r} variant={r === 'admin' ? 'active' : 'pending'}>{r}</HexBadge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isAdmin && !isCustomer && (
            <Button variant="outline" size="sm" disabled={busy} onClick={async () => {
              const ok = await invoke({ action: 'grant', user_id: user.id, role: 'customer' });
              if (ok) { hexToast.success('Customer role granted'); onChanged(); }
            }}>Make Customer</Button>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border p-4 space-y-6">
          <CustomerDetailsEditor user={user} onSaved={onChanged} invoke={invoke} busy={busy} />
          <BillingEditor user={user} onSaved={onChanged} invoke={invoke} busy={busy} />
          
          {!isAdmin && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" disabled={busy} onClick={async () => {
                if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
                const ok = await invoke({ action: 'delete_user', user_id: user.id });
                if (ok) { hexToast.success('User deleted'); onChanged(); }
              }}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete user
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function CustomerDetailsEditor({
  user, onSaved, invoke, busy,
}: {
  user: UserRow;
  onSaved: () => void;
  invoke: (b: Record<string, unknown>) => Promise<any>;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const initial = {
    full_name: user.profile?.full_name ?? '',
    email: user.email ?? '',
    phone: user.profile?.phone ?? '',
    password: user.billing?.password_plain ?? '',
  };
  const [form, setForm] = useState(initial);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { setForm(initial); /* eslint-disable-next-line */ }, [user.id, editing]);

  const accountId = user.billing?.account_id ?? '—';

  const save = async () => {
    // 1. profile + email
    const ok1 = await invoke({
      action: 'update_customer', user_id: user.id,
      full_name: form.full_name, phone: form.phone, new_email: form.email,
    });
    if (!ok1) return;
    // 2. password (only if changed and non-empty)
    if (form.password && form.password !== initial.password) {
      if (form.password.length < 8) { hexToast.error('Password must be at least 8 characters'); return; }
      const ok2 = await invoke({ action: 'set_password', user_id: user.id, password: form.password });
      if (!ok2) return;
    }
    hexToast.success('Customer details updated.');
    setEditing(false);
    onSaved();
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">// Account Details</h4>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-3 h-3 mr-1" />Cancel</Button>
            <Button size="sm" disabled={busy} onClick={save}><Save className="w-3 h-3 mr-1" />Save</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Full Name">
          <Input value={form.full_name} disabled={!editing} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Email Address">
          <Input type="email" value={form.email} disabled={!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Phone Number">
          <Input value={form.phone} disabled={!editing} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Account ID">
          <Input value={accountId} disabled readOnly className="font-mono" />
        </Field>
        <Field label="Password" className="sm:col-span-2">
          <div className="relative">
            <Input
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              disabled={!editing}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? 'New password (min 8 chars)' : '••••••••'}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
      </div>
    </section>
  );
}

function BillingEditor({
  user, onSaved, invoke, busy,
}: {
  user: UserRow;
  onSaved: () => void;
  invoke: (b: Record<string, unknown>) => Promise<any>;
  busy: boolean;
}) {
  const b = user.billing;
  const [form, setForm] = useState({
    billing_day: b?.billing_day?.toString() ?? '',
    account_state: b?.account_state ?? 'active',
    balance: b?.balance?.toString() ?? '0',
    monthly_fee: b?.monthly_fee?.toString() ?? '24.99',
  });

  useEffect(() => {
    setForm({
      billing_day: b?.billing_day?.toString() ?? '',
      account_state: b?.account_state ?? 'active',
      balance: b?.balance?.toString() ?? '0',
      monthly_fee: b?.monthly_fee?.toString() ?? '24.99',
    });
  }, [user.id, b?.billing_day, b?.account_state, b?.balance, b?.monthly_fee]);

  const dayNum = parseInt(form.billing_day || '0', 10) || null;
  const remaining = daysRemaining(dayNum);
  const auto = autoStateFromDay(dayNum);
  const manualActive = isManual(form.account_state);
  const effective = manualActive ? form.account_state : auto;
  const tag = manualActive ? 'MANUAL' : 'AUTO';

  const cycleStart = dayNum ? currentCycleStart(dayNum) : null;
  const cycleEnd = dayNum ? nextBillingDate(dayNum) : null;

  const save = async () => {
    if (!dayNum || dayNum < 1 || dayNum > 28) {
      hexToast.error('Billing day must be between 1 and 28');
      return;
    }
    const ok = await invoke({
      action: 'update_billing', user_id: user.id,
      billing_day: dayNum,
      account_state: form.account_state,
      balance: parseFloat(form.balance) || 0,
      monthly_fee: parseFloat(form.monthly_fee) || 0,
    });
    if (ok) {
      hexToast.success(`Billing cycle updated for ${user.profile?.full_name ?? user.email}.`);
      onSaved();
    }
  };

  return (
    <section>
      <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">// Billing Cycle</h4>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Billing Day">
          <Input
            type="number"
            min={1}
            max={28}
            value={form.billing_day}
            onChange={(e) => setForm({ ...form, billing_day: e.target.value })}
            placeholder="e.g. 10"
          />
          <p className="mt-1 text-[10px] text-muted-foreground font-mono">
            Customer is billed on the {form.billing_day || 'Xth'}{form.billing_day ? ordinal(parseInt(form.billing_day, 10)) : ''} of every month.
          </p>
        </Field>
        <Field label="Days Remaining">
          <Input value={remaining === null ? '—' : String(remaining)} readOnly disabled className="font-mono" />
          <p className="mt-1 text-[10px] text-muted-foreground font-mono">
            Cycle: {formatDate(cycleStart)} → {formatDate(cycleEnd)}
          </p>
        </Field>
        <Field label="Account State" className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <select
              value={effective}
              onChange={(e) => {
                const v = e.target.value;
                // Only allow manual states to be selected; selecting an auto state clears the manual override.
                if (v === 'suspended' || v === 'pending') {
                  setForm({ ...form, account_state: v });
                } else {
                  setForm({ ...form, account_state: auto });
                }
              }}
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={auto} disabled>
                {auto.toUpperCase()} (auto)
              </option>
              <option value="suspended">SUSPENDED</option>
              <option value="pending">PAYMENT PENDING</option>
              {manualActive && (
                <option value={auto}>↺ Clear override → {auto.toUpperCase()}</option>
              )}
            </select>
            <span
              className={`text-[10px] font-mono px-2 py-1 rounded border ${
                tag === 'AUTO'
                  ? 'text-cyan-400 border-cyan-400/40 bg-cyan-400/5'
                  : 'text-amber-400 border-amber-400/40 bg-amber-400/5'
              }`}
            >
              {tag}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground font-mono">
            ACTIVE / EXPIRING / EXPIRED are set automatically. Only SUSPENDED and PAYMENT PENDING are manual.
          </p>
        </Field>
        <Field label="Outstanding Balance (USD)">
          <Input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
        </Field>
        <Field label="Monthly Fee (USD)">
          <Input type="number" step="0.01" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} />
        </Field>
      </div>
      <Button onClick={save} disabled={busy} className="w-full mt-4 uppercase tracking-[0.2em] bg-primary hover:bg-primary/90">
        Update Billing Cycle
      </Button>
    </section>
  );
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
