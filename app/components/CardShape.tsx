import React from 'react';

export default function CardShape(props: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={'shadow-slate-900 flex flex-col justify-between rounded-2xl ' + props.className}
    >
      {props.children}
    </div>
  );
}
