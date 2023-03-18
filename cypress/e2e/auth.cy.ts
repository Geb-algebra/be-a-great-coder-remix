import { faker } from '@faker-js/faker';
import { consts } from 'support/consts';

describe('signup', () => {
  beforeEach(() => cy.resetDB());
  it('should be able to sign up with correct name and password', () => {
    // at 230318, signup page will fail to hydrate and re-render by client.
    // so wait for 1 second to ensure being re-rendered
    cy.visit('/signup').wait(1000);
    cy.findByLabelText(/AtCoder Username/).type(consts.username);
    cy.findByLabelText(/Password/).type(consts.password);
    cy.findByRole('button', { name: /Create Account/ }).click();
    cy.url().should('include', '/home');
  });
  it('should reject when the user does not exist on atcoder', () => {
    cy.visit('/signup');
    const username = faker.name.firstName();
    cy.findByLabelText(/AtCoder Username/).type(username);
    cy.findByLabelText(/Password/).type(consts.password);
    cy.findByRole('button', { name: /Create Account/ }).click();
    cy.findByText(RegExp(`User ${username} is not registered on AtCoder`));
    cy.url().should('include', '/signup');
  });
  it('should reject when the password is shorter than 8', () => {
    cy.visit('/signup');
    cy.findByLabelText(/AtCoder Username/).type(consts.username);
    cy.findByLabelText(/Password/).type(faker.internet.password(7));
    cy.findByRole('button', { name: /Create Account/ }).click();
    cy.findByText(RegExp('Password is too short'));
    cy.url().should('include', '/signup');
  });
  it('should reject when a user with the same name already exists', () => {
    cy.login();
    // cy.visit('/logout')
    cy.visit('/signup');
    cy.findByLabelText(/AtCoder Username/).type(consts.username);
    cy.findByLabelText(/Password/).type(consts.password);
    cy.findByRole('button', { name: /Create Account/ }).click();
    cy.findByText(RegExp('A user already exists with this name'));
    cy.url().should('include', '/signup');
  });
});
