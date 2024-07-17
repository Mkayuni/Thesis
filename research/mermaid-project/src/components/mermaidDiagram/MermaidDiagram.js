import React, { useEffect } from 'react';
import mermaid from 'mermaid';

const MermaidDiagram = ({ schema, relationships }) => {
  useEffect(() => {
    const schemaToMermaidSource = () => {
      let schemaText = [];
      schema.forEach((schemaItem, entKey) => {
        let item = `class ${schemaItem.entity}:::styling { `;
        schemaItem.attribute.forEach((attItem, attKey) => {
          let key = attItem.key ? `&#123${attItem.key.substring(1, attItem.key.length - 1)}&#125` : '';
          item += `${attItem.attribute} ${key}\n`;
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
      const source = `classDiagram\ndirection TD\n${schemaToMermaidSource()}`;
      mermaid.mermaidAPI.initialize({ startOnLoad: false });
      mermaid.mermaidAPI.render('umlDiagram', source, (svgGraph) => {
        document.getElementById('diagram').innerHTML = svgGraph;
      });
    };

    if (schema.size !== 0) {
      renderDiagram();
    } else {
      document.getElementById('diagram').innerHTML = null;
    }
  }, [schema, relationships]);

  return <div id="diagram"></div>;
};

export default MermaidDiagram;
