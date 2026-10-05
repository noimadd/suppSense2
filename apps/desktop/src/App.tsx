import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './lib/session';
import Layout from './components/Layout';
import { ToastProvider } from './components/Feedback';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SubmissionsPage from './pages/SubmissionsPage';
import ProductsPage from './pages/ProductsPage';
import IngredientsPage from './pages/IngredientsPage';

function RequireSession({ children }: { children: React.ReactNode }) {
    const session = useSession();
    const location = useLocation();
    if (!session) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    return <>{children}</>;
}

export default function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<RequireSession><Layout /></RequireSession>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="submissions" element={<SubmissionsPage />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="ingredients" element={<IngredientsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </ToastProvider>
        </BrowserRouter>
    );
}
