import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, AlertCircle, Laptop, Settings, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/dashboard/metrics');
        setMetrics(res.data.metrics);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      }
    };
    fetchMetrics();
  }, []);

  const stats = [
    { name: 'Total Requests', value: metrics?.totalRequests || 0, icon: Users, color: 'bg-blue-500' },
    { name: 'HR Pending', value: metrics?.pendingHR || 0, icon: AlertCircle, color: 'bg-yellow-500' },
    { name: 'IT Pending', value: metrics?.pendingIT || 0, icon: Settings, color: 'bg-purple-500' },
    { name: 'Asset Pending', value: metrics?.pendingAsset || 0, icon: Laptop, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here's what's happening with employee onboarding today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative bg-white dark:bg-slate-800 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden transition-all hover:shadow-md">
            <dt>
              <div className={`absolute rounded-md p-3 ${item.color}`}>
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{item.name}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
              <div className="absolute bottom-0 inset-x-0 bg-slate-50 dark:bg-slate-700/50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="#" className="font-medium text-corporate-600 dark:text-corporate-400 hover:text-corporate-500 flex items-center">
                    View all <ArrowUpRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart placeholder */}
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white mb-4">Onboarding Trends</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <span className="mt-2 block text-sm font-medium text-slate-500 dark:text-slate-400">Chart rendering area</span>
            </div>
          </div>
        </div>

        {/* Upcoming joining */}
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white mb-4">Upcoming Joining (Next 7 Days)</h3>
          <div className="flex items-center justify-between p-4 bg-corporate-50 dark:bg-corporate-900/30 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-corporate-600 dark:text-corporate-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-corporate-900 dark:text-corporate-100">Total Upcoming</p>
                <p className="text-2xl font-bold text-corporate-700 dark:text-corporate-300">{metrics?.upcomingJoining || 0}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-corporate-600 text-white rounded-md text-sm font-medium hover:bg-corporate-700 transition">
              View List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
