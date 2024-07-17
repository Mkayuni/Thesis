import React from 'react';

const RelationshipManager = ({ relationships, setRelationships, addRelationship, editRelationship, removeRelationship }) => {
  const handleAddRelationship = () => {
    const relationA = prompt('Enter first entity of the relationship:');
    const relationB = prompt('Enter second entity of the relationship:');
    const cardinalityA = prompt('Enter cardinality for first entity:');
    const cardinalityB = prompt('Enter cardinality for second entity:');
    const cardinalityText = prompt('Enter relationship text:');

    if (relationA && relationB && cardinalityA && cardinalityB && cardinalityText) {
      addRelationship(relationA, relationB, cardinalityA, cardinalityB, cardinalityText);
    }
  };

  const handleEditRelationship = (id) => {
    const relationA = prompt('Enter new first entity of the relationship:');
    const relationB = prompt('Enter new second entity of the relationship:');
    const cardinalityA = prompt('Enter new cardinality for first entity:');
    const cardinalityB = prompt('Enter new cardinality for second entity:');
    const cardinalityText = prompt('Enter new relationship text:');

    if (relationA && relationB && cardinalityA && cardinalityB && cardinalityText) {
      editRelationship(id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText);
    }
  };

  const handleRemoveRelationship = (id) => {
    removeRelationship(id);
  };

  return (
    <div>
      <button onClick={handleAddRelationship}>Add Relationship</button>
      <ul>
        {Array.from(relationships.values()).map((rel) => (
          <li key={rel.id}>
            {rel.relationA} {rel.cardinalityA} - {rel.cardinalityB} {rel.relationB}: {rel.cardinalityText}
            <button onClick={() => handleEditRelationship(rel.id)}>Edit</button>
            <button onClick={() => handleRemoveRelationship(rel.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelationshipManager;
