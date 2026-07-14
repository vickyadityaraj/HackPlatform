"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendOtpEmail } from "@/lib/mail";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export async function sendRegistrationOtp(email: string) {
  try {
    const emailLower = email.toLowerCase().trim();

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return { success: false, error: "Email is already registered" };
    }

    // 2. Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Clear existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: emailLower },
    });

    // 4. Save new OTP to database
    await prisma.verificationToken.create({
      data: {
        identifier: emailLower,
        token: otp,
        expires,
      },
    });

    // 5. Send OTP Email
    await sendOtpEmail(emailLower, otp);

    return { success: true };
  } catch (error: any) {
    console.error("Error sending registration OTP:", error);
    return { success: false, error: "Failed to send verification code. Please try again." };
  }
}

export async function verifyOtpAndRegisterUser(
  name: string,
  email: string,
  password: string,
  otp: string
) {
  try {
    const emailLower = email.toLowerCase().trim();
    const otpTrimmed = otp.trim();

    // 1. Verify token exists and is valid
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: emailLower,
        token: otpTrimmed,
      },
    });

    if (!verificationToken) {
      return { success: false, error: "Invalid verification code" };
    }

    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: emailLower,
            token: otpTrimmed,
          },
        },
      });
      return { success: false, error: "Verification code has expired. Please request a new one." };
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the user, user profile, and clean up the token in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: emailLower,
          password: hashedPassword,
          role: "PARTICIPANT",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      });

      await tx.profile.create({
        data: {
          userId: newUser.id,
          skills: [],
          badges: [],
        },
      });

      // Delete the verified token
      await tx.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: emailLower,
            token: otpTrimmed,
          },
        },
      });

      return newUser;
    });

    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error: any) {
    console.error("Verification and registration error:", error);
    return { success: false, error: "An unexpected error occurred during verification" };
  }
}

export async function registerUser(data: RegisterInput) {
  try {
    const validatedData = registerSchema.parse(data);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return { success: false, error: "Email is already registered" };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create the user and their associated profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email.toLowerCase(),
          password: hashedPassword,
          role: "PARTICIPANT",
          status: "ACTIVE",
        },
      });

      await tx.profile.create({
        data: {
          userId: newUser.id,
          skills: [],
          badges: [],
        },
      });

      return newUser;
    });

    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Registration error:", error);
    return { success: false, error: "An unexpected error occurred during registration" };
  }
}
