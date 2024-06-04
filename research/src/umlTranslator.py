import re

def extract_entities_and_relationships(input_str):
    entities = {}
    relationships = []

    # Extract entities and their attributes
    entity_pattern = r"\[(\w+)\]\((\w+)\)"
    entity_matches = re.findall(entity_pattern, input_str)

    for match in entity_matches:
        attribute, entity = match
        if entity not in entities:
            entities[entity] = []
        if attribute not in entities[entity]:  # Avoid duplicate attributes
            entities[entity].append(attribute)

    # Extract relationships from the text
    lines = input_str.split("\n")
    for line in lines:
        relationship_pattern = r"Each (\[\w+\]\(\w+\)) (\w+) a number of (\[\w+\]\(\w+\))"
        relationship_match = re.search(relationship_pattern, line)
        if relationship_match:
            parent = relationship_match.group(1)
            child = relationship_match.group(3)
            relationships.append((parent, child))

    return entities, relationships

def generate_mermaid_code(entities, relationships):
    mermaid_code = "erDiagram\n"

    # Generate entity definitions
    for entity, attributes in entities.items():
        mermaid_code += f"    {entity.upper()} {{\n"
        for attribute in attributes:
            mermaid_code += f"        string {attribute}\n"
        mermaid_code += f"    }}\n\n"

    # Generate relationships
    for parent, child in relationships:
        parent_entity = re.search(r"\((\w+)\)", parent).group(1).upper()
        child_entity = re.search(r"\((\w+)\)", child).group(1).upper()
        mermaid_code += f"    {parent_entity} ||--o{{ {child_entity} : has\n"

    return mermaid_code

def convert_html_to_mermaid(input_html):
    # Extract the UML question content
    question_pattern = r"<uml-question>(.*?)<\/uml-question>"
    question_match = re.search(question_pattern, input_html, re.DOTALL)
    if not question_match:
        return "Invalid input format"

    question_content = question_match.group(1).strip()
    
    # Clean up the question text for display
    clean_question = re.sub(r"\[\w+\]\(\w+\)", lambda m: m.group(0).split('](')[0][1:], question_content)

    entities, relationships = extract_entities_and_relationships(question_content)
    mermaid_code = generate_mermaid_code(entities, relationships)
    return clean_question, mermaid_code
