import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { 
  ArrowLeft, Lightbulb, Send, CheckCircle2, Sparkles, ChevronDown, 
  Loader2, Bug, MessageSquare, Mail, AlertTriangle, ShieldCheck
} from 'lucide-react';

// ── EmailJS Config ──────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_qhrh6qe';
const EMAILJS_TEMPLATE_ID = 'template_754yc2p';
const EMAILJS_PUBLIC_KEY  = 'lsT2ypF7uQlIneoOZ';
// ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Developer Tools',
  'Media & Images',
  'Utilities & Generators',
  'Others / General'
];

export default function RequestToolPage({ onBack }) {
  const [submissionType, setSubmissionType] = useState('request'); // 'request' | 'bug' | 'contact'
  const [form, setForm] = useState({ title: '', category: '', description: '', steps: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    setLoading(true);
    setSendError(null);

    const typePrefix = submissionType === 'bug' ? '[BUG REPORT]' : submissionType === 'contact' ? '[CONTACT & INQUIRY]' : '[REQUEST TOOL]';

    const templateParams = {
      tool_name:   `${typePrefix} ${form.title}`,
      category:    form.category || (submissionType === 'bug' ? 'Bug Report' : 'General'),
      description: submissionType === 'bug' 
        ? `BUG DESCRIPTION:\n${form.description}\n\nSTEPS TO REPRODUCE:\n${form.steps || '-'}`
        : form.description,
      reply_to:    form.email || 'Not provided',
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      setSubmitted(true);
    } catch (err) {
      console.error('EmailJS error:', err);
      setSendError('Failed to send message. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.title.trim() && form.description.trim();

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="p-5 bg-emerald-50 rounded-full text-emerald-500">
              <CheckCircle2 className="w-14 h-14" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Message Sent Successfully!</h2>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {submissionType === 'bug'
              ? 'Thank you for reporting the issue. Our development team will analyze and fix it as soon as possible.'
              : 'Thank you for your submission. We will review your request and consider it for future updates.'}
          </p>
          {form.email && (
            <p className="text-xs text-orange-600 bg-orange-50 px-4 py-2 rounded-xl mb-6">
              Replies will be sent to <strong>{form.email}</strong>
            </p>
          )}
          <button
            onClick={onBack}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-orange-500/25 hover:-translate-y-0.5"
          >
            Back to Tool Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-4">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Request & Contact</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Have a tool request, bug report, or inquiry? Get in touch directly with the developer!
            </p>
          </div>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
          <button
            type="button"
            onClick={() => setSubmissionType('request')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              submissionType === 'request'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Request Tool</span>
          </button>

          <button
            type="button"
            onClick={() => setSubmissionType('bug')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              submissionType === 'bug'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>Report Bug</span>
          </button>

          <button
            type="button"
            onClick={() => setSubmissionType('contact')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              submissionType === 'contact'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact & Feedback</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Title / Tool Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {submissionType === 'bug' ? 'Tool / Page With Issue' : submissionType === 'request' ? 'Requested Tool Name' : 'Subject / Message Title'} <span className="text-orange-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                onFocus={() => setFocused('title')}
                onBlur={() => setFocused(null)}
                placeholder={
                  submissionType === 'bug'
                    ? 'e.g. Background Remover AI, QR Code Generator...'
                    : submissionType === 'request'
                      ? 'e.g. PDF Compressor, Password Generator...'
                      : 'e.g. Question regarding features...'
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 outline-none transition-all duration-200 bg-white
                  ${focused === 'title'
                    ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              />
            </div>

            {/* Category dropdown for request mode */}
            {submissionType === 'request' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tool Category
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    onFocus={() => setFocused('category')}
                    onBlur={() => setFocused(null)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 bg-white appearance-none cursor-pointer
                      ${focused === 'category'
                        ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                      } ${!form.category ? 'text-gray-400' : 'text-gray-800'}`}
                  >
                    <option value="">Select Category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Main Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {submissionType === 'bug' ? 'Bug / Issue Description' : submissionType === 'request' ? 'Tool Purpose & Details' : 'Message / Feedback'} <span className="text-orange-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                onFocus={() => setFocused('description')}
                onBlur={() => setFocused(null)}
                rows={4}
                placeholder={
                  submissionType === 'bug'
                    ? 'Describe what happened when the issue occurred...'
                    : submissionType === 'request'
                      ? 'Describe the tool you need and how it works...'
                      : 'Write your message or inquiry here...'
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 outline-none transition-all duration-200 bg-white resize-none
                  ${focused === 'description'
                    ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              />
            </div>

            {/* Optional Steps field for Bug report */}
            {submissionType === 'bug' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Steps To Reproduce <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <textarea
                  name="steps"
                  value={form.steps}
                  onChange={handleChange}
                  onFocus={() => setFocused('steps')}
                  onBlur={() => setFocused(null)}
                  rows={2}
                  placeholder="e.g. 1. Upload image, 2. Click Remove Background, 3. Error occurs..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 outline-none transition-all duration-200 bg-white resize-none
                    ${focused === 'steps'
                      ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                />
              </div>
            )}

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Your Email <span className="text-gray-400 font-normal text-xs">(optional — for receiving replies)</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@email.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 outline-none transition-all duration-200 bg-white
                  ${focused === 'email'
                    ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md ${
                submissionType === 'bug'
                  ? isValid && !loading ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : isValid && !loading ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {submissionType === 'bug' ? 'Send Bug Report' : 'Send Message'}
                </>
              )}
            </button>

            {sendError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 text-center">
                {sendError}
              </div>
            )}
          </form>
        </div>

        {/* Contact direct card */}
        <div className="mt-8 p-5 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-800 block mb-0.5">Developer Contact & Support</span>
            Tool requests, bug reports, and feedback are sent directly to the developer's inbox. Feel free to get in touch for support or inquiries.
          </div>
        </div>

      </div>
    </div>
  );
}
