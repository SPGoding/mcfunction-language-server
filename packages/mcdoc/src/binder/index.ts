import type { AstNode, BinderContext, CheckerContext, Location, MetaRegistry, RangeLike, StringNode, Symbol } from '@spyglassmc/core'
import { AsyncBinder, Dev, ErrorSeverity, Range, ResourceLocationNode, SymbolUtil, SymbolVisibility } from '@spyglassmc/core'
import { localeQuote, localize } from '@spyglassmc/locales'
import type { AdditionalContext } from '../common.js'
import type { AnyTypeNode, AttributeValueNode, BooleanTypeNode, EnumValueNode, IdentifierNode, IndexNode, InjectionNode, LiteralTypeValueNode, ModuleNode, StructFieldNode, StructKeyNode, TypeNode } from '../node/index.js'
import { AttributeNode, AttributeTreeNamedValuesNode, AttributeTreeNode, AttributeTreePosValuesNode, DispatcherTypeNode, DispatchStatementNode, DocCommentsNode, DynamicIndexNode, EnumBlockNode, EnumFieldNode, EnumNode, FloatRangeNode, IndexBodyNode, IntRangeNode, ListTypeNode, LiteralNode, LiteralTypeNode, NumericTypeNode, PathNode, PrimitiveArrayTypeNode, ReferenceTypeNode, StaticIndexNode, StringTypeNode, StructBlockNode, StructMapKeyNode, StructNode, StructPairFieldNode, StructSpreadFieldNode, TupleTypeNode, TypeAliasNode, TypeBaseNode, TypedNumberNode, TypeParamBlockNode, TypeParamNode, UnionTypeNode, UseStatementNode } from '../node/index.js'
import type { Attribute, AttributeTree, AttributeValue, DispatcherType, DynamicIndex, EnumType, EnumTypeField, Index, KeywordType, ListType, LiteralNumberCaseInsensitiveSuffix, LiteralNumberSuffix, LiteralType, LiteralValue, McdocType, NumericRange, NumericType, NumericTypeKind, ParallelIndices, PrimitiveArrayType, PrimitiveArrayValueKind, ReferenceType, StaticIndex, StringType, StructType, StructTypeField, StructTypePairField, StructTypeSpreadField, TupleType, TypeBase, UnionType } from '../type/index.js'

interface McdocBinderContext extends BinderContext, AdditionalContext { }

export const fileModule = AsyncBinder.create<ModuleNode>(async (node, ctx) => {
	const moduleIdentifier = uriToIdentifier(ctx.doc.uri, ctx)
	if (!moduleIdentifier) {
		ctx.err.report(
			localize('mcdoc.binder.out-of-root', localeQuote(ctx.doc.uri)),
			Range.Beginning, ErrorSeverity.Hint
		)
		return
	}

	const mcdocCtx: McdocBinderContext = {
		...ctx,
		moduleIdentifier,
	}
	return module_(node, mcdocCtx)
})

export async function module_(node: ModuleNode, ctx: McdocBinderContext): Promise<void> {
	hoist(node, ctx)

	for (const child of node.children) {
		switch (child.type) {
			case 'mcdoc:dispatch_statement': await bindDispatchStatement(child, ctx); break
			case 'mcdoc:enum': bindEnum(child, ctx); break
			case 'mcdoc:injection': await bindInjection(child, ctx); break
			case 'mcdoc:struct': await bindStruct(child, ctx); break
			case 'mcdoc:type_alias': await bindTypeAlias(child, ctx); break
			case 'mcdoc:use_statement': await bindUseStatement(child, ctx); break
		}
	}
}

/**
 * Hoist enums, structs, type aliases, and use statements under the module scope.
 */
