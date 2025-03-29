import { ResourceTemplate, ResourceTemplatesListResponse } from '@/hook/type';
import { reactive } from 'vue';


export const resourcesManager = reactive<{
	current: ResourceTemplate | undefined
	templates: ResourceTemplate[]
}>({
	current: undefined,
	templates: []
});
