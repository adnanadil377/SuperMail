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

  const exampleCommands = [
    "Send that I'm on leave for 5 days to my manager and colleagues",
    "Tell my manager I'll be late tomorrow",
    "Send meeting notes to all colleagues",
    "Inform my manager about project completion"
  ];

  const handleAgentSend = async (action = 'continue') => {
    if (!agentMessage.trim() && action === 'continue') {
      setAgentError('Please enter a message.');
      return;
    }

    setAgentLoading(true);
    setAgentError(null);
    setAgentSuccess(null);

    // Add user message to conversation
    const userMsg = { role: 'user', content: agentMessage };
    setConversation(prev => [...prev, userMsg]);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const response = await axios.post(
        'http://127.0.0.1:8000/agent/send/',
        {
          message: agentMessage,
          thread_id: threadId,
          action: action
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 120000
        }
      );

      const { status, message, thread_id, emails_preview, emails_sent, recipients } = response.data;
      
      // Add agent response to conversation
      const agentMsg = { role: 'agent', content: message };
      setConversation(prev => [...prev, agentMsg]);
      
      // Update thread ID for conversation continuity
      if (thread_id) setThreadId(thread_id);
      
      // Handle different statuses
      if (status === 'needs_info') {
        // Agent is asking for more information
        setAgentMessage('');
        setAwaitingApproval(false);
      } else if (status === 'awaiting_approval') {
        // Show preview and wait for approval
        setEmailsPreview(emails_preview || []);
        setAwaitingApproval(true);
        setAgentMessage('');
      } else if (status === 'complete') {
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
    setAgentMessage('send');
    handleAgentSend('send');
  };

  const handleCancel = () => {
    setConversation([]);
    setThreadId(null);
    setAwaitingApproval(false);
    setEmailsPreview([]);
    setAgentMessage('');
    setAgentSuccess('❌ Cancelled. Emails were not sent.');
    setTimeout(() => setAgentSuccess(null), 3000);
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
    <div className="h-[97vh] bg-[#212121] rounded-2xl p-6 mb-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white">AI Email Agent</h3>
        <span className="text-xs bg-purple-500/30 px-3 py-1 rounded-full text-gray-200">
          Powered by Google Gemini
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-4">
        Describe what you want to send, and I’ll identify the recipients, set the tone, and deliver personalized emails automatically.
      </p>

      {/* Example Commands */}
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

      {/* Input Area */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            placeholder="E.g., 'Send that I'm on leave for 5 days to my manager and colleagues'"
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
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
            {agentError}
          </div>
        )}

        {/* Success Message */}
        {agentSuccess && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-200 text-sm">
            {agentSuccess}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleAgentSend}
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
            <span>Send via AI Agent</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIEmailAgent;
