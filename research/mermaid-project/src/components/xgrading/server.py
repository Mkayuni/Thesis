from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import re
import json
import time
from bs4 import BeautifulSoup


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
    
    # Grade the submission
    grade_result = grade_submission(question_id, code, schema, relationships)
    
    return jsonify({
        "success": True,
        "message": "Submission received and stored",
        "submissionId": submission_id,
        "grade": grade_result
    })

# ===== NEW GRADING SYSTEM =====

def extract_reference_data(question_html):
    """
    Extract reference schema and marking criteria from question HTML.
    """
    print("Extracting reference data from HTML...")
    
    # First try to find the UML design elements using BeautifulSoup
    soup = BeautifulSoup(question_html, 'html.parser')
    design_elements = soup.find('uml-design-elements')
    
    if design_elements:
        reference_schema = design_elements.text.strip()
        print(f"Found design elements via BeautifulSoup: {reference_schema[:100]}...")
    else:
        # Fallback: use regex to find the design elements
        import re
        match = re.search(r'<uml-design-elements>(.*?)</uml-design-elements>', question_html, re.DOTALL)
        if match:
            reference_schema = match.group(1).strip()
            print(f"Found design elements via regex: {reference_schema[:100]}...")
        else:
            print("Failed to extract design elements!")
            reference_schema = None
    
    # Extract marking criteria
    marking_element = soup.find('uml-marking')
    marking_criteria = {}
    
    if marking_element:
        for attr, value in marking_element.attrs.items():
            try:
                marking_criteria[attr] = float(value)
            except ValueError:
                marking_criteria[attr] = value
        print(f"Found marking criteria: {marking_criteria}")
    else:
        # Fallback: use default marking criteria
        print("No marking criteria found, using defaults")
        marking_criteria = {
            'entity-name': 0.2,
            'entity-attributes': 0.1,
            'relationship': 0.5,
            'cardinality': 0.25,
            'extra-entity-penalty': 0.25,
            'extra-relationship-penalty': 0.25
        }
    
    return reference_schema, marking_criteria

