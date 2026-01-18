// src/db/schema.ts
import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'job_seeker',
  'company',
  'admin',
]);

export const jobTypeEnum = pgEnum('job_type', [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'freelance',
  'temporary',
]);

export const experienceLevelEnum = pgEnum('experience_level', [
  'entry',
  'mid',
  'senior',
  'lead',
  'executive',
]);

export const applicationStatusEnum = pgEnum('application_status', [
  'applied',
  'reviewed',
  'interviewing',
  'offered',
  'rejected',
  'hired',
  'withdrawn',
]);

// ============================================================================
// TABLES
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull().default('job_seeker'),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIndex: uniqueIndex('users_email_idx').on(table.email),
  })
);

export const companies = pgTable(
  'companies',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    website: text('website'),
    logoUrl: text('logo_url'),
    location: text('location'),
    industry: text('industry'),
    size: text('size'), // e.g., '1-10', '11-50', '51-200', '201-500', '500+'
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIndex: index('companies_user_id_idx').on(table.userId),
  })
);

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIndex: uniqueIndex('categories_name_idx').on(table.name),
  })
);

export const skills = pgTable(
  'skills',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIndex: uniqueIndex('skills_name_idx').on(table.name),
  })
);

export const userSkills = pgTable(
  'user_skills',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userSkillUnique: uniqueIndex('user_skills_user_skill_idx').on(
      table.userId,
      table.skillId
    ),
    userIdIndex: index('user_skills_user_id_idx').on(table.userId),
    skillIdIndex: index('user_skills_skill_id_idx').on(table.skillId),
  })
);

export const educations = pgTable(
  'educations',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    school: text('school').notNull(),
    degree: text('degree'),
    fieldOfStudy: text('field_of_study'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIndex: index('educations_user_id_idx').on(table.userId),
  })
);

export const experiences = pgTable(
  'experiences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    company: text('company').notNull(),
    position: text('position').notNull(),
    location: text('location'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    description: text('description'),
    currentlyWorking: boolean('currently_working').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIndex: index('experiences_user_id_idx').on(table.userId),
  })
);

export const jobs = pgTable(
  'jobs',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    requirements: text('requirements'),
    responsibilities: text('responsibilities'),
    location: text('location'),
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }), // ✅ Fixed: removed notNull() to allow SET NULL
    jobType: jobTypeEnum('job_type').notNull().default('full_time'),
    experienceLevel: experienceLevelEnum('experience_level').default('mid'),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    salaryCurrency: varchar('salary_currency', { length: 3 }).default('USD'),
    remote: boolean('remote').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    postedAt: timestamp('posted_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    companyIdIndex: index('jobs_company_id_idx').on(table.companyId),
    categoryIdIndex: index('jobs_category_id_idx').on(table.categoryId),
    jobTypeIndex: index('jobs_job_type_idx').on(table.jobType),
    experienceLevelIndex: index('jobs_experience_level_idx').on(
      table.experienceLevel
    ),
    postedAtIndex: index('jobs_posted_at_idx').on(table.postedAt),
    isActiveIndex: index('jobs_is_active_idx').on(table.isActive),
  })
);

export const jobSkills = pgTable(
  'job_skills',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    isRequired: boolean('is_required').notNull().default(true), // Required vs Nice-to-have
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    jobSkillUnique: uniqueIndex('job_skills_job_skill_idx').on(
      table.jobId,
      table.skillId
    ),
    jobIdIndex: index('job_skills_job_id_idx').on(table.jobId),
    skillIdIndex: index('job_skills_skill_id_idx').on(table.skillId),
  })
);

export const applications = pgTable(
  'applications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    status: applicationStatusEnum('status').notNull().default('applied'),
    coverLetter: text('cover_letter'),
    resumeUrl: text('resume_url'),
    notes: text('notes'), // Internal notes for recruiters
    appliedAt: timestamp('applied_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // ✅ Prevent duplicate applications
    userJobUnique: uniqueIndex('applications_user_job_idx').on(
      table.userId,
      table.jobId
    ),
    userIdIndex: index('applications_user_id_idx').on(table.userId),
    jobIdIndex: index('applications_job_id_idx').on(table.jobId),
    statusIndex: index('applications_status_idx').on(table.status),
    appliedAtIndex: index('applications_applied_at_idx').on(table.appliedAt),
  })
);

// ============================================================================
// OPTIONAL: Saved Jobs (Bookmarks)
// ============================================================================

export const savedJobs = pgTable(
  'saved_jobs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at').notNull().defaultNow(),
  },
  (table) => ({
    userJobUnique: uniqueIndex('saved_jobs_user_job_idx').on(
      table.userId,
      table.jobId
    ),
    userIdIndex: index('saved_jobs_user_id_idx').on(table.userId),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
  educations: many(educations),
  experiences: many(experiences),
  userSkills: many(userSkills),
  applications: many(applications),
  savedJobs: many(savedJobs),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  jobs: many(jobs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  jobs: many(jobs),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  userSkills: many(userSkills),
  jobSkills: many(jobSkills),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
}));

export const educationsRelations = relations(educations, ({ one }) => ({
  user: one(users, {
    fields: [educations.userId],
    references: [users.id],
  }),
}));

export const experiencesRelations = relations(experiences, ({ one }) => ({
  user: one(users, {
    fields: [experiences.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [jobs.categoryId],
    references: [categories.id],
  }),
  jobSkills: many(jobSkills),
  applications: many(applications),
  savedJobs: many(savedJobs),
}));

export const jobSkillsRelations = relations(jobSkills, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSkills.jobId],
    references: [jobs.id],
  }),
  skill: one(skills, {
    fields: [jobSkills.skillId],
    references: [skills.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  user: one(users, {
    fields: [savedJobs.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [savedJobs.jobId],
    references: [jobs.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = InferSelectModel<typeof users>;
export type Company = InferSelectModel<typeof companies>;
export type Category = InferSelectModel<typeof categories>;
export type Skill = InferSelectModel<typeof skills>;
export type UserSkill = InferSelectModel<typeof userSkills>;
export type Education = InferSelectModel<typeof educations>;
export type Experience = InferSelectModel<typeof experiences>;
export type Job = InferSelectModel<typeof jobs>;
export type JobSkill = InferSelectModel<typeof jobSkills>;
export type Application = InferSelectModel<typeof applications>;
export type SavedJob = InferSelectModel<typeof savedJobs>;

export type NewUser = InferInsertModel<typeof users>;
export type NewCompany = InferInsertModel<typeof companies>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewSkill = InferInsertModel<typeof skills>;
export type NewUserSkill = InferInsertModel<typeof userSkills>;
export type NewEducation = InferInsertModel<typeof educations>;
export type NewExperience = InferInsertModel<typeof experiences>;
export type NewJob = InferInsertModel<typeof jobs>;
export type NewJobSkill = InferInsertModel<typeof jobSkills>;
export type NewApplication = InferInsertModel<typeof applications>;
export type NewSavedJob = InferInsertModel<typeof savedJobs>;

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type JobType = (typeof jobTypeEnum.enumValues)[number];
export type ExperienceLevel = (typeof experienceLevelEnum.enumValues)[number];
export type ApplicationStatus =
  (typeof applicationStatusEnum.enumValues)[number];
