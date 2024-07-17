import React, { useState } from 'react';
import UMLComponent from './components/UMLComponent';
import MermaidDiagram from './components/mermaidDiagram/MermaidDiagram';
import QuestionSetup from './components/questionSetup/QuestionSetup';
import './App.css';

function App() {
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState([]);
  const [attributes, setAttributes] = useState(new Map());
  const [questionMarkdown, setQuestionMarkdown] = useState('');

  return (
    <div className="App">
      <textarea
        placeholder="Enter UML question here"
        value={questionMarkdown}
        onChange={(e) => setQuestionMarkdown(e.target.value)}
        rows={10}
        cols={50}
      />
      <QuestionSetup
        questionMarkdown={questionMarkdown}
        setSchema={setSchema}
        setAttributes={setAttributes}
        schema={schema}
      />
      <UMLComponent setSchema={setSchema} setRelationships={setRelationships} schema={schema} />
      <MermaidDiagram schema={schema} relationships={relationships} />
    </div>
  );
}

export default App;
