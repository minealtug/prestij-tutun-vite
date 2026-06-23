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
    altSecenekler: ['questions', 'alt-secenekler'] as const,
    altSeceneklerByGrup: (secenekGrupId: number) =>
      ['questions', 'alt-secenekler', secenekGrupId] as const,
  },
  surveys: {
    all: ['surveys'] as const,
  },
  answerUnits: {
    all: ['answer-units'] as const,
  },
  optionGroups: {
    all: ['option-groups'] as const,
  },
  ekiciDefinitions: {
    all: ['ekici-definitions'] as const,
  },
  permissions: {
    menus: ['permissions', 'menus'] as const,
    yetkiler: ['permissions', 'yetkiler'] as const,
    departmans: ['permissions', 'departmans'] as const,
    menuAtamalari: (menuUrl: string) => ['permissions', 'menu-atamalari', menuUrl] as const,
  },
  surveyResponses: {
    cografiFiltreOptions: ['survey-responses', 'cografi-filtre-options'] as const,
    all: (params?: object) => ['survey-responses', params ?? {}] as const,
    mine: (kullaniciId: string) => ['survey-responses', 'mine', kullaniciId] as const,
    detail: (ekiciId: string, sablonId: number, baslikId?: number) =>
      ['survey-responses', 'detail', ekiciId, sablonId, baslikId ?? null] as const,
  },
  surveyFill: {
    ekiciler: ['survey-fill', 'ekiciler'] as const,
    sablonlar: (baslikId: number) => ['survey-fill', 'sablonlar', baslikId] as const,
    oturum: (params: { baslikId: number; sablonId: number; ekiciId: string }) =>
      ['survey-fill', 'oturum', params] as const,
    altSecenekler: (secenekGrupId: number) =>
      ['survey-fill', 'alt-secenekler', secenekGrupId] as const,
  },
} as const
