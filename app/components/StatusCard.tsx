import React from 'react';
import CardBase from './CardBase';

export default function StatusCard(props: { username: string; totalAssets: number }) {
  return (
    <CardBase className="fixed top-8 right-24 max-w-xs ring-8 ring-background ring-offset-0">
      <h2 className="h-16 px-6 py-6 align-middle text-3xl font-semibold">{props.username}</h2>
      <h2 className="h-16 px-6 py-6 align-middle text-3xl font-semibold">{props.totalAssets}</h2>
    </CardBase>
  );
}