function hoist(node: ModuleNode, ctx: McdocBinderContext): void {
	for (const child of node.children) {
		switch (child.type) {
			case 'mcdoc:enum': hoistEnum(child); break
			case 'mcdoc:struct': hoistStruct(child); break
			case 'mcdoc:type_alias': hoistTypeAlias(child); break
			case 'mcdoc:use_statement': hoistUseStatement(child); break
		}
	}

	function hoistEnum(node: EnumNode) {
		hoistFor('enum', node, EnumNode.destruct)
	}

	function hoistStruct(node: StructNode) {
		hoistFor('struct', node, StructNode.destruct)
	}

	function hoistTypeAlias(node: TypeAliasNode) {
		hoistFor('type_alias', node, TypeAliasNode.destruct)
	}

	function hoistUseStatement(node: UseStatementNode) {
		const { binding, path } = UseStatementNode.destruct(node)
		if (!path) {
			return
		}

		const { lastIdentifier } = PathNode.destruct(path)
		const identifier = binding ?? lastIdentifier
		if (!identifier) {
			return
		}

		ctx.symbols
			.query({ doc: ctx.doc, node }, 'mcdoc', `${ctx.moduleIdentifier}::${identifier.value}`)
			.ifDeclared(symbol => reportDuplicatedDeclaration(ctx, symbol, identifier))
			.elseEnter({
				data: { subcategory: 'use_statement_binding', visibility: SymbolVisibility.File },
				usage: { type: 'definition', node: identifier, fullRange: node },
			})
	}

	function hoistFor<N extends AstNode>(subcategory: 'enum' | 'struct' | 'type_alias', node: N, destructor: (node: N) => { docComments?: DocCommentsNode, identifier?: IdentifierNode }) {
		const { docComments, identifier } = destructor(node)
		if (!identifier?.value) {
			return
		}

		ctx.symbols
			.query({ doc: ctx.doc, node }, 'mcdoc', `${ctx.moduleIdentifier}::${identifier.value}`)
			.ifDeclared(symbol => reportDuplicatedDeclaration(ctx, symbol, identifier))
			.elseEnter({
				data: { desc: DocCommentsNode.asText(docComments), subcategory },
				usage: { type: 'definition', node: identifier, fullRange: node },
			})
	}
}

async function bindDispatchStatement(node: DispatchStatementNode, ctx: McdocBinderContext): Promise<void> {
	const { attributes, location, index, target } = DispatchStatementNode.destruct(node)
	if (!(location && index && target)) {
		return
	}

	const locationStr = ResourceLocationNode.toString(location, 'full')
	ctx.symbols
		.query(ctx.doc, 'mcdoc/dispatcher', locationStr)
		.enter({
			usage: { type: 'reference', node: location, fullRange: node },
		})

	const { parallelIndices } = IndexBodyNode.destruct(index)
	for (const key of parallelIndices) {
		if (DynamicIndexNode.is(key)) {
			// Ignore dynamic indices in dispatch statements.
			continue
		}
		ctx.symbols
			.query(ctx.doc, 'mcdoc/dispatcher', locationStr, asString(key))
			.ifDeclared(symbol => reportDuplicatedDeclaration(ctx, symbol, key, { localeString: 'mcdoc.binder.dispatcher-statement.duplicated-key.related' }))
			.elseEnter({
				data: {
					data: {
						attributes: convertAttributes(attributes, ctx),
						typeDef: convertType(target, ctx),
					},
				},
				usage: { type: 'definition', node: key, fullRange: node },
			})
	}

	await bindType(target, ctx)
}

async function bindType(node: TypeNode, ctx: McdocBinderContext): Promise<void> {
	if (DispatcherTypeNode.is(node)) {
		bindDispatcherType(node, ctx)
	} else if (EnumNode.is(node)) {
		bindEnum(node, ctx)
	} else if (ListTypeNode.is(node)) {
		const { item } = ListTypeNode.destruct(node)
		await bindType(item, ctx)
	} else if (ReferenceTypeNode.is(node)) {
		const { path, typeParameters } = ReferenceTypeNode.destruct(node)
		await bindPath(path, ctx)
		for (const param of typeParameters) {
			await bindType(param, ctx)
		}
	} else if (StructNode.is(node)) {
		await bindStruct(node, ctx)
	} else if (TupleTypeNode.is(node)) {
		const { items } = TupleTypeNode.destruct(node)
		for (const item of items) {
			await bindType(item, ctx)
		}
	} else if (UnionTypeNode.is(node)) {
		const { members } = UnionTypeNode.destruct(node)
		for (const member of members) {
			await bindType(member, ctx)
		}
	}
}

function bindDispatcherType(node: DispatcherTypeNode, ctx: McdocBinderContext): void {
	const { index, location } = DispatcherTypeNode.destruct(node)
	const locationStr = ResourceLocationNode.toString(location, 'full')
	const { parallelIndices } = IndexBodyNode.destruct(index)
	for (const key of parallelIndices) {
		if (DynamicIndexNode.is(key)) {
			// Although it is technically possible to bind some of the dynamic indices as references
			// of struct keys, it is rather complicated to do so. We will ignore them for now.
			continue
		}

		ctx.symbols
			.query(ctx.doc, 'mcdoc/dispatcher', locationStr, asString(key))
			.enter({ usage: { type: 'reference', node: key, fullRange: node } })
	}
}

