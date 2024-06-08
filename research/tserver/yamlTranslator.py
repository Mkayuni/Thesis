import yaml
import logging
import re

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def extract_entities_and_relationships(yaml_content):
    entities = {}
    relationships = []

    try:
        data = yaml.safe_load(yaml_content)
        logging.debug(f"Parsed YAML data: {data}")

        for entity in data['entities']:
            entity_name = entity['name']
            attributes_list = [attr.strip() for attr in entity['attributes']]
            entities[entity_name] = attributes_list

        logging.debug(f"Entities extracted: {entities}")

        for relationship in data['relationships']:
            parent_entity = relationship['parent']
            parent_cardinality = relationship['parent_cardinality']
            child_entity = relationship['child']
            child_cardinality = relationship['child_cardinality']
            relationships.append((parent_entity, parent_cardinality, child_cardinality, child_entity))

        logging.debug(f"Relationships extracted: {relationships}")

    except yaml.YAMLError as exc:
        logging.error(f"YAML parsing error: {exc}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")

    return entities, relationships

def generate_mermaid_code(entities, relationships):
    mermaid_code = "erDiagram\n"
    try:
        for entity, attributes in entities.items():
            mermaid_code += f"    {entity.upper()} {{\n"
            for attribute in attributes:
                if "{PK}" in attribute:
                    attribute = attribute.replace("{PK}", " PK")
                elif "{PPK}" in attribute:
                    attribute = attribute.replace("{PPK}", " PK")
                mermaid_code += f"        string {attribute}\n"
            mermaid_code += f"    }}\n"

        logging.debug(f"Generated Mermaid entity definitions: {mermaid_code}")

        for parent, parent_cardinality, child_cardinality, child in relationships:
            parent_card = "|o"
            child_card = "|o"
            if parent_cardinality == "1..1":
                parent_card = "||"
            if child_cardinality == "1..1":
                child_card = "||"
            if parent_cardinality == "0..*":
                parent_card = "o|"
            if child_cardinality == "0..*":
                child_card = "o|"

            mermaid_code += f"    {parent.upper()} {parent_card}--{child_card} {child.upper()} : \"relates\"\n"

        logging.debug(f"Generated Mermaid relationships: {mermaid_code}")

    except Exception as e:
        logging.error(f"Error generating Mermaid code: {e}")

    return mermaid_code

def convert_html_to_mermaid(input_html):
    question_pattern = r"<yaml-question>(.*?)<\/yaml-question>"
    question_match = re.search(question_pattern, input_html, re.DOTALL)
    if not question_match:
        logging.error("Invalid input format: No <yaml-question> found.")
        return "Invalid input format"

    question_content = question_match.group(1).strip()
    logging.debug(f"Extracted question content: {question_content}")

    answer_pattern = r"<yaml-answer>(.*?)<\/yaml-answer>"
    answer_match = re.search(answer_pattern, input_html, re.DOTALL)
    if not answer_match:
        logging.error("Invalid input format: No <yaml-answer> found.")
        return "Invalid input format"

    answer_content = answer_match.group(1).strip()
    logging.debug(f"Extracted answer content: {answer_content}")

    entities, relationships = extract_entities_and_relationships(answer_content)
    mermaid_code = generate_mermaid_code(entities, relationships)
    logging.debug(f"Generated Mermaid code: {mermaid_code}")

    return question_content, mermaid_code

# Sample usage for debugging
if __name__ == '__main__':
    sample_input_html = """
    <yaml-question>Design an ER diagram for a hospital management system.</yaml-question>
    <yaml-answer>
    entities:
      - name: Hospital
        attributes:
          - hospitalName{PK}
          - location
      - name: Doctor
        attributes:
          - medicalNum{PK}
          - name
      - name: Patient
        attributes:
          - healthId{PK}
          - name
          - gender
      - name: Visit
        attributes:
          - visitId{PK}
          - visitDate
      - name: Test
        attributes:
          - testName{PPK}
          - cost
          - outcome

    relationships:
      - parent: Hospital
        parent_cardinality: 1..1
        child_cardinality: 0..*
        child: Doctor
      - parent: Doctor
        parent_cardinality: 1..1
        child_cardinality: 0..*
        child: Visit
      - parent: Patient
        parent_cardinality: 1..1
        child_cardinality: 0..*
        child: Visit
      - parent: Visit
        parent_cardinality: 1..1
        child_cardinality: 0..*
        child: Test
    </yaml-answer>
    """
    question, mermaid = convert_html_to_mermaid(sample_input_html)
    print(f"Question: {question}")
    print(f"Mermaid Diagram:\n{mermaid}")
