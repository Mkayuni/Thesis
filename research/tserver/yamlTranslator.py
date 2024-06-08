import yaml
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def parse_yaml(yaml_content):
    try:
        data = yaml.safe_load(yaml_content)
        logging.debug(f"Parsed YAML data: {data}")
        entities = data.get('entities', {})
        relationships = data.get('relationships', [])
        return entities, relationships
    except yaml.YAMLError as exc:
        logging.error(f"Error parsing YAML: {exc}")
        return {}, []

def generate_mermaid_code(entities, relationships):
    mermaid_code = "erDiagram\n"
    for entity, attributes in entities.items():
        mermaid_code += f"    {entity.upper()} {{\n"
        for attribute in attributes:
            if "PK" in attribute:
                attribute = attribute.replace("{PK}", " PK")
            mermaid_code += f"        string {attribute}\n"
        mermaid_code += f"    }}\n"

    logging.debug(f"Generated Mermaid entity definitions: {mermaid_code}")

    for relationship in relationships:
        parent, parent_cardinality, child_cardinality, child = relationship
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

        label = "relates"
        mermaid_code += f"    {parent.upper()} {parent_card}--{child_card} {child.upper()} : \"{label}\"\n"

    logging.debug(f"Generated Mermaid relationships: {mermaid_code}")

    return mermaid_code
