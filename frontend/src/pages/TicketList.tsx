import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, Filter } from 'lucide-react';

const TicketList = ({ moduleName, expectedStatuses }: { moduleName: string, expectedStatuses: string[] }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/tickets');
        const allTickets = res.data.tickets;
        // Filter based on expected statuses for this module
        const filtered = expectedStatuses.length > 0 
          ? allTickets.filter((t: any) => expectedStatuses.includes(t.status))
          : allTickets;
        setTickets(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [expectedStatuses]);

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">{moduleName} Queue</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage tickets pending action.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input type="text" className="focus:ring-corporate-500 focus:border-corporate-500 block w-full pl-10 sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md py-2 border" placeholder="Search tickets..." />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none">
            <Filter className="mr-2 h-4 w-4 text-slate-500" /> Filter
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Candidate Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">DOJ</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">No pending tickets found.</td></tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-corporate-600 dark:text-corporate-400">
                    <Link to={`/tickets/${ticket.id}`}>{ticket.ticketNumber}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">{ticket.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{ticket.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(ticket.doj).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <Link to={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-semibold">Email</Link>
                    <Link to={`/tickets/${ticket.id}`} className="text-corporate-600 hover:text-corporate-900 dark:text-corporate-400 dark:hover:text-corporate-300 font-semibold">Review</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketList;