def parse_mermaid_schema(mermaid_text):
    """
    Parse Mermaid schema text into structured entities and relationships.
    """
    entities = {}
    relationships = []
    
    if not mermaid_text:
        print("WARNING: Empty Mermaid text provided to parser")
        return entities, relationships
    
    print(f"Parsing Mermaid schema (length: {len(mermaid_text)})")
    print(f"SCHEMA TEXT: {mermaid_text[:200]}...") # Debug: Print first part of schema
    
    # Split into lines and process each line
    lines = mermaid_text.strip().split('\n')
    print(f"Found {len(lines)} lines in Mermaid schema")
    
    # Track the current entity being processed
    current_entity = None
    attributes = []
    methods = []
    in_entity_definition = False  # New tracking variable
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        print(f"Processing line {i+1}: {line[:50]}... [current_entity={current_entity}, in_entity_definition={in_entity_definition}]")
        
        # Check for relationship lines
        if '<|..' in line:  # Implementation
            match = re.match(r'\[(.*?)\]\s*<\|\..\s*\[(.*?)\]', line)
            if match:
                source = match.group(1)
                target = match.group(2).split(':')[0].strip()
                relationships.append({
                    "type": "implementation",
                    "source": source,
                    "target": target
                })
                print(f"Found implementation: {source} implements {target}")
        elif 'o--' in line:  # Aggregation
            match = re.match(r'\[(.*?)\]\s*o--\s*"(.*?)"\s*\[(.*?)\]', line)
            if match:
                source = match.group(1)
                cardinality = match.group(2)
                target = match.group(3).split(':')[0].strip()
                relationships.append({
                    "type": "aggregation",
                    "source": source,
                    "target": target,
                    "cardinality": cardinality
                })
                print(f"Found aggregation: {source} has {target} ({cardinality})")
        elif '*--' in line:  # Composition
            match = re.match(r'\[(.*?)\]\s*\*--\s*"(.*?)"\s*\[(.*?)\]', line)
            if match:
                source = match.group(1)
                cardinality = match.group(2)
                target = match.group(3).split(':')[0].strip()
                relationships.append({
                    "type": "composition",
                    "source": source,
                    "target": target,
                    "cardinality": cardinality
                })
                print(f"Found composition: {source} composed of {target} ({cardinality})")
        
        # Check for entity definition start
        elif line.startswith('[') and '|' in line:
            # If we were processing an entity, save it
            if current_entity:
                entities[current_entity.lower()] = {
                    "entity": current_entity,
                    "attribute": {attr: {"attribute": attr} for attr in attributes},
                    "methods": methods
                }
                print(f"Saved entity {current_entity} with {len(attributes)} attributes and {len(methods)} methods")
            
            # Start new entity
            match = re.match(r'\[(.*?)\|(.*?)\|', line)
            if match:
                current_entity = match.group(1)
                attributes_text = match.group(2)
                attributes = [attr.strip() for attr in attributes_text.split(';') if attr.strip()]
                methods = []
                in_entity_definition = True  # Start entity definition
                print(f"Started entity {current_entity} with attributes: {attributes}")
            else:
                print(f"WARNING: Failed to match entity pattern for line: {line}")
        
        # Check for method definition (part of an entity)
        elif current_entity and line.startswith('+'):
            # Method line: "+return_type method_name(parameters);"
            method_match = re.match(r'\+\s*(.*?)\s+(\w+)\s*\((.*?)\);?', line)
            if method_match:
                return_type = method_match.group(1).strip()
                method_name = method_match.group(2).strip()
                parameters = method_match.group(3).strip()
                
                methods.append({
                    "name": method_name,
                    "returnType": return_type,
                    "parameters": [p.strip() for p in parameters.split(',')] if parameters else []
                })
                print(f"Added method {method_name} to entity {current_entity}")
            else:
                print(f"WARNING: Failed to match method pattern for line: {line}")
        
        # Check for entity definition end
        elif current_entity and in_entity_definition and line.endswith(']'):
            # This is the end of an entity definition
            # If there's method content before the ']', parse it
            if line.startswith('+'):
                method_text = line[:-1].strip()  # Remove the closing bracket
                method_match = re.match(r'\+\s*(.*?)\s+(\w+)\s*\((.*?)\);?', method_text)
                if method_match:
                    return_type = method_match.group(1).strip()
                    method_name = method_match.group(2).strip()
                    parameters = method_match.group(3).strip()
                    
                    methods.append({
                        "name": method_name,
                        "returnType": return_type,
                        "parameters": [p.strip() for p in parameters.split(',')] if parameters else []
                    })
                    print(f"Added final method {method_name} to entity {current_entity}")
            
            # Save the entity
            entities[current_entity.lower()] = {
                "entity": current_entity,
                "attribute": {attr: {"attribute": attr} for attr in attributes},
                "methods": methods
            }
            print(f"Saved entity {current_entity} with {len(attributes)} attributes and {len(methods)} methods at line end")
            current_entity = None
            attributes = []
            methods = []
            in_entity_definition = False
    
    # Save the last entity if we were processing one
    if current_entity:
        entities[current_entity.lower()] = {
            "entity": current_entity,
            "attribute": {attr: {"attribute": attr} for attr in attributes},
            "methods": methods
        }
        print(f"Saved final entity {current_entity} with {len(attributes)} attributes and {len(methods)} methods")
    
    print(f"Finished parsing: {len(entities)} entities, {len(relationships)} relationships")
    
    if not entities:
        print("WARNING: No entities were parsed from the schema!")
        print("Lines in schema:")
        for i, line in enumerate(lines):
            print(f"  Line {i+1}: {line}")
    else:
        print("Parsed entities:")
        for entity_name, entity_data in entities.items():
            print(f"  Entity: {entity_name}")
            print(f"    Attributes: {list(entity_data['attribute'].keys())}")
            print(f"    Methods: {[m['name'] for m in entity_data['methods']]}")
    
    return entities, relationships



