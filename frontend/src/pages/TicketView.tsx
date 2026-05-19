import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Circle, Copy, Check, FileText, Download } from 'lucide-react';

const TicketView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Exceptional BGV state
  const [bgvExceptionChecked, setBgvExceptionChecked] = useState(false);
  const [bgvExceptionReason, setBgvExceptionReason] = useState('');
  const [bgvProof, setBgvProof] = useState<string | null>(null);
  const [bgvProofName, setBgvProofName] = useState<string | null>(null);
  const [bgvProofType, setBgvProofType] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Asset Specs Form State
  const [hostname, setHostname] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [assignedEngineer, setAssignedEngineer] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [osVersion, setOsVersion] = useState('');
  const [deviceCondition, setDeviceCondition] = useState('');

  // UI visual toggles
  const [expandLogs, setExpandLogs] = useState(false);

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

  useEffect(() => {
    if (ticket) {
      setBgvExceptionChecked(!!ticket.hrDetails?.bgvExceptionReason);
      setBgvExceptionReason(ticket.hrDetails?.bgvExceptionReason || '');
      setBgvProof(ticket.hrDetails?.bgvProof || null);
      setBgvProofName(ticket.hrDetails?.bgvProofName || null);
      setBgvProofType(ticket.hrDetails?.bgvProofType || null);

      setHostname(ticket.assetDetails?.hostname || '');
      setSerialNumber(ticket.assetDetails?.serialNumber || '');
      setAssetTag(ticket.assetDetails?.assetTag || '');
      setAssignedEngineer(ticket.assetDetails?.assignedEngineer || '');
      setRam(ticket.assetDetails?.ram || '');
      setStorage(ticket.assetDetails?.storage || '');
      setOsVersion(ticket.assetDetails?.osVersion || '');
      setDeviceCondition(ticket.assetDetails?.deviceCondition || '');
    }
  }, [ticket]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!ticket) return <div className="p-8">Ticket not found.</div>;

  const handleUpdateHR = async (data: any) => {
    try {
      await api.put(`/modules/${id}/hr`, data);
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update HR details.');
    }
  };

  const handleUpdateIT = async (data: any) => {
    try {
      await api.put(`/modules/${id}/it`, data);
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update IT details.');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.put(`/tickets/${id}/status`, { status });
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    // Validate size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('Validation Error: File size exceeds the 5MB enterprise upload limit.');
      return;
    }

    // Validate allowed formats
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Validation Error: Only PNG, JPG, JPEG, and PDF file formats are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBgvProof(reader.result as string);
      setBgvProofName(file.name);
      setBgvProofType(file.type);
    };
    reader.onerror = () => {
      setFileError('Read Error: Failed to process document file.');
    };
    reader.readAsDataURL(file);
  };

  const stages = [
    'Submitted', 'HR Verification', 'IT Account Creation', 'Asset Preparation', 'Dispatch Pending', 'QA Verification', 'Ready for Joining', 'Joined', 'Closed'
  ];

  const currentStageIndex = stages.indexOf(ticket.status);

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
  const emailSubject = ticket ? `Onboarding of ${ticket.fullName}, DOJ - ${displayDoj}` : '';
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

  // Render file viewer helper
  const renderBgvProof = (proofUrl: string, proofName: string, proofType: string) => {
    if (proofType === 'application/pdf' || proofName.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="flex items-center gap-2 mt-2 p-2 bg-slate-100 dark:bg-slate-700/60 rounded border border-slate-200 dark:border-slate-600">
          <FileText className="h-5 w-5 text-red-500" />
          <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[180px] font-medium">{proofName || 'document.pdf'}</span>
          <a
            href={proofUrl}
            download={proofName || 'document.pdf'}
            className="text-xs text-corporate-600 dark:text-corporate-400 hover:underline ml-auto flex items-center gap-1 font-semibold"
          >
            <Download className="h-3 w-3" /> Download
          </a>
        </div>
      );
    } else {
      return (
        <div className="mt-2 border border-slate-200 dark:border-slate-700 p-1.5 bg-slate-50 dark:bg-slate-900 rounded max-w-xs">
          <img src={proofUrl} alt={proofName} className="max-h-40 w-auto rounded object-contain" />
          <div className="flex justify-between items-center mt-1 px-1">
            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{proofName}</span>
            <a href={proofUrl} download={proofName} className="text-[10px] text-corporate-600 dark:text-corporate-400 hover:underline">Download</a>
          </div>
        </div>
      );
    }
  };

  const showWarningBanner = 
    ticket.hrDetails?.approved &&
    ticket.hrDetails?.bgvStatus !== 'Cleared' &&
    ticket.hrDetails?.bgvProof &&
    ticket.hrDetails?.bgvExceptionReason;

  const BgvExceptionBanner = () => {
    if (!showWarningBanner) return null;
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg p-4 mb-5 shadow-sm">
        <div className="flex items-start">
          <span className="text-amber-500 text-base font-bold mt-0.5 select-none">⚠️</span>
          <div className="ml-3 flex-1">
            <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
              Employee onboarding approved through BGV exception process.
            </h5>
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p><span className="font-semibold text-amber-900 dark:text-amber-200">Reason:</span> {ticket.hrDetails.bgvExceptionReason}</p>
              <p><span className="font-semibold text-amber-900 dark:text-amber-200">Approved By:</span> {ticket.hrDetails.bgvUploadedBy || 'HR'}</p>
              <p>
                <span className="font-semibold text-amber-900 dark:text-amber-200">Approval Date:</span>{' '}
                {ticket.hrDetails.bgvApprovedAt ? new Date(ticket.hrDetails.bgvApprovedAt).toLocaleString() : 'N/A'}
              </p>
              {user?.role !== 'TA' && ticket.hrDetails.bgvProof && (
                <div className="mt-3 border-t border-amber-200/60 dark:border-amber-900/40 pt-2.5">
                  <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">Exception Proof Document:</span>
                  {renderBgvProof(ticket.hrDetails.bgvProof, ticket.hrDetails.bgvProofName || 'proof.png', ticket.hrDetails.bgvProofType || 'image/png')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </button>

      {/* STICKY STATUS HEADER */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700 rounded-b-lg -mx-4 px-4 py-3 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {ticket.fullName} 
              <span className="text-xs md:text-sm font-normal text-slate-500 select-all">({ticket.ticketNumber})</span>
            </h3>
            <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400">{ticket.designation} - {ticket.department}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              ticket.status === 'Closed' || ticket.status === 'Joined'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : ticket.status === 'Submitted'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>
        
        {/* TIMELINE WORKFLOW UI */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
          <div className="flex items-center min-w-[900px] pb-1.5">
            {stages.map((stage, idx) => (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center">
                    {idx < currentStageIndex ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                    ) : idx === currentStageIndex ? (
                      <div className="h-5 w-5 rounded-full border-2 border-corporate-600 dark:border-corporate-400 flex items-center justify-center bg-corporate-50 dark:bg-corporate-900/20">
                        <div className="h-2 w-2 rounded-full bg-corporate-600 dark:bg-corporate-400"></div>
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <span className={`text-[9px] md:text-[10px] mt-1 font-medium whitespace-nowrap ${
                    idx <= currentStageIndex ? 'text-corporate-700 dark:text-corporate-400 font-semibold' : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {stage}
                  </span>
                </div>
                {idx < stages.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 min-w-[30px] ${
                    idx < currentStageIndex 
                      ? 'bg-green-500 dark:bg-green-400' 
                      : idx === currentStageIndex 
                      ? 'bg-corporate-400 dark:bg-corporate-600' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
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
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-300">{ticket.company || 'EE-SBQ Onboarding'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Generated Email ID</dt>
                <dd className="mt-1 text-sm font-medium text-corporate-600">{ticket.companyEmailId}</dd>
              </div>
              {ticket.hardwareRequest && (
                <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                  <dt className="text-sm font-semibold text-slate-700 dark:text-slate-300">Requested Hardware Specification</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    <span className="font-bold text-corporate-600 dark:text-corporate-400">
                      {ticket.hardwareRequest.hardwareModel || 'Not Selected'}
                    </span>
                    {ticket.hardwareRequest.hardwareComment && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        Comment: {ticket.hardwareRequest.hardwareComment}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        ticket.hardwareRequest.hardwareStatus === 'SUBMITTED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        Status: {ticket.hardwareRequest.hardwareStatus}
                      </span>
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Action Modules */}
          <div>
            <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Module Actions</h4>

            {/* BGV Warning Banner for Asset, IT, Dispatch, QA, Admin */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN' || user?.role === 'ASSET' || user?.role === 'DISPATCH' || user?.role === 'QA') && (
              <BgvExceptionBanner />
            )}
            
            {/* HR Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">HR Verification</h5>
                
                <div className="space-y-4">
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

                  {ticket.hrDetails?.bgvStatus !== 'Cleared' && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={bgvExceptionChecked}
                          onChange={(e) => {
                            setBgvExceptionChecked(e.target.checked);
                            if (!e.target.checked) {
                              setBgvExceptionReason('');
                              setBgvProof(null);
                              setBgvProofName(null);
                              setBgvProofType(null);
                            }
                          }}
                          className="rounded text-corporate-600 focus:ring-corporate-500 mt-1"
                        />
                        <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                          Allow Dispatch without BGV Clearance (Exceptional Case)
                        </span>
                      </label>

                      {bgvExceptionChecked && (
                        <div className="space-y-3 pl-6 border-l-2 border-corporate-200">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Exception Reason *
                            </label>
                            <textarea
                              value={bgvExceptionReason}
                              onChange={(e) => setBgvExceptionReason(e.target.value)}
                              placeholder="Provide approval email content / manager exception reason..."
                              className="w-full text-xs rounded p-2 border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Approval Proof (Email/Chat Screenshot/PDF) *
                            </label>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, application/pdf"
                              onChange={handleFileChange}
                              className="w-full text-xs text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-corporate-50 file:text-corporate-700 hover:file:bg-corporate-100"
                            />
                            {fileError && <p className="text-red-500 text-xs mt-1 font-medium">{fileError}</p>}
                            
                            {bgvProof && bgvProofName && bgvProofType && (
                              <div className="mt-2 border border-slate-200 dark:border-slate-700 p-2 rounded bg-white dark:bg-slate-800">
                                <p className="text-[10px] text-slate-500 font-semibold mb-1">Uploaded proof:</p>
                                {renderBgvProof(bgvProof, bgvProofName, bgvProofType)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="flex items-center pt-2">
                    <input 
                      type="checkbox" 
                      checked={ticket.hrDetails?.documentsUploaded} 
                      onChange={(e) => handleUpdateHR({ documentsUploaded: e.target.checked })} 
                      className="rounded text-corporate-600 focus:ring-corporate-500" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Documents Uploaded</span>
                  </label>

                  <div className="space-y-1">
                    <label className="block text-sm text-slate-700 dark:text-slate-300">Induction Schedule</label>
                    <input 
                      type="datetime-local" 
                      value={ticket.hrDetails?.inductionSchedule ? new Date(new Date(ticket.hrDetails.inductionSchedule).getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : ''}
                      onChange={(e) => handleUpdateHR({ inductionSchedule: e.target.value })}
                      className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                  <button 
                    onClick={async () => {
                      const payload: any = {
                        bgvStatus: ticket.hrDetails?.bgvStatus || 'Pending',
                        documentsUploaded: ticket.hrDetails?.documentsUploaded,
                        inductionSchedule: ticket.hrDetails?.inductionSchedule,
                        approved: true
                      };
                      if (bgvExceptionChecked) {
                        payload.bgvProof = bgvProof;
                        payload.bgvProofName = bgvProofName;
                        payload.bgvProofType = bgvProofType;
                        payload.bgvExceptionReason = bgvExceptionReason;
                      }
                      await handleUpdateHR(payload);
                      await handleUpdateStatus('IT Account Creation');
                    }}
                    disabled={
                      !(
                        ticket.hrDetails?.bgvStatus === 'Cleared' || 
                        (bgvExceptionChecked && bgvExceptionReason.trim() !== '' && bgvProof)
                      )
                    }
                    className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Approve & Move to IT
                  </button>
                </div>
              </div>
            )}

            {/* IT Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN') && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">IT Provisioning</h5>
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

            {/* ASSET Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ASSET') && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">Asset Preparation</h5>

                {/* Requested Hardware Specification Display */}
                {ticket.hardwareRequest && (
                  <div className="mb-4 p-3 bg-corporate-50 dark:bg-corporate-900/20 border border-corporate-200 dark:border-corporate-800 rounded-lg">
                    <span className="text-[10px] font-bold text-corporate-600 dark:text-corporate-400 block uppercase tracking-wider mb-1">
                      Requested Hardware Configuration
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {ticket.hardwareRequest.hardwareModel || 'Not Selected'}
                    </span>
                    {ticket.hardwareRequest.hardwareComment && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                        Comment: {ticket.hardwareRequest.hardwareComment}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inventory Parameters</h6>
                  
                  <div className="space-y-3">
                    {/* Mandatory Fields */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Hostname *
                      </label>
                      <input 
                        type="text" 
                        value={hostname} 
                        onChange={(e) => setHostname(e.target.value)} 
                        placeholder="e.g. LAPTOP-DEV-009"
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Serial Number *
                      </label>
                      <input 
                        type="text" 
                        value={serialNumber} 
                        onChange={(e) => setSerialNumber(e.target.value)} 
                        placeholder="Enter unique manufacturer serial"
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Asset Tag *
                      </label>
                      <input 
                        type="text" 
                        value={assetTag} 
                        onChange={(e) => setAssetTag(e.target.value)} 
                        placeholder="e.g. EE-AST-2026-104"
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Assigned Engineer *
                      </label>
                      <input 
                        type="text" 
                        value={assignedEngineer} 
                        onChange={(e) => setAssignedEngineer(e.target.value)} 
                        placeholder="Enter configuration engineer"
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </div>

                    {/* Optional Fields */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                      <span className="text-xs font-semibold text-slate-500 block mb-2">Optional Specs</span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            RAM
                          </label>
                          <input 
                            type="text" 
                            value={ram} 
                            onChange={(e) => setRam(e.target.value)} 
                            placeholder="e.g. 16GB"
                            className="w-full text-xs rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Storage
                          </label>
                          <input 
                            type="text" 
                            value={storage} 
                            onChange={(e) => setStorage(e.target.value)} 
                            placeholder="e.g. 512GB SSD"
                            className="w-full text-xs rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            OS Version
                          </label>
                          <input 
                            type="text" 
                            value={osVersion} 
                            onChange={(e) => setOsVersion(e.target.value)} 
                            placeholder="e.g. Win 11 Pro"
                            className="w-full text-xs rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Device Condition
                          </label>
                          <input 
                            type="text" 
                            value={deviceCondition} 
                            onChange={(e) => setDeviceCondition(e.target.value)} 
                            placeholder="e.g. Brand New"
                            className="w-full text-xs rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        await api.put(`/modules/${id}/asset`, {
                          hostname,
                          serialNumber,
                          assetTag,
                          assignedEngineer,
                          ram,
                          storage,
                          osVersion,
                          deviceCondition
                        });
                        await handleUpdateStatus('Dispatch Pending');
                      } catch (err: any) {
                        alert(err.response?.data?.error || 'Failed to save asset details.');
                      }
                    }}
                    disabled={
                      !hostname.trim() ||
                      !serialNumber.trim() ||
                      !assetTag.trim() ||
                      !assignedEngineer.trim()
                    }
                    className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Complete Prep & Move to Dispatch
                  </button>
                </div>
              </div>
            )}

            {/* DISPATCH Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'DISPATCH') && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">Courier & Dispatch Management</h5>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={ticket.dispatchDetails?.courierScheduled} 
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/dispatch`, { courierScheduled: e.target.checked });
                        fetchTicket();
                      }} 
                      disabled={
                        !(
                          ticket.hrDetails?.bgvStatus === 'Cleared' || 
                          (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)
                        )
                      }
                      className="rounded text-corporate-600 focus:ring-corporate-500 disabled:opacity-50" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Courier Scheduled</span>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tracking ID
                    </label>
                    <input 
                      type="text" 
                      value={ticket.dispatchDetails?.trackingId || ''} 
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/dispatch`, { trackingId: e.target.value });
                      }}
                      onBlur={async (e) => {
                        await api.put(`/modules/${id}/dispatch`, { trackingId: e.target.value });
                        fetchTicket();
                      }}
                      disabled={
                        !(
                          ticket.hrDetails?.bgvStatus === 'Cleared' || 
                          (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)
                        )
                      }
                      placeholder="e.g. DHL987654321"
                      className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 disabled:opacity-50"
                    />
                  </div>
                </div>

                {!(
                  ticket.hrDetails?.bgvStatus === 'Cleared' || 
                  (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)
                ) && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Dispatch Module Locked: Background Verification (BGV) must be Cleared, or an Exception approved before laptop dispatch can proceed.
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                  <button 
                    onClick={() => handleUpdateStatus('QA Verification')} 
                    disabled={
                      !(
                        ticket.hrDetails?.bgvStatus === 'Cleared' || 
                        (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)
                      ) || !ticket.dispatchDetails?.courierScheduled
                    }
                    className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Move to QA Verification
                  </button>
                </div>
              </div>
            )}

            {/* QA Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'QA') && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">QA Verification</h5>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={ticket.qaDetails?.serialNumberVerified} 
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/qa`, { serialNumberVerified: e.target.checked });
                        fetchTicket();
                      }}
                      className="rounded text-corporate-600 focus:ring-corporate-500" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Serial Number & Specs Match Inventory</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={ticket.qaDetails?.osConfigured} 
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/qa`, { osConfigured: e.target.checked });
                        fetchTicket();
                      }}
                      className="rounded text-corporate-600 focus:ring-corporate-500" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">OS Configuration Verified</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={ticket.qaDetails?.softwareInstalled} 
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/qa`, { softwareInstalled: e.target.checked });
                        fetchTicket();
                      }}
                      className="rounded text-corporate-600 focus:ring-corporate-500" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Standard Software Bundle Verified</span>
                  </label>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                  <button 
                    onClick={() => handleUpdateStatus('Ready for Joining')} 
                    disabled={
                      !ticket.qaDetails?.serialNumberVerified || 
                      !ticket.qaDetails?.osConfigured || 
                      !ticket.qaDetails?.softwareInstalled
                    }
                    className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve QA & Ready for Joining
                  </button>
                </div>
              </div>
            )}

            {/* Joining Control for Admin */}
            {user?.role === 'SUPER_ADMIN' && ticket.status === 'Ready for Joining' && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">Onboarding Completion</h5>
                <button onClick={() => handleUpdateStatus('Joined')} className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700">Mark Candidate as Joined</button>
              </div>
            )}

            {/* If no module action available for the role */}
            {user?.role === 'TA' && (
              <p className="text-sm text-slate-500">No actions required from TA at this stage.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Onboarding Announcement Email Template (Visible ONLY to TA, ADMIN, SUPER_ADMIN) */}
      {(user?.role === 'TA' || user?.role === 'SUPER_ADMIN') && (
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
      )}
      
      {/* Expandable Activity Audit Log */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-slate-900 dark:text-white">Activity Log & Audit Trail</h4>
          {ticket.activityLogs && ticket.activityLogs.length > 3 && (
            <button 
              onClick={() => setExpandLogs(!expandLogs)} 
              className="text-xs font-semibold text-corporate-600 dark:text-corporate-400 hover:underline"
            >
              {expandLogs ? 'Show Less' : `View All Logs (${ticket.activityLogs.length})`}
            </button>
          )}
        </div>
        <div className="space-y-4">
          {(expandLogs ? ticket.activityLogs : ticket.activityLogs?.slice(0, 3))?.map((log: any) => (
            <div key={log.id} className="flex gap-4 items-start border-l-2 border-slate-100 dark:border-slate-700 pl-4 pb-2">
              <div className="h-2 w-2 -ml-[21px] mt-2 rounded-full bg-corporate-500"></div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{log.action}</p>
                <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()} - {log.details}</p>
              </div>
            </div>
          ))}
          {(!ticket.activityLogs || ticket.activityLogs.length === 0) && (
            <p className="text-sm text-slate-500">No activity logs recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketView;
