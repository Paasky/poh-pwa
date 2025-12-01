<script setup lang="ts">
import { Citizen, Culture, Religion } from '@/objects/game/gameObjects'
import { useObjectsStore } from '@/stores/objectStore'

const props = defineProps<{ citizen: Citizen }>()

const objects = useObjectsStore()
const culture = objects.getGameObject(props.citizen.culture) as Culture
const religion = props.citizen.religion ? objects.getGameObject(props.citizen.religion) as Religion : null

</script>

<template>

</template>

<style scoped>

</style>