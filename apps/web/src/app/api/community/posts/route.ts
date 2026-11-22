import { NextResponse } from "next/server";

import {
  animalsService,
  authService,
  createCommunityPostSchema,
  isAppError,
  type Actor,
} from "@furescue/core";

import { readSession } from "@/lib/auth/session";

async function readActor(): Promise<
  { actor: Actor; response?: never } | { actor?: never; response: NextResponse }
> {
  const session = await readSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      ),
    };
  }

  const user = await authService.me(session.sub);
  return {
    actor: {
      userId: user.id,
      role: user.role,
      barangayId: user.barangayId,
    },
  };
}

/**
 * GET /api/community/posts - the community adoption feed.
 *
 * Published resident submissions are visible to everyone signed in. A resident
 * also sees their own pending submissions so they know review is underway.
 */
export async function GET() {
  const auth = await readActor();
  if (auth.response) return auth.response;

  try {
    const data = await animalsService.listCommunityFeed(auth.actor);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[community/posts]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production" || !(error instanceof Error)
              ? "Could not load the community feed"
              : error.message,
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/community/posts - a resident posts an animal for adoption.
 *
 * The submission is always created as a `pending_review` listing, so nothing
 * reaches the public feed until the City Vet team approves it.
 */
export async function POST(request: Request) {
  const auth = await readActor();
  if (auth.response) return auth.response;

  if (auth.actor.role !== "community_user" && auth.actor.role !== "admin") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Only community members can post animals for adoption",
        },
      },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createCommunityPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Check the animal details",
        },
      },
      { status: 400 },
    );
  }

  try {
    const animal = await animalsService.create(
      {
        ...parsed.data,
        originType: "community_post",
        media: parsed.data.media?.map((item, index) => ({
          ...item,
          sortOrder: item.sortOrder ?? index,
        })),
      },
      auth.actor,
    );

    return NextResponse.json({ ok: true, data: animal }, { status: 201 });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error("[community/posts]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production" || !(error instanceof Error)
              ? "Could not submit the adoption post"
              : error.message,
        },
      },
      { status: 500 },
    );
  }
}
