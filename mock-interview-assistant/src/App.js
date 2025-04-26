import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const formatSummary = (summaryText) => {
  if (!summaryText) return null;
  
  // Remove interviewer signature if present
  summaryText = summaryText.replace(/\n*Your name interviewer$/i, '');
  
  // Split the summary into paragraphs
  const paragraphs = summaryText.split('\n\n');
  
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, i) => {
        // Check if this is a heading (numbered items or ending with a colon)
        if (/^\d+\.|\w+:$/.test(paragraph.trim())) {
          return (
            <h4 key={i} className="text-lg font-bold text-indigo-700 mt-4">{paragraph}</h4>
          );
        }
        
        // Check if contains "strengths" keyword
        else if (/strength|strong point|excel/i.test(paragraph)) {
          return (
            <div key={i} className="pl-4 border-l-4 border-green-500 bg-green-50 p-3 rounded">
              <p className="text-gray-800">{paragraph}</p>
            </div>
          );
        }
        
        // Check if contains "improve" or "weakness" keywords
        else if (/improve|weaker|weakness|work on/i.test(paragraph)) {
          return (
            <div key={i} className="pl-4 border-l-4 border-amber-500 bg-amber-50 p-3 rounded">
              <p className="text-gray-800">{paragraph}</p>
            </div>
          );
        }
        
        // Check if contains "actionable steps" or "next steps" keywords
        else if (/action|next steps|recommend|suggestion|advice/i.test(paragraph)) {
          return (
            <div key={i} className="pl-4 border-l-4 border-red-500 bg-red-50 p-3 rounded">
              <p className="text-gray-800">{paragraph}</p>
            </div>
          );
        }
        
        // Regular paragraph
        else {
          return <p key={i} className="text-gray-700">{paragraph}</p>;
        }
      })}
    </div>
  );
};

