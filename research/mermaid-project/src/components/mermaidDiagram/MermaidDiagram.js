import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import '../mermaid.css'; // Ensure this path points to your CSS file

const MermaidDiagram = ({ schema, relationships }) => {
  const diagramRef = useRef(null);

  useEffect(() => {
    const schemaToMermaidSource = () => {
      let schemaText = [];
      schema.forEach((schemaItem, entKey) => {
        let item = `class ${schemaItem.entity} {\n`;
        item += `    <text class="entity-name">${schemaItem.entity}</text>\n`; // Entity name with custom class
        schemaItem.attribute.forEach((attItem, attKey) => {
          item += `    <text class="attribute">${attItem.attribute} ${attItem.key ? `(${attItem.key})` : ''}</text>\n`; // Attribute with custom class
        });
        item += '}';
        schemaText.push(item);
      });

      relationships.forEach((rel) => {
        let item = `${rel.relationA}"${rel.cardinalityA}"--"${rel.cardinalityB}"${rel.relationB}`;
        if (rel.cardinality_Text && !rel.cardinality_Text.includes('___')) {
          item += ` : ${rel.cardinality_Text}`;
        } else {
          item += ':___';
        }
        schemaText.push(item);
      });

      return schemaText.join('\n');
    };

    const renderDiagram = () => {
      const source = `classDiagram\n${schemaToMermaidSource()}`;
      mermaid.mermaidAPI.initialize({ startOnLoad: false });
      mermaid.mermaidAPI.render('umlDiagram', source, (svgGraph) => {
        const diagramElement = diagramRef.current;
        if (diagramElement) {
          diagramElement.innerHTML = svgGraph;
        }
      });
    };

    if (schema.size !== 0) {
      renderDiagram();
    } else {
      const diagramElement = diagramRef.current;
      if (diagramElement) {
        diagramElement.innerHTML = null;
      }
    }
  }, [schema, relationships]);

  return <div id="diagram" ref={diagramRef}></div>;
};

export default MermaidDiagram;