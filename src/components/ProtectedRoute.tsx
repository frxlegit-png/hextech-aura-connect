import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: 'admin' | 'customer';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isAdmin, isCustomer, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const allowed = role === 'admin' ? isAdmin : isCustomer;
  if (!allowed) {
    // Send admin to admin, customer to portal, otherwise home
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isCustomer) return <Navigate to="/portal" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
