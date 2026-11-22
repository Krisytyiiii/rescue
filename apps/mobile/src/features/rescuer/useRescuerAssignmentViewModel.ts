import { useCallback, useEffect, useState } from "react";

import { rescuerAssignmentRepository } from "@/data";
import {
  applyAssignmentTransition,
  type AssignmentTransition,
  type RescuerAssignment,
  type RescuerAssignmentRepository,
} from "@/domain/rescuer";

interface Options {
  repository?: RescuerAssignmentRepository;
}

/**
 * Presentation state for a single assignment. Transitions are optimistic and
 * revert on failure; the repository is the only thing that knows whether the
 * backend is real (DIP).
 */
export function useRescuerAssignmentViewModel(
  id: string | undefined,
  { repository = rescuerAssignmentRepository }: Options = {},
) {
  const [assignment, setAssignment] = useState<RescuerAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      return;
    }

    repository
      .loadAssignment(id)
      .then((loaded) => {
        if (active) setAssignment(loaded);
      })
      .catch(() => {
        if (active) setError("Couldn't load this assignment.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, repository]);

  const run = useCallback(
    async (transition: AssignmentTransition) => {
      if (!assignment || pending) return;

      const previous = assignment;
      setError(null);
      setPending(true);

      try {
        setAssignment(applyAssignmentTransition(previous, transition));
      } catch (transitionError) {
        setPending(false);
        setError(
          transitionError instanceof Error
            ? transitionError.message
            : "That action isn't allowed right now.",
        );
        return;
      }

      try {
        const saved = await repository.transition(previous.id, transition);
        setAssignment(saved);
      } catch (requestError) {
        setAssignment(previous);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Couldn't save that action. Try again.",
        );
      } finally {
        setPending(false);
      }
    },
    [assignment, pending, repository],
  );

  return { assignment, loading, pending, error, run };
}
