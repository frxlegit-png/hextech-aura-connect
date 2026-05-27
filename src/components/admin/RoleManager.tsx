import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HexCard } from '@/components/hex/HexCard';
import { HexBadge } from '@/components/hex/HexBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hexToast } from '@/components/hex/HexToast';
import { UserPlus, Trash2, RefreshCw, ShieldCheck } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

export function RoleManager() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [listing, setListing] = useState(false);

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

  const call = async (action: 'grant' | 'revoke', targetEmail: string, role = 'customer') => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('manage-roles', {
      body: { action, email: targetEmail, role },
    });
    setLoading(false);
    if (error || data?.error) {
      hexToast.error(data?.error ?? error?.message ?? 'Failed');
      return;
    }
    hexToast.success(action === 'grant' ? `Granted ${role} to ${targetEmail}` : `Removed ${role} from ${targetEmail}`);
    if (action === 'grant') setEmail('');
    refresh();
  };

  return (
    <div className="space-y-6">
      <HexCard>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Grant Customer Access</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          The user must already have a Hextech account. Granting the customer role unlocks <code>/portal</code>.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) call('grant', email, 'customer');
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Input
            type="email"
            placeholder="client@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading || !email}>
            <UserPlus className="w-4 h-4 mr-2" /> Grant Customer
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
                return (
                  <tr key={u.id} className="border-b border-border/40">
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
                      {!isAdmin && (
                        isCustomer ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={loading}
                            onClick={() => call('revoke', u.email, 'customer')}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={() => call('grant', u.email, 'customer')}
                          >
                            <UserPlus className="w-3 h-3 mr-1" /> Make Customer
                          </Button>
                        )
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
