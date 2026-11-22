import type {
  AssignmentTransition,
  RescuerAssignment,
  RescuerAssignmentRepository,
} from "@/domain/rescuer";

import { commitTransition, findAssignment } from "./rescuer-store";

/**
 * Placeholder implementation of the assignment port. Mirrors the promised
 * `/api/rescues/:id` endpoints; swap for an HTTP gateway when they exist.
 */
export class InMemoryRescuerAssignmentRepository
  implements RescuerAssignmentRepository
{
  async loadAssignment(id: string): Promise<RescuerAssignment | null> {
    return findAssignment(id);
  }

  async transition(
    id: string,
    transition: AssignmentTransition,
  ): Promise<RescuerAssignment> {
    return commitTransition(id, transition);
  }
}
