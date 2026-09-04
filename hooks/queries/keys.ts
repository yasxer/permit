/**
 * One place for every React Query key, so an invalidation can never miss a
 * cache entry because two files spelled the key differently.
 */
export const queryKeys = {
  session: ["session"] as const,

  schools: {
    all: ["schools"] as const,
    list: (status?: string) => ["schools", "list", status ?? "all"] as const,
    detail: (id: string) => ["schools", "detail", id] as const,
    mine: ["schools", "mine"] as const,
  },

  users: {
    all: ["users"] as const,
    list: (role?: string) => ["users", "list", role ?? "all"] as const,
  },

  categories: {
    all: ["categories"] as const,
    list: ["categories", "list"] as const,
  },

  questions: {
    all: ["questions"] as const,
    list: (type: string, lang?: string) =>
      ["questions", "list", type, lang ?? "all"] as const,
  },

  enrollments: {
    all: ["enrollments"] as const,
    list: (schoolId: string, status?: string) =>
      ["enrollments", "list", schoolId, status ?? "all"] as const,
    detail: (id: string) => ["enrollments", "detail", id] as const,
  },

  payments: {
    byEnrollment: (enrollmentId: string) =>
      ["payments", enrollmentId] as const,
  },

  planning: {
    slots: (schoolId: string, weekStart: string) =>
      ["planning", "slots", schoolId, weekStart] as const,
  },

  exams: {
    all: ["exams"] as const,
    list: (schoolId: string) => ["exams", "list", schoolId] as const,
    detail: (id: string) => ["exams", "detail", id] as const,
    candidates: (examId: string) => ["exams", "candidates", examId] as const,
  },

  stats: {
    admin: ["stats", "admin"] as const,
    school: (schoolId: string) => ["stats", "school", schoolId] as const,
  },
} as const;
