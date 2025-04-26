import openai
import os
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("API key not found. Please set the GROQ_API_KEY environment variable.")
# Corrected: Notice the trailing slash '/' at the end
openai.api_key = api_key
openai.base_url = "https://api.groq.com/openai/v1/"

def get_feedback(prompt):
    print("Sending request to Groq...")
    response = openai.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": "You are a helpful interviewer bot."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    prompt = "Give me 3 tips to perform well in a mock interview."
    reply = get_feedback(prompt)
    print("Response from Groq:\n", reply)