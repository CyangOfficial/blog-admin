<template>
  <div class="p-4">
    <div class="post-table-list">
      <Row>
        <Col>
          <div class="filter-form mb-3 mt-2">
            <Form layout="inline" :model="formState">
              <FormItem>
                <Input v-model:value="formState.keyWords" placeholder="请输入标题" />
              </FormItem>
              <FormItem>
                <Button @click="searchPost"
                  ><template #icon><SearchOutlined /></template>搜索</Button
                >
              </FormItem>
              <FormItem>
                <Button @click="resetPost"
                  ><template #icon><RedoOutlined /></template>重置</Button
                >
              </FormItem>
              <FormItem>
                <Button type="primary" @click="$router.push({ path: '/post/create' })">
                  <template #icon>
                    <PlusOutlined />
                  </template>
                  添加文章</Button
                >
              </FormItem>
            </Form>
          </div>
        </Col>
      </Row>
      <Row type="flex">
        <Col flex="auto">
          <Table
            class="ant-table-striped"
            :columns="columns"
            :data-source="postData"
            :rowClassName="(_, index) => (index % 2 === 1 ? 'table-striped' : null)"
            :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            size="small"
            :pagination="configPagination"
            bordered
            :loading="tableLoading"
            @change="tableChange"
          >
            <template #posterUrl="{ text: url }">
              <Image class="post-poster" :width="150" :height="80" :src="url" />
            </template>
            <template #tags="{ text: tags }">
              <span>
                <Tag
                  v-for="tag in tags"
                  :key="tag"
                  :color="tag === 'loser' ? 'volcano' : tag.length > 5 ? 'geekblue' : 'green'"
                  >{{ tag }}</Tag
                >
              </span>
            </template>
            <template #isPublic="{ record }">
              <Switch
                :loading="stateLoading"
                v-model:checked="record.isPublic"
                @change="(checked) => changePublicState(checked, record._id)"
              />
            </template>
            <template #action="{ record }">
              <div class="action">
                <span class="edit-btn mr-3" @click="$router.push({ path: `/post/${record._id}` })"
                  ><EditFilled /> 编辑</span
                >
                <span class="del-btn"><DeleteOutlined /> 删除</span>
              </div>
            </template>
          </Table>
        </Col>
      </Row>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent, onMounted, ref, reactive, toRefs } from 'vue';
  import {
    Table,
    Tag,
    Image,
    Switch,
    Row,
    Col,
    Form,
    FormItem,
    Input,
    Button,
  } from 'ant-design-vue';
  import { SearchOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons-vue';
  import { EditFilled, DeleteOutlined } from '@ant-design/icons-vue';
  import { postListApi, updatePostApi } from '/@/api/request/post';
  import { ColumnProps } from 'ant-design-vue/es/table/interface';
  import { useMessage } from '/@/hooks/web/useMessage';
  // import { useRouter } from 'vue-router';
  // import { useGo } from '/@/hooks/web/usePage';
  import moment from 'moment';

  type Key = ColumnProps['key'];
  interface SelectType {
    selectedRowKeys: Key[];
    loading: boolean;
    onSelectChange: Function;
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      align: 'center',
      width: 125,
      slots: { customRender: '_id' },
    },
    {
      title: '标题',
      dataIndex: 'title',
      align: 'center',
      ellipsis: true,
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      align: 'center',
      ellipsis: true,
    },
    {
      title: '封面',
      dataIndex: 'posterUrl',
      align: 'center',
      slots: { customRender: 'posterUrl' },
    },
    {
      title: '浏览量',
      dataIndex: 'pv',
      align: 'center',
      width: 80,
    },
    {
      title: '点赞',
      dataIndex: 'like',
      align: 'center',
      width: 80,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      align: 'center',
      slots: { customRender: 'tags' },
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      align: 'center',
      customRender: ({ text }) => {
        return moment(text).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      align: 'center',
      customRender: ({ text }) => {
        return moment(text).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '是否公开',
      dataIndex: 'isPublic',
      align: 'center',
      slots: { customRender: 'isPublic' },
    },
    {
      title: '操作',
      dataIndex: 'action',
      align: 'center',
      width: 120,
      slots: { customRender: 'action' },
    },
  ];
  export default defineComponent({
    components: {
      Table,
      Tag,
      Image,
      EditFilled,
      DeleteOutlined,
      Switch,
      Row,
      Col,
      Input,
      Form,
      FormItem,
      Button,
      SearchOutlined,
      PlusOutlined,
      RedoOutlined,
    },
    setup() {
      const { createMessage } = useMessage();
      const postData = ref<Array<any>>([]);
      // const _go = useGo();
      // const _router = useRouter();
      // const openState = ref(true);
      const stateLoading = ref(false);
      const tableLoading = ref(false);

      const formState = reactive({
        keyWords: '',
      });

      // 更改文章状态
      const changePublicState = (state: boolean, id: string) => {
        const params = {
          _id: id,
          isPublic: state,
        };
        stateLoading.value = true;
        updatePostApi(params).then((res) => {
          stateLoading.value = false;
          createMessage.success(res.code === 0 ? '切换成功' : res.message);
        });
      };

      // 获取文章列表
      const fetchPostLists = async ({ page = 1, pageSize = 7, ...arg } = {}) => {
        tableLoading.value = true;
        const params = { page, pageSize, ...arg };
        postData.value = [];
        const { result } = await postListApi(params);
        tableLoading.value = false;
        configPagination.total = result.total as number;
        configPagination.defaultPageSize = pageSize;
        let { items } = result as any;
        // items = items.map((obj) => {
        //   const { _v, content: _content, ...rest } = obj;
        //   return rest;
        // });
        items.forEach((item) => {
          postData.value.push({
            ...item,
            key: item._id,
          });
        });
      };

      // 获取文章列表并处理数据
      onMounted(fetchPostLists);

      // 搜索
      const searchPost = () => {
        const params = {
          page: 1,
          pageSize: 7,
          title: formState.keyWords,
        };
        fetchPostLists(params);
      };

      const resetPost = () => fetchPostLists();

      // 筛选框
      const selectState = reactive<SelectType>({
        selectedRowKeys: [],
        loading: false,
        onSelectChange: (keys: Key[]) => {
          selectState.selectedRowKeys = keys;
        },
      });

      // 分页
      const configPagination = reactive({
        total: 0,
        defaultPageSize: 7,
        showTotal: (total: number) => `共 ${total} 条数据`,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '15', '20'],
        // onShowSizeChange: (current, pageSize) => (this.pageSize = pageSize),
      });

      const tableChange = (pageination) => {
        const params = {
          page: pageination.current,
        };
        fetchPostLists(params);
      };

      const editPost = (row) => {
        console.log(row);
        // router.push({ path: `/post/${row._id}` });
      };

      return {
        postData,
        columns,
        configPagination,
        editPost,
        stateLoading,
        changePublicState,
        resetPost,
        searchPost,
        tableChange,
        tableLoading,
        ...toRefs(selectState),
        formState,
      };
    },
  });
</script>

<style lang="less">
  .post-table-list {
    max-width: 100%;
    padding: 6px;
    background-color: #fff;
    border-radius: 2px;
  }
  .ant-table-striped {
    .post-poster {
      // object-fit: cover;
      width: 100%;
      height: 100%;
    }

    .action {
      color: #1890ff;
      span {
        font-size: 12px;
        cursor: pointer;
      }
    }

    @border-color: #cecece4d;

    @prefix-cls: ~'@{namespace}-basic-table';
    .@{prefix-cls} {
      max-width: 100%;

      &-row__striped {
        td {
          background-color: @app-content-background;
        }
      }

      &-form-container {
        padding: 16px;

        .ant-form {
          padding: 12px 10px 6px;
          margin-bottom: 16px;
          background-color: @component-background;
          border-radius: 2px;
        }
      }

      .ant-tag {
        margin-right: 0;
      }

      .ant-table-wrapper {
        padding: 6px;
        background-color: @component-background;
        border-radius: 2px;

        .ant-table-title {
          min-height: 40px;
          padding: 0 0 8px !important;
        }

        .ant-table.ant-table-bordered .ant-table-title {
          border: none !important;
        }
      }

      .ant-table {
        width: 100%;
        overflow-x: hidden;

        &-title {
          display: flex;
          padding: 8px 6px;
          border-bottom: none;
          justify-content: space-between;
          align-items: center;
        }

        //.ant-table-tbody > tr.ant-table-row-selected td {
        //background-color: fade(@primary-color, 8%) !important;
        //}
      }

      .ant-pagination {
        margin: 10px 0 0;
      }

      .ant-table-footer {
        padding: 0;

        .ant-table-wrapper {
          padding: 0;
        }

        table {
          border: none !important;
        }

        .ant-table-body {
          overflow-x: hidden !important;
          //  overflow-y: scroll !important;
        }

        td {
          padding: 12px 8px;
        }
      }

      &--inset {
        .ant-table-wrapper {
          padding: 0;
        }
      }
    }
  }

  [data-theme='dark'] {
    .ant-table-tbody > tr:hover.ant-table-row-selected > td,
    .ant-table-tbody > tr.ant-table-row-selected td {
      background-color: #262626;
    }
    .post-table-list {
      background-color: #151515;
    }
  }
</style>
