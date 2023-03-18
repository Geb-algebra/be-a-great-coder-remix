import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import * as React from 'react';

import { createUser, getUserByName } from '~/models/user.server';
import { safeRedirect } from '~/utils';
import { authenticateAndReturnFormError, authenticator } from '~/services/auth.server';

// export async function loader({ request }: LoaderArgs) {
//   const userId = await authenticator.isAuthenticated(request);
//   if (userId) return redirect('/home');
//   return json({});
// }

const existsAtAtCoder = async (username: string) => {
  const response = await fetch(`https://atcoder.jp/users/${username}/`);
  return response.status === 200;
};

export async function action({ request }: ActionArgs) {
  const form = await request.clone().formData();
  const username = form.get('username');
  const password = form.get('password');
  if (typeof username !== 'string') {
    return json({ errors: { username: 'Username is invalid', password: null } }, { status: 400 });
  }
  if (!(await existsAtAtCoder(username))) {
    return json(
      { errors: { username: `User ${username} is not registered on AtCoder`, password: null } },
      { status: 400 },
    );
  }
  if (typeof password !== 'string' || password.length === 0) {
    return json({ errors: { username: null, password: 'Password is required' } }, { status: 400 });
  }
  if (password.length < 8) {
    return json({ errors: { username: null, password: 'Password is too short' } }, { status: 400 });
  }
  const existingUser = await getUserByName(username);
  if (existingUser) {
    return json(
      {
        errors: {
          username: 'A user already exists with this name',
          password: null,
        },
      },
      { status: 400 },
    );
  }
  const redirectTo = safeRedirect(form.get('redirectTo'), '/home');
  await createUser(username, password);
  return await authenticateAndReturnFormError(request, redirectTo);
}

export const meta: MetaFunction = () => {
  return {
    title: 'Sign Up',
  };
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? undefined;
  const actionData = useActionData<typeof action>();
  const nameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.username) {
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
                aria-describedby="name-error"
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
                autoComplete="new-password"
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
            Create Account
          </button>
          <div className="flex items-center justify-center">
            <div className="text-gray-500 text-center text-sm">
              Already have an account?{' '}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: '/login',
                  search: searchParams.toString(),
                }}
              >
                Log in
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
