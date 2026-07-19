import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { HexDataTable } from '@/components/hex/HexDataTable';
import { HexBadge } from '@/components/hex/HexBadge';
import { HexCard } from '@/components/hex/HexCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Users, FileText, LifeBuoy, DollarSign, Settings, Home, Wallet, TrendingUp, Receipt, Wallet2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomerManager } from '@/components/admin/CustomerManager';
import { PaymentSettingsManager } from '@/components/admin/PaymentSettingsManager';
import { RevenueManager } from '@/components/admin/RevenueManager';
import { BillingTab } from '@/components/admin/BillingTab';
import { InvoicesTab } from '@/components/admin/InvoicesTab';
import { AccountsTab } from '@/components/admin/AccountsTab';
import { useAdminStats } from '@/hooks/useAdminStats';

interface TicketRow {
  id: string;
  ticket_code: string | null;
  customer_name: string | null;
  subject: string;
  message: string | null;
  status: string;
  created_at: string;
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: n < 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

const AdminPanel = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const stats = useAdminStats();

  const [revenueOpen, setRevenueOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('hex_admin_revenue_open') === '1';
  });
  useEffect(() => {
    window.localStorage.setItem('hex_admin_revenue_open', revenueOpen ? '1' : '0');
  }, [revenueOpen]);

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'opened' | 'resolved'>('all');
  const [openTicket, setOpenTicket] = useState<TicketRow | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('id, ticket_code, customer_name, subject, message, status, created_at')
        .order('created_at', { ascending: false });
      if (data) setTickets(data as TicketRow[]);
    };
    load();
    const ch = supabase
      .channel('tickets_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const monthlyDelta = stats.monthlyRevenueLogged
    ? stats.hasPrevMonth && stats.monthlyRevenuePctChange !== null
      ? `${stats.monthlyRevenuePctChange >= 0 ? '+' : ''}${stats.monthlyRevenuePctChange.toFixed(1)}% vs last`
      : 'Logged'
    : 'Not logged yet';

  const KPIS = [
    {
      label: 'Active Subscribers',
      value: String(stats.activeSubscribers),
      delta: `+${stats.newThisMonth} this month`,
      icon: Users,
      accent: 'text-primary',
    },
    {
      label: 'Monthly Revenue',
      value: stats.monthlyRevenueLogged ? fmtMoney(stats.monthlyRevenue) : '$0.00',
      delta: monthlyDelta,
      icon: DollarSign,
      accent: 'text-primary',
    },
    {
      label: 'Open Tickets',
      value: String(stats.openTickets),
      delta: `${stats.pendingTickets} awaiting reply`,
      icon: LifeBuoy,
      accent: 'text-yellow-400',
    },
    {
      label: 'Total Revenue',
      value: fmtMoney(stats.totalRevenue),
      delta: 'All time',
      icon: TrendingUp,
      accent: 'text-green-400',
    },
  ];

  const ticketTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'opened', label: 'Opened' },
    { key: 'resolved', label: 'Resolved' },
  ] as const;

  const filteredTickets = tickets.filter((t) =>
    ticketFilter === 'all' ? true : (t.status || '').toLowerCase() === ticketFilter,
  );

  const updateTicket = async (id: string, status: string) => {
    await supabase.from('tickets').update({ status }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            Hex<span className="text-primary">tech</span>{' '}
            <span className="text-muted-foreground text-sm font-normal">Admin</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/cms')}>
              <Settings className="w-4 h-4 mr-2" /> Site CMS
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" /> View Site
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">// Overview</p>
            <h2 className="text-3xl font-bold text-foreground">Operations Dashboard</h2>
            <p className="text-muted-foreground text-sm mt-1">Live data from your customer database.</p>
          </div>




          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {KPIS.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <HexCard className="relative overflow-hidden">
                  <span
                    className={`absolute top-0 left-0 right-0 h-[2px] ${
                      kpi.accent === 'text-green-400'
                        ? 'bg-green-400'
                        : kpi.accent === 'text-yellow-400'
                          ? 'bg-yellow-400'
                          : 'bg-primary'
                    }`}
                  />
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{kpi.label}</span>
                    <kpi.icon className={`w-4 h-4 ${kpi.accent}`} />
                  </div>
                  <div className={`text-3xl font-mono ${kpi.accent}`}>{kpi.value}</div>
                  <div className="text-xs text-muted-foreground mt-2">{kpi.delta}</div>
                </HexCard>
              </motion.div>
            ))}
          </div>

          <div className="mb-8">
            <RevenueManager />
          </div>

          <Tabs defaultValue="accounts" className="w-full">
            <div className="mb-6 -mx-6 px-6 overflow-x-auto">
              <TabsList className="inline-flex w-max min-w-full gap-1">
                <TabsTrigger value="customers" className="whitespace-nowrap"><Users className="w-4 h-4 mr-2" />Customers</TabsTrigger>
                <TabsTrigger value="accounts" className="whitespace-nowrap"><Wallet2 className="w-4 h-4 mr-2" />Accounts</TabsTrigger>
                <TabsTrigger value="billing" className="whitespace-nowrap"><Receipt className="w-4 h-4 mr-2" />Billing</TabsTrigger>
                <TabsTrigger value="invoices" className="whitespace-nowrap"><FileText className="w-4 h-4 mr-2" />Invoices</TabsTrigger>
                <TabsTrigger value="tickets" className="whitespace-nowrap"><LifeBuoy className="w-4 h-4 mr-2" />Support</TabsTrigger>
                <TabsTrigger value="payments" className="whitespace-nowrap"><Wallet className="w-4 h-4 mr-2" />Payments</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="customers">
              <CustomerManager />
            </TabsContent>

            <TabsContent value="accounts">
              <AccountsTab />
            </TabsContent>

            <TabsContent value="billing">
              <BillingTab />
            </TabsContent>

            <TabsContent value="invoices">
              <InvoicesTab />
            </TabsContent>



            <TabsContent value="tickets">
              <div className="flex gap-2 mb-3">
                {ticketTabs.map((t) => (
                  <Button
                    key={t.key}
                    variant={ticketFilter === t.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTicketFilter(t.key)}
                    className="uppercase tracking-[0.15em] text-[10px]"
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              <HexDataTable
                columns={[
                  { key: 'ticket_code', header: 'Ticket', mono: true,
                    render: (r: any) => r.ticket_code ?? r.id.slice(0, 8) },
                  { key: 'customer_name', header: 'Customer',
                    render: (r: any) => r.customer_name ?? '—' },
                  { key: 'subject', header: 'Subject' },
                  {
                    key: 'status', header: 'Status',
                    render: (r: any) => {
                      const s = (r.status || '').toLowerCase();
                      const variant = s === 'opened' ? 'opened' : s === 'pending' ? 'pending' : s === 'resolved' ? 'resolved' : 'open';
                      return <HexBadge variant={variant as any}>{s.toUpperCase()}</HexBadge>;
                    },
                  },
                  {
                    key: 'created_at', header: 'Opened',
                    render: (r: any) => new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                  },
                  {
                    key: 'actions', header: '',
                    render: (r: any) => {
                      const s = (r.status || '').toLowerCase();
                      return (
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          {s !== 'opened' && <Button size="sm" variant="ghost" onClick={() => updateTicket(r.id, 'opened')}>Open</Button>}
                          {s !== 'resolved' && <Button size="sm" variant="ghost" onClick={() => updateTicket(r.id, 'resolved')}>Resolve</Button>}
                        </div>
                      );
                    },
                  },
                ]}
                data={filteredTickets as any}
                onRowClick={(r: any) => setOpenTicket(r)}
              />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentSettingsManager />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Dialog open={!!openTicket} onOpenChange={(o) => !o && setOpenTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-[0.15em] text-primary text-sm">
              {openTicket?.ticket_code ?? openTicket?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {openTicket && (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Customer</div>
                <div className="text-sm text-foreground">{openTicket.customer_name ?? '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Subject</div>
                <div className="text-base font-semibold text-foreground">{openTicket.subject}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Message</div>
                <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed border border-border rounded-md p-3 bg-muted/30 max-h-72 overflow-y-auto">
                  {openTicket.message || <span className="italic text-muted-foreground">No message provided.</span>}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Status</div>
                  <HexBadge variant={((openTicket.status || '').toLowerCase() === 'opened' ? 'opened' : (openTicket.status || '').toLowerCase() === 'resolved' ? 'resolved' : 'pending') as any}>
                    {openTicket.status.toUpperCase()}
                  </HexBadge>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Opened</div>
                  <div className="text-xs font-mono text-foreground">
                    {new Date(openTicket.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {(openTicket.status || '').toLowerCase() !== 'opened' && (
                  <Button size="sm" variant="outline" onClick={async () => { await updateTicket(openTicket.id, 'opened'); setOpenTicket({ ...openTicket, status: 'opened' }); }}>
                    Mark Opened
                  </Button>
                )}
                {(openTicket.status || '').toLowerCase() !== 'resolved' && (
                  <Button size="sm" onClick={async () => { await updateTicket(openTicket.id, 'resolved'); setOpenTicket({ ...openTicket, status: 'resolved' }); }}>
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
