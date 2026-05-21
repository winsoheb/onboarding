import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitForm from './pages/TA/SubmitForm';
import TicketView from './pages/TicketView';
import TicketList from './pages/TicketList';
import HardwareConfigForm from './pages/TA/HardwareConfigForm';

// A simple wrapper to protect routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/ta/hardware-config/:id" element={<ProtectedRoute><HardwareConfigForm /></ProtectedRoute>} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            {/* Placeholder for other routes */}
            <Route path="ta/new" element={<SubmitForm />} />
            <Route path="ta/tickets" element={<TicketList moduleName="Submitted Tickets" expectedStatuses={[]} />} />
            <Route path="tickets/:id" element={<TicketView />} />
            <Route path="hr" element={<TicketList moduleName="HR" expectedStatuses={['HR Verification', 'Dispatch', 'Joined']} />} />
            <Route path="it" element={<TicketList moduleName="IT" expectedStatuses={['IT & Asset Preparation']} />} />
            <Route path="asset" element={<TicketList moduleName="Asset" expectedStatuses={['IT & Asset Preparation']} />} />
            <Route path="dispatch" element={<TicketList moduleName="Dispatch" expectedStatuses={['Dispatch']} />} />
            <Route path="qa" element={<TicketList moduleName="QA" expectedStatuses={['Dispatch']} />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
