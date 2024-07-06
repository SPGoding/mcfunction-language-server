import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import snapshot from 'snap-shot-it'
import { Color } from '../../lib/index.js'

describe('Color', () => {
	describe('fromDecRGBA()', () => {
		it('Should return correctly', () => {
			snapshot(Color.fromDecRGBA(0.1, 0.2, 0.3, 0.4))
		})
	})
	describe('fromDecRGB()', () => {
		it('Should return correctly', () => {
			snapshot(Color.fromDecRGB(0.1, 0.2, 0.3))
		})
	})
	describe('fromIntRGBA()', () => {
		it('Should return correctly', () => {
			snapshot(Color.fromIntRGBA(255, 191, 127, 63))
		})
	})
	describe('fromIntRGB()', () => {
		it('Should return correctly', () => {
			snapshot(Color.fromIntRGB(255, 191, 127))
		})
	})
	describe('fromCompositeRGB()', () => {
		it('Should return correctly', () => {
			snapshot(Color.fromCompositeRGB(0xffaa55))
		})
		it('Should return white for negative number', () => {
			assert.deepStrictEqual(Color.fromCompositeRGB(-1), [1.0, 1.0, 1.0, 1.0])
		})
	})
	describe('fromCompositeARGB()', () => {
		it('Should return correctly', () => {
			snapshot(Color.fromCompositeARGB(0xeeffaa55))
		})
	})
})
