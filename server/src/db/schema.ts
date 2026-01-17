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
} from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', [
  'job_seeker',
  'company',
  'admin'
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

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull().default('job_seeker'),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIndex: uniqueIndex('email_index').on(table.email),
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
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
  },
);

export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

export const userSkills = pgTable(
  'user_skills',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: uniqueIndex('user_skill_pk').on(table.userId, table.skillId),
  })
);

export const educations = pgTable('educations', {
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
});

export const experiences = pgTable('experiences', {
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
  currentlyWorking: boolean('currently_working').default(false),
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  location: text('location'),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'set null' }),
  jobType: jobTypeEnum('job_type').default('full_time').notNull(),
  experienceLevel: experienceLevelEnum('experience_level').default('mid'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  remote: boolean('remote').default(false),
  postedAt: timestamp('posted_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});

export const jobSkills = pgTable(
  'job_skills',
  {
    jobId: integer('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: uniqueIndex('job_skill_pk').on(table.jobId, table.skillId),
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
    status: applicationStatusEnum('status').default('applied').notNull(),
    coverLetter: text('cover_letter'),
    appliedAt: timestamp('applied_at').defaultNow(),
  },
);

export type User = InferSelectModel<typeof users>;
export type Company = InferSelectModel<typeof companies>;
export type Category = InferSelectModel<typeof categories>;
export type Skill = InferSelectModel<typeof skills>;
export type UserSkill = InferSelectModel<typeof userSkills>;
export type JobSkill = InferSelectModel<typeof jobSkills>;
export type Education = InferSelectModel<typeof educations>;
export type Experience = InferSelectModel<typeof experiences>;
export type Job = InferSelectModel<typeof jobs>;
export type Application = InferSelectModel<typeof applications>;

export type NewUser = InferInsertModel<typeof users>;
export type NewCompany = InferInsertModel<typeof companies>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewSkill = InferInsertModel<typeof skills>;
export type NewUserSkill = InferInsertModel<typeof userSkills>;
export type NewJobSkill = InferInsertModel<typeof jobSkills>;
export type NewEducation = InferInsertModel<typeof educations>;
export type NewExperience = InferInsertModel<typeof experiences>;
export type NewJob = InferInsertModel<typeof jobs>;
export type NewApplication = InferInsertModel<typeof applications>;

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type JobType = (typeof jobTypeEnum.enumValues)[number];
export type ExperienceLevel = (typeof experienceLevelEnum.enumValues)[number];
