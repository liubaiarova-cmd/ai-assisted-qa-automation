import { faker } from '@faker-js/faker';

export type ProgramDraft = {
  name: string;
  description: string;
};

/**
 * Happy-path program fields for UI or API creates. Uniqueness is built in so parallel runs do not collide.
 */
export function buildProgramDraft(overrides: Partial<ProgramDraft> = {}): ProgramDraft {
  const suffix = faker.string.alphanumeric(8);
  return {
    name: overrides.name ?? `${faker.commerce.productName()} ${suffix}`,
    description: overrides.description ?? faker.lorem.paragraph(),
  };
}
