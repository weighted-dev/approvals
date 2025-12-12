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
    allowed?: {
      users?: string[];
      teams?: string[];
    };
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
