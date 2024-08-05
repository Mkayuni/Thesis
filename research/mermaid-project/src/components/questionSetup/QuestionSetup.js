// src/components/questionSetup/QuestionSetup.js

import React, { useEffect } from 'react';

const QuestionSetup = ({ questionMarkdown, setSchema, showPopup }) => {
  useEffect(() => {
    function extractEntitiesAndAttributes(question) {
      const entityAttributePattern = /\[(.*?)\]\((.*?)\)/g;
      const entities = new Set();
      const attributes = new Set();
      let match;

      while ((match = entityAttributePattern.exec(question)) !== null) {
        entities.add(match[2]);
        attributes.add(match[1]);
      }

      return { entities, attributes };
    }

    function extractMethods(question) {
      const methodPattern = /`([^`]+)`/g;
      const methods = new Set();
      let match;

      // Extract methods from the markdown
      while ((match = methodPattern.exec(question)) !== null) {
        const methodList = match[1].split(',').map(method => method.trim());
        methodList.forEach(method => methods.add(method));
      }

      return methods;
    }

    function stripMethodParameters(methodName) {
      // Remove everything inside the parentheses
      return methodName.replace(/\(.*?\)/, '()');
    }

    function markdownToHTML(question) {
      const questionPattern = /<uml-question>(.*?)<\/uml-question>/s;
      const questionMatch = question.match(questionPattern);
      let questionContent = questionMatch ? questionMatch[1] : '';

      // Remove the plain text method list from the question content
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
            // Restore the entity/attribute linking logic
            questionHTML += `<strong><a href="#" onclick="event.preventDefault(); window.showPopup(event, '${nameInER}')">${boldText}</a></strong>`;
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

      // Add methods as plain text with parameters stripped
      const methods = extractMethods(question);
      if (methods.size > 0) {
        questionHTML += '<br /><br />Consider the following methods and decide which entity each method should belong to:<br />';
        methods.forEach((method) => {
          // Strip parameters before appending
          questionHTML += `${stripMethodParameters(method)}, `;
        });
        questionHTML = questionHTML.slice(0, -2); // Remove the last comma and space
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
      setSchema((prevSchema) => {
        const newSchema = new Map(prevSchema);
        if (!newSchema.has(entityName)) {
          newSchema.set(entityName, { entity: entityName, attribute: new Map(), methods: [] });
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
