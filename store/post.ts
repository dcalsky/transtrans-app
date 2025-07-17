import { proxy } from "valtio";
import { PostEntity } from "@/db/schema";

interface PostStoreState {
  posts: PostEntity[]
}


export const postStore = proxy<PostStoreState>({
  posts: []
})
