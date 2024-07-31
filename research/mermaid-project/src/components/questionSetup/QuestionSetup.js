import React, { useEffect, useState } from 'react';

const QuestionSetup = ({ questionMarkdown, setSchema, setAttributes, schema, showPopup }) => {
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

    function markdownToHTML(question) {
      const questionPattern = /<uml-question>(.*?)<\/uml-question>/s;
      const answerPattern = /<uml-answer>(.*?)<\/uml-answer>/s;

      const questionMatch = question.match(questionPattern);
      const questionContent = questionMatch ? questionMatch[1] : '';

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

    const initQuestionSetup = () => {
      questionSetup();
    };

    if (questionMarkdown) {
      initQuestionSetup();
    }
  }, [questionMarkdown, schema, showPopup, setSchema]);

  return <div id="question"></div>;
};

export default QuestionSetup;
