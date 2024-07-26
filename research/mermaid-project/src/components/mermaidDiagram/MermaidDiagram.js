import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import '../mermaid.css'; // Ensure this path points to your CSS file

const DiagramBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  flex: 3,
  overflow: 'hidden', // Disable vertical scrolling
}));

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const getStyles = (options) => `
  .label {
    font-family: ${options.fontFamily};
    color: ${options.nodeTextColor || options.textColor};
  }
  .cluster-label text {
    fill: ${options.titleColor};
  }
  .cluster-label span {
    color: ${options.titleColor};
  }
  .label text, span {
    fill: ${options.nodeTextColor || options.textColor};
    color: ${options.nodeTextColor || options.textColor};
  }
  .node rect,
  .node circle,
  .node ellipse {
    fill: #f5f5f5 !important;
    stroke: #000 !important;
    stroke-width: 2px !important;
  }
  .node text.entity-name {
    font-weight: bold !important;
    font-size: 20px !important;
  }
  .node text.attribute {
    font-size: 16px !important;
    font-style: italic !important;
  }
  .node rect:first-of-type {
    stroke: #000 !important;
    stroke-width: 2px !important;
  }
  text[visibility="hidden"] {
    display: none !important;
  }
`;

const MermaidDiagram = ({ schema, relationships }) => {
  const diagramRef = useRef(null);

  useEffect(() => {
    const schemaToMermaidSource = () => {
      let schemaText = [];
      schema.forEach((schemaItem) => {
        let entityName = capitalizeFirstLetter(schemaItem.entity);
        let item = `class ${entityName} {\n`;

        // Sort attributes: PK and PPK should come first
        const attributes = Array.from(schemaItem.attribute.values()).sort((a, b) => {
          if ((a.key === 'PK' || a.key === 'PPK') && (b.key !== 'PK' && b.key !== 'PPK')) return -1;
          if ((b.key === 'PK' || b.key === 'PPK') && (a.key !== 'PK' && a.key !== 'PPK')) return 1;
          return 0;
        });

        const attributeLines = attributes.map(attItem => {
          return `  ${attItem.attribute} ${attItem.key ? `(${attItem.key})` : ''}`;
        });

        if (attributeLines.length === 0) {
          item += '  No attributes\n'; // Use a recognizable string
        } else {
          item += attributeLines.join('\n');
        }

        item += '\n}\n';
        schemaText.push(item);
      });

      relationships.forEach((rel) => {
        let item = `${capitalizeFirstLetter(rel.relationA)}"${rel.cardinalityA}"--"${rel.cardinalityB}"${capitalizeFirstLetter(rel.relationB)}`;
        if (rel.cardinalityText && !rel.cardinalityText.includes('___')) {
          item += ` : ${rel.cardinalityText}`;
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

          // Generate and inject styles
          const styles = getStyles({
            fontFamily: 'Arial, sans-serif',
            nodeTextColor: '#000',
            textColor: '#000',
            titleColor: '#000'
          });

          const svg = diagramElement.querySelector('svg');
          if (svg) {
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            svg.prepend(styleElement);

            // Hide placeholder text
            svg.querySelectorAll('text').forEach((textElement) => {
              if (textElement.textContent.includes('No attributes')) {
                textElement.setAttribute('visibility', 'hidden');
              }
            });
          }

          // Adjust text clipping and fading
          const foreignObjects = diagramElement.querySelectorAll('foreignObject');
          foreignObjects.forEach((fo) => {
            fo.setAttribute('width', '100%');
            fo.setAttribute('height', '100%');
            fo.querySelectorAll('div').forEach((div) => {
              div.style.overflow = 'visible';
            });
          });
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

  return (
    <DiagramBox ref={diagramRef} id="diagram"></DiagramBox>
  );
};

export default MermaidDiagram;
