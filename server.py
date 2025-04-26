from flask import Flask, request, jsonify
from flask_cors import CORS
from llm_connect import get_feedback
from questions import technical_questions, behavioral_questions
import time
import uuid

app = Flask(__name__)
CORS(app)

# Store sessions in a dictionary with domain-specific tracking
sessions = {}

@app.route('/clear-session', methods=['POST'])
def clear_session():
    """Endpoint to explicitly clear sessions when domain changes"""
    data = request.json
    domain = data.get('domain')
    mode = data.get('mode')
    
    # Remove any sessions with matching domain/mode
    for sid in list(sessions.keys()):
        if f"-{domain}-{mode}-" in sid:
            del sessions[sid]
    
    return jsonify({"message": "Sessions cleared"}), 200

@app.route('/next-question', methods=['GET'])
def next_question():
    # Get session parameters from request
    session_id = request.args.get('sessionId')
    role = request.args.get('role')
    domain = request.args.get('domain')
    mode = request.args.get('mode')
    asked_questions_str = request.args.get('askedQuestions', '')
    
    # If domain is none, default to general questions
    if domain == 'none':
        domain = 'general'  # Map 'none' to 'general' questions
    
    # Safe parsing of asked questions
    asked_questions = []
    if asked_questions_str and asked_questions_str != 'null' and asked_questions_str != '':
        asked_questions = [q for q in asked_questions_str.split(',') if q]
    
    print(f"Request: session={session_id}, role={role}, domain={domain}, mode={mode}")
    print(f"Asked questions from client: {len(asked_questions)}")
    
    # Create a new session if this is a new session ID
    if session_id not in sessions:
        # Select questions based on mode and domain
        if mode == 'technical':
            if domain in technical_questions:
                questions = technical_questions[domain].copy()  # Create a copy
            else:
                questions = []
        elif mode == 'behavioral':
            questions = behavioral_questions.copy()  # Create a copy
        else:
            questions = []
        
        # Create new session with a fresh question pool
        sessions[session_id] = {
            "questions": questions,
            "asked_questions": [],
            "role": role,
            "domain": domain, 
            "mode": mode,
            "created_at": time.time()
        }
        print(f"Created new session {session_id} with {len(questions)} questions")
    
    # Get the session
    session = sessions[session_id]
    
    # CRITICAL: Ensure asked_questions contains ALL questions that were ever asked
    # This combines client-side tracking with server-side tracking
    all_asked_questions = list(set(session['asked_questions'] + asked_questions))
    session['asked_questions'] = all_asked_questions
    
    # Find available questions - questions that haven't been asked yet
    available_questions = []
    for question in session['questions']:
        if not question or question in all_asked_questions:
            continue
        available_questions.append(question)
    
    print(f"Available questions: {len(available_questions)}")
    
    if available_questions:
        # Pick the first available question
        next_question = available_questions[0]
        # Add to server-side tracking of asked questions
        session['asked_questions'].append(next_question)
        print(f"Returning question: {next_question}")
        return jsonify({"question": next_question})
    
    # If we get here, all questions have been asked
    print(f"No more questions available for session {session_id}")
    return jsonify({"message": "No more questions"}), 404

@app.route('/submit-answer', methods=['POST'])
def submit_answer():
    data = request.json
    answer = data.get('answer')
    question = data.get('question')
    
    # Process the answer and get feedback
    feedback = get_feedback(f"Question: {question}\n\nAnswer: {answer}\n\nPlease provide feedback on this answer.")
    
    return jsonify({"feedback": feedback})

@app.route('/interview-summary', methods=['POST'])
def interview_summary():
    data = request.json
    session_id = data.get('sessionId')
    role = data.get('role')
    domain = data.get('domain')
    mode = data.get('mode')
    candidate_name = data.get('candidateName', 'the candidate')
    completed_qa = data.get('completedQA', [])
    
    # Format the Q&A for the LLM
    questions_answers = "\n\n".join([
        f"Question: {qa['question']}\nAnswer: {qa['answer']}\nFeedback: {qa['feedback']}"
        for qa in completed_qa
    ])
    
    # Generate the summary using your LLM with an improved prompt for better formatting
    prompt = f"""
You are an expert interviewer evaluating {candidate_name} for a {role} role.
The candidate just completed a {mode} interview focused on {domain} domain.

Here are the questions, answers, and individual feedback from the interview:

{questions_answers}

Please provide a comprehensive evaluation of {candidate_name}'s performance, structured with these exact sections:

1. Overall Performance: Give a general assessment.

2. Strengths: Highlight 2-3 areas where the candidate performed well.

3. Areas for Improvement: Identify 2-3 areas where the candidate could improve.

4. Actionable Next Steps: Provide specific advice for improvement.

FORMAT REQUIREMENTS:
- Use the exact section headings above (with numbers and colons)
- Place each section heading on its own line
- Insert a blank line between sections
- Make each paragraph focused on a single aspect
- Use clear, specific examples from their answers
- End with "Best regards," without adding your name or title
"""
    
    summary = get_feedback(prompt)
    
    return jsonify({"summary": summary})

# Clean up old sessions periodically (older than 30 minutes)
@app.before_request
def cleanup_old_sessions():
    current_time = time.time()
    for sid in list(sessions.keys()):
        if current_time - sessions[sid]['created_at'] > 1800:  # 30 minutes
            del sessions[sid]

if __name__ == '__main__':
    app.run(port=5000, debug=True)