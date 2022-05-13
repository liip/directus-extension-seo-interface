import { defineInterface, useStores } from '@directus/extensions-sdk';
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
	options: ({ collection }) => {
		const fieldsStore = useStores().useFieldsStore();
		const SEO_COLLECTION = 'seo';

		const fields = fieldsStore.getFieldsForCollection(SEO_COLLECTION)
		.filter(field => !field.meta?.hidden)
		.map(field => {
			return {
				field: field.field,
				type: 'string',
				name: field.name,
				meta: {
					width: 'full',
					interface: 'system-display-template',
					required: false,
					options: {
						collectionName: collection,
						font: 'monospace',
					},
				},
			};
		});

		return fields;
	},
});
