import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import * as React from 'react';

import { getUserId } from '~/session.server';
import { authenticateAndReturnFormError } from '~/services/auth.server';

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/home');
  return json({});
}

export async function action({ request }: ActionArgs) {
  return await authenticateAndReturnFormError(request);
}

export const meta: MetaFunction = () => {
  return {
    title: 'Login',
  };
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/home';
  const actionData = useActionData<typeof action>();
  const nameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData) {
      if (actionData?.errors?.username) {
        nameRef.current?.focus();
      } else if (actionData?.errors?.password) {
        passwordRef.current?.focus();
      }
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="username" className="text-gray-700 block text-sm font-medium">
              AtCoder Username
            </label>
            <div className="mt-1">
              <input
                ref={nameRef}
                id="username"
                required
                autoFocus={true}
                name="username"
                type="text"
                aria-invalid={actionData?.errors?.username ? true : undefined}
                aria-describedby="username-error"
                className="border-gray-500 w-full rounded border px-2 py-1 text-lg"
              />
              {actionData?.errors?.username && (
                <div className="text-red-700 pt-1" id="name-error">
                  {actionData.errors.username}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-gray-700 block text-sm font-medium">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                ref={passwordRef}
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="border-gray-500 w-full rounded border px-2 py-1 text-lg"
              />
              {actionData?.errors?.password && (
                <div className="text-red-700 pt-1" id="password-error">
                  {actionData.errors.password}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="bg-blue-500 text-white hover:bg-blue-600  focus:bg-blue-400 w-full rounded py-2 px-4"
          >
            Log in
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 rounded"
              />
              <label htmlFor="remember" className="text-gray-900 ml-2 block text-sm">
                Remember me
              </label>
            </div>
            <div className="text-gray-500 text-center text-sm">
              Don't have an account?{' '}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: '/signup',
                  search: searchParams.toString(),
                }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
