export type AuthorAssociation =
  | "COLLABORATOR"
  | "CONTRIBUTOR"
  | "FIRST_TIMER"
  | "FIRST_TIME_CONTRIBUTOR"
  | "MANNEQUIN"
  | "MEMBER"
  | "NONE"
  | "OWNER"
  | string;

/**
 * Approver condition using AND/OR logic.
 *
 * Simple forms (map of team/user -> count):
 *   approvers:
 *     any:
 *       org/team-a: 1
 *       org/team-b: 1
 *
 *   approvers:
 *     all:
 *       org/team-a: 1
 *       org/team-b: 1
 *
 * Complex nested form (array for boolean combinations):
 *   approvers:
 *     any:
 *       - all:
 *           org/team-a: 1
 *           org/team-b: 1
 *       - all:
 *           org/admins: 2
 *
 * With explicit teams/users:
 *   approvers:
 *     all:
 *       - teams:
 *           org/team-a: 1
 *         users:
 *           alice: 1
 */
export type ApproverCondition =
  | { any: ApproverCondition[] | Record<string, number> }
  | { all: ApproverCondition[] | Record<string, number> }
  | { teams?: Record<string, number>; users?: Record<string, number> };

export interface WeightedApprovalsConfig {
  weights: {
    users: Record<string, number>;
    teams: Record<string, number>; // "org/team_slug" -> weight
    default?: number;
    /**
     * How to combine user vs team weights:
     * - "max": use the maximum of (user/default) and matching team weights (default)
     * - "user": if user is explicitly listed, use that value and ignore teams; otherwise fall back to max(default, teams)
     * - "team": if user matches any team, use the max team weight; otherwise fall back to user/default
     */
    precedence?: "max" | "user" | "team";
  };
  rules: Array<{
    paths: string[];
    required_total: number;
    /**
     * Define who can approve using AND/OR logic.
     * - `any`: OR logic - approvals from any listed team/user count
     * - `all`: AND logic - need approvals from each listed team/user
     *
     * When omitted, anyone can approve.
     */
    approvers?: ApproverCondition;
  }>;
  labels?: Record<string, unknown>;
}

export interface MaOverride {
  n: number;
  allowedTeams: string[];
  commentId: number;
  commentAuthor: string;
  commentAssociation: string;
  ignoredTeams: string[];
}
