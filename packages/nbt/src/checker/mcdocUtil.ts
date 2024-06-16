import type * as core from '@spyglassmc/core'

const BlockItems: { [item: string]: core.FullResourceLocation[] } = {
	// Coral fans.
	'minecraft:brain_coral_fan': ['minecraft:brain_coral_fan', 'minecraft:brain_coral_wall_fan'],
	'minecraft:bubble_coral_fan': ['minecraft:bubble_coral_fan', 'minecraft:bubble_coral_wall_fan'],
	'minecraft:fire_coral_fan': ['minecraft:fire_coral_fan', 'minecraft:fire_coral_wall_fan'],
	'minecraft:horn_coral_fan': ['minecraft:horn_coral_fan', 'minecraft:horn_coral_wall_fan'],
	'minecraft:tube_coral_fan': ['minecraft:tube_coral_fan', 'minecraft:tube_coral_wall_fan'],

	// Heads and skulls.
	'minecraft:creeper_head': ['minecraft:creeper_head', 'minecraft:creeper_wall_head'],
	'minecraft:dragon_head': ['minecraft:dragon_head', 'minecraft:dragon_wall_head'],
	'minecraft:player_head': ['minecraft:player_head', 'minecraft:player_wall_head'],
	'minecraft:skeleton_skull': ['minecraft:skeleton_skull', 'minecraft:skeleton_wall_skull'],
	'minecraft:wither_skeleton_skull': [
		'minecraft:wither_skeleton_skull',
		'minecraft:wither_skeleton_wall_skull',
	],

	// Dead coral fans.
	'minecraft:dead_brain_coral_fan': [
		'minecraft:dead_brain_coral_fan',
		'minecraft:dead_brain_coral_wall_fan',
	],
	'minecraft:dead_bubble_coral_fan': [
		'minecraft:dead_bubble_coral_fan',
		'minecraft:dead_bubble_coral_wall_fan',
	],
	'minecraft:dead_fire_coral_fan': [
		'minecraft:dead_fire_coral_fan',
		'minecraft:dead_fire_coral_wall_fan',
	],
	'minecraft:dead_horn_coral_fan': [
		'minecraft:dead_horn_coral_fan',
		'minecraft:dead_horn_coral_wall_fan',
	],
	'minecraft:dead_tube_coral_fan': [
		'minecraft:dead_tube_coral_fan',
		'minecraft:dead_tube_coral_wall_fan',
	],

	// Torches.
	'minecraft:torch': ['minecraft:torch', 'minecraft:wall_torch'],
	'minecraft:soul_torch': ['minecraft:soul_torch', 'minecraft:soul_wall_torch'],
	'minecraft:redstone_torch': ['minecraft:redstone_torch', 'minecraft:redstone_wall_torch'],

	'minecraft:beetroot_seeds': ['minecraft:beetroots'],
	'minecraft:carrot': ['minecraft:carrots'],
	'minecraft:cocoa_beans': ['minecraft:cocoa'],
	'minecraft:glow_berries': ['minecraft:cave_vines'],
	'minecraft:melon_seeds': ['minecraft:melon_stem'],
	'minecraft:potato': ['minecraft:potatoes'],
	'minecraft:pumpkin_seeds': ['minecraft:pumpkin_stem'],
	'minecraft:redstone': ['minecraft:redstone_wire'],
	'minecraft:string': ['minecraft:tripwire'],
	'minecraft:sweat_berries': ['minecraft:sweat_berry_bush'],
	'minecraft:wheat_seeds': ['minecraft:wheat'],
}

export function getBlocksFromItem(
	item: core.FullResourceLocation,
): core.FullResourceLocation[] | undefined {
	return BlockItems[item]
}

export function getEntityFromItem(
	item: core.FullResourceLocation,
): core.FullResourceLocation | undefined {
	if (item === 'minecraft:armor_stand') {
		return item
	}
	const result = item.match(/^minecraft:([a-z0-9_]+)_spawn_egg$/)
	if (result) {
		return `minecraft:${result[1]}`
	}
	return undefined
}
