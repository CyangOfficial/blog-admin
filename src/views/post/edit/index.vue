<template>
  <PageWrapper>
    <CollapseContainer>
      <BasicForm
        title="MarkDown表单"
        :labelWidth="100"
        :schemas="schemas"
        :show-submit-button="false"
        :show-reset-button="false"
        :actionColOptions="{ span: 24 }"
        @register="register"
      >
        <template #poster>
          <Upload
            v-model:file-list="fileList"
            name="avatar"
            list-type="picture-card"
            class="poster-uploader"
            :show-upload-list="false"
            action=""
            :customRequest="uploadPoster"
            @change="handleChange"
          >
            <img v-if="posterUrl" :src="posterUrl" alt="avatar" />
            <div v-else>
              <LoadingOutlined v-if="posterLoading" />
              <PlusOutlined v-else />
              <div class="ant-upload-text">封面上传</div>
            </div>
          </Upload>
        </template>
        <template #tags="{}">
          <div class="tag-container">
            <Tag closable v-for="tag in postTags" :key="tag" color="pink">{{ tag }}</Tag>
            <div class="add-btn">
              <Button v-show="btnVisibility" size="small" @click.stop="toggleBtnVisibility"
                ><PlusOutlined />添加</Button
              >
              <Input
                v-show="!btnVisibility"
                ref="tagBtn"
                class="post-form-input"
                v-model:value="tagVal"
                size="small"
                @pressEnter="addTag"
                @blur="addTag"
              />
            </div>
          </div>
        </template>
        <template #markdown="{}">
          <!-- <MarkDown v-model:value="mdValue" :options="mdOptions" ref="markDownRef" /> -->
          <VueMdEditor v-model:value="mdValue" />
        </template>
        <template #action="{}">
          <Button :loading="publishLoading" class="mr-2" type="primary" @click="handlePublish">{{
            btnText
          }}</Button>
          <Button :loading="saveLoading" @click="handleSave">保存至草稿</Button>
        </template>
      </BasicForm>
    </CollapseContainer>
  </PageWrapper>
