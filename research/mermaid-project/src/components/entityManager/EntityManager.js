// src/components/entityManager/EntityManager.js

import { useState, useCallback } from 'react';

export const useEntityManagement = () => {
  // Initialize state for schema and relationships
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map());

  // Function to add a new entity with optional methods
  const addEntity = useCallback((entity, methods = []) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map(), methods });
      return newSchema;
    });
  }, []);

  // Function to remove an entity
  const removeEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.delete(entity);
      return newSchema;
    });
  }, []);

  // Private utility to get an entity's attributes safely
  const _getAttributes = (entity, prevSchema) => {
    const entityData = prevSchema.get(entity);
    return entityData ? Array.from(entityData.attribute.entries()) : [];
  };

  // Function to add a new attribute to an entity
  const addAttribute = useCallback((entity, attribute, type = 'String', key = '') => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        const attributes = _getAttributes(entity, prevSchema);
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
      }
      return newSchema;
    });
  }, []);

  // Function to update an attribute's key (protected by utility)
  const updateAttributeKey = useCallback((entity, attribute, newKey) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData && entityData.attribute.has(attribute)) {
        const attributes = _getAttributes(entity, prevSchema);
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
        }
      }
      return newSchema;
    });
  }, []);

  // Function to remove an attribute from an entity (protected by utility)
  const removeAttribute = useCallback((entity, attribute) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.delete(attribute);
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });
  }, []);

  // Function to add a method to an entity
  const addMethod = useCallback((entity, methodDetails) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.methods.push(methodDetails);
        console.log("Schema after adding method:", newSchema); // Debug log
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });
  }, []);

  // Function to add a new relationship
  const addRelationship = useCallback((relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      const id = newRelationships.size + 1;
      newRelationships.set(id, { id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText });
      return newRelationships;
    });
  }, []);

  // Function to edit an existing relationship
  const editRelationship = useCallback((id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      if (newRelationships.has(id)) {
        newRelationships.set(id, { id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText });
      }
      return newRelationships;
    });
  }, []);

  // Function to remove a relationship
  const removeRelationship = useCallback((id) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      newRelationships.delete(id);
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
    addRelationship,
    editRelationship,
    removeRelationship,
    setSchema,
    setRelationships,
  };
};
