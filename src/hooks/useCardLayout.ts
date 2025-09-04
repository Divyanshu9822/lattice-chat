import { useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '../store';

export const useCardLayout = () => {
  const {
    cardLayout,
    cardPositions,
    updateCardPosition,
    setScrollPosition,
    scrollPosition,
    windowDimensions,
  } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);

  const calculateCardPosition = useCallback(
    (order: number) => {
      const x = order * (cardLayout.cardWidth + cardLayout.horizontalGap);
      return { x, order };
    },
    [cardLayout.cardWidth, cardLayout.horizontalGap]
  );

  const updateBranchPosition = useCallback(
    (branchId: string, order: number) => {
      const position = calculateCardPosition(order);
      updateCardPosition(branchId, position);
    },
    [calculateCardPosition, updateCardPosition]
  );

  const scrollToCard = useCallback(
    (branchId: string) => {
      const position = cardPositions[branchId];
      if (position && containerRef.current) {
        const targetScrollX = position.x - (windowDimensions.width / 2) + (cardLayout.cardWidth / 2);
        containerRef.current.scrollTo({
          left: Math.max(0, targetScrollX),
          behavior: 'smooth',
        });
      }
    },
    [cardPositions, windowDimensions.width, cardLayout.cardWidth]
  );

  const scrollToActiveCard = useCallback(() => {
    // This would be implemented with the active branch ID from conversation store
    // For now, we'll leave it as a placeholder
  }, []);

  const getVisibleCardRange = useCallback(() => {
    const containerWidth = windowDimensions.width;
    const cardTotalWidth = cardLayout.cardWidth + cardLayout.horizontalGap;
    const startIndex = Math.floor(scrollPosition / cardTotalWidth);
    const endIndex = Math.ceil((scrollPosition + containerWidth) / cardTotalWidth);
    
    return { startIndex, endIndex };
  }, [windowDimensions.width, cardLayout, scrollPosition]);

  const getTotalWidth = useCallback(
    (branchCount: number) => {
      return branchCount * (cardLayout.cardWidth + cardLayout.horizontalGap) - cardLayout.horizontalGap;
    },
    [cardLayout.cardWidth, cardLayout.horizontalGap]
  );

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [setScrollPosition]);

  return {
    containerRef,
    cardLayout,
    calculateCardPosition,
    updateBranchPosition,
    scrollToCard,
    scrollToActiveCard,
    getVisibleCardRange,
    getTotalWidth,
    scrollPosition,
  };
};