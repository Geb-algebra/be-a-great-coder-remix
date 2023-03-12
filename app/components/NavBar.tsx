import React from 'react';

export default function NavBar(props: {}) {
  return (
    <div className="flex w-full bg-geb-blue">
      <h1 className="mx-6 h-12 align-middle text-4xl font-semibold">Be A Great Coder</h1>
      {props.children}
    </div>
  );
}
