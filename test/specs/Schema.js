const expect = require('chai').expect;
const sinon = require('sinon');
const Schema = require('../../lib/Schema');
const Log = require('../../lib/Log');
const jsSchemas = require('../data/js-schemas');
const jsonSchemas = require('../data/json-schemas');

const schemaKeywords = [
    'name',
    'type',
    'items',
    'properties',
    'default',
    'validate',
    'required'
];

const allowedTypes = [
    'number',
    'integer',
    'float',
    'boolean',
    'string',
    'array',
    'object'
];

function validate(schema) {
    expect(schema).to.be.instanceof(Schema);

    expect(schema).to.have.property('type');
    expect(schema.type).to.be.a('string');
    expect(allowedTypes).to.include(schema.type);

    if (schema.type === 'array') {
        expect(schema).to.have.property('items');
        validate(schema.items);
    }

    else if (schema.type === 'object') {
        expect(schema).to.have.property('properties');
        expect(schema.properties).to.be.an('object');

        Object.keys(schema.properties).forEach(property => {
            validate(schema.properties[property]);
        });
    }
    
    expect(schema).to.have.property('name');
    expect(schema.name).to.be.a('string');
    
    expect(schema).to.have.property('parent');
    expect(typeof schema.parent).to.be.equal('object');

    if (schema.required === void 0) console.log(schema);
    expect(schema).to.have.property('required');
    expect(schema.required).to.be.a('boolean');

    expect(schema).to.have.property('default');
    expect(schema.typeOf(schema.default)).to.be.equal(schema.type);

    expect(schema).to.have.property('validate');
    expect(schema.validate).to.be.a('function');

    expect(schema).to.have.property('options');
    expect(schema.options).to.be.an('object');
}

describe('Schema', () => {
    it('should have options defined', () => {
        expect(Schema.options).not.to.be.undefined;
    });

    describe('Schema.create()', () => {
        it('Should return object of type Schema', () => {
            expect(Schema.create({}) instanceof Schema).to.be.true;
        });
        it('should construct different type of schemas correctly', () => {
            expect(new Schema({}).type).to.be.equal('object');
            expect(new Schema([]).type).to.be.equal('array');
            expect(new Schema(Number).type).to.be.equal('number');
            expect(new Schema().type).to.be.equal('object');
            expect(new Schema(null).type).to.be.equal('object');
        });
        it('should construct complex schemas correctly', () => {
            jsSchemas.forEach(def => validate(Schema.create(def)));
            jsonSchemas.forEach(def => validate(Schema.create(def)));
        });
    });

    describe('Schema.definitionOf()', () => {
        it('should return canonical schema definition of the given schema ' +
            'object', () =>
        {
            let schema = Schema.create(Number);
            let def = Schema.definitionOf(schema);

            Object.keys(def).forEach(prop => {
                expect(!~schemaKeywords.indexOf(prop)).to.be.false;
            });
        });

        it('should use caching for constructing schema definition', () => {
            let schema = Schema.create({
                name: String('test'),
                numbers: [Number],
                someField: Log
            });
            let def = Schema.definitionOf(schema);

            expect(schema.definition).not.to.be.undefined;
            expect(schema.definition).to.be.equal(def);

            Schema.definitionOf(schema);

            expect(schema.definition).to.be.equal(def);
        });

        it('should throw error if a given schema object is invalid', () => {
            expect(() => Schema.definitionOf({})).to.throw(TypeError);
        });
    });

    describe('Schema.root()', () => {

    });

    describe('Schema.cast()', () => {

    });

    describe('Schema.parse()', () => {

    });

    describe('Schema.typeOf()', () => {

    });

    describe('Schema.toJSON()', () => {

    });
});
