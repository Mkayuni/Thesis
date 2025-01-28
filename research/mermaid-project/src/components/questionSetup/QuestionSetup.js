import React, { useEffect } from 'react';

const QuestionSetup = ({ questionMarkdown, setSchema, showPopup }) => {
  useEffect(() => {
    function extractEntitiesAndAttributes(question) {
      const entityAttributePattern = /\[(.*?)\]\((.*?)\)/g;
      const entities = new Set();
      const attributes = new Set();
      let match;

      while ((match = entityAttributePattern.exec(question)) !== null) {
        const entityName = match[2].replace(/\s+/g, '').toLowerCase(); // Normalize entity name
        entities.add(entityName);
        attributes.add(match[1]);
      }

      return { entities, attributes };
    }

    function extractMethods(question) {
      const methodPattern = /<method>(.*?)<\/method>/g;
      const methods = new Set();
      let match;

      while ((match = methodPattern.exec(question)) !== null) {
        methods.add(match[1].trim());
      }

      return methods;
    }

    function stripMethodParameters(methodName) {
      return methodName.replace(/\(.*?\)/, '()');
    }

    function markdownToHTML(question) {
      const questionPattern = /<uml-question>(.*?)<\/uml-question>/s;
      const questionMatch = question.match(questionPattern);
      let questionContent = questionMatch ? questionMatch[1] : '';

      questionContent = questionContent.replace(/`[^`]+`/, '');

      let questionHTML = '';
      let insideSquare = false;
      let insideCircle = false;
      let innerHTML = '';
      let nameInER = '';

      for (let i = 0; i < questionContent.length; i++) {
        if (questionContent.charAt(i) === '\n') {
          questionHTML += ' ';
        }
        if (questionContent.charAt(i) === '[') {
          insideSquare = true;
        } else if (questionContent.charAt(i) === ']') {
          insideSquare = false;
        } else if (questionContent.charAt(i) === '(') {
          if (questionContent.charAt(i - 1) === ']') {
            insideCircle = true;
          } else {
            questionHTML += questionContent.charAt(i);
          }
        } else if (questionContent.charAt(i) === ')') {
          if (insideCircle) {
            insideCircle = false;
            const boldText = innerHTML;
            const normalizedEntityName = nameInER.replace(/\s+/g, '').toLowerCase(); // Normalize entity name
            questionHTML += `<strong><a href="#" onclick="event.preventDefault(); window.showPopup(event, '${normalizedEntityName}')">${boldText}</a></strong>`;
            nameInER = '';
            innerHTML = '';
          } else {
            questionHTML += questionContent.charAt(i);
          }
        } else if (!insideCircle && !insideSquare) {
          questionHTML += questionContent.charAt(i);
        } else if (insideCircle) {
          nameInER += questionContent.charAt(i);
        } else if (insideSquare) {
          innerHTML += questionContent.charAt(i);
        }
      }

      return questionHTML;
    }

    function questionSetup() {
      const { entities, attributes } = extractEntitiesAndAttributes(questionMarkdown);
      const question = document.getElementById('question');
      question.innerHTML = markdownToHTML(questionMarkdown);

      window.showPopup = showPopup;
      window.addEntityOrAttribute = (nameInER) => {
        if (entities.has(nameInER)) {
          addEntity(nameInER);
        } else if (attributes.has(nameInER)) {
          showPopup(nameInER);
        }
      };
    }

    const addEntity = (entityName) => {
      const normalizedEntityName = entityName.replace(/\s+/g, '').toLowerCase(); // Normalize entity name
      setSchema((prevSchema) => {
        const newSchema = new Map(prevSchema);
        if (!newSchema.has(normalizedEntityName)) {
          newSchema.set(normalizedEntityName, { entity: normalizedEntityName, attribute: new Map(), methods: [] });
        }
        return newSchema;
      });
    };

    if (questionMarkdown) {
      questionSetup();
    }
  }, [questionMarkdown, showPopup, setSchema]);

  return <div id="question"></div>;
};

export default QuestionSetup;