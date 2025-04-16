import React from 'react';

export interface AccordionItemProps {
  isExpanded: boolean;
  children: React.ReactNode;
  maxHeight?: number;
} 