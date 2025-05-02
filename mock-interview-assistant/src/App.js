import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const formatSummary = (summaryText) => {
  if (!summaryText) return null;

  // Remove "Your name interviewer" if present
  summaryText = summaryText.replace(/\n*Your name interviewer$/i, '');

  // Use a more reliable approach: Extract each section by directly parsing the content
  const sections = [];
  let remainingText = summaryText;
  
  // List of sections we expect to find in order
  const expectedSections = [
    { id: "overall", title: /\d+\.\s*Overall Performance:?/i },
    { id: "strengths", title: /\d+\.\s*Strengths:?/i },
    { id: "improvement", title: /\d+\.\s*Areas for Improvement:?/i },
    { id: "steps", title: /\d+\.\s*Actionable Next Steps:?/i }
  ];
  
  // Extract each section
  for (let i = 0; i < expectedSections.length; i++) {
    const section = expectedSections[i];
    const match = remainingText.match(section.title);
    
    if (match) {
      const startIndex = match.index;
      const headerText = match[0];
      
      // Find the start of the next section (or end of text)
      let endIndex = remainingText.length;
      if (i < expectedSections.length - 1) {
        const nextMatch = remainingText.match(expectedSections[i + 1].title);
        if (nextMatch) {
          endIndex = nextMatch.index;
        }
      }
      
      // Extract section content (excluding the header)
      const contentStartIndex = startIndex + headerText.length;
      const content = remainingText.substring(contentStartIndex, endIndex).trim();
      
      // Add to our sections array
      sections.push({ 
        id: section.id,
        header: headerText.trim(), 
        content: content 
      });
      
      // Update remaining text to start from this section's end
      remainingText = remainingText.substring(endIndex);
    }
  }
  
  // Check for closing text (like "Best regards")
  const closingMatch = remainingText.match(/Best regards,?/i);
  if (closingMatch) {
    sections.push({
      id: "closing",
      header: null,
      content: remainingText.trim()
    });
  }
  
  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        if (section.id === "closing") {
          return (
            <div key={index} className="text-right italic text-gray-600 mt-6">
              {section.content}
            </div>
          );
        }
        
        // Determine styling based on section ID
        let borderColor, bgColor;
        switch(section.id) {
          case "overall":
            borderColor = "border-blue-500";
            bgColor = "bg-blue-50";
            break;
          case "strengths":
            borderColor = "border-green-500";
            bgColor = "bg-green-50";
            break;
          case "improvement":
            borderColor = "border-amber-500";
            bgColor = "bg-amber-50";
            break;
          case "steps":
            borderColor = "border-red-500";
            bgColor = "bg-red-50";
            break;
          default:
            borderColor = "border-gray-300";
            bgColor = "bg-gray-50";
        }
        
        // Process content for bullet points
        const contentLines = section.content.split('\n').filter(line => line.trim());
        
        return (
          <div key={index} className={`pl-4 border-l-4 ${borderColor} ${bgColor} p-4 rounded mb-6`}>
            <h4 className="text-xl font-bold text-gray-800 mb-3">{section.header}</h4>
            <div className="space-y-2">
              {contentLines.map((line, lineIdx) => {
                const trimmedLine = line.trim();
                
                // Check for section title repeats in the first line and skip if found
                if (lineIdx === 0) {
                  for (const name of ["Overall Performance", "Strengths", "Areas for Improvement", "Actionable Next Steps"]) {
                    if (trimmedLine === name) {
                      return null;
                    }
                  }
                }
                
                // Format bullet points
                if (trimmedLine.startsWith('•') || trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
                  return (
                    <div key={lineIdx} className="flex mb-2">
                      <span className="mr-2">•</span>
                      <p className="text-gray-800">{trimmedLine.replace(/^[•*-]\s*/, '')}</p>
                    </div>
                  );
                }
                
                return trimmedLine ? (
                  <p key={lineIdx} className="text-gray-800 mb-2">{trimmedLine}</p>
                ) : null;
              })}
            </div>
          </div>
        );
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