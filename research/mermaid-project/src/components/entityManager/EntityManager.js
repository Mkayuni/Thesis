import React, { useEffect, useRef, useCallback } from 'react';

const EntityManager = ({ schema, setSchema, attributes, setAttributes, showPopup }) => {
  const questionRef = useRef(null);

  const toAttributeName = (string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
  };

  const updateAttMenu = useCallback((i, j) => {
    const attElement = document.getElementById(`sm-att-${i}-${j}`);
    if (attElement) {
      let attHTML = '';
      const attName = toAttributeName(attElement.parentElement.getAttribute('nameer'));

      attHTML += `<a class="attribute ${i}-${j}" href="#" onclick="event.preventDefault(); window.showPopup(event, '${attName}', 'attribute')">Add attribute</a><div id="submenu-${i}-${j}" class="submenu-content">`;
      schema.forEach((value, key) => {
        const enObj = schema.get(key);
        if (typeof enObj['attribute'].get(attName) === 'undefined') {
          attHTML += `<a href="#" onclick="event.preventDefault(); window.addAttributeToEntity('${attName}', '${key}')" class="${key}" id="attribute${i}-${j}-${key}">${value.entity}</a>`;
        } else {
          attHTML += `<a href="#" class="disabled-link ${key}" id="attribute${i}-${j}-${key}">${value.entity}</a>`;
        }
      });
      attHTML += '</div>';

      attElement.innerHTML = attHTML;
    }
  }, [schema]);

  const showAddAttribute = useCallback(() => {
    const questionElement = questionRef.current;
    if (questionElement) {
      const lis = questionElement.getElementsByTagName('li');
      for (let i = 0; i < lis.length; i++) {
        const divs = lis[i].children;
        for (let j = 0; j < divs.length; j++) {
          if (schema.size === 0) {
            const attElement = document.getElementById(`sm-att-${i}-${j}`);
            if (attElement) {
              attElement.innerHTML = `<a class="disabled-link attribute ${i}-${j}">Add attribute</a>`;
            }
          } else {
            updateAttMenu(i, j);
          }
        }
      }
    }
  }, [schema, updateAttMenu]);

  useEffect(() => {
    window.addAttributeToEntity = (attribute, entity) => {
      addAttribute(entity, attribute);
    };

    showAddAttribute();
  }, [schema, attributes, showAddAttribute]);

  const addEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map() });
      return newSchema;
    });
  }, [setSchema]);

  const addAttribute = useCallback((entity, attribute, key = '') => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.set(attribute, { attribute, key });
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });

    setAttributes((prevAttributes) => {
      const newAttributes = new Map(prevAttributes);
      if (!newAttributes.has(attribute)) {
        const enMap = new Map();
        enMap.set(entity, true);
        newAttributes.set(attribute, { attribute, entities: enMap });
      } else {
        const attObj = newAttributes.get(attribute);
        attObj.entities.set(entity, true);
      }
      return newAttributes;
    });
  }, [setSchema, setAttributes]);

  return (
    <div id="entity-manager">
      <h3>Entity Manager</h3>
      <div id="entity-list">
        {Array.from(schema.entries()).map(([key, value]) => (
          <div key={key}>
            <h4>{value.entity}</h4>
            <ul>
              {Array.from(value.attribute.entries()).map(([attKey, attValue]) => (
                <li key={attKey}>
                  {attValue.attribute} {attValue.key}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityManager;
