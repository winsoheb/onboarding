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
    department: 'Engineering',
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
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-corporate-600 hover:bg-corporate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {generatingEmail ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
            <select name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border">
              <option>Engineering</option>
              <option>Sales</option>
              <option>HR</option>
              <option>Marketing</option>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reporting Manager</label>
            <input required type="text" name="reportingManager" value={formData.reportingManager} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Account Manager</label>
            <input required type="text" name="accountManager" value={formData.accountManager} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-corporate-500 focus:ring-corporate-500 sm:text-sm dark:bg-slate-700 dark:text-white px-3 py-2 border" />
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
          <button type="submit" disabled={loading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-corporate-600 hover:bg-corporate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-500 disabled:bg-corporate-400">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitForm;