async function bindPath(node: PathNode, ctx: McdocBinderContext): Promise<void> {
	// TODO
}

function bindEnum(node: EnumNode, ctx: McdocBinderContext): void {
	const { block, identifier } = EnumNode.destruct(node)
	if (!identifier?.value) {
		return
	}

	// TODO: Check duplicated keys.
}

async function bindInjection(node: InjectionNode, ctx: McdocBinderContext): Promise<void> {
	// TODO
}

async function bindStruct(node: StructNode, ctx: McdocBinderContext): Promise<void> {
	const { block, identifier } = StructNode.destruct(node)
	if (!identifier?.value) {
		return
	}

	// TODO: Check duplicated keys.
	// TODO: Bind spread types.
}

async function bindTypeAlias(node: TypeAliasNode, ctx: McdocBinderContext): Promise<void> {
	const { identifier, rhs, typeParams } = TypeAliasNode.destruct(node)
	if (!identifier?.value) {
		return
	}

	if (rhs) {
		await bindType(rhs, ctx)
	}

	if (typeParams) {
		// Type parameters are added as 1) members of the type alias symbol and 2) local symbols on the type alias AST node.
		node.locals = Object.create(null)
		const { params } = TypeParamBlockNode.destruct(typeParams)
		const query = ctx.symbols.query({ doc: ctx.doc, node }, 'mcdoc', `${ctx.moduleIdentifier}::${identifier.value}`)
		for (const param of params) {
			const { constraint, identifier: paramIdentifier } = TypeParamNode.destruct(param)
			if (query.symbol?.subcategory === 'type_alias' && paramIdentifier.value) {
				query.member(paramIdentifier.value, q => q
					.ifDeclared(symbol => reportDuplicatedDeclaration(ctx, symbol, paramIdentifier))
					.elseEnter({ usage: { type: 'declaration', node: paramIdentifier, fullRange: param } })
				)
				ctx.symbols
					.query({ doc: ctx.doc, node }, 'mcdoc', `${ctx.moduleIdentifier}::${identifier.value}::${paramIdentifier.value}`)
					.ifDeclared(symbol => reportDuplicatedDeclaration(ctx, symbol, paramIdentifier))
					.elseEnter({ data: { visibility: SymbolVisibility.Block }, usage: { type: 'declaration', node: paramIdentifier, fullRange: param } })
			}
			if (constraint) {
				await bindPath(constraint, ctx)
			}
		}
	}
}

async function bindUseStatement(node: UseStatementNode, ctx: McdocBinderContext): Promise<void> {
	const { path } = UseStatementNode.destruct(node)
	if (!path) {
		return
	}

	return bindPath(path, ctx)
}

export function registerMcdocBinders(meta: MetaRegistry) {
	meta.registerBinder<ModuleNode>('mcdoc:module', fileModule)
}

function reportDuplicatedDeclaration(ctx: McdocBinderContext, symbol: Symbol, range: RangeLike, options: { localeString: 'mcdoc.binder.dispatcher-statement.duplicated-key.related' | 'mcdoc.binder.duplicated-path' } = { localeString: 'mcdoc.binder.duplicated-path' }) {
	ctx.err.report(
		localize(options.localeString, localeQuote(symbol.identifier)),
		range, ErrorSeverity.Warning,
		{
			related: [{
				location: SymbolUtil.getDeclaredLocation(symbol) as Location,
				message: localize(`${options.localeString}.related`, localeQuote(symbol.identifier)),
			}],
		}
	)
}

function resolvePath(ctx: McdocBinderContext, path: PathNode, options: { reportErrors?: boolean } = {}): string[] | undefined {
	const { children, isAbsolute } = PathNode.destruct(path)
	const identifiers: string[] = isAbsolute
		? []
		: ctx.moduleIdentifier.slice(2).split('::')
	for (const child of children) {
		switch (child.type) {
			case 'mcdoc:identifier':
				identifiers.push(child.value)
				break
			case 'mcdoc:literal':
				// super
				if (identifiers.length === 0) {
					if (options.reportErrors) {
						ctx.err.report(localize('mcdoc.binder.path.super-from-root'), child)
					}
					return undefined
				}
				identifiers.pop()
				break
			default:
				Dev.assertNever(child)
		}
	}
	return identifiers
}

