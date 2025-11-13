/**
 * AI Email Agent Hook
 * Connects to Django backend which communicates with LangGraph server
 */

import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const useEmailAgent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * Send email using natural language with AI agent
   * @param {string} message - Natural language message like "send that I'm on leave to my manager"
   * @returns {Promise<Object>} Result from the agent
   */
  const sendWithAgent = async (message) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated. Please login.');
      }

      const response = await axios.post(
        `${API_BASE_URL}/agent/send/`,
        { message },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes
        }
      );

      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send email';
      const errorHelp = err.response?.data?.help;
      
      setError({
        message: errorMessage,
        help: errorHelp,
        status: err.response?.status,
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if LangGraph agent is available
   * @returns {Promise<Object>} Health status
   */
  const checkAgentHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_BASE_URL}/agent/health/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (err) {
      console.error('Agent health check failed:', err);
      return {
        status: 'error',
        error: err.message,
      };
    }
  };

  return {
    sendWithAgent,
    checkAgentHealth,
    loading,
    error,
    result,
  };
};

export default useEmailAgent;
