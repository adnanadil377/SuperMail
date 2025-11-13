import { useState } from "react";
import axios from "axios";

const AIEmailAgent = ({ user, onSuccess }) => {
  const [agentMessage, setAgentMessage] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState(null);
  const [agentSuccess, setAgentSuccess] = useState(null);
  
  // Conversation state
  const [conversation, setConversation] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [emailsPreview, setEmailsPreview] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedEmails, setEditedEmails] = useState([]);

  const exampleCommands = [
    "Send that I'm on leave for 5 days to my manager and colleagues",
    "Tell my manager I'll be late tomorrow",
    "Summarize my recent emails",
    "Show me a summary of my inbox",
    "Send meeting notes to all colleagues",
    "Inform my manager about project completion"
  ];

  const handleAgentSend = async (action = 'continue', editedEmailsData = null) => {
    if (!agentMessage.trim() && action === 'continue') {
      setAgentError('Please enter a message.');
      return;
    }

    setAgentLoading(true);
    setAgentError(null);
    setAgentSuccess(null);

    // Add user message to conversation
    if (agentMessage.trim()) {
      const userMsg = { role: 'user', content: agentMessage };
      setConversation(prev => [...prev, userMsg]);
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const requestBody = {
        message: agentMessage || 'send',
        thread_id: threadId,
        action: action
      };

      // If sending with edited emails, include them
      if (action === 'send' && editedEmailsData) {
        requestBody.edited_emails = editedEmailsData;
      }

      const response = await axios.post(
        'http://127.0.0.1:8000/agent/send/',
        requestBody,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 120000
        }
      );

      const { status, message, thread_id, emails_preview, emails_sent, recipients, action_type } = response.data;
      
      console.log('📦 Agent response:', { status, message: message?.substring(0, 100), thread_id, action_type });
      
      // Add agent response to conversation
      const agentMsg = { role: 'agent', content: message };
      setConversation(prev => [...prev, agentMsg]);
      
      // Update thread ID for conversation continuity
      if (thread_id) setThreadId(thread_id);
      
      // Handle different statuses
      if (status === 'summary') {
        console.log('📊 Received email summary');
        // Email summary received - just display it
        setAgentMessage('');
        setAwaitingApproval(false);
      } else if (status === 'needs_info') {
        console.log('❓ Agent needs more info');
        // Agent is asking for more information
        setAgentMessage('');
        setAwaitingApproval(false);
      } else if (status === 'awaiting_approval') {
        console.log('📧 Showing email preview');
        // Show preview and wait for approval
        setEmailsPreview(emails_preview || []);
        setEditedEmails(emails_preview || []); // Initialize edited emails
        setAwaitingApproval(true);
        setAgentMessage('');
      } else if (status === 'complete') {
        console.log('✅ Process complete');
        // Emails sent successfully
        setAgentSuccess(`✅ Successfully sent ${emails_sent} email(s) to: ${recipients.join(', ')}`);
        setAgentMessage('');
        setAwaitingApproval(false);
        setEmailsPreview([]);
        
        // Reset conversation after success
        setTimeout(() => {
          setConversation([]);
          setThreadId(null);
          setAgentSuccess(null);
        }, 5000);
        
        if (onSuccess) setTimeout(() => onSuccess(), 1000);
      }

    } catch (error) {
      console.error('Agent error:', error);
      let errorMessage = 'Failed to process request. Please try again.';

      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.detail || errorMessage;
        if (error.response.data?.help) {
          errorMessage += `\n\n💡 ${error.response.data.help}`;
        }
      } else if (error.request) {
        errorMessage = 'Cannot connect to backend server. Please ensure Django is running on port 8000.';
      } else {
        errorMessage = error.message;
      }

      setAgentError(errorMessage);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleApprove = () => {
    // Send with edited emails (or original if not edited)
    handleAgentSend('send', emailsPreview);
  };

  const handleCancel = () => {
    setConversation([]);
    setThreadId(null);
    setAwaitingApproval(false);
    setEmailsPreview([]);
    setEditedEmails([]);
    setEditingIndex(null);
    setAgentMessage('');
    setAgentSuccess('❌ Cancelled. Emails were not sent.');
    setTimeout(() => setAgentSuccess(null), 3000);
  };

  const handleEditEmail = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index) => {
    setEmailsPreview(editedEmails);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditedEmails([...emailsPreview]);
    setEditingIndex(null);
  };

  const updateEditedEmail = (index, field, value) => {
    const updated = [...editedEmails];
    updated[index] = { ...updated[index], [field]: value };
    setEditedEmails(updated);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) handleAgentSend();
  };

  const fillExample = (example) => {
    setAgentMessage(example);
    setAgentError(null);
    setAgentSuccess(null);
  };

  return (
    <div className="h-[97vh] bg-[#212121] rounded-2xl p-6 mb-4 shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white">AI Email Agent</h3>
        <span className="text-xs bg-purple-500/30 px-3 py-1 rounded-full text-gray-200">
          Powered by Google Gemini
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-4">
        Describe what you want to send, and I'll ask for details, show you a preview, and send when you approve.
      </p>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="mb-4 space-y-2 bg-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto">
          <p className="text-xs text-gray-400 font-semibold mb-2">Conversation:</p>
          {conversation.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-200 ml-8' : 'bg-green-600/20 text-green-200 mr-8'}`}>
              <span className="text-xs font-semibold block mb-1">{msg.role === 'user' ? '👤 You' : '🤖 Agent'}:</span>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Email Preview Section */}
      {awaitingApproval && emailsPreview.length > 0 && (
        <div className="mb-4 bg-slate-800 rounded-xl p-4 border-2 border-purple-500">
          <h4 className="text-lg font-bold text-white mb-3">📧 Email Preview</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {emailsPreview.map((email, idx) => (
              <div key={idx} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">Email {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full text-purple-200">{email.tone}</span>
                    {editingIndex !== idx && (
                      <button
                        onClick={() => handleEditEmail(idx)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full text-white transition-colors"
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </div>
                
                {editingIndex === idx ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">To:</label>
                      <p className="text-sm text-white bg-slate-600 rounded p-2">
                        {email.to_name} <span className="text-gray-400">({email.to})</span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Subject:</label>
                      <input
                        type="text"
                        value={editedEmails[idx]?.subject || ''}
                        onChange={(e) => updateEditedEmail(idx, 'subject', e.target.value)}
                        className="w-full bg-slate-600 text-white rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Body:</label>
                      <textarea
                        value={editedEmails[idx]?.body || ''}
                        onChange={(e) => updateEditedEmail(idx, 'body', e.target.value)}
                        rows="8"
                        className="w-full bg-slate-600 text-white rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(idx)}
                        className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
                      >
                        ✗ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <p className="text-sm text-white mb-1">
                      <strong>To:</strong> {email.to_name} <span className="text-gray-400">({email.to})</span>
                    </p>
                    <p className="text-sm text-white mb-3">
                      <strong>Subject:</strong> {email.subject}
                    </p>
                    <div className="text-sm text-gray-300 bg-slate-900 rounded p-3 mt-2">
                      <p className="text-xs text-gray-400 mb-2 font-semibold">Body:</p>
                      <p className="whitespace-pre-wrap">{email.body}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {/* Approval Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleApprove}
              disabled={agentLoading || editingIndex !== null}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl px-4 py-3 font-semibold transition-all text-white flex items-center justify-center gap-2"
            >
              {agentLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>✅ Send All Emails</>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={agentLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl px-4 py-3 font-semibold transition-all text-white"
            >
              ❌ Cancel
            </button>
          </div>
          
          {editingIndex !== null && (
            <p className="text-xs text-yellow-400 mt-2 text-center">
              ⚠️ Please save or cancel your edits before sending
            </p>
          )}
        </div>
      )}

      {/* Example Commands */}
      {!awaitingApproval && conversation.length === 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-gray-400 font-semibold">Example commands:</p>
          <div className="flex flex-wrap gap-2">
            {exampleCommands.map((example, idx) => (
              <button
                key={idx}
                onClick={() => fillExample(example)}
                disabled={agentLoading}
                className="text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-600 hover:border-purple-500 transition-colors duration-200"
              >
                {example.length > 40 ? example.substring(0, 40) + '...' : example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      {!awaitingApproval && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              placeholder={conversation.length > 0 ? "Answer the question above..." : "E.g., 'Send that I'm on leave for 5 days to my manager and colleagues'"}
              className="w-full bg-slate-700 rounded-xl p-3 pr-16 outline-none text-white resize-none focus:ring-2 focus:ring-purple-500 transition-all"
              rows="3"
              value={agentMessage}
              onChange={e => setAgentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={agentLoading}
            />
            {agentMessage && !agentLoading && (
              <button
                onClick={() => setAgentMessage('')}
                className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-600 transition-colors"
                title="Clear"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="text-xs text-gray-400">
            Press <span className="font-semibold text-gray-300">Ctrl + Enter</span> to send.
          </div>

          {/* Error Message */}
          {agentError && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm whitespace-pre-wrap">
              {agentError}
            </div>
          )}

          {/* Success Message */}
          {agentSuccess && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-200 text-sm whitespace-pre-wrap">
              {agentSuccess}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={() => handleAgentSend()}
            disabled={agentLoading || !agentMessage.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl px-6 py-3 font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-white"
          >
            {agentLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Processing with AI...</span>
              </span>
            ) : (
              <span>{conversation.length > 0 ? 'Continue' : 'Send via AI Agent'}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AIEmailAgent;
