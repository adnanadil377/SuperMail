import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EllipsisVertical, Send, X, Mail } from 'lucide-react';
import EmailMessage from './EmailMessage';
import useAuth from '../auth/useAuth';

const EmailDisplay = ({ activeContactEmail }) => {
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isComposeExpanded, setIsComposeExpanded] = useState(false);
  const { user } = useAuth();

  const [composeStep, setComposeStep] = useState('choose'); // 'choose', 'ai', 'review', 'manual'
  const [aiLoading, setAiLoading] = useState(false);

  const [aiBody, setAiBody] = useState('');
  const [aiTo, setAiTo] = useState(activeContactEmail || '');
  const [reviewSubject, setReviewSubject] = useState('');
  const [reviewBody, setReviewBody] = useState('');

  useEffect(() => {
    if (!activeContactEmail) {
      setEmails([]);
      setError(null);
      return;
    }

    const fetchEmails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://127.0.0.1:8000/emails/?email=${activeContactEmail}`);
        setEmails(response.data.emails);
      } catch (error) {
        console.error("Failed to fetch email data:", error);
        setError(
          error.response?.status === 401
            ? "You are not authorized. Please log in again."
            : "Failed to fetch emails. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmails();
  }, [activeContactEmail]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (sendSuccess) {
      const timer = setTimeout(() => setSendSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [sendSuccess]);

  const handleSendEmail = async () => {
    setSendError(null);
    setSendSuccess(null);
    
    if (!subject.trim() || !body.trim()) {
      setSendError("Please fill in both subject and message.");
      return;
    }

    setIsSending(true);
    try {
      await axios.post('http://127.0.0.1:8000/send/', {
        to: activeContactEmail,
        subject,
        body,
      });
      setSendSuccess("Email sent successfully!");
      setSubject('');
      setBody('');
      setIsComposeExpanded(false);
      
      // Refresh emails to show the sent message
      const response = await axios.get(`http://127.0.0.1:8000/emails/?email=${activeContactEmail}`);
      setEmails(response.data.emails);
    } catch (error) {
      setSendError(error.response?.data?.message || "Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleAiCompose = async () => {
    setSendError(null);
    setAiLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/aicompose/', {
        body: aiBody,
        to: aiTo,
      });
      setReviewSubject(response.data.subject);
      setReviewBody(response.data.body);
      setComposeStep('review');
    } catch (error) {
      setSendError("AI compose failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendReviewedEmail = async () => {
    setSendError(null);
    setSendSuccess(null);
    setIsSending(true);
    try {
      await axios.post('http://127.0.0.1:8000/send/', {
        to: aiTo,
        subject: reviewSubject,
        body: reviewBody,
      });
      setSendSuccess("Email sent successfully!");
      setComposeStep('choose');
      setAiBody('');
      setReviewSubject('');
      setReviewBody('');
      setIsComposeExpanded(false);

      // Refresh emails
      const response = await axios.get(`http://127.0.0.1:8000/emails/?email=${aiTo}`);
      setEmails(response.data.emails);
    } catch (error) {
      setSendError("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleManualCompose = () => {
    setSubject('');
    setBody('');
    setComposeStep('manual');
    setIsComposeExpanded(true);
  };

  const handleCancelAll = () => {
    setComposeStep('choose');
    setAiBody('');
    setReviewSubject('');
    setReviewBody('');
    setIsComposeExpanded(false);
    setSendError(null);
  };

  if (!activeContactEmail) {
    return (
      <div className="hidden md:w-8/12 md:ml-1 rounded-4xl bg-[#212121] text-white md:flex items-center justify-center h-full">
        <div className="text-center">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Select a contact to view emails</p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full md:ml-1 rounded-4xl bg-[#212121] text-white flex flex-col h-full'>
      {/* Header */}
      <div className='flex flex-row justify-between items-center px-5 bg-[#2a2a2a] rounded-t-4xl shadow-lg'>
        <div className='text-xl font-semibold py-4'>{activeContactEmail}</div>
        <button className='p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors'>
          <EllipsisVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Success Message (Fixed at top) */}
      {sendSuccess && (
        <div className="bg-green-600 text-white px-4 py-3 m-3 rounded-lg flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {sendSuccess}
          </span>
          <button onClick={() => setSendSuccess(null)} className="hover:bg-green-700 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 text-white px-4 py-3 m-3 rounded-lg flex items-center justify-between shadow-lg">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:bg-red-700 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Email List */}
      <div className='flex-grow overflow-y-auto px-3 py-2'>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Mail className="w-12 h-12 mb-2" />
            <p>No emails yet</p>
          </div>
        ) : (
          emails.slice().reverse().map((email) => (
            <EmailMessage key={email.message_id} email={email} currentUserEmail={user?.email} />
          ))
        )}
      </div>

      {/* Compose Email Section */}
      <div className='mx-3 mb-3'>
        {composeStep === 'choose' && (
          <div className="flex items-center gap-2 bg-[#232323] rounded-full px-4 py-3 mt-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 bg-transparent outline-none text-base text-white px-2"
              value={aiBody}
              onChange={e => setAiBody(e.target.value)}
              disabled={aiLoading || isSending}
            />
            <button
              onClick={async () => {
                setAiTo(activeContactEmail);
                await handleAiCompose();
              }}
              disabled={aiLoading || !aiBody.trim()}
              className="bg-[#49516b] text-white font-semibold px-4 py-2 rounded-full transition-colors hover:bg-[#5a5f7a] disabled:opacity-60 flex items-center gap-2"
            >
              {aiLoading && (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              )}
              AI
            </button>
            <button
              onClick={async () => {
                setSubject('');
                setBody(aiBody);
                setComposeStep('manual');
                setIsComposeExpanded(true);
              }}
              disabled={isSending || !aiBody.trim()}
              className="bg-[#49516b] text-white px-4 py-2 rounded-full transition-colors hover:bg-[#5a5f7a] disabled:opacity-60"
              title="Send manually"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}

        {composeStep === 'ai' && (
          <div className='bg-[#2a2a2a] rounded-2xl shadow-xl border border-gray-700 overflow-hidden p-4'>
            <label className='text-xs text-gray-400 mb-1 block'>To</label>
            <input
              type='email'
              value={aiTo}
              onChange={e => setAiTo(e.target.value)}
              className='w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white mb-3'
              disabled={aiLoading}
            />
            <label className='text-xs text-gray-400 mb-1 block'>Message Body</label>
            <textarea
              value={aiBody}
              onChange={e => setAiBody(e.target.value)}
              placeholder='Type your request...'
              className='w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white min-h-[80px] mb-3'
              disabled={aiLoading}
            />
            <div className='flex gap-2'>
              <button
                onClick={handleAiCompose}
                disabled={aiLoading || !aiBody.trim() || !aiTo.trim()}
                className='flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-md'
              >
                {aiLoading ? "Composing..." : "Compose with AI"}
              </button>
              <button
                onClick={handleCancelAll}
                className='px-4 py-2.5 rounded-lg border border-gray-600 hover:bg-[#3a3a3a] transition-colors'
              >
                Cancel
              </button>
            </div>
            {sendError && <div className="text-red-400 mt-2">{sendError}</div>}
          </div>
        )}

        {composeStep === 'review' && (
          <div className='bg-[#2a2a2a] rounded-2xl shadow-xl border border-gray-700 overflow-hidden p-4'>
            <label className='text-xs text-gray-400 mb-1 block'>Subject</label>
            <input
              type='text'
              value={reviewSubject}
              onChange={e => setReviewSubject(e.target.value)}
              className='w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white mb-3'
              disabled={isSending}
            />
            <label className='text-xs text-gray-400 mb-1 block'>Body</label>
            <textarea
              value={reviewBody}
              onChange={e => setReviewBody(e.target.value)}
              className='w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-white min-h-[120px] mb-3'
              disabled={isSending}
            />
            <div className='flex gap-2'>
              <button
                onClick={handleSendReviewedEmail}
                disabled={isSending || !reviewSubject.trim() || !reviewBody.trim()}
                className='flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-md'
              >
                {isSending ? "Sending..." : "Send Email"}
              </button>
              <button
                onClick={handleCancelAll}
                className='px-4 py-2.5 rounded-lg border border-gray-600 hover:bg-[#3a3a3a] transition-colors'
              >
                Cancel
              </button>
            </div>
            {sendError && <div className="text-red-400 mt-2">{sendError}</div>}
          </div>
        )}

        {composeStep === 'manual' && isComposeExpanded && (
          <div className='bg-[#2a2a2a] rounded-2xl shadow-xl border border-gray-700 overflow-hidden'>
            {/* Compose Header */}
            <div className='flex justify-between items-center px-4 py-3 border-b border-gray-700'>
              <h3 className='font-semibold flex items-center gap-2'>
                <Mail className="w-5 h-5 text-purple-400" />
                New Email to {activeContactEmail}
              </h3>
              <button
                onClick={handleCancelAll}
                className='hover:bg-[#3a3a3a] rounded p-1.5 transition-colors'
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Compose Form */}
            <div className='p-4 space-y-3'>
              <div>
                <label htmlFor="email-subject" className='text-xs text-gray-400 mb-1 block'>
                  Subject
                </label>
                <input
                  id="email-subject"
                  type='text'
                  placeholder='Enter email subject'
                  className='w-full bg-[#1a1a1a] border border-gray-700 focus:border-purple-500 outline-none rounded-lg px-3 py-2.5 text-white transition-colors'
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={isSending}
                />
              </div>

              <div>
                <label htmlFor="email-body" className='text-xs text-gray-400 mb-1 block'>
                  Message
                </label>
                <textarea
                  id="email-body"
                  placeholder='Type your message...'
                  className='w-full bg-[#1a1a1a] border border-gray-700 focus:border-purple-500 outline-none rounded-lg px-3 py-2.5 text-white min-h-[120px] resize-y transition-colors'
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  disabled={isSending}
                />
              </div>

              {/* Send Error */}
              {sendError && (
                <div className="bg-red-600/20 border border-red-600 text-red-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {sendError}
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex gap-2 pt-2'>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || !subject.trim() || !body.trim()}
                  className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-md'
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelAll}
                  disabled={isSending}
                  className='px-4 py-2.5 rounded-lg border border-gray-600 hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailDisplay;