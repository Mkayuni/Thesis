import { useState, useCallback } from 'react';

export const useEntityManagement = () => {
  // Initialize state for schema and relationships
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map());

  // Function to add a new entity with optional methods
  const addEntity = useCallback((entity, methods = []) => {
    setSchema((prevSchema) => {
      if (prevSchema.has(entity)) {
        console.warn(`Entity "${entity}" already exists.`);
        return prevSchema; // Avoid duplicate entities
      }

      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map(), methods });
      console.log(`Added Entity: ${entity}`); // Log added entity
      return newSchema;
    });
  }, []);

  // Function to remove an entity
  const removeEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      if (!prevSchema.has(entity)) {
        console.warn(`Entity "${entity}" does not exist.`);
        return prevSchema; // Avoid errors if entity doesn't exist
      }

      const newSchema = new Map(prevSchema);
      newSchema.delete(entity);
      console.log(`Removed Entity: ${entity}`); // Log removed entity
      return new Map(newSchema);
    });
  }, []);

  // Function to add a new attribute to an entity
  const addAttribute = useCallback((entity, attribute, type = '', key = '') => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (!entityData) {
        console.warn(`Entity "${entity}" does not exist.`);
        return prevSchema; // Avoid adding attributes to non-existent entities
      }
  
      if (!type) {
        console.warn(`Type is empty for Attribute: ${attribute} in Entity: ${entity}`); // Log warning for empty type
      }
  
      const attributes = Array.from(entityData.attribute.entries());
      const attributeIndex = attributes.findIndex(([attr]) => attr === attribute);
  
      if (attributeIndex !== -1) {
        attributes.splice(attributeIndex, 1);
      }
  
      const newAttribute = { attribute, type, key, visibility: 'private' }; // Include type
  
      if (key) {
        attributes.unshift([attribute, newAttribute]);
      } else {
        attributes.push([attribute, newAttribute]);
      }
  
      entityData.attribute = new Map(attributes);
      newSchema.set(entity, entityData);
      console.log(`Added Attribute: ${attribute} to Entity: ${entity}, Type: ${type}`); // Log added attribute
      return newSchema;
    });
  }, []);

  // Function to update an attribute's key
  const updateAttributeKey = useCallback((entity, attribute, newKey) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (!entityData || !entityData.attribute.has(attribute)) {
        console.warn(`Attribute "${attribute}" does not exist on entity "${entity}".`);
        return prevSchema; // Avoid updating non-existent attributes
      }

      const attributes = Array.from(entityData.attribute.entries());
      const attributeIndex = attributes.findIndex(([attr]) => attr === attribute);

      if (attributeIndex !== -1) {
        const [attr, attrData] = attributes.splice(attributeIndex, 1)[0];
        attrData.key = newKey;

        if (newKey) {
          attributes.unshift([attr, attrData]);
        } else {
          attributes.push([attr, attrData]);
        }

        entityData.attribute = new Map(attributes);
        newSchema.set(entity, entityData);
        console.log(`Updated Attribute Key: ${attribute} in Entity: ${entity}, New Key: ${newKey}`); // Log updated key
      }
      return newSchema;
    });
  }, []);

  // Function to remove an attribute from an entity
  const removeAttribute = useCallback((entity, attribute) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (!entityData || !entityData.attribute.has(attribute)) {
        console.warn(`Attribute "${attribute}" does not exist on entity "${entity}".`);
        return prevSchema; // Avoid removing non-existent attributes
      }

      entityData.attribute.delete(attribute);
      newSchema.set(entity, entityData);
      console.log(`Removed Attribute: ${attribute} from Entity: ${entity}`); // Log removed attribute
      return newSchema;
    });
  }, []);

  // Function to add a method to an entity
  const addMethod = useCallback((entity, methodDetails) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (!entityData) {
        console.warn(`Entity "${entity}" does not exist.`);
        return prevSchema;
      }

      const existingMethods = entityData.methods || [];
      // Check if method with same name already exists
      const methodExists = existingMethods.some((method) => method.name === methodDetails.name);

      if (!methodExists) {
        entityData.methods = [...existingMethods, methodDetails];
        newSchema.set(entity, entityData);
        console.log(`Added Method: ${methodDetails.name} to Entity: ${entity}`);
      } else {
        console.warn(`Method "${methodDetails.name}" already exists in Entity "${entity}".`);
      }

      return newSchema;
    });
  }, []);

  // Function to remove a method from an entity
  const removeMethod = useCallback((entity, methodName) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (!entityData) {
        console.warn(`Entity "${entity}" does not exist.`);
        return prevSchema; // Avoid removing methods from non-existent entities
      }

      entityData.methods = entityData.methods.filter((method) => method.name !== methodName);
      newSchema.set(entity, entityData);
      console.log(`Removed Method: ${methodName} from Entity: ${entity}`); // Log removed method
      return newSchema;
    });
  }, []);

  // Function to add a new relationship
  // Function to add a new relationship
  const addRelationship = useCallback((relationship) => {
    setRelationships((prevRelationships) => {
      // Ensure relationship doesn't already exist
      const existingRelation = Array.from(prevRelationships.values()).find(
        (rel) =>
          rel.relationA === relationship.relationA &&
          rel.relationB === relationship.relationB &&
          rel.type === relationship.type // Consider relationship type
      );
      if (existingRelation) {
        console.warn(
          `Relationship between "${relationship.relationA}" and "${relationship.relationB}" of type "${relationship.type}" already exists.`
        );
        return prevRelationships;
      }

      const newRelationships = new Map(prevRelationships);
      const id = Date.now(); // Unique ID

      if (relationship.type === 'inheritance') {
        // Store inheritance relationship
        newRelationships.set(id, {
          id,
          type: 'inheritance',
          relationA: relationship.relationA, // Child
          relationB: relationship.relationB, // Parent
        });
        console.log(`Added Inheritance Relationship: ${relationship.relationA} ▷ ${relationship.relationB}`);
      } else if (relationship.type === 'composition') {
        // Store composition relationship
        newRelationships.set(id, {
          id,
          type: 'composition',
          relationA: relationship.relationA, // Owner
          relationB: relationship.relationB, // Owned
          cardinalityA: relationship.cardinalityA || '1', // Default cardinality
          cardinalityB: relationship.cardinalityB || '1', // Default cardinality
        });
        console.log(
          `Added Composition Relationship: ${relationship.relationA} ◆ ${relationship.relationB} (${relationship.cardinalityA}-${relationship.cardinalityB})`
        );
      } else if (relationship.type === 'aggregation') {
        // Store aggregation relationship
        newRelationships.set(id, {
          id,
          type: 'aggregation',
          relationA: relationship.relationA, // Whole
          relationB: relationship.relationB, // Part
          cardinalityA: relationship.cardinalityA || '1', // Default cardinality
          cardinalityB: relationship.cardinalityB || 'many', // Default cardinality
        });
        console.log(
          `Added Aggregation Relationship: ${relationship.relationA} ◇ ${relationship.relationB} (${relationship.cardinalityA}-${relationship.cardinalityB})`
        );
      } else {
        // Store cardinality relationship
        newRelationships.set(id, {
          id,
          type: 'cardinality',
          relationA: relationship.relationA,
          relationB: relationship.relationB,
          cardinalityA: relationship.cardinalityA,
          cardinalityB: relationship.cardinalityB,
        });
        console.log(
          `Added Cardinality Relationship: ${relationship.relationA} ${relationship.cardinalityA} -- ${relationship.cardinalityB} ${relationship.relationB}`
        );
      }

      return newRelationships;
    });
  }, []);

  // Function to edit an existing relationship
  const editRelationship = useCallback((id, updatedRelationship) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      if (!newRelationships.has(id)) {
        console.warn(`Warning: Relationship with ID "${id}" does not exist.`);
        return prevRelationships; // Avoid modifying a non-existent relationship
      }

      const existingRelationship = newRelationships.get(id);
      const updatedRel = {
        ...existingRelationship,
        ...updatedRelationship,
      };

      newRelationships.set(id, updatedRel);
      console.log(`Edited Relationship ID "${id}": ${updatedRel.relationA} -- ${updatedRel.relationB}`);
      return newRelationships;
    });
  }, []);

  // Function to remove a relationship
  const removeRelationship = useCallback((id) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      if (!newRelationships.has(id)) {
        console.warn(`Relationship with ID "${id}" does not exist.`);
        return prevRelationships; // Avoid removing non-existent relationships
      }
      newRelationships.delete(id);
      console.log(`Removed Relationship with ID: ${id}`); // Log removed relationship
      return newRelationships;
    });
  }, []);

  return {
    schema,
    relationships,
    addEntity,
    removeEntity,
    addAttribute,
    updateAttributeKey,
    removeAttribute,
    addMethod,
    removeMethod, 
    addRelationship,
    editRelationship,
    removeRelationship,
    setSchema,
    setRelationships,
  };
};

