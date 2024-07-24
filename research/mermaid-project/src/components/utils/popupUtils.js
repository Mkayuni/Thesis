import { useRef, useState, useCallback } from 'react';

export const usePopup = () => {
  const [popup, setPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', type: '', entities: [] });
  const [subPopup, setSubPopup] = useState({ visible: false, x: 0, y: 0, entityOrAttribute: '', entities: [] });
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
      setSubPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', entities: [] });
    }
  }, []);

  const showPopup = useCallback((e, entityOrAttribute, type, schema, umlRef) => {
    if (e.preventDefault) e.preventDefault(); 
    const rect = e.target ? e.target.getBoundingClientRect() : { left: 0, bottom: 0, right: 0, top: 0 };
    const popupWidth = 200;
    const popupHeight = 100;
    const umlRect = umlRef.current.getBoundingClientRect();
    let x = rect.left - umlRect.left;
    let y = rect.bottom - umlRect.top;

    if (x + popupWidth > umlRect.right - umlRect.left) {
      x = umlRect.right - umlRect.left - popupWidth - 10;
    }
    if (y + popupHeight > umlRect.bottom - umlRect.top) {
      y = umlRect.bottom - umlRect.top - popupHeight - 10;
    }

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
    setSubPopup({ visible: false, x: 0, y: 0, entityOrAttribute: '', entities: [] });
  };

  const adjustPopupPosition = (x, y, popupWidth, popupHeight, umlRef) => {
    const umlRect = umlRef.current.getBoundingClientRect();
    if (x + popupWidth > umlRect.right - umlRect.left) {
      x = umlRect.right - umlRect.left - popupWidth - 10;
    }
    if (y + popupHeight > umlRect.bottom - umlRect.top) {
      y = umlRect.bottom - umlRect.top - popupHeight - 10;
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
