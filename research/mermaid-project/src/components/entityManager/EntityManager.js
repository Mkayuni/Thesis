import { useState, useCallback } from 'react';

export const useEntityManagement = () => {
  const [schema, setSchema] = useState(new Map());
  const [relationships, setRelationships] = useState(new Map());

  const addEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.set(entity, { entity, attribute: new Map() });
      return newSchema;
    });
  }, []);

  const removeEntity = useCallback((entity) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      newSchema.delete(entity);
      return newSchema;
    });
  }, []);

  const addAttribute = useCallback((entity, attribute, key = '') => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData) {
        entityData.attribute.set(attribute, { attribute, key });
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });
  }, []);

  const updateAttributeKey = useCallback((entity, attribute, newKey) => {
    setSchema((prevSchema) => {
      const newSchema = new Map(prevSchema);
      const entityData = newSchema.get(entity);
      if (entityData && entityData.attribute.has(attribute)) {
        const attrData = entityData.attribute.get(attribute);
        attrData.key = newKey;
        entityData.attribute.set(attribute, attrData);
        newSchema.set(entity, entityData);
      }
      return newSchema;
    });
  }, []);

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

  const addRelationship = useCallback((relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      const id = newRelationships.size + 1;
      newRelationships.set(id, { id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText });
      return newRelationships;
    });
  }, []);

  const editRelationship = useCallback((id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText) => {
    setRelationships((prevRelationships) => {
      const newRelationships = new Map(prevRelationships);
      if (newRelationships.has(id)) {
        newRelationships.set(id, { id, relationA, relationB, cardinalityA, cardinalityB, cardinalityText });
      }
      return newRelationships;
    });
  }, []);

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
    addRelationship,
    editRelationship,
    removeRelationship,
    setSchema,
    setRelationships
  };
};
