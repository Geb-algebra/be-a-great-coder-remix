import React from 'react';

const CardShape = (props: { className?: string; children?: React.ReactNode }) => {
  return (
    <div
      className={'shadow-slate-900 flex flex-col justify-between rounded-2xl ' + props.className}
    >
      {props.children}
    </div>
  );
};

export default CardShape;
