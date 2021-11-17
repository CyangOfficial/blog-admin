<template>
  <v-md-editor
    :height="`${$props.height}px`"
    :disabled-menus="[]"
    @upload-image="handleUploadImage"
    v-model="$props.value"
    :left-toolbar="leftToolBar"
    @change="handleMdChange"
  />
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { uploadApi } from '/@/api/sys/upload';
  export default defineComponent({
    props: {
      height: { type: Number, default: 400 },
      value: { type: String, default: '' },
    },
    emits: ['update:value'],
    setup(_, { emit }) {
      const { createMessage } = useMessage();
      const leftToolBar = ref<string>(
        'undo redo clear | tip h bold italic strikethrough quote | ul ol table hr | link emoji image code | todo-list',
      );
      const handleMdChange = (v) => {
        emit('update:value', v);
      };
      const handleUploadImage = (_event, insertImage, files) => {
        if (files.length > 1) {
          createMessage.error('仅支持单张上传');
        }
        uploadApi(files[0]).then((res) => {
          const { data } = res;
          console.log(data);
          createMessage.success(data.code === 0 ? '上传成功' : data.message);

          insertImage({
            url: data.result.url,
            desc: data.result.name,
            width: 'auto',
            height: 'auto',
          });
        });
      };

      return {
        leftToolBar,
        handleUploadImage,
        handleMdChange,
      };
    },
  });
</script>
