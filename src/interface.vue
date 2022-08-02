<template>
	<v-form
		:fields="fields"
		:initial-values="initial"
		:model-value="{ ...initial, ...(hasValueChanged ? value : {}) }"
		@update:model-value="setValue($event)"
	></v-form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
		type: [Object, Number],
		default() {
			return [];
		},
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

const emit = defineEmits(['input']);

const value = computed({
	get: () => props.value,
	set: (value) => {
		emit('input', value);
	},
});

const hasValueChanged = ref(false);

const setValue = (input) => {
	hasValueChanged.value = true;
	value.value = input;
};

const fields = computed(() => {
	if (!relatedCollection) return [];
	return fieldsStore.getFieldsForCollection(relatedCollection.collection);
});

// Use ref and watcher, since async computed would return Promise<Object>
const initial = ref({});
watch(value, async (value) => {
	if (typeof value === typeof Number()) {
		const response = await api.get(`/items/${relatedCollection.collection}?filter[id][_eq]=${value}`);
		const data = response.data.data;
		if (data.length === 1) initial.value = data[0];
	}
});
</script>
