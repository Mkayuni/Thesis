import React, { useEffect, useRef } from 'react';

const EntityManager = ({ schema, setSchema, attributes, setAttributes, addEntity, addAttribute, showPopup }) => {
  const questionRef = useRef(null);

  const toAttributeName = (string) => {
    return string.charAt(0).toLowerCase() + string.slice(1);
  };

  const updateAttMenu = (i, j) => {
    const attElement = document.getElementById(`sm-att-${i}-${j}`);
    if (attElement) {
      let attHTML = '';
      const attName = toAttributeName(attElement.parentElement.getAttribute('nameer'));

      attHTML += `<a class="attribute ${i}-${j}" >Add attribute </a><div id="submenu-${i}-${j}" class="submenu-content">`;
      schema.forEach((value, key) => {
        const enObj = schema.get(key);
        if (typeof enObj['attribute'].get(attName) === 'undefined') {
          attHTML += `<a href="#" onclick="event.preventDefault();" class="${key}" id="attribute${i}-${j}-${key}">${value.entity}</a>`;
        } else {
          attHTML += `<a href="#" class="disabled-link ${key}" id="attribute${i}-${j}-${key}">${value.entity}</a>`;
        }
      });
      attHTML += '</div>';
  
      attElement.innerHTML = attHTML;
    }
  };

  const showAddAttribute = () => {
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
  };

  useEffect(() => {
    showAddAttribute();
  }, [schema, attributes, showAddAttribute]);

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
