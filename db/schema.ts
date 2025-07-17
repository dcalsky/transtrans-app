import { blob, int, sqliteTable, text } from "drizzle-orm/sqlite-core";


export interface AudioInPost {
  filename: string
  uri: string
  duration: number
}

export const postsTable = sqliteTable("posts", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  textContent: text().notNull(),
  audios: text({ mode: 'json' }).$type<AudioInPost[]>().default([]).notNull(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});


export const postTagMapping = sqliteTable("post_tag_mapping", {
  id: int().primaryKey({ autoIncrement: true }),
  postId: int().references(() => postsTable.id).notNull(),
  text: text().notNull(),
})

export type PostEntity = typeof postsTable.$inferSelect;
export type PostTagMappingEntity = typeof postTagMapping.$inferSelect;