def grade_entities(submitted_entities, ref_entities, marking_criteria):
    """
    Grade the entities in the submission.
    
    Args:
        submitted_entities (dict): The submitted entities
        ref_entities (dict): The reference entities
        marking_criteria (dict): The marking criteria
    
    Returns:
        dict: Grading results for entities
    """
    entity_score = 0
    max_entity_score = 0
    feedback = []
    
    # Points for entity names
    entity_name_points = marking_criteria.get('entity-name', 0.2)
    max_entity_score += len(ref_entities) * entity_name_points
    
    # Check for required entities
    for entity_name, entity_data in ref_entities.items():
        if entity_name.lower() in [e.lower() for e in submitted_entities]:
            entity_score += entity_name_points
            feedback.append(f"✓ Found required entity: {entity_name}")
        else:
            feedback.append(f"✗ Missing required entity: {entity_name}")
    
    # Points for entity attributes
    attribute_points = marking_criteria.get('entity-attributes', 0.1)
    
    # Check attributes for each entity
    for entity_name, entity_data in ref_entities.items():
        if entity_name in submitted_entities:
            ref_attrs = entity_data.get('attribute', {})
            submitted_attrs = submitted_entities[entity_name].get('attribute', {})
            
            # Count matching attributes
            max_entity_score += len(ref_attrs) * attribute_points
            
            for attr_name in ref_attrs:
                if attr_name in submitted_attrs:
                    entity_score += attribute_points
                    feedback.append(f"✓ Entity {entity_name} has required attribute: {attr_name}")
                else:
                    feedback.append(f"✗ Entity {entity_name} is missing attribute: {attr_name}")
    
    # Check for extra entities (penalty)
    extra_entity_penalty = marking_criteria.get('extra-entity-penalty', 0.25)
    extra_entities = [e for e in submitted_entities if e not in ref_entities]
    
    if extra_entities:
        penalty = min(len(extra_entities) * extra_entity_penalty, max_entity_score * 0.5)  # Cap penalty at 50% of max score
        entity_score = max(0, entity_score - penalty)
        feedback.append(f"! Found {len(extra_entities)} extra entities: {', '.join(extra_entities)}")
    
    return {
        "score": entity_score,
        "max_score": max_entity_score,
        "feedback": feedback
    }

