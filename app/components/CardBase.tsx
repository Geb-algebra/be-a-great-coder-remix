import React from 'react';
import CardShape from './CardShape';

export default (props: { className?: string; children?: React.ReactNode }) => {
  return (
    <CardShape className={`bg-geb-blue text-blue-light ${props.className ?? ''}`}>
      {props.children}
    </CardShape>
  );
};
