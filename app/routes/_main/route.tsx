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
import { authenticator } from '~/services/auth.server';
// import MainCard from '~/components/MainCard';
// import NavBar from '~/components/NavBar';
// import OrdersCard from '~/components/OrdersCard';

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  });
  const user = await getUserById(userId);
  const totalAssets = await getTotalAssets(userId);
  const credibility = await getCredibility(userId);
  return json({ user, totalAssets, credibility });
};

export default function Index() {
  const { user, totalAssets, credibility } = useLoaderData<typeof loader>();
  return (
    <main className="relative flex h-[100vh] flex-col justify-center bg-background">
      <div className="flex h-12 w-full space-x-6 bg-geb-blue align-middle">
        <Link to="/home">
          <h1 className="mx-6 h-12 align-middle text-4xl font-semibold">Be A Great Coder</h1>
        </Link>
        <Link to="/orders">Orders</Link>
        <Link to="/investment">Investment</Link>
        <Link to="/stats">Stats</Link>
      </div>
      <StatusCard username={user.name} totalAssets={totalAssets} />
      <div className="h-full w-full">
        <Outlet />
      </div>
    </main>
  );
}