def grade_relationships(submitted_relationships, ref_relationships, marking_criteria):
    """
    Grade the relationships in the submission.
    
    Args:
        submitted_relationships (list): The submitted relationships
        ref_relationships (list): The reference relationships
        marking_criteria (dict): The marking criteria
    
    Returns:
        dict: Grading results for relationships
    """
    relationship_score = 0
    max_relationship_score = 0
    feedback = []
    
    # Points for relationships
    relationship_points = marking_criteria.get('relationship', 0.5)
    cardinality_points = marking_criteria.get('cardinality', 0.25)
    
    # Convert submitted relationships to a more comparable format
    formatted_submitted_rels = []
    for rel_key, rel_data in submitted_relationships:
        # Handle different possible formats from frontend
        rel_type = rel_data.get('type', '')
        source = rel_data.get('relationA', rel_data.get('source', ''))
        target = rel_data.get('relationB', rel_data.get('target', ''))
        cardinality = rel_data.get('cardinalityA', rel_data.get('cardinality', ''))
        label = rel_data.get('label', '')
        
        formatted_submitted_rels.append({
            "type": rel_type,
            "source": source,
            "target": target,
            "cardinality": cardinality,
            "label": label
        })
    
    # Check for required relationships
    for ref_rel in ref_relationships:
        max_relationship_score += relationship_points
        
        # Look for matching relationship in submission
        found_match = False
        for sub_rel in formatted_submitted_rels:
            if (sub_rel.get('type') == ref_rel.get('type') and
                (sub_rel.get('source') == ref_rel.get('source') or sub_rel.get('target') == ref_rel.get('source')) and
                (sub_rel.get('target') == ref_rel.get('target') or sub_rel.get('source') == ref_rel.get('target'))):
                
                found_match = True
                relationship_score += relationship_points
                feedback.append(f"✓ Found relationship: {ref_rel.get('type')} between {ref_rel.get('source')} and {ref_rel.get('target')}")
                
                # Check cardinality if applicable
                if 'cardinality' in ref_rel and 'cardinality' in sub_rel:
                    max_relationship_score += cardinality_points
                    
                    if ref_rel['cardinality'] == sub_rel['cardinality']:
                        relationship_score += cardinality_points
                        feedback.append(f"✓ Correct cardinality: {ref_rel['cardinality']}")
                    else:
                        feedback.append(f"✗ Incorrect cardinality: expected {ref_rel['cardinality']}, got {sub_rel['cardinality']}")
                
                break
        
        if not found_match:
            feedback.append(f"✗ Missing relationship: {ref_rel.get('type')} between {ref_rel.get('source')} and {ref_rel.get('target')}")
    
    # Check for extra relationships (penalty)
    extra_relationship_penalty = marking_criteria.get('extra-relationship-penalty', 0.25)
    extra_rels = []
    
    for sub_rel in formatted_submitted_rels:
        # Check if this relationship exists in the reference
        found_match = False
        for ref_rel in ref_relationships:
            if ((sub_rel.get('type') == ref_rel.get('type')) and
                ((sub_rel.get('source') == ref_rel.get('source') and sub_rel.get('target') == ref_rel.get('target')) or
                 (sub_rel.get('source') == ref_rel.get('target') and sub_rel.get('target') == ref_rel.get('source')))):
                found_match = True
                break
        
        if not found_match:
            extra_rels.append(f"{sub_rel.get('type')} between {sub_rel.get('source')} and {sub_rel.get('target')}")
    
    if extra_rels:
        penalty = min(len(extra_rels) * extra_relationship_penalty, max_relationship_score * 0.5)  # Cap penalty at 50% of max score
        relationship_score = max(0, relationship_score - penalty)
        feedback.append(f"! Found {len(extra_rels)} extra relationships: {', '.join(extra_rels)}")
    
    return {
        "score": relationship_score,
        "max_score": max_relationship_score,
        "feedback": feedback
    }
def grade_methods(submitted_entities, ref_entities, marking_criteria):
    """
    Grade the methods in the submission.
    """
    method_score = 0
    max_method_score = 0
    feedback = []
    
    # We'll allocate points based on finding required methods in the right classes
    method_points = 1.0
    
    # Check for required methods in each entity
    for entity_name, entity_data in ref_entities.items():
        ref_methods = entity_data.get('methods', [])
        
        if not ref_methods:
            continue
        
        # Modified: Use case-insensitive lookup for entity names
        matching_entity = None
        for submitted_name in submitted_entities:
            if submitted_name.lower() == entity_name.lower():
                matching_entity = submitted_name
                break
            
        if matching_entity:
            submitted_methods = submitted_entities[matching_entity].get('methods', [])
            
            # Check each required method
            for ref_method in ref_methods:
                max_method_score += method_points
                
                # Get method name
                ref_method_name = ref_method.get('name')
                
                # Look for this method in the submitted entity
                found_method = False
                for sub_method in submitted_methods:
                    if sub_method.get('name') == ref_method_name:
                        found_method = True
                        method_score += method_points
                        feedback.append(f"✓ Entity {entity_name} has required method: {ref_method_name}")
                        break
                
                if not found_method:
                    feedback.append(f"✗ Entity {entity_name} is missing required method: {ref_method_name}")
        else:
            # If the entity is missing, all its methods are missing
            max_method_score += len(ref_methods) * method_points
            for ref_method in ref_methods:
                feedback.append(f"✗ Missing method: {ref_method.get('name')} (entity {entity_name} not found)")
    
    return {
        "score": method_score,
        "max_score": max_method_score,
        "feedback": feedback
    }
    
