import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Clock, User, ArrowLeft, Loader2, FileText, Code } from 'lucide-react';
import useAuth from '../auth/useAuth';
import DOMPurify from 'dompurify';

const AllMails = () => {
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAllEmails();
  }, [loading, isAuthenticated, navigate]);

  const fetchAllEmails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/emails/');
      setEmails(response.data.emails);
      setNextPageToken(response.data.next_page_token);
      setHasMore(!!response.data.next_page_token);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      setError(
        error.response?.status === 401
          ? "You are not authorized. Please log in again."
          : "Failed to fetch emails. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreEmails = async () => {
    if (!nextPageToken || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/emails/?page_token=${nextPageToken}`);
      setEmails(prevEmails => [...prevEmails, ...response.data.emails]);
      setNextPageToken(response.data.next_page_token);
      setHasMore(!!response.data.next_page_token);
    } catch (error) {
      console.error("Failed to load more emails:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Load more when user is 200px from bottom
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !isLoadingMore) {
      loadMoreEmails();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const parseFrom = (fromString) => {
    const match = fromString.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: fromString, email: fromString };
  };

  const handleEmailClick = (email) => {
    // Fetch the full email details from the API
    setIsLoading(true);
    axios.get(`http://127.0.0.1:8000/emails/${email.id}/`)
      .then(response => {
        setSelectedEmail(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch email details:", error);
        setError("Failed to load email details. Please try again.");
        setIsLoading(false);
      });
  };

  const handleBack = () => {
    if (selectedEmail) {
      setSelectedEmail(null);
    } else {
      navigate(-1);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchAllEmails}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center shadow-lg">
        <button
          onClick={handleBack}
          className="mr-3 p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-xl font-semibold text-white">
          {selectedEmail ? 'Email Details' : 'All Mails'}
        </h1>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-64px)] overflow-hidden">
        {selectedEmail ? (
          <EmailDetailView email={selectedEmail} />
        ) : (
          <EmailListView
            emails={emails}
            onEmailClick={handleEmailClick}
            formatDate={formatDate}
            parseFrom={parseFrom}
            onScroll={handleScroll}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
          />
        )}
      </div>
    </div>
  );
};

// Email List View Component
const EmailListView = ({ emails, onEmailClick, formatDate, parseFrom }) => {
  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      {emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Mail className="w-16 h-16 mb-4" />
          <p className="text-lg">No emails found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {emails.map((email) => {
            const { name, email: emailAddr } = parseFrom(email.from);
            return (
              <div
                key={email.id}
                onClick={() => onEmailClick(email)}
                className="px-6 py-4 hover:bg-gray-900 cursor-pointer transition-colors bg-gray-950 border-b border-gray-800/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <span className="text-sm font-semibold text-white">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{name}</p>
                      <p className="text-sm text-gray-400 truncate">{emailAddr}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500 ml-4">
                    {formatDate(email.date)}
                  </div>
                </div>
                <div className="ml-13">
                  <p className="font-medium text-gray-200 mb-1 truncate">{email.subject}</p>
                  <p className="text-sm text-gray-400 line-clamp-2">{email.snippet}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Email Detail View Component
const EmailDetailView = ({ email }) => {
  const [viewMode, setViewMode] = useState('auto'); // 'auto', 'html', 'text'
  
  const parseFrom = (fromString) => {
    const match = fromString.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: fromString, email: fromString };
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const { name, email: emailAddr } = parseFrom(email.from);
  
  // Determine what to display based on content type and view mode
  const shouldShowHtml = () => {
    if (viewMode === 'html') return email.body_html;
    if (viewMode === 'text') return false;
    // Auto mode: show HTML if available and no plain text, or if it's HTML type
    return email.body_html && (!email.body || email.content_type === 'text/html' || email.content_type === 'multipart');
  };
  
  const hasMultipleFormats = email.body && email.body_html;
  
  // Sanitize HTML content
  const sanitizeHtml = (html) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'blockquote', 'pre', 'code', 'img', 'div', 'span', 
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'tfoot',
        'hr', 'b', 'i', 's', 'sub', 'sup', 'center', 'font',
        'address', 'cite', 'del', 'ins', 'mark', 'small'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style', 'target',
        'width', 'height', 'align', 'border', 'bgcolor', 'color',
        'colspan', 'rowspan', 'cellpadding', 'cellspacing',
        'valign', 'type', 'start', 'dir'
      ],
      ALLOWED_STYLES: {
        '*': {
          'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
          'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
          'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
          'font-size': [/^\d+(?:px|em|rem|%)$/],
          'font-weight': [/^\d+$/, /^bold$/, /^normal$/],
          'padding': [/^\d+(?:px|em|rem|%)$/],
          'margin': [/^\d+(?:px|em|rem|%)$/],
          'border': [/.*/],
          'border-radius': [/^\d+(?:px|em|rem|%)$/],
          'width': [/^\d+(?:px|em|rem|%)$/, /^auto$/],
          'max-width': [/^\d+(?:px|em|rem|%)$/],
          'height': [/^\d+(?:px|em|rem|%)$/, /^auto$/],
          'display': [/^block$/, /^inline$/, /^inline-block$/],
          'text-decoration': [/^none$/, /^underline$/],
        }
      },
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true,
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      <div className="max-w-4xl mx-auto p-6">
        {/* Email Header */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-4">{email.subject}</h1>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-semibold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-white">{name}</p>
                  <p className="text-sm text-gray-400">&lt;{emailAddr}&gt;</p>
                </div>
              </div>
              
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center text-gray-400">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium mr-2">To:</span>
                  <span>{email.to}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{formatFullDate(email.date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
          {/* View Toggle (only show if multiple formats available) */}
          {hasMultipleFormats && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-800/30">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400 font-medium">View as:</span>
                <div className="flex space-x-1 bg-gray-950 rounded-lg p-1 border border-gray-800">
                  <button
                    onClick={() => setViewMode('auto')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                      viewMode === 'auto'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setViewMode('html')}
                    className={`px-3 py-1.5 text-xs rounded-md flex items-center space-x-1.5 transition-all font-medium ${
                      viewMode === 'html'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>HTML</span>
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1.5 text-xs rounded-md flex items-center space-x-1.5 transition-all font-medium ${
                      viewMode === 'text'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Plain Text</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 font-mono border border-gray-700">
                  {email.content_type}
                </span>
              </div>
            </div>
          )}
          
          {/* Email Content */}
          <div className={`${shouldShowHtml() ? 'p-0' : 'p-6'}`}>
            {shouldShowHtml() ? (
              <div className="min-h-[200px]">
                <div 
                  className="email-html-content p-8"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body_html) }}
                />
              </div>
            ) : (
              <div className="min-h-[200px]">
                <div className="bg-gray-950 rounded-lg p-6 border border-gray-800">
                  <pre className="text-gray-300 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                    {email.body || email.snippet || 'No content available'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Metadata */}
        {email.message_id && (
          <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800 shadow-lg">
            <p className="text-xs text-gray-500 font-mono break-all">
              Message-ID: {email.message_id}
            </p>
            {email.thread_id && (
              <p className="text-xs text-gray-500 font-mono break-all mt-2">
                Thread-ID: {email.thread_id}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMails;
