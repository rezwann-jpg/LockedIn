import { drizzle } from "drizzle-orm/node-postgres";
import * as dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL!);

export default db;
