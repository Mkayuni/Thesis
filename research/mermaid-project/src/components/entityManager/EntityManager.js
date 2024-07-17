import React, { useEffect } from 'react';

const EntityManager = ({ schema, setSchema, attributes, setAttributes, addEntity, removeEntity, addAttribute, removeAttribute }) => {

  const toAttributeName = (string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
  };

  const updateEntityMenu = (i, j, clicked) => {
    let entityElement = document.getElementById(`sm-entity-${i}-${j}`);
    entityElement.innerHTML = `<a onclick="addEntity(this)" class="entity ${i}-${j}">Add entity</a>`;
    let entity = entityElement.className.split(' ')[1];

    let allEntities = document.getElementsByClassName(entity);
    for (let k = 0; k < allEntities.length; k++) {
      if (clicked) {
        allEntities[k].className += ' disabled-link';
      } else {
        allEntities[k].className = allEntities[k].className.replace(' disabled-link', '');
      }
    }
  };

  const showAddAttribute = () => {
    const lis = document.getElementById('question').getElementsByTagName('li');
    for (let i = 0; i < lis.length; i++) {
      const divs = lis[i].children;
      for (let j = 0; j < divs.length; j++) {
        if (schema.size === 0) {
          document.getElementById(`sm-att-${i}-${j}`).innerHTML = `<a class="disabled-link attribute ${i}-${j}">Add attribute</a>`;
        } else {
          updateAttMenu(i, j);
        }
      }
    }
  };

  const updateAttMenu = (i, j) => {
    let attHTML = '';
    let attName = toAttributeName(document.getElementById(`sm-att-${i}-${j}`).parentElement.getAttribute('nameer'));
    let attObj = attributes.get(attName);

    attHTML +=
      `<a class="attribute ${i}-${j}" >Add attribute </a>` +
      `<div id="submenu-${i}-${j}" class="submenu-content">`;
    schema.forEach((value, key) => {
      let enObj = schema.get(key);
      if (typeof enObj['attribute'].get(attName) === 'undefined') {
        attHTML += `<a onclick="addAttribute(this.className, '${attName}')" class="${key}" id="attribute${i}-${j}-${key}">${value.entity}</a>`;
      } else {
        attHTML += `<a class="disabled-link ${key}" id="attribute${i}-${j}-${key}">${value.entity}</a>`;
      }
    });
    attHTML += '</div>';

    document.getElementById(`sm-att-${i}-${j}`).innerHTML = attHTML;
  };

  const handleAddEntity = () => {
    const entity = 'NewEntity';
    addEntity(entity);
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map() });
      return newSchema;
    });
  };

  const handleRemoveEntity = () => {
    const entity = 'EntityToRemove';
    removeEntity(entity);
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.delete(entity);
      return newSchema;
    });
  };

  const handleAddAttribute = () => {
    const entity = 'Entity';
    const attribute = 'NewAttribute';
    addAttribute(entity, attribute, '{PK}');
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.set(attribute, { attribute, key: '{PK}' });
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });

    setAttributes((prevAttributes) => {
      const newAttributes = new Map(prevAttributes);
      if (!newAttributes.has(attribute)) {
        const enMap = new Map();
        enMap.set(entity);
        newAttributes.set(attribute, { attribute, entities: enMap });
      } else {
        const attObj = newAttributes.get(attribute);
        attObj.entities.set(entity);
      }
      return newAttributes;
    });
  };

  const handleRemoveAttribute = () => {
    const entity = 'Entity';
    const attribute = 'AttributeToRemove';
    removeAttribute(entity, attribute);
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.delete(attribute);
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });

    setAttributes((prevAttributes) => {
      const newAttributes = new Map(prevAttributes);
      const attObj = newAttributes.get(attribute);
      if (attObj) {
        attObj.entities.delete(entity);
        if (attObj.entities.size === 0) {
          newAttributes.delete(attribute);
        }
      }
      return newAttributes;
    });
  };

  useEffect(() => {
    showAddAttribute();
  }, [schema, attributes]);

  return (
    <div id="entity-manager">
      <h3>Entity Manager</h3>
      <button onClick={handleAddEntity}>Add Entity</button>
      <button onClick={handleRemoveEntity}>Remove Entity</button>
      <button onClick={handleAddAttribute}>Add Attribute</button>
      <button onClick={handleRemoveAttribute}>Remove Attribute</button>
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
            <button onClick={() => removeEntity(key)}>Remove {value.entity}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityManager;
