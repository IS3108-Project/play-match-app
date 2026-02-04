interface User {
  id: number;
  name: string;
}

export const getAllUsers = async (): Promise<User[]> => {
  // Business logic: fetch from DB, filter, transform, etc.
  return [{ id: 1, name: "Jordan" }];
};

export const getUserById = async (id: number): Promise<User | null> => {
  // Business logic: fetch, validate, transform
  return { id: Number(id), name: "Jordan" };
};
