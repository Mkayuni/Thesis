import re
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def extract_entities_and_relationships(input_str):
    entities = {}
    relationships = []

    # Extract entities and their attributes
    entity_pattern = r"\[(\w+)\|([^]]+)\]"
    entity_matches = re.findall(entity_pattern, input_str)

    logging.debug(f"Entity matches: {entity_matches}")

    for match in entity_matches:
        entity, attributes = match
        attributes_list = [attr.strip() for attr in attributes.split(';')]
        entities[entity] = attributes_list

    logging.debug(f"Entities extracted: {entities}")

    # Extract relationships
    relationship_pattern = r"\[(\w+)\]\s*([\d\.\*]*)\s*-\s*([\d\.\*]*)\s*\[(\w+)\]"
    lines = input_str.strip().split('\n')
    for line in lines:
        logging.debug(f"Processing line for relationships: {line}")
        match = re.search(relationship_pattern, line)
        if match:
            parent_entity = match.group(1)
            parent_cardinality = match.group(2)
            child_cardinality = match.group(3)
            child_entity = match.group(4)
            relationships.append((parent_entity, parent_cardinality, child_cardinality, child_entity))
            logging.debug(f"Matched Relationship: {parent_entity, parent_cardinality, child_cardinality, child_entity}")

    logging.debug(f"Relationships extracted: {relationships}")

    return entities, relationships

def generate_mermaid_code(entities, relationships):
    mermaid_code = "erDiagram\n"
    for entity, attributes in entities.items():
        mermaid_code += f"    {entity.upper()} {{\n"
        for attribute in attributes:
            # Replace '{PK}' and '{PPK}' with 'PK' in the attribute strings
            if "{PK}" in attribute:
                attribute = attribute.replace("{PK}", " PK")
            elif "{PPK}" in attribute:
                attribute = attribute.replace("{PPK}", " PK")
            mermaid_code += f"        string {attribute}\n"
        mermaid_code += f"    }}\n"

    logging.debug(f"Generated Mermaid entity definitions: {mermaid_code}")

    for parent, parent_cardinality, child_cardinality, child in relationships:
        if parent_cardinality == "1..1" and child_cardinality == "0..*":
            parent_card = "||"
            child_card = "o|"
        elif parent_cardinality == "1..1" and child_cardinality == "1..1":
            parent_card = "||"
            child_card = "||"
        elif parent_cardinality == "1..*" and child_cardinality == "1..1":
            parent_card = "|o"
            child_card = "||"
        elif parent_cardinality == "1..1" and child_cardinality == "0..*":
            parent_card = "||"
            child_card = "o|"
        elif parent_cardinality == "1..*" and child_cardinality == "1..1":
            parent_card = "|o"
            child_card = "||"
        elif parent_cardinality == "1..1" and child_cardinality == "0..*":
            parent_card = "||"
            child_card = "o|"
        else:
            parent_card = "|o"
            child_card = "|o"

        mermaid_code += f"    {parent.upper()} {parent_card}--{child_card} {child.upper()} : \"relates\"\n"

    logging.debug(f"Generated Mermaid relationships: {mermaid_code}")

    return mermaid_code

def convert_html_to_mermaid(input_html):
    question_pattern = r"<uml-question>(.*?)<\/uml-question>"
    question_match = re.search(question_pattern, input_html, re.DOTALL)
    if not question_match:
        logging.error("Invalid input format: No <uml-question> found.")
        return "Invalid input format"

    question_content = question_match.group(1).strip()
    logging.debug(f"Extracted question content: {question_content}")

    answer_pattern = r"<uml-answer>(.*?)<\/uml-answer>"
    answer_match = re.search(answer_pattern, input_html, re.DOTALL)
    if not answer_match:
        logging.error("Invalid input format: No <uml-answer> found.")
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
    <uml-question>Construct a database design in UML for a fish store where...</uml-question>
    <uml-answer>[Tank|number {PK};name;volume;color]
    [Fish|id {PK};name;color;weight]
    [Species|id {PK};name;preferredFood]
    [Event|date {PPK};note]
    [Tank] 1..1 - 0..* [Fish]
    [Fish] 1..* - 1..1 [Species]
    [Fish] 1..1 - 0..* [Event]</uml-answer>
    """
    question, mermaid = convert_html_to_mermaid(sample_input_html)
    print(f"Question: {question}")
    print(f"Mermaid Diagram:\n{mermaid}")
