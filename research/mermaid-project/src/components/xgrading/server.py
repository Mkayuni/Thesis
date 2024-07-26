from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

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

def grade_diagram(diagram):
    return {
        'score': 95,
        'feedback': 'Good job, but consider adding more relationships.'
    }

if __name__ == '__main__':
    app.run(debug=True)
