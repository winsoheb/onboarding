import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Archive, Inbox, CheckCircle2, Clock } from 'lucide-react';

const DONE_STATUSES = ['Joined'];

const statusColors: Record<string, string> = {
  'Onboarding': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'HR Verification': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'IT & Asset Preparation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Dispatch': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Joined': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const TicketList = ({ moduleName, expectedStatuses }: { moduleName: string; expectedStatuses: string[] }) => {
  const { user } = useAuth();
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'queue' | 'archive'>('queue');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/tickets');
        const all = res.data.tickets;
        const filtered = expectedStatuses.length > 0
          ? all.filter((t: any) => expectedStatuses.includes(t.status))
          : all;
        setAllTickets(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [expectedStatuses]);

  const queueTickets = allTickets.filter(t => !DONE_STATUSES.includes(t.status));
  const archiveTickets = allTickets.filter(t => DONE_STATUSES.includes(t.status));
  const displayed = (tab === 'queue' ? queueTickets : archiveTickets).filter(t =>
    !search || t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg leading-6 font-semibold text-slate-900 dark:text-white">
              {moduleName} — {tab === 'queue' ? 'Active Queue' : 'Archive'}
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {tab === 'queue' ? `${queueTickets.length} ticket${queueTickets.length !== 1 ? 's' : ''} pending action` : `${archiveTickets.length} completed ticket${archiveTickets.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Queue / Archive Tabs */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-sm font-medium">
              <button
                onClick={() => setTab('queue')}
                className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
                  tab === 'queue'
                    ? 'bg-corporate-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                Queue
                {queueTickets.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === 'queue' ? 'bg-white/20 text-white' : 'bg-corporate-100 text-corporate-700'}`}>
                    {queueTickets.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab('archive')}
                className={`flex items-center gap-1.5 px-4 py-2 border-l border-slate-200 dark:border-slate-700 transition-colors ${
                  tab === 'archive'
                    ? 'bg-slate-700 text-white dark:bg-slate-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
                {archiveTickets.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === 'archive' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {archiveTickets.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="focus:ring-corporate-500 focus:border-corporate-500 block pl-10 sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 border"
                placeholder="Search..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Archive Banner */}
      {tab === 'archive' && (
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Archive className="w-3.5 h-3.5" />
          Showing completed (Joined) tickets. These are read-only records.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Candidate Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">DOJ</th>
              <th className="relative px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-corporate-500"></div>
                  Loading tickets...
                </div>
              </td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  {tab === 'archive' ? <Archive className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8 text-green-400" />}
                  <p className="text-sm font-medium">
                    {tab === 'archive' ? 'No archived tickets yet.' : 'No pending tickets. All clear! ✅'}
                  </p>
                </div>
              </td></tr>
            ) : (
              displayed.map((ticket) => (
                <tr key={ticket.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${tab === 'archive' ? 'opacity-80' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-corporate-600 dark:text-corporate-400">
                    <Link to={`/tickets/${ticket.id}`} className="hover:underline">{ticket.ticketNumber}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{ticket.fullName}</div>
                    <div className="text-xs text-slate-400">{ticket.designation || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{ticket.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs leading-5 font-semibold rounded-full ${statusColors[ticket.status] || 'bg-slate-100 text-slate-700'}`}>
                      {ticket.status === 'Joined' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(ticket.doj).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      {/* Email — only visible to TA role */}
                      {(user?.role === 'TA' || user?.role === 'SUPER_ADMIN') && (
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                        >
                          Email
                        </Link>
                      )}
                      {/* Action button — visible to all */}
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-corporate-600 hover:bg-corporate-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Action →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      {!loading && displayed.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400 flex justify-between items-center">
          <span>Showing {displayed.length} of {(tab === 'queue' ? queueTickets : archiveTickets).length} tickets</span>
          {tab === 'archive' && <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="w-3 h-3" /> All onboarding completed</span>}
        </div>
      )}
    </div>
  );
};

export default TicketList;
