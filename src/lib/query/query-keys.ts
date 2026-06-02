export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    activity: ['dashboard', 'activity'] as const,
  },
  users: {
    all: (params?: object) => ['users', params ?? {}] as const,
    detail: (id: string) => ['users', id] as const,
  },
  settings: {
    profile: ['settings', 'profile'] as const,
  },
  questions: {
    all: ['questions'] as const,
  },
  surveys: {
    all: ['surveys'] as const,
  },
  surveyResponses: {
    all: (params?: object) => ['survey-responses', params ?? {}] as const,
  },
} as const
