import type {
  FastifyPluginAsync,
} from "fastify";

import {
  z,
} from "zod";

import type {
  AdminProfileRecord,
} from "../domains/admin-profile/admin-profile.types.js";

import type {
  AdminProfileService,
} from "../application/admin-profile/admin-profile.service.js";

import {
  requirePlatformPermission,
} from "../http/authorization-context.js";

import {
  parseHttpRequestBody,
} from "../http/request-validation.js";

const OptionalTextSchema =
  z
    .string()
    .trim()
    .max(200)
    .nullable();

const UpdateAdminProfileSchema =
  z
    .object({
      expectedRowVersion:
        z
          .string()
          .regex(
            /^\d+$/,
            "Row version must be a positive integer."
          ),

      fullName:
        z
          .string()
          .trim()
          .min(1)
          .max(200),

      displayName:
        z
          .string()
          .trim()
          .min(1)
          .max(200),

      jobTitle:
        OptionalTextSchema,

      businessEmail:
        z
          .string()
          .trim()
          .email()
          .max(320)
          .nullable(),

      primaryPhone:
        z
          .string()
          .trim()
          .regex(
            /^[+()\-\s0-9]{7,24}$/
          )
          .nullable(),

      alternatePhone:
        z
          .string()
          .trim()
          .regex(
            /^[+()\-\s0-9]{7,24}$/
          )
          .nullable(),

      signalAccount:
        z
          .string()
          .trim()
          .min(2)
          .max(100)
          .nullable(),

      telegramUsername:
        z
          .string()
          .trim()
          .min(2)
          .max(100)
          .nullable(),

      preferredLanguage:
        z.enum([
          "en",
          "hi",
        ]),

      timeZone:
        z
          .string()
          .trim()
          .min(1)
          .max(100),
    })
    .strict();

function mapProfile(
  profile:
    AdminProfileRecord
) {
  return {
    userId:
      profile.userId,

    loginEmail:
      profile.loginEmail,

    fullName:
      profile.fullName,

    displayName:
      profile.displayName,

    jobTitle:
      profile.jobTitle,

    businessEmail:
      profile.businessEmail,

    primaryPhone:
      profile.primaryPhone,

    alternatePhone:
      profile.alternatePhone,

    signalAccount:
      profile.signalAccount,

    telegramUsername:
      profile.telegramUsername,

    preferredLanguage:
      profile.preferredLanguage,

    timeZone:
      profile.timeZone,

    emailVerifiedAt:
      profile.emailVerifiedAt
        ?.toISOString() ??
      null,

    lastLoginAt:
      profile.lastLoginAt
        ?.toISOString() ??
      null,

    accountCreatedAt:
      profile.accountCreatedAt
        .toISOString(),

    createdAt:
      profile.createdAt
        .toISOString(),

    updatedAt:
      profile.updatedAt
        .toISOString(),

    rowVersion:
      profile.rowVersion,
  };
}

export interface AdminProfileRoutesOptions {
  service:
    AdminProfileService;
}

export const adminProfileRoutes:
  FastifyPluginAsync<
    AdminProfileRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/profile",
      async (
        request,
        reply
      ) => {
        const context =
          requirePlatformPermission(
            request,
            "admin.access"
          );

        const profile =
          await options
            .service
            .get(
              context.userId
            );

        return reply
          .status(200)
          .send(
            mapProfile(profile)
          );
      }
    );

    app.patch(
      "/profile",
      async (
        request,
        reply
      ) => {
        const context =
          requirePlatformPermission(
            request,
            "admin.access"
          );

        const input =
          parseHttpRequestBody(
            UpdateAdminProfileSchema,
            request.body
          );

        const profile =
          await options
            .service
            .update({
              ...input,

              userId:
                context.userId,

              actorUserId:
                context.userId,
            });

        return reply
          .status(200)
          .send(
            mapProfile(profile)
          );
      }
    );
  };
