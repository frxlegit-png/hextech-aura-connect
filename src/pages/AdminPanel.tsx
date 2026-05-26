import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { HexDataTable } from '@/components/hex/HexDataTable';
import { HexBadge } from '@/components/hex/HexBadge';
import { HexCard } from '@/components/hex/HexCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Users, FileText, LifeBuoy, BarChart3, DollarSign, Wifi, Settings, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const KPIS = [
  { label: 'Active Subscribers', value: '247', delta: '+12 this month', icon: Users, accent: 'text-primary' },
  { label: 'Monthly Revenue', value: '$6,172', delta: '+8.4% vs last', icon: DollarSign, accent: 'text-accent' },
  { label: 'Open Tickets', value: '8', delta: '3 awaiting reply', icon: LifeBuoy, accent: 'text-yellow-400' },
  { label: 'Network Uptime', value: '99.7%', delta: 'Last 30 days', icon: Wifi, accent: 'text-green-400' },
];

const CUSTOMERS = [
  { id: 'HXT-00042', name: 'Tatenda Moyo', plan: 'Residential', status: 'active', balance: '$0.00', renews: '06 Jun 2026' },
  { id: 'HXT-00041', name: 'Rumbi Chikore', plan: 'Residential', status: 'pending', balance: '$24.99', renews: '12 May 2026' },
  { id: 'HXT-00040', name: 'Farai Ncube', plan: 'Residential', status: 'overdue', balance: '$49.98', renews: '02 Apr 2026' },
  { id: 'HXT-00039', name: 'Kuda Mhuriro', plan: 'Residential', status: 'active', balance: '$0.00', renews: '18 Jun 2026' },
  { id: 'HXT-00038', name: 'Anesu Sibanda', plan: 'Residential', status: 'soon', balance: '$0.00', renews: '28 May 2026' },
];

const INVOICES = [
  { id: 'INV-2026-0418', customer: 'Tatenda Moyo', amount: '$24.99', method: 'EcoCash', status: 'paid', date: '06 May 2026' },
  { id: 'INV-2026-0417', customer: 'Rumbi Chikore', amount: '$24.99', method: 'EcoCash', status: 'pending', date: '06 May 2026' },
  { id: 'INV-2026-0416', customer: 'Farai Ncube', amount: '$49.98', method: '—', status: 'overdue', date: '02 Apr 2026' },
  { id: 'INV-2026-0415', customer: 'Kuda Mhuriro', amount: '$24.99', method: 'ZimSwitch', status: 'paid', date: '18 Apr 2026' },
];

const TICKETS = [
  { id: 'TKT-0212', customer: 'Tatenda Moyo', subject: 'Speed test below plan', status: 'open', opened: '12 May 2026' },
  { id: 'TKT-0211', customer: 'Anesu Sibanda', subject: 'Router reboot request', status: 'progress', opened: '10 May 2026' },
  { id: 'TKT-0210', customer: 'Farai Ncube', subject: 'Billing question', status: 'resolved', opened: '03 May 2026' },
];

const AdminPanel = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
            <p className="text-muted-foreground text-sm mt-1">
              Demo data — connect a customer database to make this live.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {KPIS.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <HexCard>
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

          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="customers"><Users className="w-4 h-4 mr-2" />Customers</TabsTrigger>
              <TabsTrigger value="invoices"><FileText className="w-4 h-4 mr-2" />Invoices</TabsTrigger>
              <TabsTrigger value="tickets"><LifeBuoy className="w-4 h-4 mr-2" />Support</TabsTrigger>
            </TabsList>

            <TabsContent value="customers">
              <HexDataTable
                columns={[
                  { key: 'id', header: 'Account ID', mono: true },
                  { key: 'name', header: 'Name' },
                  { key: 'plan', header: 'Plan' },
                  {
                    key: 'status', header: 'Status',
                    render: (r: any) => <HexBadge variant={r.status}>{String(r.status).toUpperCase()}</HexBadge>,
                  },
                  { key: 'balance', header: 'Balance' },
                  { key: 'renews', header: 'Renews' },
                ]}
                data={CUSTOMERS as any}
              />
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
              <HexDataTable
                columns={[
                  { key: 'id', header: 'Ticket', mono: true },
                  { key: 'customer', header: 'Customer' },
                  { key: 'subject', header: 'Subject' },
                  {
                    key: 'status', header: 'Status',
                    render: (r: any) => <HexBadge variant={r.status}>{String(r.status).toUpperCase()}</HexBadge>,
                  },
                  { key: 'opened', header: 'Opened' },
                ]}
                data={TICKETS as any}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPanel;
