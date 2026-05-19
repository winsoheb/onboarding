import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Laptop, Apple, PenTool, CheckCircle, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';

const dellOptions = [
  "Dell - 8GB, 256GB SSD, i3",
  "Dell - 8GB, 512GB SSD, i5",
  "Dell - 16GB, 256GB SSD, i5",
  "Dell - 16GB, 512GB SSD, i7",
  "Dell - 32GB, 1TB SSD, i7"
];

const macOptions = [
  "MacBook Pro - 8GB, 256GB SSD, M1",
  "MacBook Pro - 16GB, 256GB SSD, M1",
  "MacBook Pro - 16GB, 512GB SSD, M2",
  "MacBook Pro - 32GB, 1TB SSD, M3"
];

const HardwareConfigForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Selection States
  const [selectedCategory, setSelectedCategory] = useState<'dell' | 'mac' | 'custom' | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await api.get(`/tickets/${id}`);
        setTicket(res.data.ticket);
        
        // If hardware is already configured, redirect away
        if (res.data.ticket.hardwareRequest?.hardwareStatus === 'SUBMITTED') {
          navigate('/');
        }
      } catch (err: any) {
        setError('Failed to fetch candidate ticket details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, navigate]);

  const handleCategorySelect = (category: 'dell' | 'mac' | 'custom') => {
    setSelectedCategory(category);
    setSelectedModel('');
    setComment('');
    if (category === 'custom') {
      setSelectedModel('Other, Please mention in comment');
    }
  };

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
  };

  const isFormValid = () => {
    if (!selectedCategory) return false;
    if (selectedCategory === 'custom') {
      return comment.trim().length > 0;
    }
    return selectedModel !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmitting(true);
    setError('');

    try {
      await api.patch(`/tickets/${id}/hardware`, {
        hardwareModel: selectedModel,
        hardwareComment: selectedCategory === 'custom' || selectedModel.includes('Other') ? comment : ''
      });
      
      // Navigate to dashboard on success
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit hardware configuration. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-corporate-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-red-100 dark:border-red-900/30 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Occurred</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="w-full bg-corporate-600 hover:bg-corporate-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-corporate-600/20">
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        {/* Step Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center space-x-4 text-sm font-medium">
            <div className="flex items-center text-green-600 dark:text-green-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 font-bold border border-green-500">✓</span>
              <span className="ml-2 hidden sm:inline">Step 1: Details</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center text-corporate-600 dark:text-corporate-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-corporate-100 dark:bg-corporate-950 font-bold border border-corporate-500 animate-pulse">2</span>
              <span className="ml-2 font-semibold">Step 2: Hardware Selection</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center text-slate-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold border border-slate-200 dark:border-slate-700">3</span>
              <span className="ml-2 hidden sm:inline">Step 3: Completed</span>
            </div>
          </div>
        </div>

        {/* Wizard Form Wrapper */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
          {/* Header Panel */}
          <div className="bg-gradient-to-r from-corporate-600 to-indigo-600 px-8 py-8 text-white">
            <h1 className="text-2xl font-extrabold tracking-tight">System Configuration Setup</h1>
            <p className="mt-2 text-corporate-100 text-sm">
              Please specify the required system specifications for <strong className="text-white">{ticket?.fullName}</strong> ({ticket?.designation}) at <strong className="text-white">{ticket?.company}</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Category Cards */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Select Hardware Brand/Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dell Card */}
                <button
                  type="button"
                  onClick={() => handleCategorySelect('dell')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedCategory === 'dell'
                      ? 'border-corporate-500 bg-corporate-50/50 dark:bg-corporate-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <Laptop className={`h-10 w-10 mb-3 ${selectedCategory === 'dell' ? 'text-corporate-600 dark:text-corporate-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Dell</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Windows Laptops</span>
                </button>

                {/* MacBook Card */}
                <button
                  type="button"
                  onClick={() => handleCategorySelect('mac')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedCategory === 'mac'
                      ? 'border-corporate-500 bg-corporate-50/50 dark:bg-corporate-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <Apple className={`h-10 w-10 mb-3 ${selectedCategory === 'mac' ? 'text-corporate-600 dark:text-corporate-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-800 dark:text-slate-200">MacBook</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">macOS Devices</span>
                </button>

                {/* Custom Card */}
                <button
                  type="button"
                  onClick={() => handleCategorySelect('custom')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedCategory === 'custom'
                      ? 'border-corporate-500 bg-corporate-50/50 dark:bg-corporate-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <PenTool className={`h-10 w-10 mb-3 ${selectedCategory === 'custom' ? 'text-corporate-600 dark:text-corporate-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Custom Requirement</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Other specifications</span>
                </button>
              </div>
            </div>

            {/* Model Selection Dropdown (Dell/MacBook) */}
            {selectedCategory && selectedCategory !== 'custom' && (
              <div className="space-y-3 animate-fadeIn">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Select Specification Model <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {(selectedCategory === 'dell' ? dellOptions : macOptions).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleModelSelect(option)}
                      className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all duration-150 ${
                        selectedModel === option
                          ? 'border-corporate-500 bg-corporate-50/30 dark:bg-corporate-950/30 text-corporate-700 dark:text-corporate-300 ring-2 ring-corporate-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Comment Section */}
            {selectedCategory === 'custom' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Custom Specification Details <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-red-500 font-medium">Required field</span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Please type out the complete device specifications required for this candidate..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-4 py-3 shadow-sm focus:ring-corporate-500 focus:border-corporate-500 sm:text-sm"
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid() || submitting}
                className={`flex items-center justify-center px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
                  isFormValid() && !submitting
                    ? 'bg-corporate-600 hover:bg-corporate-700 text-white shadow-corporate-600/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-corporate-600/30 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 shadow-none cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving System Settings...
                  </>
                ) : (
                  <>
                    Complete Configuration
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HardwareConfigForm;
