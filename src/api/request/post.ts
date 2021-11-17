import { defHttp } from '/@/utils/http/axios';
import {
  DefaultParams,
  PostListResultModel,
  CreatePostDTO,
  UpdatePostDto,
} from './model/postModel';

enum Api {
  POST_LIST = '/post/getPosts',
  POST_CREATE = '/post',
  POST_UPDATE = '/post',
}

/**
 * @description: Get sample list value
 */

export const postListApi = (params: DefaultParams) =>
  defHttp.get<PostListResultModel>({
    url: Api.POST_LIST,
    params,
  });

export const createPostApi = (params: CreatePostDTO) =>
  defHttp.post<PostListResultModel>({
    url: Api.POST_CREATE,
    params,
  });

export const updatePostApi = (params: UpdatePostDto) =>
  defHttp.put<PostListResultModel>({
    url: Api.POST_UPDATE,
    params,
  });
