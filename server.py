from flask import Flask, request, jsonify
from flask_cors import CORS
from llm_connect import get_feedback
import time
import uuid

app = Flask(__name__)
CORS(app)

# Store sessions in a dictionary
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
        domain = 'general'
    
    # Safe parsing of asked questions
    asked_questions = []
    if asked_questions_str and asked_questions_str != 'null' and asked_questions_str != '':
        asked_questions = [q for q in asked_questions_str.split(',') if q]
    
    print(f"Request: session={session_id}, role={role}, domain={domain}, mode={mode}")
    print(f"Asked questions from client: {len(asked_questions)}")
    
    # Create a new session if this is a new session ID
    if session_id not in sessions:
        sessions[session_id] = {
            "asked_questions": [],
            "topics_covered": [],  # Keep track of topics to avoid repetition
            "question_count": 0,
            "role": role,
            "domain": domain, 
            "mode": mode,
            "created_at": time.time(),
            "performance_scores": [],  # Track performance scores
            "difficulty_level": "moderate"  # Start with moderate difficulty
        }
        print(f"Created new session {session_id}")
    
    # Get the session
    session = sessions[session_id]
    
    # CRITICAL: Ensure asked_questions contains ALL questions that were ever asked
    all_asked_questions = list(set(session['asked_questions'] + asked_questions))
    session['asked_questions'] = all_asked_questions
    
    # Calculate adaptive question limit based on performance
    performance_avg = sum(session['performance_scores']) / max(len(session['performance_scores']), 1) if session['performance_scores'] else 3.0
    
    # Determine max questions based on performance (3-5 range)
    if performance_avg >= 4.0:  # Excellent performance
        max_questions = 5
    elif performance_avg >= 3.0:  # Good performance
        max_questions = 4
    else:  # Average or below performance
        max_questions = 3
    
    # Check if we've already asked enough questions
    if session['question_count'] >= max_questions:
        print(f"Reached adaptive question limit ({max_questions}) for session {session_id}")
        return jsonify({"message": "No more questions"}), 404
    
    # Adjust difficulty based on performance
    if performance_avg >= 4.0:
        difficulty = "challenging"
    elif performance_avg >= 3.0:
        difficulty = "moderate"
    else:
        difficulty = "basic"
    
    session['difficulty_level'] = difficulty
    
    # Generate a new question based on role, domain, mode, and adaptive difficulty
    topics_covered = ", ".join(session['topics_covered']) if session['topics_covered'] else "none"
    
    prompt = f"""You are an expert interviewer conducting a {mode} interview for a {role} position.
The candidate specializes in {domain} development.

Previous topics covered: {topics_covered}
Performance level: The candidate is performing at a {performance_avg}/5 level so far.

Generate ONE {session['difficulty_level']}-level {mode} interview question that:
1. Is tailored specifically for a {role} role
2. Focuses on {domain} expertise
3. Is different from topics already covered
4. Is concise and clear (1-2 sentences only)
5. Does NOT include any explanatory text, notes, or context - ONLY the question itself

The difficulty should be {session['difficulty_level']} - {"more theoretical and advanced" if difficulty == "challenging" else "foundational and straightforward" if difficulty == "basic" else "balanced between theory and application"}.

DO NOT number the question or add any prefix like 'Question:'. Just provide the direct question text.
"""
    
    # Get a new question from the LLM
    new_question = get_feedback(prompt).strip()
    print(f"Generated new {difficulty} question: {new_question}")
    
    # Increment the question count
    session['question_count'] += 1
    
    # Add to server-side tracking of asked questions
    session['asked_questions'].append(new_question)
    
    # Extract a topic keyword from the question to track for diversity
    topic_words = [word for word in new_question.lower().split() 
                 if len(word) > 4 and word not in ['about', 'would', 'could', 'should', 'explain']]
    if topic_words:
        session['topics_covered'].append(topic_words[0])
    
    return jsonify({"question": new_question})

@app.route('/submit-answer', methods=['POST'])
def submit_answer():
    data = request.json
    answer = data.get('answer')
    question = data.get('question')
    session_id = data.get('sessionId')
    
    # Get session info for context
    session = sessions.get(session_id, {})
    role = session.get('role', 'Software Engineer')
    domain = session.get('domain', 'general')
    mode = session.get('mode', 'technical')
    
    # Process the answer and get feedback with context and score the response
    prompt = f"""You are an expert interviewer evaluating a candidate for a {role} position.
This is a {mode} interview focusing on {domain} expertise.

Question: {question}

Candidate's Answer: {answer}

First, rate the answer on a scale of 1-5 (where 1 is poor and 5 is excellent) based on accuracy, completeness, and clarity.

Then provide constructive feedback on this answer (150-250 words):
1. Start with what was done well
2. Mention areas for improvement
3. Give specific technical corrections if needed
4. Be encouraging but honest

Format your response exactly like this:
Score: [1-5]

Feedback: [Your detailed feedback here]
"""
    
    response = get_feedback(prompt)
    
    # Extract the score from the response
    score_line = response.split('\n')[0] if '\n' in response else response
    try:
        score = float(score_line.replace('Score:', '').strip())
        # Ensure score is between 1-5
        score = max(1, min(5, score))
    except:
        # Default score if extraction fails
        score = 3.0
    
    # Get just the feedback part (remove the score line)
    feedback = response.split('\n', 1)[1].strip() if '\n' in response else response
    
    # Update the session with the performance score
    if session_id in sessions:
        sessions[session_id]['performance_scores'].append(score)
        print(f"Updated score for session {session_id}: {score}")
    
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
    
    # Get average performance score if available
    performance_summary = ""
    if session_id in sessions and sessions[session_id]['performance_scores']:
        avg_score = sum(sessions[session_id]['performance_scores']) / len(sessions[session_id]['performance_scores'])
        performance_summary = f"\nThe candidate's average performance score was {avg_score:.1f} out of 5."
    
    # Generate the summary using your LLM with an improved prompt for better formatting
    prompt = f"""
You are an expert interviewer evaluating {candidate_name} for a {role} role.
The candidate just completed a {mode} interview focused on {domain} domain.{performance_summary}

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