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


