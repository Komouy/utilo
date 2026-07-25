import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { ArrowLeft, Lightbulb, Send, CheckCircle2, Sparkles, ChevronDown, Loader2 } from 'lucide-react';

// ── EmailJS Config ──────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_qhrh6qe';       // ✅ sudah diisi
const EMAILJS_TEMPLATE_ID = 'template_754yc2p';        // ✅ sudah diisi
const EMAILJS_PUBLIC_KEY  = 'lsT2ypF7uQlIneoOZ';     // ✅ sudah diisi
// ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Image & Media',
  'PDF & Document',
  'Text & Writing',
  'Developer Tools',
  'Security & Privacy',
  'Math & Converter',
  'Social Media',
  'Others',
];

export default function RequestToolPage({ onBack }) {
  const [form, setForm] = useState({ toolName: '', category: '', description: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [focused, setFocused] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.toolName || !form.description) return;

    setLoading(true);
    setSendError(null);

    const templateParams = {
      tool_name:   form.toolName,
      category:    form.category || 'Not specified',
      description: form.description,
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
      setSendError('Failed to send request. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.toolName.trim() && form.description.trim();

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="p-5 bg-green-50 rounded-full">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Request Sent!</h2>
          <p className="text-gray-500 mb-2">
            Thank you for submitting your tool request. We will review and consider it for inclusion in Utilo.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            {form.email ? `A notification will be sent to ${form.email} when the tool is available.` : ''}
          </p>
          <button
            onClick={onBack}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-full transition-all shadow-md shadow-orange-500/20 hover:-translate-y-0.5"
          >
            Back to All Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Tools
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-500">
            <Lightbulb className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Request Tool</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Have an idea for a tool you need? Tell us!
            </p>
          </div>
        </div>

        {/* Spark banner */}
        <div className="mt-6 mb-8 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 px-5 py-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 leading-relaxed">
            Most requested tools will be prioritized for development. Help us know what tools you need!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Tool Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tool Name <span className="text-orange-500">*</span>
            </label>
            <input
              name="toolName"
              type="text"
              value={form.toolName}
              onChange={handleChange}
              onFocus={() => setFocused('toolName')}
              onBlur={() => setFocused(null)}
              placeholder="e.g. Video Compressor, Password Generator..."
              className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-700 outline-none transition-all duration-200 bg-white
                ${focused === 'toolName'
                  ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                onFocus={() => setFocused('category')}
                onBlur={() => setFocused(null)}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-700 outline-none transition-all duration-200 bg-white appearance-none cursor-pointer
                  ${focused === 'category'
                    ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                  } ${!form.category ? 'text-gray-400' : 'text-gray-700'}`}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span className="text-orange-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              onFocus={() => setFocused('description')}
              onBlur={() => setFocused(null)}
              rows={4}
              placeholder="Describe the tool you need, its purpose, and why you need it..."
              className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-700 outline-none transition-all duration-200 bg-white resize-none
                ${focused === 'description'
                  ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email <span className="text-gray-400 font-normal text-xs">(optional — for notifications)</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="yourname@email.com"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-700 outline-none transition-all duration-200 bg-white
                ${focused === 'email'
                  ? 'border-orange-400 ring-4 ring-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md
              ${isValid && !loading
                ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 hover:-translate-y-0.5 hover:shadow-orange-500/35'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>

          {sendError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 text-center">
              {sendError}
            </div>
          )}

          <p className="text-center text-xs text-gray-400">
            Fields marked with <span className="text-orange-500">*</span> are required
          </p>
        </form>
      </div>
    </div>
  );
}
