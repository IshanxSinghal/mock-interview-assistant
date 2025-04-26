# 🚀 Mock Interview Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-v18-blue)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-v2.3-green)](https://flask.palletsprojects.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v3.3-38B2AC)](https://tailwindcss.com/)

> A cutting-edge AI-driven platform that simulates real interview environments, providing personalized feedback and actionable insights to help candidates excel in both technical and behavioral interviews.


## ✨ Features

- **🎯 Multi-domain Support**: Choose from specialized technical domains (Frontend, Backend, ML) or general software engineering questions  
- **🤖 Dual Interview Modes**: Practice both technical and behavioral interviews  
- **📝 Real-time Feedback**: Receive instant, detailed feedback on your answers  
- **📊 Performance Analytics**: Get comprehensive performance summaries with highlighted strengths and improvement areas  
- **💻 Interactive UI**: Clean, responsive interface with color-coded feedback visualization  
- **🔄 Session Management**: Seamlessly manage interview sessions with persistent state  

## 🔧 Technologies

- **Frontend**: React.js with Tailwind CSS for a responsive, modern UI  
- **Backend**: Flask Python server with RESTful API architecture  
- **AI Integration**: Groq API with llama3-70b-8192 for intelligent response analysis  
- **State Management**: Client and server-side session management  
- **Styling**: Custom styling with Tailwind utility classes  

## 📋 System Architecture

```
├── Frontend (React.js)
│   ├── User Interface Components
│   ├── Interview Session Management
│   └── Feedback Visualization
│
├── Backend (Flask)
│   ├── Question Database
│   ├── Session Management
│   ├── Interview Logic
│   └── Feedback Generation
│
└── AI Processing (Groq API)
    ├── Answer Analysis
    ├── Feedback Generation
    └── Performance Summary
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js v14+ and npm  
- Python 3.8+  
- Groq API key (sign up at [groq.com](https://groq.com))  

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/IshanxSinghal/mock-interview-assistant.git
   cd mock-interview-assistant
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

5. Start the Flask server:
   ```bash
   python server.py
   ```

### Frontend Setup

1. Navigate to the React app directory:
   ```bash
   cd mock-interview-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## 📱 How to Use

1. **Start an Interview**: Enter your name, select your preferred job role, domain (optional), and interview mode  
2. **Answer Questions**: You'll be presented with relevant questions based on your selections  
3. **Get Feedback**: After submitting your answer, receive detailed feedback  
4. **Continue or Complete**: Move on to the next question or complete the interview  
5. **Review Performance**: At the end, get a comprehensive performance summary with color-coded insights  

## 💡 Use Cases

- **Interview Preparation**: Practice for upcoming job interviews  
- **Skill Assessment**: Identify strengths and weaknesses in technical and soft skills  
- **Teaching Tool**: Help students understand interview expectations  
- **Self-improvement**: Get actionable feedback on communication skills  

## 🔮 Future Roadmap

- **👥 Multi-user Support**: Allow mentors to review and provide additional feedback  
- **🎤 Audio Interface**: Support voice input for more natural interactions  
- **📊 Progress Tracking**: Track improvement over multiple practice sessions  
- **🌐 Expanded Domains**: Add support for more specialized interview domains  
- **📱 Mobile App**: Develop native mobile applications for on-the-go practice  

## 👨‍💻 Development Notes

- **Customizing Questions**: Add or modify questions in the `questions.py` file  
- **Styling**: Tailwind utilities can be customized in `tailwind.config.js`  
- **API Integration**: Modify `llm_connect.py` to use alternative AI providers  

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed with ❤️ for HCL Hackathon 2025
