import { useCallback, useEffect, useState } from "react";

import { communityDataSource } from "@/data";
import type { CommunityDataSource } from "@/data";
import type { CommunityPost, NewCommunityPost } from "@/domain/community";

interface CommunityOptions {
  data?: CommunityDataSource;
}

/**
 * Presentation state for the resident community adoption feed: loading the
 * feed and submitting a new adoption post.
 */
export function useCommunityViewModel({
  data = communityDataSource,
}: CommunityOptions = {}) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const items = await data.loadFeed();
    setPosts(items);
    setError(null);
  }, [data]);

  useEffect(() => {
    let active = true;

    load()
      .catch((cause) => {
        if (active) {
          setPosts([]);
          setError(
            cause instanceof Error ? cause.message : "Couldn't load the feed.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    try {
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn't load the feed.",
      );
    }
  }, [load]);

  const clearNotice = useCallback(() => setNotice(null), []);

  const submit = useCallback(
    async (input: NewCommunityPost): Promise<boolean> => {
      setSubmitting(true);
      setSubmitError(null);
      setNotice(null);

      try {
        const created = await data.createPost(input);
        // Pending posts appear at the top so the author sees their submission.
        setPosts((current) => [created, ...current]);
        setNotice(
          "Your post was submitted. The City Vet team will review it before it appears publicly.",
        );
        return true;
      } catch (cause) {
        setSubmitError(
          cause instanceof Error
            ? cause.message
            : "We couldn't submit your adoption post.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [data],
  );

  return {
    posts,
    loading,
    error,
    reload,
    submitting,
    submitError,
    notice,
    clearNotice,
    submit,
  };
}
