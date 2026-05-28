import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { HexBadge } from '@/components/hex/HexBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hexToast } from '@/components/hex/HexToast';
import { UserPlus, Trash2, RefreshCw, ShieldCheck, KeyRound } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

export function RoleManager() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [listing, setListing] = useState(false);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState('');

  const refresh = async () => {
    setListing(true);
    const { data, error } = await supabase.functions.invoke('manage-roles', {
      body: { action: 'list' },
    });
    setListing(false);
    if (error || data?.error) {
      hexToast.error(data?.error ?? error?.message ?? 'Failed to load users');
      return;
    }
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const invoke = async (body: Record<string, unknown>) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('manage-roles', { body });
    setLoading(false);
    if (error || data?.error) {
      hexToast.error(data?.error ?? error?.message ?? 'Failed');
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await invoke({ action: 'create', email, password, full_name: fullName, role: 'customer' });
    if (ok) {
      hexToast.success(`Created ${email}`);
      setEmail(''); setPassword(''); setFullName('');
      refresh();
    }
  };

  const handleResetPwd = async (targetEmail: string) => {
    if (resetPwd.length < 8) {
      hexToast.error('Password must be at least 8 characters');
      return;
    }
    const ok = await invoke({ action: 'set_password', email: targetEmail, password: resetPwd });
    if (ok) {
      hexToast.success(`Password updated for ${targetEmail}`);
      setResetFor(null); setResetPwd('');
    }
  };

  const handleAction = async (action: string, targetEmail: string, role = 'customer') => {
    const ok = await invoke({ action, email: targetEmail, role });
    if (ok) {
      hexToast.success(`${action} done for ${targetEmail}`);
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
        <p className="text-xs text-muted-foreground mb-4">
          Manually create a user with email + password. They will be granted <code>customer</code> access to <code>/portal</code>.
        </p>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
          <Input
            type="text"
            placeholder="Full name (optional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="client@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="sm:col-span-2"
          />
          <Button type="submit" disabled={loading || !email || password.length < 8} className="sm:col-span-2">
            <UserPlus className="w-4 h-4 mr-2" /> Create Account
          </Button>
        </form>
      </HexCard>

      <HexCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">All Users</h3>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={listing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${listing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Roles</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCustomer = u.roles.includes('customer');
                const isAdmin = u.roles.includes('admin');
                const isResetting = resetFor === u.email;
                return (
                  <tr key={u.id} className="border-b border-border/40 align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">{u.email}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {u.roles.map((r) => (
                          <HexBadge key={r} variant={r === 'admin' ? 'active' : 'pending'}>{r}</HexBadge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {!isAdmin && (
                          isCustomer ? (
                            <Button variant="ghost" size="sm" disabled={loading} onClick={() => handleAction('revoke', u.email, 'customer')}>
                              <Trash2 className="w-3 h-3 mr-1" /> Remove role
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled={loading} onClick={() => handleAction('grant', u.email, 'customer')}>
                              <UserPlus className="w-3 h-3 mr-1" /> Make Customer
                            </Button>
                          )
                        )}
                        <Button variant="ghost" size="sm" disabled={loading} onClick={() => { setResetFor(isResetting ? null : u.email); setResetPwd(''); }}>
                          <KeyRound className="w-3 h-3 mr-1" /> Password
                        </Button>
                      </div>
                      {isResetting && (
                        <div className="flex gap-2 mt-2 justify-end">
                          <Input
                            type="text"
                            placeholder="New password (min 8)"
                            value={resetPwd}
                            onChange={(e) => setResetPwd(e.target.value)}
                            className="max-w-[220px]"
                          />
                          <Button size="sm" disabled={loading || resetPwd.length < 8} onClick={() => handleResetPwd(u.email)}>
                            Save
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && !listing && (
                <tr><td colSpan={3} className="py-6 text-center text-xs text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </HexCard>
    </div>
  );
}