</template>
<script lang="ts">
  import { defineComponent, reactive, toRefs, ref, nextTick } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { BasicForm, FormSchema, useForm } from '/@/components/Form/index';
  import { CollapseContainer } from '/@/components/Container/index';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { PageWrapper } from '/@/components/Page';
  import { Upload, Tag, Button, Input } from 'ant-design-vue';
  import { PlusOutlined, LoadingOutlined } from '@ant-design/icons-vue';
  import { useComponentRegister } from '/@/components/Form/index';
  import { uploadApi } from '/@/api/sys/upload';
  import { createPostApi } from '/@/api/request/post';
  import VueMdEditor from './components/VueMdEditor.vue';
  const schemas: FormSchema[] = [
    {
      field: '',
      component: 'Upload',
      slot: 'poster',
      label: '封面',
      rules: [{ required: true }],
    },
    {
      field: 'title',
      component: 'Input',
      label: '标题',
      defaultValue: '',
      rules: [{ required: true }],
    },
    {
      field: 'summary',
      component: 'InputTextArea',
      label: '摘要',
      defaultValue: '',
      rules: [{ required: true }],
    },
    {
      field: '',
      component: 'Tag',
      slot: 'tags',
      label: '标签',
      rules: [{ required: true }],
    },
    {
      field: '',
      component: 'Input',
      slot: 'markdown',
      label: '内容',
      rules: [{ required: true }],
    },
    {
      field: '',
      component: 'Button',
      slot: 'action',
      label: ' ',
    },
  ];
  type UploadType = {
    fileList: [];
    posterUrl: string;
    posterLoading: Boolean;
    handleChange: Fn;
    uploadPoster: Fn;
  };
  export default defineComponent({
    components: {
      BasicForm,
      CollapseContainer,
      PageWrapper,
      Upload,
      PlusOutlined,
      LoadingOutlined,
      Tag,
      Button,
      Input,
      VueMdEditor,
    },
    setup() {
      useComponentRegister('Tag', Tag);
      useComponentRegister('Button', Button);
      const { createMessage } = useMessage();
      const [register, { getFieldsValue }] = useForm();
      const router = useRouter();
      const route = useRoute();
      let btnText = ref('发布');
      if (route.params?.id) {
        btnText.value = '保存';
      } else {
        btnText.value = '发布';
      }

      const getPostById = () => {

      }

      // 封面上传逻辑
      const beforeUpload = (file: File) => {
        console.log(file);
        const imgExt = ['image/jpeg', 'image/png', 'image/gif'];
        const imgTypes = imgExt.some((item) => item === file.type);
        if (!imgTypes) {
          createMessage.error('仅支持格式：jpg,png,gif');
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
          createMessage.error('图片不能大于5MB!');
        }
        return imgTypes && isLt5M;
      };
      const uploadState = reactive<UploadType>({
        fileList: [],
        posterUrl: '',
        posterLoading: false,
        handleChange: () => {
          // uploadState.posterLoading = false;
          // console.log(a, b, c);
          // console.log('上传');
        },
        uploadPoster: ({ file }) => {
          if (!beforeUpload(file)) return;
          uploadState.posterLoading = true;
          setTimeout(() => (uploadState.posterLoading = false), 5000);
          uploadApi(file).then(({ data }) => {
            uploadState.posterLoading = false;
            uploadState.posterUrl = data.code === 0 ? data.result.url : '';
            console.log(uploadState.posterUrl);
            createMessage.success(data.message);
          });
        },
      });

      // 标签逻辑
      const postTags = ref<Array<string>>([]);
      const tagVal = ref('');
      const btnVisibility = ref(true);
      const tagBtn = ref<ElRef>(null);
      const toggleBtnVisibility = () => {
        btnVisibility.value = !btnVisibility.value;
        if (!btnVisibility.value) {
          nextTick(() => tagBtn.value!.focus());
        }
      };
      const addTag = () => {
        if (tagVal.value.trim() !== '') {
          postTags.value.push(tagVal.value);
        }
        tagVal.value = '';
        btnVisibility.value = true;
      };

      // 发布/保存
      const handlePublish = () => {
        const { title, summary } = getFieldsValue();
        const params = {
          title,
          summary,
          content: mdValue.value,
          posterUrl: uploadState.posterUrl,
          tags: postTags.value,
          lastModifiedDate: new Date(),
          isPublic: true,
        };
        createPostApi(params).then((res) => {
          createMessage.success(res.code === 0 ? '发布成功' : res.message);
          router.push({ path: '/post/index' });
        });
      };
      const handleSave = () => {
        const { title, summary } = getFieldsValue();
        const params = {
          title,
          summary,
          content: mdValue.value,
          posterUrl: uploadState.posterUrl,
          tags: postTags.value,
          lastModifiedDate: new Date(),
          isPublic: true,
        };
      };
      const publishLoading = ref(false);
      const saveLoading = ref(false);

      const mdValue = ref('');
      // watch(
      //   () => route.params,
      //   (n: any) => {
      //     console.log(n);
      //   },
      // );

      return {
        schemas,
        postTags,
        tagVal,
        tagBtn,
        btnVisibility,
        addTag,
        toggleBtnVisibility,
        handlePublish,
        handleSave,
        publishLoading,
        saveLoading,
        register,
        mdValue,
        btnText,
        ...toRefs(uploadState),
      };
    },
  });
</script>

<style lang="less">
  .post-form-input {
    width: 90px;
  }
  .tag-container {
    display: flex;
  }
  .poster-uploader {
    .ant-upload {
      width: 250px;
      max-height: 150px;
    }
  }
  .ant-upload-select-picture-card i {
    font-size: 32px;
    color: #999;
  }

  .ant-upload-select-picture-card .ant-upload-text {
    margin-top: 8px;
    color: #666;
  }
</style>
