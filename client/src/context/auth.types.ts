export type User = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupData = {
  email: string;
  password: string;
  name: string;
};
