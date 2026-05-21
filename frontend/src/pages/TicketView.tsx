import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Circle, Copy, Check, FileText, Download, Users } from 'lucide-react';

const TicketView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Exceptional BGV state
  const [approvalType, setApprovalType] = useState('BGV_CLEARED');
  const [bgvExceptionReason, setBgvExceptionReason] = useState('');
  const [bgvProof, setBgvProof] = useState<string | null>(null);
  const [bgvProofName, setBgvProofName] = useState<string | null>(null);
  const [bgvProofType, setBgvProofType] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [hrRemarks, setHrRemarks] = useState('');

  // Induction Form State
  const [inductionSchedule, setInductionSchedule] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [hrCoordinator, setHrCoordinator] = useState('');
  const [inductionNotes, setInductionNotes] = useState('');

  // Keka ID Form State
  const [kekaEmployeeId, setKekaEmployeeId] = useState('');
  const [kekaProfileUrl, setKekaProfileUrl] = useState('');
  const [kekaHrNotes, setKekaHrNotes] = useState('');

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

  // Inventory Licenses State
  const [availableLicenses, setAvailableLicenses] = useState<any[]>([]);
  const [licenseCounts, setLicenseCounts] = useState<Record<string, number>>({});

  // Credential Handover Package State
  const [credentialFile, setCredentialFile] = useState<string | null>(null);
  const [credentialFileName, setCredentialFileName] = useState<string | null>(null);
  const [credentialFileType, setCredentialFileType] = useState<string | null>(null);
  const [passwordHint, setPasswordHint] = useState('');
  const [credFileError, setCredFileError] = useState<string | null>(null);
  const [isReplacingCreds, setIsReplacingCreds] = useState(false);

  // Deployable Assets State
  const [deployableAssets, setDeployableAssets] = useState<any[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  // GetPass Upload State
  const [handoverType, setHandoverType] = useState<'OFFICE' | 'COURIER' | ''>('');
  const [getpassFile, setGetpassFile] = useState<string | null>(null);
  const [getpassFileName, setGetpassFileName] = useState<string | null>(null);
  const [getpassFileType, setGetpassFileType] = useState<string | null>(null);
  const [getpassPasswordHint, setGetpassPasswordHint] = useState('');
  const [getpassFileError, setGetpassFileError] = useState<string | null>(null);
  const [isReplacingGetpass, setIsReplacingGetpass] = useState(false);
  const [getpassUploading, setGetpassUploading] = useState(false);

  const fetchLicenses = async () => {
    try {
      const res = await api.get('/modules/inventory/licenses');
      if (res.data) {
        if (res.data.licenses) {
          setAvailableLicenses(res.data.licenses);
        }
        if (res.data.counts) {
          setLicenseCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory licenses:', err);
    }
  };

  const fetchDeployableAssets = async () => {
    try {
      setAssetsLoading(true);
      const res = await api.get('/modules/inventory/deployable');
      if (res.data && res.data.assets) {
        setDeployableAssets(res.data.assets);
      }
    } catch (err) {
      console.error('Failed to fetch deployable assets:', err);
    } finally {
      setAssetsLoading(false);
    }
  };
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
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN') {
      fetchLicenses();
    }
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ASSET') {
      fetchDeployableAssets();
    }
  }, [id, user]);

  useEffect(() => {
    if (ticket) {
      setApprovalType(ticket.hrDetails?.approvalType || 'BGV_CLEARED');
      setBgvExceptionReason(ticket.hrDetails?.bgvExceptionReason || '');
      setBgvProof(ticket.hrDetails?.bgvProof || null);
      setBgvProofName(ticket.hrDetails?.bgvProofName || null);
      setBgvProofType(ticket.hrDetails?.bgvProofType || null);
      setHrRemarks(ticket.hrDetails?.hrRemarks || '');

      setInductionSchedule(ticket.hrDetails?.inductionSchedule ? new Date(new Date(ticket.hrDetails.inductionSchedule).getTime() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : '');
      setMeetingLink(ticket.hrDetails?.meetingLink || '');
      setHrCoordinator(ticket.hrDetails?.hrCoordinator || '');
      setInductionNotes(ticket.hrDetails?.inductionNotes || '');

      setKekaEmployeeId(ticket.kekaEmployeeId || '');
      setKekaProfileUrl(ticket.kekaProfileUrl || '');
      setKekaHrNotes(ticket.kekaHrNotes || '');

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

  const getAssignedLicenseType = () => {
    const key = ticket?.itDetails?.assignedO365License;
    if (!key) return '';
    const parts = key.split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }
    return '';
  };

  const getAvailableCount = (type: string) => {
    // Use real-time Snipe-IT counts (from licenseCounts) if available, fallback to DB count
    if (licenseCounts[type] !== undefined) {
      return licenseCounts[type];
    }
    return availableLicenses.filter(l => l.licenseType === type).length;
  };

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

  const handleValidateAsset = async () => {
    if (!assetSearchTerm.trim()) return;
    setAssetValidating(true);
    setAssetValidationResult(null);
    try {
      const res = await api.get('/modules/asset/validate', {
        params: { search: assetSearchTerm.trim(), searchType: assetSearchType }
      });
      setAssetValidationResult({ deployable: true, statusName: res.data.statusName, assetName: res.data.assetName });
      // Auto-fill the serial/tag field
      if (assetSearchType === 'serial') setSerialNumber(assetSearchTerm.trim());
      else setAssetTag(assetSearchTerm.trim());
    } catch (err: any) {
      const errData = err.response?.data;
      setAssetValidationResult({
        deployable: false,
        statusName: errData?.statusName || 'Unknown',
        error: errData?.error || 'Asset validation failed.'
      });
    } finally {
      setAssetValidating(false);
    }
  };

  const handleGetpassFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setGetpassFileError(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setGetpassFileError('File size exceeds 10MB limit.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && file.type !== 'application/pdf') {
      setGetpassFileError('Only password-protected PDF files are accepted for GetPass package.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setGetpassFile(reader.result as string);
      setGetpassFileName(file.name);
      setGetpassFileType(file.type || 'application/pdf');
    };
    reader.onerror = () => setGetpassFileError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const handleUploadGetpass = async () => {
    if (!getpassFile || !getpassFileName || !getpassFileType) {
      alert('Please select a valid PDF file first.');
      return;
    }
    if (!handoverType) {
      alert('Please select a Handover Type before uploading GetPass.');
      return;
    }
    setGetpassUploading(true);
    try {
      await api.put(`/modules/${id}/getpass`, {
        fileName: getpassFileName,
        fileContent: getpassFile,
        fileType: getpassFileType,
        passwordHint: getpassPasswordHint,
        handoverType
      });
      setIsReplacingGetpass(false);
      setGetpassFile(null);
      setGetpassFileName(null);
      setGetpassFileType(null);
      setGetpassPasswordHint('');
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload GetPass package.');
    } finally {
      setGetpassUploading(false);
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


  const handleApproveBGV = async () => {
    const payload: any = {
      bgvStatus: ticket.hrDetails?.bgvStatus || 'Pending',
      approvalType,
      approved: true,
      hrRemarks
    };
    if (approvalType === 'EXCEPTION_APPROVAL') {
      if (!bgvExceptionReason.trim() || !bgvProof) {
        alert('Exception Reason and Approval Proof document are mandatory for Exception Approval.');
        return;
      }
      payload.bgvProof = bgvProof;
      payload.bgvProofName = bgvProofName;
      payload.bgvProofType = bgvProofType;
      payload.bgvExceptionReason = bgvExceptionReason;
    }
    try {
      await api.put(`/modules/${id}/hr`, payload);
      await api.put(`/tickets/${id}/status`, { status: 'IT & Asset Preparation' });
      alert('BGV Verification Completed & Ticket transitioned to IT & Asset Preparation.');
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve BGV.');
    }
  };

  const handleSaveDOJDetails = async () => {
    if (!kekaEmployeeId.trim()) {
      alert('Employee ID is mandatory.');
      return;
    }

    try {
      // 1. Save HR Induction details
      await api.put(`/modules/${id}/hr`, {
        inductionSchedule,
        meetingLink,
        hrCoordinator,
        inductionNotes
      });

      // 2. Save Keka Employee ID details (triggers Snipe-IT sync in backend)
      await api.put(`/modules/${id}/keka`, {
        kekaEmployeeId: kekaEmployeeId.trim(),
        kekaProfileUrl,
        kekaHrNotes
      });

      alert('DOJ Induction details and Keka Employee ID saved and synced successfully!');
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save DOJ details.');
    }
  };

  const handleMarkAsJoined = async () => {
    try {
      await api.put(`/tickets/${id}/status`, { status: 'Joined' });
      alert('Candidate has successfully joined the company!');
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to mark candidate as Joined.');
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

  const handleCredentialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCredFileError(null);
    if (!file) return;

    // Validate size (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCredFileError('Validation Error: File size exceeds the 10MB upload limit.');
      return;
    }

    // Only accept PDF files (must be password-protected PDF)
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isPdf = ext === 'pdf' || file.type === 'application/pdf';

    if (!isPdf) {
      setCredFileError('Validation Error: Only password-protected PDF files are accepted for the Credential Handover Package.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCredentialFile(reader.result as string);
      setCredentialFileName(file.name);
      setCredentialFileType(file.type || 'application/pdf');
    };
    reader.onerror = () => {
      setCredFileError('Read Error: Failed to process credentials sheet file.');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCredentials = async () => {
    if (!credentialFile || !credentialFileName || !credentialFileType) {
      alert('Please select a valid credential sheet file first.');
      return;
    }

    try {
      await api.put(`/modules/${id}/credentials`, {
        fileName: credentialFileName,
        fileContent: credentialFile,
        fileType: credentialFileType,
        passwordHint
      });
      alert('Credential sheet uploaded successfully!');
      setIsReplacingCreds(false);
      setCredentialFile(null);
      setCredentialFileName(null);
      setCredentialFileType(null);
      setPasswordHint('');
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload credential sheet.');
    }
  };

  const stages = [
    'TA Submission', 'HR Verification', 'IT & Asset Preparation', 'Dispatch', 'Induction & Employee ID', 'Joined', 'Closed'
  ];

  let currentStageIndex = 0;
  if (ticket.status === 'HR Verification') {
    currentStageIndex = 1;
  } else if (ticket.status === 'IT & Asset Preparation') {
    currentStageIndex = 2;
  } else if (ticket.status === 'Dispatch') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const doj = new Date(ticket.doj);
    doj.setHours(0, 0, 0, 0);
    if (today >= doj) {
      currentStageIndex = 4; // Induction & Employee ID
    } else {
      currentStageIndex = 3; // Dispatch
    }
  } else if (ticket.status === 'Joined') {
    currentStageIndex = 5;
  } else if (ticket.status === 'Closed') {
    currentStageIndex = 6;
  } else {
    currentStageIndex = 0;
  }

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
      {/* GLOBAL EMPLOYEE DETAILS HEADER */}
      <div className="bg-gradient-to-r from-corporate-50 to-white dark:from-slate-800/80 dark:to-slate-900/80 border border-corporate-100 dark:border-slate-700 shadow-sm rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-corporate-100 dark:border-slate-700 flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-corporate-800 dark:text-corporate-300 flex items-center gap-2">
            <Users className="w-4 h-4" /> Global Employee Details
          </h4>
          <span className="text-xs bg-corporate-100 text-corporate-800 dark:bg-corporate-900/50 dark:text-corporate-300 px-3 py-1 rounded-full font-semibold">
            Emp ID: {ticket.employeeId || ticket.kekaEmployeeId || 'Pending'}
          </span>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4">
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Full Name</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{ticket.fullName}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Date of Joining</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{new Date(ticket.doj).toLocaleDateString()}</dd>
          </div>
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <dt className="text-[10px] font-bold uppercase text-slate-500">Official Email</dt>
            <dd className="mt-1 text-sm font-semibold text-corporate-600 dark:text-corporate-400 truncate" title={ticket.companyEmailId}>{ticket.companyEmailId || 'Pending Generation'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Contact Number</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{ticket.contactNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Department</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={ticket.department}>{ticket.department}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Designation</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={ticket.designation}>{ticket.designation}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Reporting Manager</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{ticket.reportingManager}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Hardware Type</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{ticket.hardwareRequest?.hardwareModel || 'Not Selected'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-500">Work Location</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{ticket.officeLocation}</dd>
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
              {ticket.itDetails?.assignedO365License && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Assigned O365 License</dt>
                  <dd className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">{ticket.itDetails.assignedO365License}</dd>
                </div>
              )}
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

          {/* Dispatch & Tracking Info — visible to TA and HR */}
          {(user?.role === 'TA' || user?.role === 'HR' || user?.role === 'SUPER_ADMIN') && ticket.dispatchDetails && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg">
              <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span>🚚</span> Courier &amp; Dispatch Info
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Courier</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {ticket.dispatchDetails.courierVendor === 'SHREE_MARUTI' ? '🟠 Shree Maruti'
                      : ticket.dispatchDetails.courierVendor === 'DTDC' ? '🔴 DTDC'
                      : ticket.dispatchDetails.courierVendor === 'OTHER' ? '📦 Other'
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Tracking #</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {ticket.dispatchDetails.trackingId || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Scheduled</span>
                  <span className={`font-semibold ${ticket.dispatchDetails.courierScheduled ? 'text-green-600' : 'text-slate-400'}`}>
                    {ticket.dispatchDetails.courierScheduled ? '✓ Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Delivered</span>
                  <span className={`font-semibold ${ticket.dispatchDetails.delivered ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}`}>
                    {ticket.dispatchDetails.delivered
                      ? `✅ ${ticket.dispatchDetails.deliveredAt ? new Date(ticket.dispatchDetails.deliveredAt).toLocaleDateString('en-IN') : 'Yes'}`
                      : 'In Transit'}
                  </span>
                </div>
              </div>
              {/* Live Tracking Link */}
              {ticket.dispatchDetails.trackingId && (ticket.dispatchDetails.courierVendor === 'SHREE_MARUTI' || ticket.dispatchDetails.courierVendor === 'DTDC') && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700">
                  {ticket.dispatchDetails.courierVendor === 'SHREE_MARUTI' && (
                    <a href={`https://shreemaruti.com/track-shipment/?tracking_number=${ticket.dispatchDetails.trackingId}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                      📡 Track via Shree Maruti →
                    </a>
                  )}
                  {ticket.dispatchDetails.courierVendor === 'DTDC' && (
                    <a href={`https://www.dtdc.in/trace.asp?strCnno=${ticket.dispatchDetails.trackingId}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                      📡 Track via DTDC →
                    </a>
                  )}
                </div>
              )}
              {ticket.dispatchDetails.deliveryNote && (
                <p className="mt-2 text-xs text-slate-500 italic">Note: {ticket.dispatchDetails.deliveryNote}</p>
              )}
            </div>
          )}

          {/* Action Modules */}
          <div>
            <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Module Actions</h4>

            {/* BGV Warning Banner for Asset, IT, Dispatch, QA, Admin */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN' || user?.role === 'ASSET' || user?.role === 'DISPATCH' || user?.role === 'QA') && (
              <BgvExceptionBanner />
            )}
            
            {/* HR BGV Verification Control Card */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
              <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5 mb-5 border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-sm text-slate-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span>📋</span> HR: BGV Verification
                </h5>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">BGV Status</label>
                    <select 
                      value={ticket.hrDetails?.bgvStatus || 'Pending'}
                      onChange={(e) => handleUpdateHR({ bgvStatus: e.target.value })}
                      className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                      disabled={ticket.status !== 'HR Verification'}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Approval Type</label>
                    <select 
                      value={approvalType}
                      onChange={(e) => {
                        setApprovalType(e.target.value);
                        if (e.target.value === 'BGV_CLEARED') {
                          setBgvExceptionReason('');
                          setBgvProof(null);
                        }
                      }}
                      className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                      disabled={ticket.status !== 'HR Verification'}
                    >
                      <option value="BGV_CLEARED">BGV Cleared</option>
                      <option value="EXCEPTION_APPROVAL">Exception Approval</option>
                    </select>
                  </div>

                  {approvalType === 'EXCEPTION_APPROVAL' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                          Exception Reason *
                        </label>
                        <textarea
                          value={bgvExceptionReason}
                          onChange={(e) => setBgvExceptionReason(e.target.value)}
                          placeholder="Provide manager exception reason / approval reason..."
                          className="w-full text-xs rounded p-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white border"
                          rows={2.5}
                          disabled={ticket.status !== 'HR Verification'}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                          Approval Proof Document (Image/PDF) *
                        </label>
                        {ticket.status === 'HR Verification' && (
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, application/pdf"
                            onChange={handleFileChange}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-corporate-50 file:text-corporate-700 hover:file:bg-corporate-100"
                          />
                        )}
                        {fileError && <p className="text-red-500 text-xs mt-1 font-medium">{fileError}</p>}
                        
                        {bgvProof && bgvProofName && bgvProofType && (
                          <div className="mt-2 border border-slate-200 dark:border-slate-700 p-2 rounded bg-slate-50 dark:bg-slate-900">
                            <p className="text-[10px] text-slate-500 font-semibold mb-1">Uploaded proof:</p>
                            {renderBgvProof(bgvProof, bgvProofName, bgvProofType)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">HR Remarks</label>
                    <textarea 
                      value={hrRemarks} 
                      onChange={(e) => {
                        setHrRemarks(e.target.value);
                        handleUpdateHR({ hrRemarks: e.target.value });
                      }}
                      placeholder="Add background verification details or overall remarks..."
                      className="w-full text-xs rounded p-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white border"
                      rows={2}
                      disabled={ticket.status !== 'HR Verification'}
                    />
                  </div>

                  <label className="flex items-center pt-1.5">
                    <input 
                      type="checkbox" 
                      checked={ticket.hrDetails?.documentsUploaded} 
                      onChange={(e) => handleUpdateHR({ documentsUploaded: e.target.checked })} 
                      className="rounded text-corporate-600 focus:ring-corporate-500" 
                      disabled={ticket.status !== 'HR Verification'}
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 font-medium">Candidate Documents Verified & Checked</span>
                  </label>
                </div>

                {ticket.status === 'HR Verification' && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={handleApproveBGV}
                      disabled={
                        !(
                          ticket.hrDetails?.bgvStatus === 'Cleared' || 
                          (approvalType === 'EXCEPTION_APPROVAL' && bgvExceptionReason.trim() !== '' && bgvProof)
                        )
                      }
                      className="w-full bg-corporate-600 text-white text-sm py-2.5 rounded-lg shadow hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
                    >
                      Approve BGV & Move to IT + Asset Preparation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* HR Induction Schedule & Employee ID Card (Keka) */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
              <div className="relative bg-white dark:bg-slate-800 shadow rounded-lg p-5 mb-5 border border-slate-200 dark:border-slate-700 overflow-hidden">
                
                {/* DOJ Lock Overlay */}
                {(() => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const dojDate = new Date(ticket.doj);
                  dojDate.setHours(0,0,0,0);
                  const isDojReached = today >= dojDate;

                  if (!isDojReached) {
                    return (
                      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-20">
                        <div className="bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700/60 p-4 rounded-xl shadow-2xl max-w-sm">
                          <p className="text-2xl mb-2">🔒</p>
                          <h6 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Task Locked Before DOJ</h6>
                          <p className="text-xs text-slate-300">
                            Induction Schedule and Employee ID Sync are locked. This card unlocks on joining day: <strong className="text-corporate-400">{new Date(ticket.doj).toLocaleDateString()}</strong>.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <h5 className="font-bold text-sm text-slate-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span>📅</span> DOJ: Induction & Employee ID (Keka)
                </h5>

                <div className="space-y-4">
                  {/* Induction Sub-Section */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">1. Induction Schedule</span>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Induction Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={inductionSchedule}
                        onChange={(e) => setInductionSchedule(e.target.value)}
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Meeting Link</label>
                      <input 
                        type="text" 
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        placeholder="https://teams.microsoft.com/..."
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">HR Coordinator</label>
                      <input 
                        type="text" 
                        value={hrCoordinator}
                        onChange={(e) => setHrCoordinator(e.target.value)}
                        placeholder="e.g. Sonal Thorat"
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Notes</label>
                      <textarea 
                        value={inductionNotes}
                        onChange={(e) => setInductionNotes(e.target.value)}
                        placeholder="Induction notes/instructions..."
                        className="w-full text-xs rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Keka ID Sub-Section */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">2. Employee ID Update (Keka)</span>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Employee ID *</label>
                      <input 
                        type="text" 
                        value={kekaEmployeeId}
                        onChange={(e) => setKekaEmployeeId(e.target.value)}
                        placeholder="e.g. EE1024"
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Keka Profile URL</label>
                      <input 
                        type="text" 
                        value={kekaProfileUrl}
                        onChange={(e) => setKekaProfileUrl(e.target.value)}
                        placeholder="https://easternenterprise.keka.com/..."
                        className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">HR Notes</label>
                      <textarea 
                        value={kekaHrNotes}
                        onChange={(e) => setKekaHrNotes(e.target.value)}
                        placeholder="Additional sync notes..."
                        className="w-full text-xs rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <button 
                    onClick={handleSaveDOJDetails}
                    className="w-full bg-corporate-600 text-white text-sm py-2.5 rounded-lg shadow hover:bg-corporate-700 font-semibold transition-all"
                  >
                    Save DOJ Induction & Keka Employee ID
                  </button>

                  {ticket.status === 'Dispatch' && ticket.kekaEmployeeId && ticket.hrDetails?.inductionSchedule && (
                    <button 
                      onClick={handleMarkAsJoined}
                      className="w-full bg-green-600 text-white text-sm py-2.5 rounded-lg shadow hover:bg-green-700 font-semibold transition-all mt-1"
                    >
                      Mark Candidate as Joined
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* IT Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN') && ticket.status === 'IT & Asset Preparation' && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">IT Provisioning</h5>
                
                {/* Checklist */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={ticket.itDetails?.adCreated || false} 
                        onChange={(e) => handleUpdateIT({ adCreated: e.target.checked })} 
                        className="rounded text-corporate-600 focus:ring-corporate-500 cursor-pointer" 
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 font-medium">Create AD Account</span>
                    </div>
                    {ticket.itDetails?.adCreated ? (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded flex items-center gap-1">✔ Completed</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">Pending (Mandatory)</span>
                    )}
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm opacity-90">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={ticket.itDetails?.o365LicenseAssigned || false} 
                        disabled
                        className="rounded text-corporate-600 focus:ring-corporate-500 cursor-not-allowed" 
                      />
                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Assign Office 365 License</span>
                    </div>
                    {ticket.itDetails?.o365LicenseAssigned ? (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded flex items-center gap-1">✔ Assigned</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">Requires Dropdown Selection</span>
                    )}
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={ticket.itDetails?.mfaEnabled || false} 
                        onChange={(e) => handleUpdateIT({ mfaEnabled: e.target.checked })} 
                        className="rounded text-corporate-600 focus:ring-corporate-500 cursor-pointer" 
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 font-medium">Enable MFA for Office 365</span>
                    </div>
                    {ticket.itDetails?.mfaEnabled ? (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded flex items-center gap-1">✔ Completed</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">Pending (Mandatory)</span>
                    )}
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={ticket.itDetails?.vpnCreated || false} 
                        onChange={(e) => handleUpdateIT({ vpnCreated: e.target.checked })} 
                        className="rounded text-corporate-600 focus:ring-corporate-500 cursor-pointer" 
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 font-medium">Create VPN Account</span>
                    </div>
                    {ticket.itDetails?.vpnCreated ? (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded flex items-center gap-1">✔ Completed</span>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-900/30 px-2 py-0.5 rounded">Pending</span>
                    )}
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={ticket.itDetails?.pitCreated || false} 
                        onChange={(e) => handleUpdateIT({ pitCreated: e.target.checked })} 
                        className="rounded text-corporate-600 focus:ring-corporate-500 cursor-pointer" 
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300 font-medium">Create PIT Account</span>
                    </div>
                    {ticket.itDetails?.pitCreated ? (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded flex items-center gap-1">✔ Completed</span>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-900/30 px-2 py-0.5 rounded">Pending</span>
                    )}
                  </label>
                </div>

                {/* License Dropdown Selector */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Office 365 License Allocation
                  </label>
                  <select
                    value={getAssignedLicenseType()}
                    onChange={async (e) => {
                      try {
                        await api.put(`/modules/${id}/it`, { assignedO365LicenseType: e.target.value });
                        fetchTicket();
                        fetchLicenses();
                      } catch (err: any) {
                        alert(err.response?.data?.error || 'Failed to update license.');
                      }
                    }}
                    className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2 border shadow-sm focus:ring-corporate-500 focus:border-corporate-500"
                  >
                    <option value="">-- Select O365 License (None) --</option>
                    <option value="EE-Basic" disabled={licenseCounts['EE-Basic'] <= 0 && getAssignedLicenseType() !== 'EE-Basic'}>
                      EE-Basic ({getAvailableCount('EE-Basic')} available{(licenseCounts['EE-Basic'] <= 0 && getAssignedLicenseType() !== 'EE-Basic') ? ' - Out of Stock' : ''})
                    </option>
                    <option value="EE-Standard" disabled={licenseCounts['EE-Standard'] <= 0 && getAssignedLicenseType() !== 'EE-Standard'}>
                      EE-Standard ({getAvailableCount('EE-Standard')} available{(licenseCounts['EE-Standard'] <= 0 && getAssignedLicenseType() !== 'EE-Standard') ? ' - Out of Stock' : ''})
                    </option>
                    <option value="SBQ-Basic" disabled={licenseCounts['SBQ-Basic'] <= 0 && getAssignedLicenseType() !== 'SBQ-Basic'}>
                      SBQ-Basic ({getAvailableCount('SBQ-Basic')} available{(licenseCounts['SBQ-Basic'] <= 0 && getAssignedLicenseType() !== 'SBQ-Basic') ? ' - Out of Stock' : ''})
                    </option>
                    <option value="SBQ-Standard" disabled={licenseCounts['SBQ-Standard'] <= 0 && getAssignedLicenseType() !== 'SBQ-Standard'}>
                      SBQ-Standard ({getAvailableCount('SBQ-Standard')} available{(licenseCounts['SBQ-Standard'] <= 0 && getAssignedLicenseType() !== 'SBQ-Standard') ? ' - Out of Stock' : ''})
                    </option>
                  </select>

                  {ticket.itDetails?.assignedO365License && (
                    <div className="mt-2.5 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-800 dark:text-green-400 flex items-center justify-between font-medium">
                      <span>Assigned License: <span className="font-bold">{ticket.itDetails.assignedO365License}</span></span>
                      <span className="text-[10px] bg-green-100 dark:bg-green-900/60 px-1.5 py-0.5 rounded text-green-800 dark:text-green-300 font-bold uppercase">Inventory Synced</span>
                    </div>
                  )}
                </div>

                {ticket.itDetails?.tempPassword && (
                  <p className="mt-3.5 text-xs text-green-700 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-950/10 p-2 rounded border border-green-100 dark:border-green-900/30">
                    🔑 Generated Temporary Password: <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 border rounded shadow-sm text-slate-800 dark:text-slate-200 select-all">{ticket.itDetails.tempPassword}</span>
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                  <button 
                    onClick={() => handleUpdateStatus('Dispatch')} 
                    disabled={!(ticket.itDetails?.adCreated && ticket.itDetails?.o365LicenseAssigned && ticket.itDetails?.mfaEnabled && hostname && serialNumber && assetTag && assignedEngineer && ticket.credentialSheet)}
                    className="w-full bg-corporate-600 text-white text-sm py-2 rounded shadow hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Transition to Dispatch
                  </button>
                </div>
              </div>
            )}

            {/* Credential Handover Package Card */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN') && ticket.status === 'IT & Asset Preparation' && (() => {
              const itMandatoryDone = !!(ticket.itDetails?.adCreated && ticket.itDetails?.o365LicenseAssigned && ticket.itDetails?.mfaEnabled);
              return (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  Credential Handover Package
                  {!itMandatoryDone && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wide">Locked</span>
                  )}
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Upload the password-protected PDF containing AD, VPN, O365, MFA, and PIT login credentials.
                </p>

                {!itMandatoryDone ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Complete IT Provisioning First</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">The following mandatory tasks must be completed before uploading the credential handover package:</p>
                        <ul className="mt-1.5 space-y-1">
                          <li className={`text-xs flex items-center gap-1.5 ${ticket.itDetails?.adCreated ? 'text-green-600 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {ticket.itDetails?.adCreated ? '✔' : '○'} Create AD Account
                          </li>
                          <li className={`text-xs flex items-center gap-1.5 ${ticket.itDetails?.o365LicenseAssigned ? 'text-green-600 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {ticket.itDetails?.o365LicenseAssigned ? '✔' : '○'} Assign Office 365 License
                          </li>
                          <li className={`text-xs flex items-center gap-1.5 ${ticket.itDetails?.mfaEnabled ? 'text-green-600 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {ticket.itDetails?.mfaEnabled ? '✔' : '○'} Enable MFA for Office 365
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : ticket.credentialSheet && !isReplacingCreds ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Handover Package Uploaded
                      </span>
                      <button
                        onClick={() => setIsReplacingCreds(true)}
                        className="text-xs font-medium text-corporate-600 hover:text-corporate-700 hover:underline"
                      >
                        Replace / Update
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <p><span className="font-semibold">File Name:</span> {ticket.credentialSheet.fileName}</p>
                      <p><span className="font-semibold">Uploaded By:</span> {ticket.credentialSheet.uploadedBy}</p>
                      <p><span className="font-semibold">Uploaded At:</span> {new Date(ticket.credentialSheet.uploadedAt).toLocaleString()}</p>
                      {ticket.credentialSheet.passwordHint && (
                        <p><span className="font-semibold">Password Hint:</span> <span className="bg-white dark:bg-slate-800 px-1 border rounded font-mono">{ticket.credentialSheet.passwordHint}</span></p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Select Credential File * <span className="font-normal text-slate-500">(Password-Protected PDF only)</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleCredentialFileChange}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-corporate-50 file:text-corporate-700 hover:file:bg-corporate-100 dark:file:bg-slate-800 dark:file:text-slate-300"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">⚠ Ensure the PDF is password-protected before uploading. Max 10MB.</p>
                      {credFileError && (
                        <p className="mt-1 text-xs text-red-600 font-semibold">{credFileError}</p>
                      )}
                    </div>

                    {credentialFileName && (
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>📄 {credentialFileName}</span>
                        <button
                          onClick={() => {
                            setCredentialFile(null);
                            setCredentialFileName(null);
                            setCredentialFileType(null);
                          }}
                          className="text-red-500 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Password Hint (Optional)
                      </label>
                      <input
                        type="text"
                        value={passwordHint}
                        onChange={(e) => setPasswordHint(e.target.value)}
                        placeholder="e.g. Employee's date of birth in YYYYMMDD format"
                        className="w-full text-xs rounded border-slate-300 dark:border-slate-600 dark:bg-slate-850 dark:text-white p-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleUploadCredentials}
                        disabled={!credentialFile}
                        className="w-full bg-corporate-600 text-white text-xs py-2 rounded hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        Upload Handover Package
                      </button>
                      {isReplacingCreds && (
                        <button
                          onClick={() => {
                            setIsReplacingCreds(false);
                            setCredentialFile(null);
                            setCredentialFileName(null);
                            setCredentialFileType(null);
                            setCredFileError(null);
                          }}
                          className="w-full bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs py-2 rounded hover:bg-slate-300 dark:hover:bg-slate-650 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              );
            })()}

            {/* ASSET Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ASSET') && ticket.status === 'IT & Asset Preparation' && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">Asset Preparation</h5>

                {/* BGV Warning Banner for Asset */}
                {showWarningBanner && (
                  <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded">
                    <div className="flex">
                      <span className="text-amber-500 mr-2">⚠️</span>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        BGV Exception Case: Approved with reason "{ticket.hrDetails?.bgvExceptionReason}"
                      </p>
                    </div>
                  </div>
                )}

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

                  {/* Select Asset from Inventory */}
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">🔍 Select Asset from Inventory</span>
                    <div className="flex gap-2">
                      <select
                        value={selectedAssetId}
                        onChange={(e) => {
                          const assetId = e.target.value;
                          setSelectedAssetId(assetId);
                          const asset = deployableAssets.find(a => a.id.toString() === assetId);
                          if (asset) {
                            setSerialNumber(asset.serial);
                            setAssetTag(asset.assetTag);
                            if (asset.name) setHostname(asset.name);
                          }
                        }}
                        disabled={assetsLoading}
                        className="flex-1 text-sm rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2"
                      >
                        <option value="">{assetsLoading ? 'Loading inventory...' : '-- Select Deployable Hardware --'}</option>
                        {deployableAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.model} - {asset.assetTag} (SN: {asset.serial})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedAssetId && (
                      <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded px-2.5 py-1.5 mt-2">
                        <span className="text-green-500">✔</span>
                        <span><strong>Asset Selected</strong> — Serial Number and Asset Tag auto-filled below.</span>
                      </div>
                    )}
                  </div>

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
                        {selectedAssetId && (
                          <span className="ml-2 text-[10px] text-green-600 font-bold">✔ Auto-filled</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        readOnly={!!selectedAssetId}
                        placeholder="Enter unique manufacturer serial"
                        className={`w-full text-sm rounded border dark:bg-slate-800 ${selectedAssetId ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20' : 'border-slate-300 dark:border-slate-600'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Asset Tag *
                        {selectedAssetId && (
                          <span className="ml-2 text-[10px] text-green-600 font-bold">✔ Auto-filled</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={assetTag}
                        onChange={(e) => setAssetTag(e.target.value)}
                        readOnly={!!selectedAssetId}
                        placeholder="e.g. EE-AST-2026-104"
                        className={`w-full text-sm rounded border dark:bg-slate-800 ${selectedAssetId ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20' : 'border-slate-300 dark:border-slate-600'}`}
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

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex flex-col gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/modules/${id}/asset`, {
                          hostname, serialNumber, assetTag, assignedEngineer, ram, storage, osVersion, deviceCondition
                        });
                        alert('Asset details saved successfully!');
                        fetchTicket();
                      } catch (err: any) {
                        alert(err.response?.data?.error || 'Failed to save asset details.');
                      }
                    }}
                    disabled={!hostname.trim() || !serialNumber.trim() || !assetTag.trim() || !assignedEngineer.trim()}
                    className="w-full bg-slate-600 text-white text-sm py-2 rounded shadow hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Save Asset Details
                  </button>
                </div>

                {/* Handover Type + GetPass Upload */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 space-y-4">
                  {/* Handover Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Hardware Handover Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHandoverType('OFFICE')}
                        className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl border-2 transition-all duration-150 ${
                          (handoverType || ticket.assetDetails?.handoverType) === 'OFFICE'
                            ? 'border-corporate-500 bg-corporate-50 dark:bg-corporate-950/30 text-corporate-700 dark:text-corporate-300'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-2xl mb-1">🏢</span>
                        <span className="text-xs font-bold">Hand Over in Office</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Collected at office</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHandoverType('COURIER')}
                        className={`flex flex-col items-center justify-center py-4 px-3 rounded-xl border-2 transition-all duration-150 ${
                          (handoverType || ticket.assetDetails?.handoverType) === 'COURIER'
                            ? 'border-corporate-500 bg-corporate-50 dark:bg-corporate-950/30 text-corporate-700 dark:text-corporate-300'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-2xl mb-1">🚚</span>
                        <span className="text-xs font-bold">Hand Over to Courier</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Shipped to employee</span>
                      </button>
                    </div>
                    {ticket.assetDetails?.handoverType && !handoverType && (
                      <p className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="text-corporate-500">✔</span> Current: {ticket.assetDetails.handoverType === 'OFFICE' ? '🏢 Office Handover' : '🚚 Courier Handover'}
                      </p>
                    )}
                  </div>

                  {/* GetPass Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      GetPass Credential Package <span className="text-red-500">*</span>
                    </label>
                    {ticket.assetDetails?.getpassUploaded && !isReplacingGetpass ? (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> GetPass Package Uploaded
                          </span>
                          <button onClick={() => setIsReplacingGetpass(true)} className="text-xs text-corporate-600 hover:underline">Replace</button>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                          <p><span className="font-semibold">File:</span> {ticket.assetDetails.getpassFileName}</p>
                          {ticket.assetDetails.getpassUploadedBy && <p><span className="font-semibold">By:</span> {ticket.assetDetails.getpassUploadedBy}</p>}
                          {ticket.assetDetails.getpassPasswordHint && <p><span className="font-semibold">Password Hint:</span> <span className="font-mono bg-white dark:bg-slate-800 px-1 border rounded">{ticket.assetDetails.getpassPasswordHint}</span></p>}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-[10px] text-slate-500">Upload the password-protected PDF containing GetPass login credentials for the device.</p>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleGetpassFileChange}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-corporate-50 file:text-corporate-700 hover:file:bg-corporate-100 dark:file:bg-slate-800 dark:file:text-slate-300"
                        />
                        <p className="text-[10px] text-slate-400">⚠ Password-protected PDF only. Max 10MB.</p>
                        {getpassFileError && <p className="text-xs text-red-600 font-semibold">{getpassFileError}</p>}
                        {getpassFileName && (
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded border text-xs flex justify-between items-center text-slate-700 dark:text-slate-300">
                            <span>📄 {getpassFileName}</span>
                            <button onClick={() => { setGetpassFile(null); setGetpassFileName(null); setGetpassFileType(null); }} className="text-red-500 hover:underline">Clear</button>
                          </div>
                        )}
                        <input
                          type="text"
                          value={getpassPasswordHint}
                          onChange={(e) => setGetpassPasswordHint(e.target.value)}
                          placeholder="Password hint (optional)"
                          className="w-full text-xs rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white p-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUploadGetpass}
                            disabled={!getpassFile || getpassUploading || !handoverType}
                            className="flex-1 bg-corporate-600 text-white text-xs py-2 rounded hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                          >
                            {getpassUploading ? 'Uploading...' : 'Upload GetPass Package'}
                          </button>
                          {isReplacingGetpass && (
                            <button onClick={() => { setIsReplacingGetpass(false); setGetpassFile(null); setGetpassFileName(null); }} className="px-3 text-xs bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300">Cancel</button>
                          )}
                        </div>
                        {!handoverType && !ticket.assetDetails?.handoverType && (
                          <p className="text-[10px] text-amber-600 font-semibold">⚠ Select Handover Type above before uploading.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dispatch Transition Button */}
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/modules/${id}/asset`, {
                          hostname, serialNumber, assetTag, assignedEngineer, ram, storage, osVersion, deviceCondition,
                          ...(handoverType ? { handoverType } : {})
                        });
                        await handleUpdateStatus('Dispatch');
                      } catch (err: any) {
                        alert(err.response?.data?.error || 'Failed to transition to Dispatch.');
                      }
                    }}
                    disabled={
                      !hostname.trim() || !serialNumber.trim() || !assetTag.trim() || !assignedEngineer.trim() ||
                      !(ticket.itDetails?.adCreated && ticket.itDetails?.o365LicenseAssigned && ticket.itDetails?.mfaEnabled && ticket.credentialSheet) ||
                      !ticket.assetDetails?.getpassUploaded ||
                      !(ticket.assetDetails?.handoverType || handoverType)
                    }
                    className="w-full bg-corporate-600 text-white text-sm py-2.5 rounded shadow hover:bg-corporate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Save &amp; Transition to Dispatch
                  </button>

                  {/* Readiness hint */}
                  {(!ticket.assetDetails?.getpassUploaded || !(ticket.assetDetails?.handoverType || handoverType)) && (
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      {!ticket.assetDetails?.getpassUploaded && <p className="text-amber-600">○ GetPass Package not yet uploaded</p>}
                      {!(ticket.assetDetails?.handoverType || handoverType) && <p className="text-amber-600">○ Handover Type not selected</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DISPATCH Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'DISPATCH') && ticket.status === 'Dispatch' && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">Courier &amp; Dispatch Management</h5>
                
                {/* Candidate Delivery Address for Dispatch */}
                <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
                  <h6 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Candidate Delivery Address</h6>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{ticket.address}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{ticket.city}, {ticket.state} {ticket.zip}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{ticket.country}</p>
                </div>
                {/* BGV Warning Banner for Dispatch */}
                {showWarningBanner && (
                  <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded">
                    <div className="flex">
                      <span className="text-amber-500 mr-2">⚠️</span>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        BGV Exception Case: Approved with reason "{ticket.hrDetails?.bgvExceptionReason}"
                      </p>
                    </div>
                  </div>
                )}

                {!(ticket.hrDetails?.bgvStatus === 'Cleared' || (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)) && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Dispatch Module Locked: BGV must be Cleared or Exception approved before dispatch can proceed.
                  </div>
                )}

                {ticket.assetDetails?.handoverType === 'OFFICE' ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                    <div className="text-3xl mb-2">🏢</div>
                    <h6 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Office Handover Selected</h6>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      The Courier &amp; Delivery workflow is skipped. You can proceed directly to QA Verification or transition to the next state.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Courier Vendor Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Select Courier Vendor <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'SHREE_MARUTI', label: 'Shree Maruti', emoji: '🟠', sub: 'shreemaruti.com' },
                          { key: 'DTDC', label: 'DTDC Courier', emoji: '🔴', sub: 'dtdc.com' },
                          { key: 'OTHER', label: 'Other', emoji: '📦', sub: 'Manual tracking' },
                        ].map(({ key, label, emoji, sub }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={async () => {
                              await api.put(`/modules/${id}/dispatch`, { courierVendor: key });
                              fetchTicket();
                            }}
                            disabled={!(ticket.hrDetails?.bgvStatus === 'Cleared' || (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)) || ticket.dispatchDetails?.deliveryStatus === 'Delivered'}
                            className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                              ticket.dispatchDetails?.courierVendor === key
                                ? 'border-corporate-500 bg-corporate-50 dark:bg-corporate-950/30'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xl mb-1">{emoji}</span>
                            <span className={`text-xs font-bold ${ticket.dispatchDetails?.courierVendor === key ? 'text-corporate-700 dark:text-corporate-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tracking ID */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Tracking Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          defaultValue={ticket.dispatchDetails?.trackingId || ''}
                          onBlur={async (e) => {
                            if (e.target.value !== ticket.dispatchDetails?.trackingId) {
                              await api.put(`/modules/${id}/dispatch`, { trackingId: e.target.value });
                              fetchTicket();
                            }
                          }}
                          disabled={!(ticket.hrDetails?.bgvStatus === 'Cleared' || (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)) || ticket.dispatchDetails?.deliveryStatus === 'Delivered'}
                          placeholder="e.g. SM1234567890"
                          className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 disabled:opacity-50"
                        />
                      </div>

                      {/* Dispatch Date */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Dispatch Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          defaultValue={ticket.dispatchDetails?.dispatchDate ? new Date(ticket.dispatchDetails.dispatchDate).toISOString().split('T')[0] : ''}
                          onBlur={async (e) => {
                            if (e.target.value) {
                              await api.put(`/modules/${id}/dispatch`, { dispatchDate: e.target.value });
                              fetchTicket();
                            }
                          }}
                          disabled={!(ticket.hrDetails?.bgvStatus === 'Cleared' || (ticket.hrDetails?.approved && ticket.hrDetails?.bgvProof && ticket.hrDetails?.bgvExceptionReason)) || ticket.dispatchDetails?.deliveryStatus === 'Delivered'}
                          className="w-full text-sm rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Live Tracking Link */}
                    {ticket.dispatchDetails?.trackingId && ticket.dispatchDetails?.courierVendor && ticket.dispatchDetails?.courierVendor !== 'OTHER' && (
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">📡 Live Tracking</p>
                        {ticket.dispatchDetails.courierVendor === 'SHREE_MARUTI' && (
                          <a
                            href={`https://shreemaruti.com/track-shipment/?tracking_number=${ticket.dispatchDetails.trackingId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            🟠 Track via Shree Maruti → shreemaruti.com/track-shipment
                          </a>
                        )}
                        {ticket.dispatchDetails.courierVendor === 'DTDC' && (
                          <a
                            href={`https://www.dtdc.in/trace.asp?strCnno=${ticket.dispatchDetails.trackingId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            🔴 Track via DTDC → dtdc.in/trace
                          </a>
                        )}
                      </div>
                    )}

                    {/* Delivery Status Tracker */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                        📬 Delivery Status
                      </label>
                      
                      {!ticket.dispatchDetails?.trackingId ? (
                        <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                          Tracking Number is mandatory to unlock Delivery Status tracking.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Stepper UI */}
                          <div className="flex items-center justify-between relative px-4">
                            <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-600 -z-10 -translate-y-1/2"></div>
                            
                            {['Dispatched', 'In Transit', 'Delivered'].map((stepStatus) => {
                              const currentStatus = ticket.dispatchDetails?.deliveryStatus || 'Pending';
                              const statusOrder = ['Pending', 'Dispatched', 'In Transit', 'Delivered'];
                              const currentIndex = statusOrder.indexOf(currentStatus);
                              const stepIndex = statusOrder.indexOf(stepStatus);
                              const isCompleted = stepIndex <= currentIndex;
                              const isActive = stepIndex === currentIndex + 1;

                              return (
                                <button
                                  key={stepStatus}
                                  onClick={async () => {
                                    // only allow moving to the next status or reverting
                                    await api.put(`/modules/${id}/dispatch`, { deliveryStatus: stepStatus });
                                    fetchTicket();
                                  }}
                                  disabled={currentStatus === 'Delivered'}
                                  className={`flex flex-col items-center gap-1.5 focus:outline-none ${currentStatus === 'Delivered' ? 'cursor-not-allowed opacity-80' : ''}`}
                                >
                                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors bg-white dark:bg-slate-800 ${
                                    isCompleted 
                                      ? 'border-corporate-600 text-corporate-600 dark:border-corporate-400 dark:text-corporate-400' 
                                      : isActive 
                                        ? 'border-blue-400 text-blue-500' 
                                        : 'border-slate-300 text-slate-300 dark:border-slate-600 dark:text-slate-600'
                                  }`}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current opacity-50" />}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    isCompleted ? 'text-corporate-700 dark:text-corporate-300' : 'text-slate-400'
                                  }`}>{stepStatus}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Delivery Notes & Details */}
                          {ticket.dispatchDetails?.deliveryStatus === 'Delivered' ? (
                            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-700 rounded-lg mt-4">
                              <p className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                                ✅ Laptop Delivered
                              </p>
                              {ticket.dispatchDetails.deliveredAt && (
                                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                  on {new Date(ticket.dispatchDetails.deliveredAt).toLocaleString()}
                                  {ticket.dispatchDetails.deliveredBy && ` · by ${ticket.dispatchDetails.deliveredBy}`}
                                </p>
                              )}
                              {ticket.dispatchDetails.deliveryNote && (
                                <p className="text-xs text-slate-500 mt-1 italic">Note: {ticket.dispatchDetails.deliveryNote}</p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-4 space-y-2">
                              <textarea
                                rows={2}
                                placeholder="Add delivery note (optional)..."
                                defaultValue={ticket.dispatchDetails?.deliveryNote || ''}
                                onBlur={async (e) => {
                                  if (e.target.value !== ticket.dispatchDetails?.deliveryNote) {
                                    await api.put(`/modules/${id}/dispatch`, { deliveryNote: e.target.value });
                                    fetchTicket();
                                  }
                                }}
                                className="w-full text-xs rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-2.5 py-2 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QA Module Controls */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'QA') && ticket.status === 'Dispatch' && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">QA Verification</h5>

                {/* BGV Warning Banner for QA */}
                {showWarningBanner && (
                  <div className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 rounded">
                    <div className="flex">
                      <span className="text-amber-500 mr-2">⚠️</span>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        BGV Exception Case: Approved with reason "{ticket.hrDetails?.bgvExceptionReason}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={ticket.qaDetails?.serialNumberVerified} 
                      disabled={ticket.qaDetails?.completed}
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/qa`, { serialNumberVerified: e.target.checked });
                        fetchTicket();
                      }}
                      className="rounded text-corporate-600 focus:ring-corporate-500 disabled:opacity-50" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Serial Number & Specs Match Inventory</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={ticket.qaDetails?.osConfigured} 
                      disabled={ticket.qaDetails?.completed}
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/qa`, { osConfigured: e.target.checked });
                        fetchTicket();
                      }}
                      className="rounded text-corporate-600 focus:ring-corporate-500 disabled:opacity-50" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">OS Configuration Verified</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={ticket.qaDetails?.softwareInstalled}
                      disabled={ticket.qaDetails?.completed} 
                      onChange={async (e) => {
                        await api.put(`/modules/${id}/qa`, { softwareInstalled: e.target.checked });
                        fetchTicket();
                      }}
                      className="rounded text-corporate-600 focus:ring-corporate-500 disabled:opacity-50" 
                    />
                    <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Standard Software Bundle Verified</span>
                  </label>
                </div>

                {ticket.qaDetails?.completed ? (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-700 rounded-lg text-center">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400 flex justify-center items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> QA Verification Submitted & Completed
                    </p>
                  </div>
                ) : (
                  <button
                    disabled={!(ticket.qaDetails?.serialNumberVerified && ticket.qaDetails?.osConfigured && ticket.qaDetails?.softwareInstalled)}
                    onClick={async () => {
                      if(window.confirm('Are you sure you want to submit QA Verification? This cannot be undone.')){
                        await api.put(`/modules/${id}/qa`, { completed: true });
                        fetchTicket();
                      }
                    }}
                    className="w-full mt-4 bg-corporate-600 hover:bg-corporate-700 text-white text-sm py-2 rounded shadow transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit QA Verification
                  </button>
                )}
              </div>
            )}

            {/* Close Ticket Control */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && ticket.status === 'Joined' && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 border border-slate-200 dark:border-slate-600">
                <h5 className="font-semibold text-slate-900 dark:text-white mb-3">Onboarding Closure</h5>
                <button 
                  onClick={() => handleUpdateStatus('Closed')} 
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white text-sm py-2 rounded shadow transition-colors font-medium"
                >
                  Close Onboarding Ticket
                </button>
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
