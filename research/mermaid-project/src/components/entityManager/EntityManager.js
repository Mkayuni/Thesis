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
        return prevSchema; // Avoid adding methods to non-existent entities
      }

      const existingMethods = entityData.methods || [];
      entityData.methods = [...existingMethods, methodDetails]; // Add method details
      newSchema.set(entity, entityData);
      console.log(`Added Method: ${methodDetails.name} to Entity: ${entity}`); // Log added method
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
  const addRelationship = useCallback((relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      // Ensure relationship doesn't already exist
      const existingRelation = Array.from(prevRelationships.values()).find(
        (rel) => rel.relationA === relationA && rel.relationB === relationB
      );
      if (existingRelation) {
        console.warn(`Relationship between "${relationA}" and "${relationB}" already exists.`);
        return prevRelationships;
      }

      const newRelationships = new Map(prevRelationships);
      const id = newRelationships.size + 1;
      newRelationships.set(id, { id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText });
      console.log(`Added Relationship: ${relationA} -- ${relationB}`); // Log added relationship
      return newRelationships;
    });
  }, []);

  // Function to edit an existing relationship
  const editRelationship = useCallback((id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      if (!newRelationships.has(id)) {
        console.warn(`Relationship with ID "${id}" does not exist.`);
        return prevRelationships; // Avoid editing non-existent relationships
      }

      newRelationships.set(id, { id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText });
      console.log(`Edited Relationship: ${relationA} -- ${relationB}`); // Log edited relationship
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