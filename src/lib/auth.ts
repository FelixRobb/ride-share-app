import { compare } from "bcrypt";
import { parsePhoneNumber } from "libphonenumber-js";
import type { NextAuthOptions } from "next-auth";
// eslint-disable-next-line import/no-named-as-default
import CredentialsProvider from "next-auth/providers/credentials";

import { supabase } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        let query;
        const identifier = credentials.identifier.toLowerCase();

        if (identifier.includes("@")) {
          query = supabase.from("users").select("*").eq("email", identifier).single();
        } else {
          const phoneNumber = parsePhoneNumber(identifier, { defaultCountry: "PT" });
          if (!phoneNumber || !phoneNumber.isValid()) {
            return null;
          }
          const e164PhoneNumber = phoneNumber.format("E.164");
          query = supabase.from("users").select("*").eq("phone", e164PhoneNumber).single();
        }

        const { data: user, error } = await query;

        if (error || !user) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
