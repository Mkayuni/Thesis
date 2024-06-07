import sys
import os
from flask import Flask, jsonify
from flask_cors import CORS

# Add the server directory to the system path
server_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server'))
sys.path.insert(0, server_path)

from umlTranslator import convert_html_to_mermaid

app = Flask(__name__)
CORS(app)

@app.route('/convert_file', methods=['GET'])
def convert_file():
    """Convert UML HTML content from a diagram.md file"""
    try:
        # Path to the diagram.md file
        src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
        file_path = os.path.join(src_path, 'diagram.md')

        # Read the file
        if not os.path.exists(file_path):
            return jsonify({'error': 'diagram.md file not found'}), 404
        
        with open(file_path, 'r') as file:
            input_html = file.read()

        # Convert the content to Mermaid code
        question_content, mermaid_code = convert_html_to_mermaid(input_html)
        return jsonify({
            'question': question_content,
            'mermaid_code': mermaid_code
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
