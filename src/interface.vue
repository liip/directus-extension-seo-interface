<template>
	<div style="margin: 20px;">
		<v-button
			style="margin-bottom: 20px;"
			v-if="value && value.edited" 
			@click="updateValue(defaultValue, false)"
		>
		Use Template
		</v-button>
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
import { computed, inject, ref, watch } from "vue";

const props = withDefaults(
	defineProps<{
		collection: string;
		field: string;
		value: number | Object;
		// Options
		title: string;
		description: string;
		image: string;
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


/*
	Use default values
*/

watch(entityValues, (values) => {
	// Check that value isn't edited, if set
	if(value.value && value.value.edited) return;

	// If value is set but unedited, check if it is the same
	// as the default value to avoid self update
	if(value.value !== null){
		const doValuesDiffer = Object.keys(defaultValue.value).map(key => {
			return defaultValue.value[key] === value.value[key];
		}).includes(false);
		if(!doValuesDiffer) return;
	}
	updateValue(defaultValue.value, false);
});

const defaultValue = computed(() => {
	return {
		title: useTemplateString(props.title, entityValues.value),
		description: useTemplateString(props.description, entityValues.value),
		image: useTemplateString(props.image, entityValues.value),
	}
});


/*
	Utils
*/
const useTemplateString = (string, object) => {
	const tokens = getTokensFromString(string);
	const tokenValues = tokens.map(token => ({
		token: token,
		value: object[token]
	}));
	
	const stringWithValues = tokenValues.reduce((acc, tokenValue) => {
		return acc.replace(`{{${tokenValue.token}}}`, tokenValue.value);
	}, string);
	
	if(stringWithValues === String(undefined)) return null;
	return stringWithValues;
};

const getTokensFromString = (string) => {
	const validToken = /{{(([a-zA-Z_$][0-9a-zA-Z_$]*\.?)+)}}/g;

	const results = [];
	// We don't actually replace, but this works better
	// than the regex exec function
	string.replace(validToken, (s, token) => {
		results.push(token);
	});
	
	return results;
}
</script>
