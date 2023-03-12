import type { ActionArgs, LoaderArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react';
import * as React from 'react';

import { createUserSession, getUserId } from '~/session.server';
import { createUser, verifyLogin } from '~/models/user.server';
import { safeRedirect } from '~/utils';

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();
  const username = body.get('name');
  const password = body.get('password');

  if (typeof username !== 'string') {
    return json({ errors: { name: 'Username is invalid', password: null } }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length === 0) {
    return json({ errors: { name: null, password: 'Password is required' } }, { status: 400 });
  }

  if (password.length < 8) {
    return json({ errors: { name: null, password: 'Password is too short' } }, { status: 400 });
  }

  const user = await createUser(username, password);
  return await createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo: '/home',
  });
};

export default function SignupPage() {
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
          <button
            type="submit"
            className="bg-blue-500 text-white hover:bg-blue-600  focus:bg-blue-400 w-full rounded py-2 px-4"
          >
            Sign Up
          </button>
        </Form>
      </div>
    </div>
  );
}
