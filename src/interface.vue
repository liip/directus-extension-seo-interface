<template>
	<v-form :fields="fields" :initial-values="initial" :model-value="value" @update:model-value="value = $event"></v-form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref, watchEffect } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';

const props = defineProps({
	collection: {
		type: String,
		required: true,
	},
	field: {
		type: String,
		required: true,
	},
	value: {
		type: [Object, Number, null],
		default: null,
	},
});

const api = useApi();
const stores = useStores();
const fieldsStore = stores.useFieldsStore();
const relationsStore = stores.useRelationsStore();
const collectionsStore = stores.useCollectionsStore();
const relatedCollection = collectionsStore.getCollection(
	relationsStore.getRelationForField(props.collection, props.field).related_collection
);
const fields = computed(() => {
	if (!relatedCollection) return [];
	return fieldsStore.getFieldsForCollection(relatedCollection.collection);
});

const emit = defineEmits(['input']);
const isId = (value) => typeof value === typeof Number();
const initial = ref({});

const value = computed({
	get: () => (isId(props.value) ? initial.value : props.value),
	set: (value) => {
		emit('input', value);
	},
});

watchEffect(async () => {
	if (isId(props.value)) {
		const response = await api.get(`/items/${relatedCollection.collection}?filter[id][_eq]=${props.value}`);
		const data = response.data.data;
		if (data.length === 1) initial.value = data[0];
	}
});
</script>
