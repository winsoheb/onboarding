import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Circle, Copy, Check } from 'lucide-react';

const TicketView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!ticket) return <div className="p-8">Ticket not found.</div>;

  const handleUpdateHR = async (data: any) => {
    await api.put(`/modules/${id}/hr`, data);
    fetchTicket();
  };

  const handleUpdateIT = async (data: any) => {
    await api.put(`/modules/${id}/it`, data);
    fetchTicket();
  };

  const handleUpdateStatus = async (status: string) => {
    await api.put(`/tickets/${id}/status`, { status });
    fetchTicket();
  };

  const stages = [
    'Submitted', 'HR Verification', 'IT Account Creation', 'Asset Preparation', 'Dispatch Pending', 'QA Verification', 'Ready for Joining', 'Joined', 'Closed'
  ];

  const currentStageIndex = stages.indexOf(ticket.status);

  // Format DOJ like 12th May 26
  const formatDOJ = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      else if (day === 2 || day === 22) suffix = 'nd';
      else if (day === 3 || day === 23) suffix = 'rd';
      
      return `${day}${suffix} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const displayDoj = ticket ? formatDOJ(ticket.doj) : '';

  const emailSubject = ticket
    ? `Onboarding of ${ticket.fullName}, DOJ - ${displayDoj}`
    : '';

  const emailBody = ticket
    ? `Name of Candidate (As per Aadhar / National ID ):  ${ticket.fullName}
Contact Number : ${ticket.contactNumber}
DOJ: ${displayDoj}
Designation : ${ticket.designation}
Work Type : ${ticket.workType || 'Employee'}
Location : ${ticket.officeLocation}
Client Name/Project Name: - ${ticket.projectName || 'Internal'}
Reporting Manager: - ${ticket.reportingManager}
Account Manager: - ${ticket.accountManager}
Personal Email ID: ${ticket.personalEmail}
NDA Signed: ${ticket.ndaSigned ? 'Yes' : 'No'}
Past Experience : ${ticket.pastExperience || 'No'}

${ticket.laptopRequired ? 'We need to dispatch the laptop.' : 'No laptop dispatch is required.'}`
    : '';

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </button>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{ticket.fullName} ({ticket.ticketNumber})</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ticket.designation} - {ticket.department}</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-corporate-100 text-corporate-800 dark:bg-corporate-900/30 dark:text-corporate-400">
            {ticket.status}
          </span>
        </div>

        {/* Status Tracker */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center overflow-x-auto pb-4">
            {stages.map((stage, idx) => (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center min-w-[100px]">
                  {idx <= currentStageIndex ? (
                    <CheckCircle2 className="h-6 w-6 text-corporate-600 dark:text-corporate-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  )}
                  <span className={`text-xs mt-2 text-center ${idx <= currentStageIndex ? 'text-corporate-700 font-medium dark:text-corporate-400' : 'text-slate-500'}`}>{stage}</span>
                </div>
                {idx < stages.length - 1 && (
                  <div className={`flex-1 h-0.5 w-12 mx-2 ${idx < currentStageIndex ? 'bg-corporate-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Details Section */}
          <div>
            <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Candidate Information</h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-300">{ticket.personalEmail}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Phone</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-300">{ticket.contactNumber}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Date of Joining</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-300">{new Date(ticket.doj).toLocaleDateString()}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Location</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-300">{ticket.officeLocation}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Company</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-300">{ticket.company || 'Eastern Enterprise.com'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Generated Email ID</dt>
                <dd className="mt-1 text-sm font-medium text-corporate-600">{ticket.companyEmailId}</dd>
              </div>
            </dl>
          </div>

          {/* Action Modules */}
          <div>
            <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Module Actions</h4>
            
            {/* HR Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-medium text-slate-900 dark:text-white mb-3">HR Verification</h5>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-700 dark:text-slate-300">BGV Status</label>
                  <select 
                    value={ticket.hrDetails?.bgvStatus || 'Pending'}
                    onChange={(e) => handleUpdateHR({ bgvStatus: e.target.value })}
                    className="text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                  <button onClick={() => handleUpdateStatus('IT Account Creation')} className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700">Approve & Move to IT</button>
                </div>
              </div>
            )}

            {/* IT Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN') && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-medium text-slate-900 dark:text-white mb-3">IT Provisioning</h5>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" checked={ticket.itDetails?.adCreated} onChange={(e) => handleUpdateIT({ adCreated: e.target.checked })} className="rounded text-corporate-600 focus:ring-corporate-500" />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Create AD Account</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={ticket.itDetails?.o365LicenseAssigned} onChange={(e) => handleUpdateIT({ o365LicenseAssigned: e.target.checked })} className="rounded text-corporate-600 focus:ring-corporate-500" />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Assign Office 365 License</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={ticket.itDetails?.mfaEnabled} onChange={(e) => handleUpdateIT({ mfaEnabled: e.target.checked })} className="rounded text-corporate-600 focus:ring-corporate-500" />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Enable MFA</span>
                  </label>
                </div>
                {ticket.itDetails?.tempPassword && (
                  <p className="mt-3 text-sm text-green-600 font-medium">Temp Password: {ticket.itDetails.tempPassword}</p>
                )}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                  <button onClick={() => handleUpdateStatus('Asset Preparation')} className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700">Move to Asset Team</button>
                </div>
              </div>
            )}

            {/* If no module action available for the role */}
            {user?.role === 'TA' && (
              <p className="text-sm text-slate-500">No actions required from TA at this stage.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Onboarding Announcement Email Template */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-lg font-medium text-slate-900 dark:text-white">📧 Onboarding Announcement Email Draft</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Use this professional, uniform draft for internal announcements and notifications.</p>
          </div>
          <button
            onClick={() => {
              const fullText = `Subject :- ${emailSubject}\n\ncontaint :-\n${emailBody}`;
              navigator.clipboard.writeText(fullText);
              setCopiedBody(true);
              setTimeout(() => setCopiedBody(false), 2000);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            {copiedBody ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                Copied Full Email!
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                Copy Full Email
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {/* Subject Line */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(emailSubject);
                  setCopiedSubject(true);
                  setTimeout(() => setCopiedSubject(false), 2000);
                }}
                className="text-corporate-600 dark:text-corporate-400 hover:text-corporate-700 dark:hover:text-corporate-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedSubject ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Subject
                  </>
                )}
              </button>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 select-all">{emailSubject}</p>
          </div>

          {/* Email Body */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Content / Body</span>
            </div>
            <pre className="text-sm text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap select-all leading-relaxed bg-white dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
              {emailBody}
            </pre>
          </div>
        </div>
      </div>
      
      {/* Activity Log */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Activity Log</h4>
        <div className="space-y-4">
          {ticket.activityLogs?.map((log: any) => (
            <div key={log.id} className="flex gap-4 items-start">
              <div className="h-2 w-2 mt-2 rounded-full bg-corporate-500"></div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{log.action}</p>
                <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()} - {log.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TicketView;
