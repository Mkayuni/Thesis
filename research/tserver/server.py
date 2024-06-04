import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add the server directory to the system path
server_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'server'))
sys.path.insert(0, server_path)

from umlTranslator import convert_html_to_mermaid

app = Flask(__name__)
CORS(app)

@app.route('/convert', methods=['GET'])
def convert():
    try:
        # Open and read the diagram.md file
        src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
        with open(os.path.join(src_path, 'diagram.md'), 'r') as file:
            input_html = file.read()

        question_content, mermaid_code = convert_html_to_mermaid(input_html)
        return jsonify({'question': question_content, 'mermaid_code': mermaid_code})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