async function ensureFileBound(ctx: McdocBinderContext, path: PathNode): Promise<string | undefined> {
	const identifiers = resolvePath(ctx, path, { reportErrors: true })
	if (!identifiers) {
		return undefined
	}

	const referencedModuleFile = `::${identifiers.slice(0, -1).join('::')}`
	const referencedModuleUri = identifierToUri(referencedModuleFile, ctx)
	const referencedPath = `::${identifiers.join('::')}`
	if (!referencedModuleUri) {
		ctx.err.report(localize('mcdoc.binder.path.unknown-module'), path)
		return undefined
	}

	await ctx.ensureBound(referencedModuleUri)

	if (!ctx.symbols.global.mcdoc?.[referencedPath]?.definition?.length) {
		return undefined
	}

	return referencedPath
}

function identifierToUri(module: string, ctx: McdocBinderContext): string | undefined {
	return ctx.symbols.global.mcdoc?.[module]?.definition?.[0]?.uri
}

function uriToIdentifier(uri: string, ctx: CheckerContext): string | undefined {
	return Object
		.values(ctx.symbols.global.mcdoc ?? {})
		.find(symbol => {
			return symbol.subcategory === 'module' && symbol.definition?.some(loc => loc.uri === uri)
		})
		?.identifier
}

function pathArrayToString(path: string[]): string
function pathArrayToString(path: string[] | undefined): string | undefined
function pathArrayToString(path: string[] | undefined): string | undefined {
	return path ? `::${path.join('::')}` : undefined
}

function convertType(node: TypeNode, ctx: McdocBinderContext): McdocType {
	switch (node.type) {
		case 'mcdoc:enum': return convertEnum(node, ctx)
		case 'mcdoc:struct': return convertStruct(node, ctx)
		case 'mcdoc:type/any': return convertAny(node, ctx)
		case 'mcdoc:type/boolean': return convertBoolean(node, ctx)
		case 'mcdoc:type/dispatcher': return convertDispatcher(node, ctx)
		case 'mcdoc:type/list': return convertList(node, ctx)
		case 'mcdoc:type/literal': return convertLiteral(node, ctx)
		case 'mcdoc:type/numeric_type': return convertNumericType(node, ctx)
		case 'mcdoc:type/primitive_array': return convertPrimitiveArray(node, ctx)
		case 'mcdoc:type/string': return convertString(node, ctx)
		case 'mcdoc:type/reference': return convertReference(node, ctx)
		case 'mcdoc:type/tuple': return convertTuple(node, ctx)
		case 'mcdoc:type/union': return convertUnion(node, ctx)
		default: return Dev.assertNever(node)
	}
}

function convertBase(node: TypeBaseNode<any>, ctx: McdocBinderContext, options: { skipFirstIndexBody?: boolean } = {}): Omit<TypeBase, 'kind'> {
	const { attributes, indices } = TypeBaseNode.destruct(node)
	return {
		attributes: convertAttributes(attributes, ctx),
		indices: convertIndexBodies(options.skipFirstIndexBody ? indices.slice(1) : indices, ctx),
	}
}

function convertAttributes(nodes: AttributeNode[], ctx: McdocBinderContext): Attribute[] | undefined {
	return undefineEmptyArray(nodes.map(n => convertAttribute(n, ctx)))
}

function undefineEmptyArray<T>(array: T[]): T[] | undefined {
	return array.length ? array : undefined
}

function convertAttribute(node: AttributeNode, ctx: McdocBinderContext): Attribute {
	const { name, value } = AttributeNode.destruct(node)
	return {
		name: name.value,
		value: convertAttributeValue(value, ctx),
	}
}

function convertAttributeValue(node: AttributeValueNode, ctx: McdocBinderContext): AttributeValue {
	if (node.type === 'mcdoc:attribute/tree') {
		return convertAttributeTree(node, ctx)
	} else {
		return convertType(node, ctx)
	}
}

