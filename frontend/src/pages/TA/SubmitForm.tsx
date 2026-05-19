import React, { useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const SubmitForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    personalEmail: '',
    doj: '',
    company: 'Eastern Enterprise.com',
    companyEmailId: '',
    designation: '',
    department: 'KPO - Operators',
    workType: 'Full-Time',
    officeLocation: '',
    projectName: '',
    reportingManager: '',
    accountManager: '',
    ndaSigned: false,
    pastExperience: '',
    address: '',
    country: '',
    state: '',
    city: '',
    laptopRequired: true,
    dispatchRequired: true,
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const [reportingSuggestions, setReportingSuggestions] = useState<any[]>([]);
  const [accountSuggestions, setAccountSuggestions] = useState<any[]>([]);
  const [searchingReporting, setSearchingReporting] = useState(false);
  const [searchingAccount, setSearchingAccount] = useState(false);

  const handleSearchReporting = async (val: string) => {
    setFormData(prev => ({ ...prev, reportingManager: val }));
    if (val.trim().length < 2) {
      setReportingSuggestions([]);
      return;
    }
    setSearchingReporting(true);
    try {
      const res = await api.get(`/tickets/search-users?q=${encodeURIComponent(val)}`);
      setReportingSuggestions(res.data.users || []);
    } catch (err) {
      console.error(val, err);
    } finally {
      setSearchingReporting(false);
    }
  };

  const handleSearchAccount = async (val: string) => {
    setFormData(prev => ({ ...prev, accountManager: val }));
    if (val.trim().length < 2) {
      setAccountSuggestions([]);
      return;
    }
    setSearchingAccount(true);
    try {
      const res = await api.get(`/tickets/search-users?q=${encodeURIComponent(val)}`);
      setAccountSuggestions(res.data.users || []);
    } catch (err) {
      console.error(val, err);
    } finally {
      setSearchingAccount(false);
    }
  };

  const [generatingEmail, setGeneratingEmail] = useState(false);

  const handleGenerateEmail = async () => {
    if (!formData.firstName || !formData.lastName) {
      alert('Please fill out First Name and Last Name first.');
      return;
    }
    setGeneratingEmail(true);
    try {
      const res = await api.post('/tickets/generate-email', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company
      });
      if (res.data && res.data.email) {
        setFormData(prev => ({
          ...prev,
          companyEmailId: res.data.email
        }));
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate unique email address. Please try again.');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/tickets', {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`
      });
      setSuccess(true);
      setTimeout(() => navigate(`/ta/hardware-config/${res.data.ticket.id}`), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit onboarding request.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-lg shadow">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding Request Submitted!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">The request has been sent to HR & IT queues.</p>
        <p className="text-sm text-slate-400 mt-4">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 shadow rounded-lg">
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">New Candidate Onboarding</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Please fill out the candidate details to initiate onboarding workflow.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
            <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Middle Name</label>
            <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
            <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Number</label>
            <input required type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Personal Email</label>
            <input required type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Joining</label>
            <input required type="date" name="doj" value={formData.doj} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
            <select name="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border">
              <option value="Eastern Enterprise.com">Eastern Enterprise.com</option>
              <option value="Smartbooqing.nl">Smartbooqing.nl</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Official Email ID</label>
            <div className="mt-1 flex gap-2">
              <input
                required
                type="text"
                name="companyEmailId"
                value={formData.companyEmailId}
                onChange={handleChange}
                placeholder="Click Generate to create..."
                className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border"
              />
              <button
                type="button"
                onClick={handleGenerateEmail}
                disabled={generatingEmail || !formData.firstName || !formData.lastName}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {generatingEmail ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
            <select name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border">
              <option value="KPO - Operators">KPO - Operators</option>
              <option value="IT - Infra">IT - Infra</option>
              <option value="Sales">Sales</option>
              <option value="Talent Acquisition">Talent Acquisition</option>
              <option value="Intern">Intern</option>
              <option value="Data Entry">Data Entry</option>
              <option value="Marketing">Marketing</option>
              <option value="Management">Management</option>
              <option value="People Ops">People Ops</option>
              <option value="Admin">Admin</option>
              <option value="EE-Egypt">EE-Egypt</option>
              <option value="Engg > Dev">Engg &gt; Dev</option>
              <option value="Engg > BA">Engg &gt; BA</option>
              <option value="Engg > QA">Engg &gt; QA</option>
              <option value="Engg > Design">Engg &gt; Design</option>
              <option value="Engg > PM">Engg &gt; PM</option>
              <option value="SBQ_Engg > Dev_SBQ">SBQ_Engg &gt; Dev_SBQ</option>
              <option value="SBQ_Engg > PM_SBQ">SBQ_Engg &gt; PM_SBQ</option>
              <option value="SBQ_Engg > QA_SBQ">SBQ_Engg &gt; QA_SBQ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Designation</label>
            <input required type="text" name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Office Location</label>
            <input required type="text" name="officeLocation" value={formData.officeLocation} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Name</label>
            <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reporting Manager</label>
            <input 
              required 
              type="text" 
              name="reportingManager" 
              value={formData.reportingManager} 
              onChange={(e) => handleSearchReporting(e.target.value)} 
              onBlur={() => setTimeout(() => setReportingSuggestions([]), 200)}
              autoComplete="off"
              placeholder="Search manager..."
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" 
            />
            {searchingReporting && (
              <span className="absolute right-3 top-9 text-xs text-slate-400">Searching...</span>
            )}
            {reportingSuggestions.length > 0 && (
              <ul className="absolute right-0 left-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {reportingSuggestions.map((usr: any) => (
                  <li
                    key={usr.id}
                    onMouseDown={() => {
                      setFormData(prev => ({ ...prev, reportingManager: usr.name }));
                      setReportingSuggestions([]);
                    }}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-200 flex justify-between items-center"
                  >
                    <span className="font-medium">{usr.name}</span>
                    <span className="text-xs text-slate-400">{usr.email || usr.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Account Manager</label>
            <input 
              required 
              type="text" 
              name="accountManager" 
              value={formData.accountManager} 
              onChange={(e) => handleSearchAccount(e.target.value)} 
              onBlur={() => setTimeout(() => setAccountSuggestions([]), 200)}
              autoComplete="off"
              placeholder="Search account manager..."
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" 
            />
            {searchingAccount && (
              <span className="absolute right-3 top-9 text-xs text-slate-400">Searching...</span>
            )}
            {accountSuggestions.length > 0 && (
              <ul className="absolute right-0 left-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {accountSuggestions.map((usr: any) => (
                  <li
                    key={usr.id}
                    onMouseDown={() => {
                      setFormData(prev => ({ ...prev, accountManager: usr.name }));
                      setAccountSuggestions([]);
                    }}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-200 flex justify-between items-center"
                  >
                    <span className="font-medium">{usr.name}</span>
                    <span className="text-xs text-slate-400">{usr.email || usr.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h4 className="text-md font-medium text-slate-900 dark:text-white mb-4">Address & Additional Info</h4>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Complete Address</label>
              <textarea required name="address" value={formData.address} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
              <input required type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
              <input required type="text" name="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
              <input required type="text" name="country" value={formData.country} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
              <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <input type="checkbox" name="ndaSigned" checked={formData.ndaSigned} onChange={handleChange} className="h-4 w-4 text-corporate-600 focus:ring-corporate-500 border-slate-300 rounded" />
              <label className="ml-2 block text-sm text-slate-900 dark:text-slate-300">NDA Signed</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="laptopRequired" checked={formData.laptopRequired} onChange={handleChange} className="h-4 w-4 text-corporate-600 focus:ring-corporate-500 border-slate-300 rounded" />
              <label className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Laptop Required</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="dispatchRequired" checked={formData.dispatchRequired} onChange={handleChange} className="h-4 w-4 text-corporate-600 focus:ring-corporate-500 border-slate-300 rounded" />
              <label className="ml-2 block text-sm text-slate-900 dark:text-slate-300">Dispatch Required</label>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button type="button" onClick={() => navigate('/')} className="bg-white dark:bg-slate-800 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-500">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitForm;
