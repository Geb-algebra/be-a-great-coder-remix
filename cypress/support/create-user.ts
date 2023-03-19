// Use this to create a new user and login with that user
// Simply call this with:
// npx ts-node --require tsconfig-paths/register ./cypress/support/create-user.ts username@example.com
// and it will log out the cookie value you can use to interact with the server
// as that new user.

import { installGlobals } from '@remix-run/node';
import { parse } from 'cookie';

import { createUser } from '~/models/user.server';
import { createUserSession } from '~/session.server';
import { consts } from './consts';

installGlobals();

async function createAndLogin(username: string) {
  if (!username) {
    throw new Error('username required for login');
  }

  const user = await createUser(username, consts.password);

  const response = await createUserSession({
    request: new Request('test://test'),
    userId: user.id,
    redirectTo: '/home',
  });

  const cookieValue = response.headers.get('Set-Cookie');
  if (!cookieValue) {
    throw new Error('Cookie missing from createUserSession response');
  }
  const parsedCookie = parse(cookieValue);
  // we log it like this so our cypress command can parse it out and set it as
  // the cookie value.
  console.log(
    `
<cookie>
  ${parsedCookie.__session}
</cookie>
  `.trim(),
  );
}

createAndLogin(process.argv[2]);
