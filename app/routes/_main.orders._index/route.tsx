import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useActionData, useSearchParams } from '@remix-run/react';
import * as React from 'react';
import { authenticator, getUserIfAuthenticated } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const user = await getUserIfAuthenticated(request);
  // const order = await getReceivedOr
  return json({});
}

export async function action({ request }: ActionArgs) {
  return redirect('/home');
}

export const meta: MetaFunction = () => {
  return {
    title: '',
  };
};

// export default function Page() {
//   const [searchParams] = useSearchParams();
//   const loaderData = useLoaderData<typeof loader>();
//   const actionData = useActionData<typeof action>();

//   return ();
// }
