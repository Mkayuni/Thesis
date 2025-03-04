from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import re
import json
import time

app = Flask(__name__)
CORS(app)

@app.route('/api/diagram', methods=['GET'])
def get_diagram():
    # Replace this with actual logic to retrieve diagram data
    data = {
        "content": "ER Diagram Content\nAnother Line of Content"
    }
    return jsonify(data)

@app.route('/api/grade', methods=['POST'])
def grade():
    diagram = request.json.get('diagram')
    result = grade_diagram(diagram)
    return jsonify(result)

@app.route('/api/questions', methods=['GET'])
def get_questions():
    questions_dir = os.path.join(os.path.dirname(__file__), 'Questions')
    questions = [d for d in os.listdir(questions_dir) if os.path.isdir(os.path.join(questions_dir, d))]
    return jsonify({"questions": questions})

@app.route('/api/question/<question_title>', methods=['GET'])
def get_question(question_title):
    base_directory = os.path.dirname(__file__)  # Get the directory of the current script
    directory = os.path.join(base_directory, 'Questions', question_title)  # Construct the correct directory path
    print(f"Directory path: {directory}")  # Debug logging
    print(f"Full path to question.html: {os.path.join(directory, 'question.html')}")  # Debug logging
    if os.path.exists(os.path.join(directory, 'question.html')):
        return send_from_directory(directory, 'question.html')
    else:
        print("File not found.")
        return jsonify({"error": "File not found"}), 404

# New route to extract methods from a question file
@app.route('/api/question/<question_title>/methods', methods=['GET'])
def get_question_methods(question_title):
    base_directory = os.path.dirname(__file__)  # Get the directory of the current script
    directory = os.path.join(base_directory, 'Questions', question_title)  # Construct the correct directory path

    if os.path.exists(os.path.join(directory, 'question.html')):
        with open(os.path.join(directory, 'question.html'), 'r') as f:
            content = f.read()
            print(f"HTML Content: {content}")  # Debug logging of HTML content
            
            # Use regex to extract all methods from the content
            methods = re.findall(r'<method>\s*(.*?)\s*<\/method>', content)
            print(f"Extracted methods: {methods}")  # Debug print to check extracted methods
            
            return jsonify({"methods": methods})
    else:
        print("File not found.")
        return jsonify({"error": "File not found"}), 404

# New route to retrieve saved code for a question
@app.route('/api/question/<question_title>/code', methods=['GET'])
def get_question_code(question_title):
    base_directory = os.path.dirname(__file__)
    submissions_dir = os.path.join(base_directory, 'Submissions')
    question_dir = os.path.join(submissions_dir, question_title)
    
    # Check if this question has any saved code
    if not os.path.exists(question_dir):
        return jsonify({"code": "", "message": "No saved code found for this question"})
    
    # Look for the most recent submission file
    files = [f for f in os.listdir(question_dir) if f.endswith('.json')]
    if not files:
        return jsonify({"code": "", "message": "No saved code found for this question"})
    
    # Sort files by timestamp (assuming filenames contain timestamps)
    latest_file = sorted(files, reverse=True)[0]
    with open(os.path.join(question_dir, latest_file), 'r') as f:
        submission_data = json.load(f)
        return jsonify({
            "code": submission_data.get("code", ""),
            "timestamp": submission_data.get("timestamp", ""),
            "message": "Retrieved saved code"
        })

# New route to submit code for a question
@app.route('/api/submit', methods=['POST'])
def submit_for_grading():
    data = request.json
    question_id = data.get('questionId')
    code = data.get('code')
    schema = data.get('schema')
    relationships = data.get('relationships')
    
    if not question_id or not code:
        return jsonify({"error": "Missing required data"}), 400
    
    # Create a directory to store submissions if it doesn't exist
    base_directory = os.path.dirname(__file__)
    submissions_dir = os.path.join(base_directory, 'Submissions')
    os.makedirs(submissions_dir, exist_ok=True)
    
    question_dir = os.path.join(submissions_dir, question_id)
    os.makedirs(question_dir, exist_ok=True)
    
    # Store the submission with timestamp
    timestamp = int(time.time())
    submission_id = f"{question_id}_{timestamp}"
    submission_path = os.path.join(question_dir, f"{submission_id}.json")
    
    # Add timestamp to the data
    data["timestamp"] = timestamp
    
    with open(submission_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    # For now, do basic grading - this would be expanded later
    grade_result = grade_submission(question_id, code, schema, relationships)
    
    return jsonify({
        "success": True,
        "message": "Submission received and stored",
        "submissionId": submission_id,
        "grade": grade_result
    })

# Basic grading function - placeholder for your more complex grading logic
def grade_submission(question_id, code, schema, relationships):
    # This is where you'd implement your auto-grading logic
    # For now, we'll just return a simple result
    
    # Check if we have an expected solution for this question
    base_directory = os.path.dirname(__file__)
    solutions_dir = os.path.join(base_directory, 'Solutions')
    question_solution = os.path.join(solutions_dir, f"{question_id}.json")
    
    if os.path.exists(question_solution):
        with open(question_solution, 'r') as f:
            solution_data = json.load(f)
            # Compare submitted schema with solution schema
            # This is a placeholder for more sophisticated comparison
            entities_match = len(schema) == len(solution_data.get("schema", []))
            relationships_match = len(relationships) == len(solution_data.get("relationships", []))
            
            if entities_match and relationships_match:
                score = 100
                feedback = "Perfect match! Your diagram matches the expected solution."
            elif entities_match:
                score = 80
                feedback = "Good job! Your entities match but relationships need work."
            elif relationships_match:
                score = 70
                feedback = "Your relationships look good, but check your entities."
            else:
                score = 50
                feedback = "Your diagram differs significantly from the expected solution."
    else:
        # No solution file exists yet, so we'll grade more generically
        entity_count = len(schema) if schema else 0
        relationship_count = len(relationships) if relationships else 0
        
        if entity_count > 3 and relationship_count > 2:
            score = 85
            feedback = "Good job! Your diagram has a good number of entities and relationships."
        elif entity_count > 0:
            score = 60
            feedback = "You've started with some entities, but your diagram needs more elements."
        else:
            score = 20
            feedback = "Your diagram is very minimal. Please add more entities and relationships."
    
    return {
        "score": score,
        "feedback": feedback
    }

def grade_diagram(diagram):
    return {
        'score': 95,
        'feedback': 'Good job, but consider adding more relationships.'
    }

if __name__ == '__main__':
    app.run(debug=True)