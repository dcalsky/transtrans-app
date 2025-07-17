import { useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { PageOption } from '@/models/dto/base';


export function usePostDb() {
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db, { schema });

  const createPost = async (newPost: Omit<schema.PostEntity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const post = {
      ...newPost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await drizzleDb.insert(schema.postsTable).values(post)
    // postStore.posts.push(res[0]);
  }

  const updatePostById = async (id: number, post: Partial<schema.PostEntity>) => {
    await drizzleDb.update(schema.postsTable).set(post).where(eq(schema.postsTable.id, id)).execute();
    // const index = postStore.posts.findIndex(p => p.id === id);
    // postStore.posts[index] = {
    //   ...postStore.posts[index],
    //   ...post,
    // };
  }

  const deletePostById = async (id: number) => {
    await drizzleDb.delete(schema.postsTable).where(eq(schema.postsTable.id, id)).execute();
  }

  const getPostById = async (id: number): Promise<schema.PostEntity | null> => {
    const posts = await drizzleDb.select().from(schema.postsTable).where(eq(schema.postsTable.id, id)).limit(1)
    if (posts.length === 0) {
      return null
    }
    return posts[0]
  }

  const listPosts = async (title?: string, content?: string, pagination?: PageOption): Promise<schema.PostEntity[]> => {
    if (!pagination) {
      pagination = {
        PageNum: 1,
        PageSize: 50,
      }
    } else {
      if (pagination.PageNum < 1) {
        pagination.PageNum = 1
      }
      if (pagination.PageSize < 1) {
        pagination.PageSize = 10
      }
    }
    const offset = pagination.PageSize * (pagination.PageNum - 1)
    return await drizzleDb.query.postsTable.findMany({
      where(fields, { or, like }) {
        return or(like(schema.postsTable.title, `%${title}%`), like(schema.postsTable.textContent, `%${content}%`))
      },
      limit: pagination.PageSize,
      offset: offset,
      orderBy: desc(schema.postsTable.id)
    })
  }
  return {
    createPost,
    listPosts,
    updatePostById,
    deletePostById,
    getPostById,
  }
}
