import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import yamlTranslator  # Import the new YAML translator module
from umlTranslator import convert_html_to_mermaid
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@app.route('/convert_file', methods=['GET'])
def convert_file():
    """Convert UML HTML content from a diagram.md file"""
    try:
        # Path to the diagram.md file
        data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
        file_path = os.path.join(data_path, 'diagram.md')

        # Read the file
        if not os.path.exists(file_path):
            logging.error(f"File not found: {file_path}")
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
        logging.error(f"Error converting UML file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/convert_yaml_file', methods=['GET'])
def convert_yaml_file():
    """Convert YAML content from a diagram.yaml file"""
    try:
        # Path to the diagram.yaml file
        data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
        file_path = os.path.join(data_path, 'diagram.yaml')

        # Read the file
        if not os.path.exists(file_path):
            logging.error(f"File not found: {file_path}")
            return jsonify({'error': 'diagram.yaml file not found'}), 404

        with open(file_path, 'r') as file:
            yaml_content = file.read()

        # Parse and convert YAML to Mermaid code
        entities, relationships = yamlTranslator.extract_entities_and_relationships(yaml_content)
        mermaid_code = yamlTranslator.generate_mermaid_code(entities, relationships)

        return jsonify({
            'mermaid_code': mermaid_code
        })
    except Exception as e:
        logging.error(f"Error converting YAML file: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
