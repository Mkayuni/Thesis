import React, { useEffect } from 'react';

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
      let questionHTML = '';
      let insideSquare = false;
      let insideCircle = false;
      let innerHTML = '';
      let nameInER = '';

      for (let i = 0; i < question.length; i++) {
        if (question.charAt(i) === '\n') {
          questionHTML += ' ';
        }
        if (question.charAt(i) === '[') {
          insideSquare = true;
        } else if (question.charAt(i) === ']') {
          insideSquare = false;
        } else if (question.charAt(i) === '(') {
          if (question.charAt(i - 1) === ']') {
            insideCircle = true;
          } else {
            questionHTML += question.charAt(i);
          }
        } else if (question.charAt(i) === ')') {
          if (insideCircle) {
            insideCircle = false;
            const boldText = innerHTML;
            questionHTML += `<strong><a href="#" onclick="event.preventDefault(); window.showPopup(event, '${nameInER}')">${boldText}</a></strong>`;
            nameInER = '';
            innerHTML = '';
          } else {
            questionHTML += question.charAt(i);
          }
        } else if (!insideCircle && !insideSquare) {
          questionHTML += question.charAt(i);
        } else if (insideCircle) {
          nameInER += question.charAt(i);
        } else if (insideSquare) {
          innerHTML += question.charAt(i);
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

    const initQuestionSetup = () => {
      questionSetup();
    };

    if (questionMarkdown) {
      initQuestionSetup();
    }
  }, [questionMarkdown, schema, showPopup]);

  const addEntity = (entityName) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      if (!newSchema.has(entityName)) {
        newSchema.set(entityName, { entity: entityName, attribute: new Map() });
      }
      return newSchema;
    });
  };

  const addAttribute = (entityName, attName, key = '') => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const enObj = newSchema.get(entityName);
      enObj.attribute.set(attName, { attribute: attName, key });
      newSchema.set(entityName, enObj);
      return newSchema;
    });

    setAttributes((prevAttributes) => {
      const newAttributes = new Map(prevAttributes);
      if (!newAttributes.has(attName)) {
        const enMap = new Map();
        enMap.set(entityName, { attribute: attName, key });
        newAttributes.set(attName, { attribute: attName, entities: enMap });
      } else {
        const attObj = newAttributes.get(attName);
        attObj.entities.set(entityName, { attribute: attName, key });
        newAttributes.set(attName, attObj);
      }
      return newAttributes;
    });
  };

  return <div id="question"></div>;
};

export default QuestionSetup;
