<template>
	<div style="margin: 20px;">
		<v-form
			:fields="fields"
			:model-value="value"
			:initial-value="initial"
			@update:modelValue="updateValue($event)"
			>
		</v-form>
	</div>

	<v-divider />
</template>

<script setup lang="ts">
import { useStores, useApi } from "@directus/extensions-sdk";
import { computed, inject, ref } from "vue";

const props = withDefaults(
	defineProps<{
		collection: string;
		field: string;
		value: number | Object;
	}>(),
	{
		value: () => [],
	}
)

const stores = useStores();
const fieldsStore = stores.useFieldsStore();
const relationsStore = stores.useRelationsStore();
const collectionsStore = stores.useCollectionsStore();
const api = useApi();

const relatedCollection = collectionsStore.getCollection(
	relationsStore.getRelationForField(
		props.collection, props.field
	).related_collection
);

const entityValues = inject('values', ref({}));
const emit = defineEmits(['input']);
const value = computed({
	get: () => props.value,
	set: (value) => {
		emit('input', value);
	},
});

const fields = computed(() => {
	if(!relatedCollection) return [];
	return fieldsStore.getFieldsForCollection(relatedCollection.collection);
});

const emptyValue = computed(() => {
	if(!fields.value) return {};
	return fields.value
		.filter(field => !field.meta.hidden)
		.reduce((acc, field) => {
			acc[field.field] = null;
			return acc;
		}, {});
});

const initial = computed(async () => {
	if(!props.value || Number(value.value) !== value.value) return initial || emptyValue.value;

	const item = await getValue(value.value);
	// Replace value with the loaded entry
	updateValue(item);
	return item;
});


const getValue = async (id) => {
	const response = await api.get(`/items/${relatedCollection.collection}?filter[id][_eq]=${id}`)
	const responseData = response.data.data;
	if(responseData.length === 1) {
		const item = responseData[0];
		return item;
	}

	return emptyValue.value;
}

const updateValue = (item, edited=true) => {
	value.value = {...emptyValue.value, ...item, edited: edited};
}

</script>
