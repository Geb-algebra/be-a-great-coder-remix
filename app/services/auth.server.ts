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
  try {
    await authenticator.authenticate('user-pass', request, {
      successRedirect: successRedirect ?? '/home',
      // failureRedirect: '/login',
      throwOnError: true,
    });
    // WORKAROUND: the return statement below never executes but, without this, this function may
    // return undefined and causes type error when using actionData in route modules
    return json({ errors: { username: null, password: null } }, { status: 400 });
  } catch (error) {
    // Because redirects work by throwing a Response, you need to check if the
    // caught error is a response and return it or throw it again
    if (error instanceof Response) throw error;
    if (error instanceof Error) {
      return json({ errors: { username: error.message, password: null } }, { status: 400 });
    } else {
      return json({ errors: { username: 'something wrong', password: null } }, { status: 400 });
    }
  }
};
