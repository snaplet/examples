import { Database as Db } from "@/lib/database.types";

declare global {
    type Database = Db;
}