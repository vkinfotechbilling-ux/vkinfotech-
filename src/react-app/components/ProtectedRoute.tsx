import { Navigate } from 'react-router';
import { authService } from '../services/AuthService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'staff')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    // TEMPORARY: Bypass login for testing
    const user = authService.getCurrentUser() || {
        id: 'TEMP_ADMIN',
        username: 'VKINFOTECH',
        role: 'admin',
        name: 'VK INFOTECH (Temp)'
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If staff tries to access admin route, redirect to billing or home
        return <Navigate to="/billing" replace />;
    }

    return <>{children}</>;
}