function App() {
  // State variables remain unchanged
  const [candidateName, setCandidateName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [completedQA, setCompletedQA] = useState([]);
  const [summaryFeedback, setSummaryFeedback] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [domain, setDomain] = useState('frontend');
  const [mode, setMode] = useState('technical');
  const [started, setStarted] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [sessionId, setSessionId] = useState('');
  
  // Your existing function logic remains the same
  const fetchNextQuestion = useCallback(async () => {
    // Only use the current session's asked questions
    const currentAskedQuestions = askedQuestions.filter(q => q !== '');
    console.log(`Fetching next question. Current asked: ${currentAskedQuestions.length}`);
    
    try {
      const res = await axios.get('/next-question', {
        params: { 
          role, 
          domain, 
          mode,
          sessionId,
          askedQuestions: currentAskedQuestions.join(',')
        }
      });
      
      if (res.data.question) {
        setQuestion(res.data.question);
        setFeedback('');
        setAnswer('');
        // Add to the list of asked questions
        if (!currentAskedQuestions.includes(res.data.question)) {
          setAskedQuestions(prev => [...prev, res.data.question]);
        }
      } else {
        // No more unique questions available
        setQuestion(null);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setQuestion(null);
        setFeedback('');
        setAnswer('');
      } else {
        console.error('Error fetching next question', error);
      }
    }
  }, [role, domain, mode, sessionId, askedQuestions]);

  const submitAnswer = async () => {
    try {
      const res = await axios.post('/submit-answer', { 
        answer,
        question,
        sessionId 
      });
      setFeedback(res.data.feedback);
      
      // Track this Q&A pair
      setCompletedQA(prev => [...prev, {
        question,
        answer,
        feedback: res.data.feedback
      }]);
      
    } catch (error) {
      console.error('Error submitting answer', error);
    }
  };
  
  const getInterviewSummary = useCallback(async () => {
    try {
      // Show loading state
      setSummaryFeedback("Analyzing your interview performance...");
      
      const res = await axios.post('/interview-summary', {
        sessionId,
        role,
        domain,
        mode,
        completedQA,
        candidateName  // Include the name in the request
      });
      
      setSummaryFeedback(res.data.summary);
    } catch (error) {
      console.error('Error getting interview summary:', error);
      setSummaryFeedback("Unable to generate interview feedback. You've completed all questions.");
    }
  }, [sessionId, role, domain, mode, completedQA, candidateName]);

  useEffect(() => {
    // If question becomes null (no more questions) and we have completed Q&A pairs
    if (question === null && completedQA.length > 0 && !summaryFeedback) {
      getInterviewSummary();
    }
  }, [question, completedQA, summaryFeedback, getInterviewSummary]);

  const startInterview = async () => {
    // Generate a new session ID first
    const timestamp = Date.now();
    // If domain is none, pass 'general' as the domain for the session ID
    const effectiveDomain = domain === 'none' ? 'general' : domain;
    const newSessionId = `${role}-${effectiveDomain}-${mode}-${timestamp}`;
    
    // Step 2: Clear the server-side session state first
    try {
      await axios.post('/clear-session', { domain, mode });
      console.log('Server session cleared');
    } catch (err) {
      console.log('No clear-session endpoint, continuing');
    }
    
    // Step 3: Reset all client state
    setAskedQuestions([]);
    setQuestion('');
    setAnswer('');
    setFeedback('');
    
    // Step 4: Update session ID after clearing state
    setSessionId(newSessionId);
    setStarted(true);
    console.log(`Starting fresh interview: ${role}/${domain}/${mode}`);
    
    // Step 5: Get the first question with an explicit empty asked questions list
    try {
      const res = await axios.get('/next-question', {
        params: { 
          role, 
          domain, 
          mode,
          sessionId: newSessionId,
          askedQuestions: ''
        }
      });
      
      if (res.data.question) {
        setQuestion(res.data.question);
        // Initialize asked questions with only this first question
        setAskedQuestions([res.data.question]);
      } else {
        setQuestion(null);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Mock Interview Assistant</h1>
          <div className="h-1 w-24 mx-auto bg-white rounded-full mb-8"></div>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {!started ? (
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select Preferences</h2>

              {/* Name field */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Your Name</label>
                <input 
                  type="text" 
                  value={candidateName} 
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Job Role */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Job Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Data Analyst">Data Analyst</option>
                </select>
              </div>

              {/* Domain */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Domain <span className="text-gray-500">(optional)</span>
                </label>
                <select 
                  value={domain} 
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                >
                  <option value="none">None</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="ml">ML</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Interview Mode */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Interview Mode</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="technical"
                      name="mode"
                      checked={mode === 'technical'}
                      onChange={() => setMode('technical')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="technical" className="ml-3 text-gray-700">Technical Interview</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="behavioral"
                      name="mode"
                      checked={mode === 'behavioral'}
                      onChange={() => setMode('behavioral')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="behavioral" className="ml-3 text-gray-700">Behavioral Interview</label>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button 
                onClick={startInterview} 
                disabled={!candidateName.trim()}
                className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  candidateName.trim() 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transform hover:-translate-y-0.5' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Start Interview
              </button>
              
              {!candidateName.trim() && (
                <p className="text-red-500 text-sm mt-2">Please enter your name to continue</p>
              )}
            </div>
          ) : (
            <div className="p-8">
              {question ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">Question for {candidateName}:</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                      <p className="text-gray-800">{question}</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="answer" className="block text-gray-700 text-sm font-medium mb-2">Your Answer:</label>
                    <textarea
                      id="answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows="6"
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <button 
                    onClick={submitAnswer}
                    disabled={!answer.trim()}
                    className={`px-6 py-3 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                      answer.trim() 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md' 
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Submit Answer
                  </button>

                  {feedback && (
                    <div className="mt-8 space-y-4">
                      <h2 className="text-xl font-semibold text-gray-800">Feedback:</h2>
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                        <p className="text-gray-800 whitespace-pre-wrap">{feedback}</p>
                      </div>
                      
                      <button 
                        onClick={fetchNextQuestion} 
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-md font-medium shadow-md transform transition hover:-translate-y-0.5"
                      >
                        Next Question
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Interview Complete!</h2>
                  <p className="text-lg text-gray-600">Good job, {candidateName}!</p>
                  
                  {summaryFeedback ? (
                    <div className="mt-8 text-left">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Summary:</h3>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm">
                        {formatSummary(summaryFeedback)}
                      </div>
                      
                      <div className="flex justify-center mt-8">
                        <button 
                          onClick={() => {
                            setStarted(false);
                            setCompletedQA([]);
                            setSummaryFeedback('');
                          }} 
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md font-medium shadow-lg transform transition hover:-translate-y-0.5"
                        >
                          Start New Interview
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-700">Analyzing {candidateName}'s performance...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center text-sm text-white opacity-75">
          © {new Date().getFullYear()} Mock Interview Assistant
        </div>
      </div>
    </div>
  );
}

export default App;