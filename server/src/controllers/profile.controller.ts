import { Request, Response } from 'express';
import db from '../config/db';
import {
  users,
  skills,
  userSkills,
  educations,
  experiences,
} from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found' });
    }

    const userSkillRows = await db
      .select()
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, userId));

    const skillsList = userSkillRows.map((row) => row.skills.name);

    const edcationList = await db
      .select()
      .from(educations)
      .where(eq(educations.userId, userId));

    const experienceList = await db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, userId));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      profile: {
        skills: skillsList,
        educations: edcationList,
        experiences: experienceList,
      }
    });
  }
  catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Internal Server Error' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { skills: skillNames, educations: eduData, experiences: expData } = req.body;

    // Utilize the stored procedure for skills
    if (Array.isArray(skillNames)) {
      const skillArraySql = skillNames.length > 0
        ? sql`ARRAY[${sql.join(skillNames.map(s => sql`${s}`), sql`, `)}]::TEXT[]`
        : sql`ARRAY[]::TEXT[]`;
      await db.execute(sql`CALL update_user_skills(${userId}::INT, ${skillArraySql})`);
    }

    // Update Educations (Simple clear and insert approach)
    await db
      .delete(educations)
      .where(eq(educations.userId, userId));
    if (Array.isArray(eduData) && eduData.length > 0) {
      await db.insert(educations).values(
        eduData.map((edu: any) => ({
          userId,
          school: edu.school || '',
          degree: edu.degree || null,
          fieldOfStudy: edu.fieldOfStudy || null,
          startDate: edu.startDate || null,
          endDate: edu.endDate || null,
          description: edu.description || null,
        }))
      );
    }

    // Update Experiences
    await db
      .delete(experiences)
      .where(eq(experiences.userId, userId));
    if (Array.isArray(expData) && expData.length > 0) {
      await db.insert(experiences).values(
        expData.map((exp: any) => ({
          userId,
          company: exp.company || '',
          position: exp.position || '',
          location: exp.location || null,
          startDate: exp.startDate || null,
          endDate:
            exp.currentlyWorking || exp.endDate === 'Present'
              ? null
              : exp.endDate || null,
          description: exp.description || null,
          currentlyWorking: Boolean(exp.currentlyWorking),
        }))
      );
    }
    return res
      .status(200)
      .json({ message: 'Profile updated successfully', });
  }
  catch (error) {
    console.error('Error updating profile:', error);
    res
      .status(500)
      .json({ error: 'Failed to update profile' });
  }
}
