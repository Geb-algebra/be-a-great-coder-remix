import { json, redirect } from '@remix-run/node';
import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import { getUserByName, verifyLogin } from '~/models/user.server';

import { getSession, sessionStorage } from '~/session.server';

type UserId = string;

export let authenticator = new Authenticator<UserId>(sessionStorage);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const username = form.get('username') as string;
    const password = form.get('password') as string;
    const user = await verifyLogin(username, password);
    if (user === null) throw new Error('Invalid username or password');
    return user.id;
  }),
  'user-pass',
);

export const authenticateAndReturnFormError = async (
  request: Request,
  successRedirect?: string,
) => {
  await authenticator.authenticate('user-pass', request, {
    successRedirect: successRedirect ?? '/home',
    failureRedirect: '/login',
  });
  const session = await getSession(request);
  const error = session.get(authenticator.sessionErrorKey);
  return json({ errors: { username: error.message as string, password: null } }, { status: 400 });
};
