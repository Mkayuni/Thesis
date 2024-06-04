import re

def extract_entities_and_relationships(input_str):
    entities = {}
    relationships = []

    # Extract entities and their attributes
    entity_pattern = r"\[(\w+)\|([^]]+)\]"
    entity_matches = re.findall(entity_pattern, input_str)

    for match in entity_matches:
        entity, attributes = match
        attributes_list = [attr.strip() for attr in attributes.split(';')]
        entities[entity] = attributes_list

    # Extract relationships from the text
    relationship_pattern = r"\[(\w+)\] (\d+\.\.\d+) - (\d+\.\d+)\[(\w+)\]"
    relationship_matches = re.findall(relationship_pattern, input_str)

    for match in relationship_matches:
        parent_entity, parent_cardinality, child_cardinality, child_entity = match
        relationships.append((parent_entity, parent_cardinality, child_cardinality, child_entity))

    return entities, relationships

def generate_mermaid_code(entities, relationships):
    mermaid_code = "erDiagram\n"

    # Generate entity definitions
    for entity, attributes in entities.items():
        mermaid_code += f"    {entity.upper()} {{\n"
        for attribute in attributes:
            if "PK" in attribute:
                attribute = attribute.replace("{PK}", "") + " PK"
            mermaid_code += f"        string {attribute}\n"
        mermaid_code += f"    }}\n\n"

    # Generate relationships
    for parent, parent_cardinality, child_cardinality, child in relationships:
        relationship_label = "relates"
        if parent.upper() == "REGION" and child.upper() == "STATE":
            relationship_label = "includes"
        elif parent.upper() == "STATE" and child.upper() == "CONGRESSPERSON":
            relationship_label = "has"
        elif parent.upper() == "CONGRESSPERSON" and child.upper() == "BILL":
            relationship_label = "sponsors"
        elif parent.upper() == "CONGRESSPERSON" and child.upper() == "VOTES_ON":
            relationship_label = "casts"
        elif parent.upper() == "BILL" and child.upper() == "VOTES_ON":
            relationship_label = "receives"
        mermaid_code += f"    {parent.upper()} {parent_cardinality} -- {child_cardinality} {child.upper()} : \"{relationship_label}\"\n"

    return mermaid_code

def convert_html_to_mermaid(input_html):
    # Extract the UML question content
    question_pattern = r"<uml-question>(.*?)<\/uml-question>"
    question_match = re.search(question_pattern, input_html, re.DOTALL)
    if not question_match:
        return "Invalid input format"

    question_content = question_match.group(1).strip()
    
    # Clean up the question text for display and make important words bold and underlined
    clean_question = re.sub(r"\[([^\]]+)\]\((\w+)\)", r"<strong><u>\2</u></strong>", question_content)

    # Extract the UML answer content
    answer_pattern = r"<uml-answer>(.*?)<\/uml-answer>"
    answer_match = re.search(answer_pattern, input_html, re.DOTALL)
    if not answer_match:
        return "Invalid input format"

    answer_content = answer_match.group(1).strip()

    entities, relationships = extract_entities_and_relationships(answer_content)
    mermaid_code = generate_mermaid_code(entities, relationships)
    return clean_question, mermaid_code
