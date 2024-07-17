from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Mock Data
mock_entities = []
mock_attributes = []
mock_relationships = []

@app.route('/convert_file', methods=['GET'])
def convert_file():
    """Convert UML HTML content from a diagram.md file"""
    return jsonify({'status': 'Endpoint not implemented'})

@app.route('/convert_yaml_file', methods=['GET'])
def convert_yaml_file():
    """Convert YAML content from a diagram.yaml file"""
    return jsonify({'status': 'Endpoint not implemented'})

@app.route('/add_entity', methods=['POST'])
def add_entity():
    try:
        data = request.json
        entity_name = data.get('entity')
        if not entity_name:
            raise ValueError('Entity name is required')
        mock_entities.append({'name': entity_name})
        logging.debug(f"Added entity: {entity_name}")
        return jsonify({'status': 'Entity added successfully', 'entities': mock_entities})
    except Exception as e:
        logging.error(f"Error adding entity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_attribute', methods=['POST'])
def add_attribute():
    try:
        data = request.json
        entity_name = data.get('entity')
        attribute_name = data.get('attribute')
        key = data.get('key', '')
        if not entity_name or not attribute_name:
            raise ValueError('Entity name and attribute name are required')
        entity = next((e for e in mock_entities if e['name'] == entity_name), None)
        if not entity:
            raise ValueError('Entity not found')
        mock_attributes.append({'entity': entity_name, 'name': attribute_name, 'key': key})
        logging.debug(f"Added attribute: {attribute_name} to entity: {entity_name}")
        return jsonify({'status': 'Attribute added successfully', 'attributes': mock_attributes})
    except Exception as e:
        logging.error(f"Error adding attribute: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_relationship', methods=['POST'])
def add_relationship():
    try:
        data = request.json
        parent_entity = data.get('relationA')
        child_entity = data.get('relationB')
        parent_cardinality = data.get('cardinalityA')
        child_cardinality = data.get('cardinalityB')
        if not parent_entity or not child_entity:
            raise ValueError('Both parent and child entities are required')
        parent = next((e for e in mock_entities if e['name'] == parent_entity), None)
        child = next((e for e in mock_entities if e['name'] == child_entity), None)
        if not parent or not child:
            raise ValueError('One or both entities not found')
        mock_relationships.append({
            'parent_entity': parent_entity, 
            'child_entity': child_entity,
            'parent_cardinality': parent_cardinality,
            'child_cardinality': child_cardinality
        })
        logging.debug(f"Added relationship: {parent_entity} ({parent_cardinality}) -> {child_entity} ({child_cardinality})")
        return jsonify({'status': 'Relationship added successfully', 'relationships': mock_relationships})
    except Exception as e:
        logging.error(f"Error adding relationship: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
