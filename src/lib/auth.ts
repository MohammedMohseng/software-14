import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // If user registered via Google, they don't have a password
        if (!user.password) {
          return null;
        }

        // Verify password with bcrypt
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          points: user.points,
          bio: user.bio,
          themePref: user.themePref,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Auto-create user on first Google login
            await db.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split("@")[0],
                role: "student",
                avatar: user.image || null,
                provider: "google",
                emailVerified: new Date(),
              },
            });
          } else if (existingUser.provider === "google" || existingUser.emailVerified) {
            // Existing Google user or verified user — allow login
            return true;
          }

          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // On first sign-in, fetch user from DB to get role/points/etc
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.avatar = dbUser.avatar;
          token.points = dbUser.points;
          token.bio = dbUser.bio;
          token.themePref = dbUser.themePref;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.points = token.points as number;
        session.user.bio = token.bio as string | null;
        session.user.themePref = token.themePref as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "software-14-platform-secret-key-dev-only",
};

// Type extensions for next-auth
declare module "next-auth" {
  interface User {
    role: string;
    avatar: string | null;
    points: number;
    bio: string | null;
    themePref: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      avatar: string | null;
      points: number;
      bio: string | null;
      themePref: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    avatar: string | null;
    points: number;
    bio: string | null;
    themePref: string | null;
  }
}
