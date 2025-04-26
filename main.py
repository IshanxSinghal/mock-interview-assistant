# main.py
from llm_connect import get_feedback
from questions import technical_questions, behavioral_questions

class InterviewSession:
    def __init__(self, role='Software Engineer', domain='general', mode='technical'):
        self.role = role
        self.domain = domain
        self.mode = mode
        self.asked_questions = []
        
        # Select questions based on mode and domain
        if mode == 'technical':
            if domain in technical_questions:
                self.questions = technical_questions[domain].copy()
            else:
                self.questions = []
        elif mode == 'behavioral':
            self.questions = behavioral_questions.copy()
        else:
            self.questions = []

    def get_next_question(self):
        # Find a question that hasn't been asked yet
        for question in self.questions:
            if question not in self.asked_questions:
                self.asked_questions.append(question)
                return question
        return None  # No more questions

    def get_feedback_for_answer(self, answer):
        return get_feedback(answer)

# No global session - create sessions as needed instead
def create_session(role='Software Engineer', domain='general', mode='technical'):
    return InterviewSession(role, domain, mode)