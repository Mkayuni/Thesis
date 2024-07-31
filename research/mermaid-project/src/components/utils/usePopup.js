import { useRef, useState, useCallback } from 'react';

export const usePopup = () => {
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  const [subPopup, setSubPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  const entityPopupRef = useRef(null);
  const subPopupRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (
      entityPopupRef.current &&
      !entityPopupRef.current.contains(event.target) &&
      (!subPopupRef.current || !subPopupRef.current.contains(event.target))
    ) {
      setPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
    }
    if (subPopupRef.current && !subPopupRef.current.contains(event.target)) {
      setSubPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
    }
  }, []);

  const showPopup = useCallback((e, entityOrAttribute, type, schema, questionContainerRef) => {
    if (e.preventDefault) e.preventDefault(); 
    const rect = e.target ? e.target.getBoundingClientRect() : { left: 0, bottom: 0, right: 0, top: 0 };
    const questionContainerRect = questionContainerRef.current.getBoundingClientRect();
    const popupWidth = 200;
    const popupHeight = 100;
    let x = rect.left - questionContainerRect.left;
    let y = rect.bottom - questionContainerRect.top + window.scrollY;

    setPopup({
      visible: true,
      x,
      y,
      entityOrAttribute,
      type,
      entities: Array.from(schema.keys()),
    });
  }, []);

  const hidePopup = () => {
    setPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
    setSubPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  };

  const adjustPopupPosition = (x, y, popupWidth, popupHeight, questionContainerRef) => {
    const questionContainerRect = questionContainerRef.current.getBoundingClientRect();
    if (x + popupWidth > questionContainerRect.right - questionContainerRect.left) {
      x = questionContainerRect.right - questionContainerRect.left - popupWidth - 10;
    }
    if (y + popupHeight > questionContainerRect.bottom - questionContainerRect.top) {
      y = questionContainerRect.bottom - questionContainerRect.top - popupHeight - 10;
    }
    return { x, y };
  };

  return {
    popup,
    subPopup,
    entityPopupRef,
    subPopupRef,
    handleClickOutside,
    showPopup,
    hidePopup,
    adjustPopupPosition,
    setPopup,
    setSubPopup
  };
};