def generate_feedback(grading_result):
    """
    Generate detailed feedback based on grading results.
    
    Args:
        grading_result (dict): The grading results
    
    Returns:
        str: Detailed feedback
    """
    entity_score = grading_result["entity_score"]["score"]
    entity_max = grading_result["entity_score"]["max_score"]
    entity_percent = (entity_score / entity_max * 100) if entity_max > 0 else 0
    
    relationship_score = grading_result["relationship_score"]["score"]
    relationship_max = grading_result["relationship_score"]["max_score"]
    relationship_percent = (relationship_score / relationship_max * 100) if relationship_max > 0 else 0
    
    method_score = grading_result["method_score"]["score"]
    method_max = grading_result["method_score"]["max_score"]
    method_percent = (method_score / method_max * 100) if method_max > 0 else 0
    
    total_score = entity_score + relationship_score + method_score
    total_max = entity_max + relationship_max + method_max
    total_percent = (total_score / total_max * 100) if total_max > 0 else 0
    
    # Format detailed feedback
    feedback = [
        f"### UML Diagram Grading Results",
        f"",
        f"**Overall Score**: {total_score:.1f}/{total_max:.1f} ({total_percent:.1f}%)",
        f"",
        f"#### Entity Assessment: {entity_score:.1f}/{entity_max:.1f} ({entity_percent:.1f}%)",
    ]
    
    # Add up to 3 entity feedback items
    entity_feedback = grading_result["entity_score"]["feedback"]
    for item in entity_feedback[:3]:
        feedback.append(f"- {item}")
    
    if len(entity_feedback) > 3:
        feedback.append(f"- *...and {len(entity_feedback) - 3} more entity observations*")
    
    feedback.extend([
        f"",
        f"#### Relationship Assessment: {relationship_score:.1f}/{relationship_max:.1f} ({relationship_percent:.1f}%)",
    ])
    
    # Add up to 3 relationship feedback items
    relationship_feedback = grading_result["relationship_score"]["feedback"]
    for item in relationship_feedback[:3]:
        feedback.append(f"- {item}")
    
    if len(relationship_feedback) > 3:
        feedback.append(f"- *...and {len(relationship_feedback) - 3} more relationship observations*")
    
    feedback.extend([
        f"",
        f"#### Method Assessment: {method_score:.1f}/{method_max:.1f} ({method_percent:.1f}%)",
    ])
    
    # Add up to 3 method feedback items
    method_feedback = grading_result["method_score"]["feedback"]
    for item in method_feedback[:3]:
        feedback.append(f"- {item}")
    
    if len(method_feedback) > 3:
        feedback.append(f"- *...and {len(method_feedback) - 3} more method observations*")
    
    # Add summary feedback based on score
    feedback.extend([
        f"",
        f"### Summary Feedback",
    ])
    
    if total_percent >= 90:
        feedback.append("Excellent work! Your UML diagram accurately represents the required system. The entities, relationships, and methods are well-defined and properly structured.")
    elif total_percent >= 80:
        feedback.append("Good job! Your UML diagram covers most of the required elements. Review the feedback above to make minor improvements to your design.")
    elif total_percent >= 70:
        feedback.append("Your UML diagram is on the right track but needs improvements. Pay attention to the relationship types and make sure all required methods are placed in the correct classes.")
    elif total_percent >= 60:
        feedback.append("Your diagram needs substantial improvement. Focus on correctly implementing all the required entities and their relationships. Make sure you've included all required methods.")
    else:
        feedback.append("Your diagram requires significant revision. Review the UML notation and make sure you understand the requirements. Start by ensuring you have all the required entities and then focus on their relationships and methods.")
    
    return "\n".join(feedback)

