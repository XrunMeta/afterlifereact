

export interface FixtureUser {
  email: string;
  password: string;
  name: string;
}

export interface FixtureClone {
  username: string;
  name: string;
  description: string;
  clone_type: string;
  visibility: string;
  training_status: string;
}

export interface FixtureAdmin {
  email: string;
  password: string;
}

export interface Fixture {
  user: FixtureUser;
  clone: FixtureClone;

  credits: number;
  admin: FixtureAdmin;
}

export const FIXTURE: Fixture;

export interface FixtureStatus {
  userId: number;
  email: string;
  credits: number;
  creditsFree: number;
  lotsRemaining: number;
  cloneCount: number;
  clone: { id: number; username: string; name: string } | null;
}

export function status(db: string): FixtureStatus | null;

export interface SeedResult {
  userId: number;
  cloneId: number;
  ledgerId: number;
  adminId: number;
}

export function seed(db: string): SeedResult;
export function reset(db: string): number | null;
export function hashPassword(password: string): string;
export function verifyAgainstProduct(password: string, phc: string): Promise<boolean | null>;