function convertAttributeTree(node: AttributeTreeNode, ctx: McdocBinderContext): AttributeTree {
	const ans: AttributeTree = {}
	const { named, positional } = AttributeTreeNode.destruct(node)

	if (positional) {
		const { values } = AttributeTreePosValuesNode.destruct(positional)
		for (const [i, child] of values.entries()) {
			ans[i] = convertAttributeValue(child, ctx)
		}
	}

	if (named) {
		const { values } = AttributeTreeNamedValuesNode.destruct(named)
		for (const { key, value } of values) {
			ans[key.value] = convertAttributeValue(value, ctx)
		}
	}

	return ans
}

function convertIndexBodies(nodes: IndexBodyNode[], ctx: McdocBinderContext): ParallelIndices[] | undefined {
	return undefineEmptyArray(nodes.map(n => convertIndexBody(n, ctx)))
}

function convertIndexBody(node: IndexBodyNode, ctx: McdocBinderContext): ParallelIndices {
	const { parallelIndices } = IndexBodyNode.destruct(node)
	return parallelIndices.map(n => convertIndex(n, ctx))
}

function convertIndex(node: IndexNode, ctx: McdocBinderContext): Index {
	return StaticIndexNode.is(node)
		? convertStaticIndex(node, ctx)
		: convertDynamicIndex(node, ctx)
}

function convertStaticIndex(node: StaticIndexNode, ctx: McdocBinderContext): StaticIndex {
	return {
		kind: 'static',
		value: asString(node),
	}
}

function convertDynamicIndex(node: DynamicIndexNode, ctx: McdocBinderContext): DynamicIndex {
	const { keys } = DynamicIndexNode.destruct(node)
	return {
		kind: 'dynamic',
		accessor: keys.map(asString),
	}
}

function convertEnum(node: EnumNode, ctx: McdocBinderContext): EnumType {
	const { block, enumKind } = EnumNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'enum',
		enumKind,
		values: convertEnumBlock(block, ctx),
	}
}

function convertEnumBlock(node: EnumBlockNode, ctx: McdocBinderContext): EnumTypeField[] {
	const { fields } = EnumBlockNode.destruct(node)
	return fields.map(n => convertEnumField(n, ctx))
}

function convertEnumField(node: EnumFieldNode, ctx: McdocBinderContext): EnumTypeField {
	const { attributes, identifier, value } = EnumFieldNode.destruct(node)
	return {
		attributes: convertAttributes(attributes, ctx),
		identifier: identifier.value,
		value: convertEnumValue(value, ctx),
	}
}

function convertEnumValue(node: EnumValueNode, ctx: McdocBinderContext): string | number | bigint {
	if (TypedNumberNode.is(node)) {
		const { value } = TypedNumberNode.destruct(node)
		return value.value
	}
	return node.value
}

function convertStruct(node: StructNode, ctx: McdocBinderContext): StructType {
	const { block } = StructNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'struct',
		fields: convertStructBlock(block, ctx),
	}
}

function convertStructBlock(node: StructBlockNode, ctx: McdocBinderContext): StructTypeField[] {
	const { fields } = StructBlockNode.destruct(node)
	return fields.map(n => convertStructField(n, ctx))
}

function convertStructField(node: StructFieldNode, ctx: McdocBinderContext): StructTypeField {
	return StructPairFieldNode.is(node)
		? convertStructPairField(node, ctx)
		: convertStructSpreadField(node, ctx)
}

function convertStructPairField(node: StructPairFieldNode, ctx: McdocBinderContext): StructTypePairField {
	const { key, type } = StructPairFieldNode.destruct(node)
	return {
		kind: 'pair',
		key: convertStructKey(key, ctx),
		type: convertType(type, ctx),
	}
}

function convertStructKey(node: StructKeyNode, ctx: McdocBinderContext): string | McdocType {
	if (StructMapKeyNode.is(node)) {
		const { type } = StructMapKeyNode.destruct(node)
		return convertType(type, ctx)
	} else {
		return asString(node)
	}
}

function convertStructSpreadField(node: StructSpreadFieldNode, ctx: McdocBinderContext): StructTypeSpreadField {
	const { attributes, type } = StructSpreadFieldNode.destruct(node)
	return {
		kind: 'spread',
		attributes: convertAttributes(attributes, ctx),
		type: convertType(type, ctx),
	}
}

function convertAny(node: AnyTypeNode, ctx: McdocBinderContext): KeywordType {
	return {
		...convertBase(node, ctx),
		kind: 'any',
	}
}

function convertBoolean(node: BooleanTypeNode, ctx: McdocBinderContext): KeywordType {
	return {
		...convertBase(node, ctx),
		kind: 'boolean',
	}
}

