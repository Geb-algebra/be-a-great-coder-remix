import { Link, Outlet, useLoaderData } from '@remix-run/react';
import { json, type LoaderArgs, redirect } from '@remix-run/node';
// import { getUserById } from '~/models/user.server';
import { getUserId } from '~/session.server';
import {
  getTotalAssets,
  getCredibility,
  getReceivedOrder,
  getUnreceivedOrders,
  getUserById,
} from '~/models/mocks.server';

import { useOptionalUser } from '~/utils';
// import PaperPrev from '~/components/PaperPrev';
// import PaperNext from '~/components/PaperNext';
// import PaperCurrent from '~/components/PaperCurrent';
// import ContentMainText from '~/components/ContentMainText';
// import CardBase from '~/components/old/CardBase';
import StatusCard from '~/components/StatusCard';
// import MainCard from '~/components/MainCard';
// import NavBar from '~/components/NavBar';
// import OrdersCard from '~/components/OrdersCard';

export const loader = async ({ request }: LoaderArgs) => {
  // const userId = await getUserId(request);
  const userId = 'fake';
  // if (!userId) return redirect('/login');
  const user = await getUserById(userId);
  const unreceivedOrders = await getUnreceivedOrders(userId);
  const receivedOrder = await getReceivedOrder(userId);
  const totalAssets = await getTotalAssets(userId);
  const credibility = await getCredibility(userId);
  return json({ user, unreceivedOrders, receivedOrder, totalAssets, credibility });
};

export default function Index() {
  const { user, unreceivedOrders, receivedOrder, totalAssets, credibility } =
    useLoaderData<typeof loader>();
  return <div />;
}
