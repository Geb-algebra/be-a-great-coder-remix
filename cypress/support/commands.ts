import { consts } from './consts';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in with a random user. Yields the user and adds an alias to the user
       *
       * @returns {typeof login}
       * @memberof Chainable
       * @example
       *    cy.login()
       * @example
       *    cy.login({ email: 'whatever@example.com' })
       */
      login: typeof login;

      /**
       * Deletes the current @user
       *
       * @returns {typeof cleanupUser}
       * @memberof Chainable
       * @example
       *    cy.cleanupUser()
       * @example
       *    cy.cleanupUser({ email: 'whatever@example.com' })
       */
      cleanupUser: typeof cleanupUser;

      /**
       * Extends the standard visit command to wait for the page to load
       *
       * @returns {typeof visitAndCheck}
       * @memberof Chainable
       * @example
       *    cy.visitAndCheck('/')
       *  @example
       *    cy.visitAndCheck('/', 500)
       */
      visitAndCheck: typeof visitAndCheck;

      /**
       * Reset DB
       */
      resetDB: typeof resetDB;
    }
  }
}

function login({
  username = consts.username,
}: {
  username?: string;
} = {}) {
  cy.then(() => ({ username })).as('user');
  cy.exec(
    `npx ts-node --require tsconfig-paths/register ./cypress/support/create-user.ts "${username}"`,
  ).then(({ stdout }) => {
    const cookieValue = stdout
      .replace(/.*<cookie>(?<cookieValue>.*)<\/cookie>.*/s, '$<cookieValue>')
      .trim();
    cy.setCookie('__session', cookieValue);
  });
  return cy.get('@user');
}

function cleanupUser({ username }: { username?: string } = {}) {
  if (username) {
    deleteUserByName(username);
  } else {
    try {
      cy.get('@user').then((user) => {
        const username = (user as { username?: string }).username;
        if (username) {
          deleteUserByName(username);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
  cy.clearCookie('__session');
}

function deleteUserByName(username: string) {
  cy.exec(
    `npx ts-node --require tsconfig-paths/register ./cypress/support/delete-user.ts "${username}"`,
  );
  cy.clearCookie('__session');
}

function resetDB() {
  cy.exec('npx prisma migrate reset --force');
}

// We're waiting a second because of this issue happen randomly
// https://github.com/cypress-io/cypress/issues/7306
// Also added custom types to avoid getting detached
// https://github.com/cypress-io/cypress/issues/7306#issuecomment-1152752612
// ===========================================================
function visitAndCheck(url: string, waitTime: number = 1000) {
  cy.visit(url);
  cy.location('pathname').should('contain', url).wait(waitTime);
}

Cypress.Commands.add('login', login);
Cypress.Commands.add('cleanupUser', cleanupUser);
Cypress.Commands.add('visitAndCheck', visitAndCheck);
Cypress.Commands.add('resetDB', resetDB);
