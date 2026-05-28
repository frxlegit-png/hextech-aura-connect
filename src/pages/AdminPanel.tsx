import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { HexDataTable } from '@/components/hex/HexDataTable';
import { HexBadge } from '@/components/hex/HexBadge';
import { HexCard } from '@/components/hex/HexCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, FileText, LifeBuoy, DollarSign, Settings, Home, Wallet, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomerManager } from '@/components/admin/CustomerManager';
import { PaymentSettingsManager } from '@/components/admin/PaymentSettingsManager';
import { RevenueManager } from '@/components/admin/RevenueManager';
import { useAdminStats } from '@/hooks/useAdminStats';

const INVOICES = [
  { id: 'INV-2026-0418', customer: 'Tatenda Moyo', amount: '$24.99', method: 'EcoCash', status: 'paid', date: '06 May 2026' },
  { id: 'INV-2026-0417', customer: 'Rumbi Chikore', amount: '$24.99', method: 'EcoCash', status: 'pending', date: '06 May 2026' },
  { id: 'INV-2026-0416', customer: 'Farai Ncube', amount: '$49.98', method: '—', status: 'overdue', date: '02 Apr 2026' },
  { id: 'INV-2026-0415', customer: 'Kuda Mhuriro', amount: '$24.99', method: 'ZimSwitch', status: 'paid', date: '18 Apr 2026' },
];

interface TicketRow {
  id: string;
  ticket_code: string | null;
  customer_name: string | null;
  subject: string;
  status: string;
  created_at: string;
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: n < 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

const AdminPanel = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const stats = useAdminStats();

  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'opened' | 'resolved'>('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('id, ticket_code, customer_name, subject, status, created_at')
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

          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="customers"><Users className="w-4 h-4 mr-2" />Customers</TabsTrigger>
              <TabsTrigger value="invoices"><FileText className="w-4 h-4 mr-2" />Invoices</TabsTrigger>
              <TabsTrigger value="tickets"><LifeBuoy className="w-4 h-4 mr-2" />Support</TabsTrigger>
              <TabsTrigger value="payments"><Wallet className="w-4 h-4 mr-2" />Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="customers">
              <CustomerManager />
            </TabsContent>

            <TabsContent value="invoices">
              <HexDataTable
                columns={[
                  { key: 'id', header: 'Invoice', mono: true },
                  { key: 'customer', header: 'Customer' },
                  { key: 'amount', header: 'Amount' },
                  { key: 'method', header: 'Method' },
                  {
                    key: 'status', header: 'Status',
                    render: (r: any) => <HexBadge variant={r.status}>{String(r.status).toUpperCase()}</HexBadge>,
                  },
                  { key: 'date', header: 'Date' },
                ]}
                data={INVOICES as any}
              />
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
                        <div className="flex gap-1 justify-end">
                          {s !== 'opened' && <Button size="sm" variant="ghost" onClick={() => updateTicket(r.id, 'opened')}>Open</Button>}
                          {s !== 'resolved' && <Button size="sm" variant="ghost" onClick={() => updateTicket(r.id, 'resolved')}>Resolve</Button>}
                        </div>
                      );
                    },
                  },
                ]}
                data={filteredTickets as any}
              />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentSettingsManager />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPanel;
