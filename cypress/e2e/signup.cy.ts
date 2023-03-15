import { faker } from '@faker-js/faker';

describe('signup', () => {
  it('should be able to sign up with correct name and password', () => {
    cy.visit('/signup');
    cy.findByLabelText(/AtCoder Username/).type(faker.name.firstName());
    cy.findByLabelText(/Password/).type(faker.internet.password());
    cy.findByRole('button', { name: /Create Account/ }).click();
    cy.url().should('include', '/home');
  });
});
