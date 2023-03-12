import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import * as React from 'react';

import { createUserSession, getUserId } from '~/session.server';
import { verifyLogin } from '~/models/user.server';
import { safeRedirect } from '~/utils';

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect('/');
  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const name = formData.get('name');
  const password = formData.get('password');
  const redirectTo = safeRedirect(formData.get('redirectTo'), '/home');
  const remember = formData.get('remember');

  if (typeof name !== 'string') {
    return json({ errors: { name: 'Username is invalid', password: null } }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length === 0) {
    return json({ errors: { name: null, password: 'Password is required' } }, { status: 400 });
  }

  if (password.length < 8) {
    return json({ errors: { name: null, password: 'Password is too short' } }, { status: 400 });
  }

  const user = await verifyLogin(name, password);

  if (!user) {
    return json({ errors: { name: 'Invalid name or password', password: null } }, { status: 400 });
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === 'on' ? true : false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return {
    title: 'Login',
  };
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const actionData = useActionData<typeof action>();
  const nameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="text-gray-700 block text-sm font-medium">
              Name
            </label>
            <div className="mt-1">
              <input
                ref={nameRef}
                id="name"
                required
                autoFocus={true}
                name="name"
                type="text"
                aria-invalid={actionData?.errors?.name ? true : undefined}
                aria-describedby="name-error"
                className="border-gray-500 w-full rounded border px-2 py-1 text-lg"
              />
              {actionData?.errors?.name && (
                <div className="text-red-700 pt-1" id="name-error">
                  {actionData.errors.name}
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
                  pathname: '/join',
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
