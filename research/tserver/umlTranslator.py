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

    # Mapping relationships to meaningful labels
    relationship_labels = {
        ('Region', 'State'): 'has',
        ('State', 'Congressperson'): 'represents',
        ('Congressperson', 'Bill'): 'sponsors',
        ('Congressperson', 'VotesOn'): 'votes',
        ('VotesOn', 'Bill'): 'is on'
    }

    for parent, parent_cardinality, child_cardinality, child in relationships:
        # Determine the cardinality symbols
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

        label = relationship_labels.get((parent, child), "relates")
        mermaid_code += f"    {parent.upper()} {parent_card}--{child_card} {child.upper()} : \"{label}\"\n"

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

    # Remove square brackets and their content
    question_content = re.sub(r'\[[^\]]+\]', '', question_content)  # Remove [content]

    # Bold and underline text inside parentheses
    question_content = re.sub(r'\(([^)]+)\)', r'<strong><u>\1</u></strong>', question_content)

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
    <uml-question>Design an ER diagram for keeping track of information about votes taken in the U.S. House of Representatives during the current two-year congressional session.
    The database needs to keep track of each U.S [State](State) [name](name) including [region](Region).
    The [region](Region) has a [name](name) from the domain of {Northeast, Midwest, Southeast, Southwest, and West} and a [description](description) of the region.
    Each [congressperson](Congressperson) in the House is described by [name](name), [district](district) represented, [start date](startDate), and political [party](party).
    Each [state](State) is represented by at least one [congressperson](Congressperson).
    The database keeps track of each [bill](Bill) (proposed law) including bill [name](name), [date](voteDate) of vote, [passed or failed](status), and the sponsor [congressperson](Congressperson) of the bill.
    The database keeps track of how each [congressperson](Congressperson) [voted on](VotesOn) each bill [{Yes, No, Abstain, Absent}](vote). State clearly any assumptions.</uml-question>
    <uml-answer>[Region|name{PK}; description]
    [State|name {PK}]
    [Congressperson|name{PK}; district{PK}; startDate; party]
    [Bill|name {PK}; voteDate; status]
    [VotesOn| vote]
    [Region] 1..1 - 1..*[State]
    [State] 1..1 - 1..*[Congressperson]
    [Congressperson] 1..1 - 0..*[Bill]
    [Congressperson]1..1 - 0..*[VotesOn]
    [VotesOn]0..* - 1..1[Bill]</uml-answer>
    """
    question, mermaid = convert_html_to_mermaid(sample_input_html)
    print(f"Question: {question}")
    print(f"Mermaid Diagram:\n{mermaid}")
