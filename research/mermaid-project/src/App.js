// src/App.js

import React, { useState } from 'react';
import UMLComponent from './components/UMLComponent';
import './App.css';

function App() {
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState([]);
  const [setAttributes] = useState(new Map());

  return (
    <div className="App">
      <UMLComponent 
        setSchema={setSchema}
        setRelationships={setRelationships}
        schema={schema}
        relationships={relationships}
        setAttributes={setAttributes}
      />
    </div>
  );
}

export default App;
