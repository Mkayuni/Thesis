import yamlTranslator

try:
    print("Opening the YAML file...")
    with open('C:/Users/kayun/Research/Thesis/research/src/diagram.yaml', 'r') as file:
        yaml_content = file.read()
    print("YAML file read successfully.")
    
    print("Parsing the YAML content...")
    entities, relationships = yamlTranslator.parse_yaml(yaml_content)
    print(f"Entities: {entities}")
    print(f"Relationships: {relationships}")

    print("Generating Mermaid code...")
    mermaid_code = yamlTranslator.generate_mermaid_code(entities, relationships)
    print(f"Generated Mermaid Code:\n{mermaid_code}")
except Exception as e:
    print(f"Error: {e}")
