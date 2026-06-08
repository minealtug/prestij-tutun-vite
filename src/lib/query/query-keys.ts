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
    userTypes: ['users', 'user-types'] as const,
    departmans: ['users', 'departmans'] as const,
    mintikas: ['users', 'mintikas'] as const,
  },
  settings: {
    profile: ['settings', 'profile'] as const,
  },
  questions: {
    all: (baslikId?: number) => ['questions', { baslikId: baslikId ?? null }] as const,
    answerInputTypes: ['questions', 'answer-input-types'] as const,
  },
  surveys: {
    all: ['surveys'] as const,
  },
  surveyResponses: {
    menseiler: ['survey-responses', 'menseiler'] as const,
    bolgeler: (menseiId?: number) => ['survey-responses', 'bolgeler', menseiId ?? null] as const,
    mintikalar: (bolgeId?: number) => ['survey-responses', 'mintikalar', bolgeId ?? null] as const,
    alimNoktalari: (mintikaId?: number) =>
      ['survey-responses', 'alim-noktalari', mintikaId ?? null] as const,
    koyler: (alimNoktasiId?: number) =>
      ['survey-responses', 'koyler', alimNoktasiId ?? null] as const,
    all: (params?: object) => ['survey-responses', params ?? {}] as const,
    detail: (ekiciId: string, sablonId: number) =>
      ['survey-responses', 'detail', ekiciId, sablonId] as const,
  },
} as const
