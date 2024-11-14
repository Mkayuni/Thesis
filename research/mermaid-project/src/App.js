// src/App.js

import React, { useState } from 'react';
import UMLComponent from './components/UMLComponent';
import './App.css';

function App() {
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map()); // Change relationships to a Map for consistency
  const [attributes, setAttributes] = useState(new Map()); // Correct variable name from setAttributes to attributes

  return (
    <div className="App">
      <UMLComponent 
        setSchema={setSchema}
        setRelationships={setRelationships}
        schema={schema}
        relationships={relationships}
        setAttributes={setAttributes} // Pass setAttributes instead of setAttributes state itself
        attributes={attributes} // Pass the attributes state to UMLComponent if needed
      />
    </div>
  );
}

export default App;