def grade_submission(question_id, code, schema, relationships):
    """
    Grade a UML diagram submission by comparing it to the reference solution.
    
    Args:
        question_id (str): The ID of the question
        code (str): The submitted code
        schema (list): The schema as a list of [entity_name, entity_data] pairs
        relationships (list): The relationships as a list
    
    Returns:
        dict: Grading results with score and feedback
    """
    # Get the question HTML to extract reference schema
    base_directory = os.path.dirname(__file__)
    question_dir = os.path.join(base_directory, 'Questions', question_id)
    question_file = os.path.join(question_dir, 'question.html')
    
    if not os.path.exists(question_file):
        return {
            "score": 50,
            "feedback": "Unable to find reference solution for grading."
        }
    
    with open(question_file, 'r') as f:
        question_html = f.read()
    
    # Extract reference schema and marking criteria
    reference_schema, marking_criteria = extract_reference_data(question_html)
    if not reference_schema:
        return {
            "score": 50,
            "feedback": "Reference schema not found in question."
        }
    
    # Convert the reference schema (in Mermaid format) to our internal representation
    ref_entities, ref_relationships = parse_mermaid_schema(reference_schema)
    
    
    
    # Convert our submitted schema list to a dict for easier access
    submitted_entities = {name: data for name, data in schema}
    
    # Grade entities and methods
    entity_score_result = grade_entities(submitted_entities, ref_entities, marking_criteria)
    method_score_result = grade_methods(submitted_entities, ref_entities, marking_criteria)
    
    # Only grade relationships if they were submitted
    relationship_score_result = {"score": 0, "max_score": 0, "feedback": []}
    if relationships and len(relationships) > 0:
        relationship_score_result = grade_relationships(relationships, ref_relationships, marking_criteria)
    else:
        # Add feedback about missing relationships but don't penalize the entire submission
        relationship_feedback = ["✗ No relationships defined in the diagram."]
        for rel in ref_relationships:
            rel_type = rel.get('type', 'unknown')
            source = rel.get('source', 'unknown')
            target = rel.get('target', 'unknown')
            relationship_feedback.append(f"✗ Missing relationship: {rel_type} between {source} and {target}")
        
        relationship_score_result = {
            "score": 0,
            "max_score": len(ref_relationships) * marking_criteria.get('relationship', 0.5),
            "feedback": relationship_feedback
        }
    
    # Ensure entity and method scores aren't zero if entities exist
    if submitted_entities and entity_score_result["score"] == 0:
        entity_score_result["score"] = 0.1 * entity_score_result["max_score"]
    
    if submitted_entities and method_score_result["score"] == 0:
        method_score_result["score"] = 0.1 * method_score_result["max_score"]
    
    # Update the grading result
    grading_result = {
        "entity_score": entity_score_result,
        "relationship_score": relationship_score_result,
        "method_score": method_score_result
    }
    
    # Calculate overall score
    total_score = (
        grading_result["entity_score"]["score"] +
        grading_result["relationship_score"]["score"] +
        grading_result["method_score"]["score"]
    )
    
    # Scale to a 100-point scale
    total_max = (
        grading_result["entity_score"]["max_score"] +
        grading_result["relationship_score"]["max_score"] +
        grading_result["method_score"]["max_score"]
    )
    
    # Ensure we get at least some credit for having entities
    if submitted_entities and total_score == 0:
        total_score = 0.3 * grading_result["entity_score"]["max_score"]
    
    normalized_score = 100 * (total_score / total_max) if total_max > 0 else 50
    
    # Generate detailed feedback
    feedback = generate_feedback(grading_result)
    
    return {
        "score": round(normalized_score),
        "feedback": feedback,
        "details": grading_result
    }

def grade_diagram(diagram):
    return {
        'score': 95,
        'feedback': 'Good job, but consider adding more relationships.'
    }

if __name__ == '__main__':
    app.run(debug=True)