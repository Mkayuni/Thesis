import React, { useEffect } from 'react';
import mermaid from 'mermaid';

const MermaidComponent = () => {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
  }, []);

  const fetchAndRenderUMLContent = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/convert_file');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      document.getElementById('question').innerHTML = `<p>${data.question}</p>`;
      document.getElementById('diagram').innerHTML = `<div class="mermaid">${data.mermaid_code}</div>`;
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
      console.error('Error fetching and rendering UML content:', error);
    }
  };

  const fetchAndRenderYAMLContent = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/convert_yaml_file');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      document.getElementById('diagram').innerHTML = `<div class="mermaid">${data.mermaid_code}</div>`;
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
      console.error('Error fetching and rendering YAML content:', error);
    }
  };

  return (
    <div>
      <h1>Welcome to the Mermaid Project</h1>
      <p>This is a test paragraph to ensure the HTML is being displayed correctly.</p>

      <button onClick={fetchAndRenderUMLContent}>Load UML Diagram</button>
      <button onClick={fetchAndRenderYAMLContent}>Load YAML Diagram</button>

      <div id="question"></div>
      <div id="diagram"></div>
    </div>
  );
};

export default MermaidComponent;