function convertDispatcher(node: DispatcherTypeNode, ctx: McdocBinderContext): DispatcherType {
	const { index, location } = DispatcherTypeNode.destruct(node)
	return {
		...convertBase(node, ctx, {
			skipFirstIndexBody: true,
		}),
		kind: 'dispatcher',
		index: convertIndexBody(index, ctx),
		registry: ResourceLocationNode.toString(location, 'full'),
	}
}

function convertList(node: ListTypeNode, ctx: McdocBinderContext): ListType {
	const { item, lengthRange } = ListTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'list',
		item: convertType(item, ctx),
		lengthRange: convertRange(lengthRange, ctx),
	}
}

function convertRange(node: FloatRangeNode | IntRangeNode, ctx: McdocBinderContext): NumericRange
function convertRange(node: FloatRangeNode | IntRangeNode | undefined, ctx: McdocBinderContext): NumericRange | undefined
function convertRange(node: FloatRangeNode | IntRangeNode | undefined, ctx: McdocBinderContext): NumericRange | undefined {
	if (!node) {
		return undefined
	}

	const { min, max } = FloatRangeNode.is(node) ? FloatRangeNode.destruct(node) : IntRangeNode.destruct(node)
	return [min?.value, max?.value]
}

function convertLiteral(node: LiteralTypeNode, ctx: McdocBinderContext): LiteralType {
	const { value } = LiteralTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'literal',
		value: convertLiteralValue(value, ctx),
	}
}

function convertLiteralValue(node: LiteralTypeValueNode, ctx: McdocBinderContext): LiteralValue {
	if (LiteralNode.is(node)) {
		return {
			kind: 'boolean',
			value: node.value === 'true',
		}
	} else if (TypedNumberNode.is(node)) {
		const { suffix, value } = TypedNumberNode.destruct(node)
		return {
			kind: 'number',
			value: value.value,
			suffix: convertLiteralNumberSuffix(suffix, ctx),
		}
	} else {
		return {
			kind: 'string',
			value: node.value,
		}
	}
}

function convertLiteralNumberSuffix(node: LiteralNode | undefined, ctx: McdocBinderContext): LiteralNumberSuffix | undefined {
	const suffix = node?.value as LiteralNumberCaseInsensitiveSuffix | undefined
	return suffix?.toLowerCase() as Lowercase<Exclude<typeof suffix, undefined>> | undefined
}

function convertNumericType(node: NumericTypeNode, ctx: McdocBinderContext): NumericType {
	const { numericKind, valueRange } = NumericTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: numericKind.value as NumericTypeKind,
		valueRange: convertRange(valueRange, ctx),
	}
}

function convertPrimitiveArray(node: PrimitiveArrayTypeNode, ctx: McdocBinderContext): PrimitiveArrayType {
	const { arrayKind, lengthRange, valueRange } = PrimitiveArrayTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: `${arrayKind.value as PrimitiveArrayValueKind}_array`,
		lengthRange: convertRange(lengthRange, ctx),
		valueRange: convertRange(valueRange, ctx),
	}
}

function convertString(node: StringTypeNode, ctx: McdocBinderContext): StringType {
	const { lengthRange } = StringTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'string',
		lengthRange: convertRange(lengthRange, ctx),
	}
}

function convertReference(node: ReferenceTypeNode, ctx: McdocBinderContext): ReferenceType {
	const { path, typeParameters } = ReferenceTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'reference',
		path: pathArrayToString(resolvePath(ctx, path)),
		typeParameters: undefineEmptyArray(typeParameters.map(n => convertType(n, ctx))),
	}
}

function convertTuple(node: TupleTypeNode, ctx: McdocBinderContext): TupleType {
	const { items } = TupleTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'tuple',
		items: items.map(n => convertType(n, ctx)),
	}
}

function convertUnion(node: UnionTypeNode, ctx: McdocBinderContext): UnionType {
	const { members } = UnionTypeNode.destruct(node)
	return {
		...convertBase(node, ctx),
		kind: 'union',
		members: members.map(n => convertType(n, ctx)),
	}
}

function asString(node: IdentifierNode | LiteralNode | StringNode | ResourceLocationNode): string {
	if (ResourceLocationNode.is(node)) {
		return ResourceLocationNode.toString(node, 'short')
	}
	return node.value
}