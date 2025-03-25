import { reactive } from 'vue';

import I18n from '@/i18n';

const { t } = I18n.global;

export const sidebarItems = reactive([
	{
		icon: 'icon-debug',
		name: t('debug'),
		ident: 'debug'
	},
	{
		icon: 'icon-plugin',
		name: t('connect'),
		ident: 'connect'
	},
	{
		icon: 'icon-setting',
		name: t('setting'),
		ident: 'setting'
	},
	{
		icon: 'icon-about',
		name: t('about'),
		ident: 'about'
	}
]);

export const Connection = reactive({
	connected: false,
	showPanel: false
});
