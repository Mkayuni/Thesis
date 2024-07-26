import json
import randomgeneration as rg
import randomgrader as grader
import chevron
import lxml.html
import random

# INTIALIZE PARAMETERS
RANDOMIZED_QUESTION = False
FEEDBACK = True
MARKERFEEDBACK = False


# MARKING
MAX_GRADE = 10
MAX_ATTEMPTS = None
ENTITY_NAME = 0.2
ENTITY_ATTRIBUTES = 0.1
ENTITY_KEY = 0.2
EXTRA_ENTITY_PENALTY = 0.25
WEAK_ENTITY = 0.5
RELATIONSHIP = 0.5
CARDINALITY = 0.25
EXTRA_RELATIONSHIP_PENALTY = 0.25
# CARDINALITY_TEXT = 0.25


# RANDOMIZED QUESTION


def prepare(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    randomized_question = RANDOMIZED_QUESTION
    data['params']['oldAnswer'] = None
    data['params']['feedback'] = None
    data['params']['answer'] = []
    if randomized_question is False:
        setup_question(element, data)
        setup_answer(element, data)
    else:
        question = rg.generate_random(data)
        data['params']['question_data'] = question['question']
        data['params']['answer'] = [{"answer": question['answer']}]


def setup_question(element, data):
    for child in element:
        is_question = (child.tag in ['uml-question', 'uml_question'])
        if is_question:
            data['params']['question_data'] = child.text_content()


def setup_answer(element, data):
    for child in element:
        is_answer = (child.tag in ['uml-answer', 'uml_answer'])
        if is_answer:
            data['params']['answer'].append({"answer": (child.text_content())})


def setup_marking(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    global ENTITY_NAME
    global ENTITY_ATTRIBUTES
    global ENTITY_KEY
    global EXTRA_ENTITY_PENALTY
    global WEAK_ENTITY
    global RELATIONSHIP
    global CARDINALITY
    global EXTRA_RELATIONSHIP_PENALTY

    for child in element:
        is_marking = (child.tag in ['uml-marking', 'uml_marking'])
        if is_marking:
            ENTITY_NAME = float(child.get('entity-name', ENTITY_NAME))
            ENTITY_ATTRIBUTES = float(child.get('entity-attributes', ENTITY_ATTRIBUTES))
            ENTITY_KEY = float(child.get('entity-key', ENTITY_KEY))
            EXTRA_ENTITY_PENALTY = float(child.get('extra-entity-penalty', EXTRA_ENTITY_PENALTY))
            WEAK_ENTITY = float(child.get('weak-entity', WEAK_ENTITY))
            RELATIONSHIP = float(child.get('relationship', RELATIONSHIP))
            CARDINALITY = float(child.get('cardinality', CARDINALITY))
            EXTRA_RELATIONSHIP_PENALTY = float(child.get('extra-relationship-penalty', EXTRA_RELATIONSHIP_PENALTY))

    maximum_grade = float(element.get('max-grade', MAX_GRADE))
    grader.setMaxGrade(maximum_grade)
    grader.setMarkingCriteria(ENTITY_NAME, ENTITY_ATTRIBUTES, ENTITY_KEY, EXTRA_ENTITY_PENALTY, WEAK_ENTITY,
                              RELATIONSHIP, CARDINALITY, EXTRA_ENTITY_PENALTY)
    return maximum_grade


def render(element_html, data):
    element = lxml.html.fragment_fromstring(element_html)
    give_feedback = FEEDBACK
    final_feedback = MARKERFEEDBACK
    data['params']['oldAnswer'] = data['submitted_answers'].get('c', '')

    if data['panel'] == 'question':
        html_params = {
            'question_data': data['params']['question_data'],
            'oldAnswer': data['params']['oldAnswer'],
        }
        with open('uml-element.mustache', 'r', encoding='utf-8') as f:
            html = chevron.render(f, html_params).strip()

    elif data['panel'] == 'submission':
        if give_feedback:
            try:
                feedback = data['partial_scores']['uml_answer'].get('feedback', None)
            except KeyError:
                feedback = ''
        else:
            feedback = ''
        html_params = {
            'submission': True,
            'feedback': feedback,
            'oldAnswer': data['params']['oldAnswer'],
        }
        with open('uml-submission.mustache', 'r', encoding='utf-8') as f:
            html = chevron.render(f, html_params).strip()

    elif data['panel'] == 'answer':
        if final_feedback:
            try:
                marker_feedback = data['partial_scores']['uml_answer'].get('marker_feedback', None)
            except KeyError:
                marker_feedback = ''
        else:
            marker_feedback = ''
        html_params = {
            'answer': True,
            'finalFeedback': marker_feedback,
            'oldAnswer': data['params']['oldAnswer'],
        }
        with open('uml-answer.mustache', 'r', encoding='utf-8') as f:
            html = chevron.render(f, html_params).strip()
    
    return html


def grade(element_html, data):
    maximum_grade = setup_marking(element_html, data)
    graded_question = grader.grade_question(data)
    score = graded_question['params']['score']
    feedback = graded_question['params']['feedback']
    marker_feedback = graded_question['params']['marker_feedback']
    data['params']['feedback'] = feedback
    data['partial_scores']['uml_answer'] = {
        'score': score,
        'weight': maximum_grade,
        'feedback': feedback,
        'marker_feedback': marker_feedback
    }
