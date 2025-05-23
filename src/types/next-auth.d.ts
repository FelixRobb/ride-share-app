// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    phone?: string | null;
    id?: string;
  }

  interface Session {
    user: User;
  }
}
