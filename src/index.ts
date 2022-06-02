import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'seo',
	name: 'SEO',
	icon: 'link',
	description: 'SEO Integration',
	types: ['alias'],
	localTypes: ['m2o'],
	component: InterfaceComponent,
	group: 'relational',
	relational: true,
	options: null,
});
