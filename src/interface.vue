<template>
	<div style="margin: 20px">
		<v-form
			:fields="seoFields"
			:model-value="internalValue"
			:initial-value="initial"
			@update:model-value="updateInternalValue($event)"
		></v-form>
	</div>

	<v-divider />
</template>

<script setup lang="ts">
import { useStores, useApi } from '@directus/extensions-sdk';
import { computed, ref, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		collection: string;
		field: string;
		value: number | Object;
	}>(),
	{
		value: () => [],
	}
);

const stores = useStores();
const fieldsStore = stores.useFieldsStore();
const relationsStore = stores.useRelationsStore();
const collectionsStore = stores.useCollectionsStore();
const api = useApi();

const relatedCollection = collectionsStore.getCollection(
	relationsStore.getRelationForField(props.collection, props.field).related_collection
);

const emit = defineEmits(['input']);
const internalValue = computed({
	get: () => props.value,
	set: (value) => {
		emit('input', value);
	},
});

const seoFields = computed(() => {
	if (!relatedCollection) return [];
	return fieldsStore.getFieldsForCollection(relatedCollection.collection);
});

const getSeoValues = async (id) => {
	const response = await api.get(`/items/${relatedCollection.collection}/${id}`);
	return response.data?.data || emptyValue.value;
};

const updateInternalValue = (item, edited = true) => {
	internalValue.value = { ...emptyValue.value, ...item, edited: edited };
};

const emptyValue = computed(() => {
	if (!seoFields.value) return {};
	return seoFields.value
		.filter((field) => !field.meta.hidden)
		.reduce((acc, field) => {
			acc[field.field] = null;
			return acc;
		}, {});
});

const initial = ref(emptyValue.value);

watch(internalValue, async (newValue) => {
	if (!newValue || Number(newValue) !== newValue) {
		return;
	}

	initial.value = await getSeoValues(newValue);
	// Replace value with the loaded entry
	updateInternalValue(initial.value);
});
</script>
