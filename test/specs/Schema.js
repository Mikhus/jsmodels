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
    expect(['function', 'string']).to.include(typeof schema.validate);

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
        it('should return most top parent of the given schema', () => {
            let rootSchema = Schema.create(jsSchemas[0]);

            expect(rootSchema.properties.addresses.items.root())
                .to.be.equal(rootSchema);
            expect(rootSchema.properties.addresses.items.properties.country.root())
                .to.be.equal(rootSchema);
        });
    });

    describe('Schema.cast()', () => {
        it('should properly cast given value to integer', () => {
            let schema = new Schema();

            expect(schema.cast('1', 'integer')).to.be.a('number');
            expect(Number.isInteger(schema.cast('1', 'integer'))).to.be.true;
            expect(schema.cast('1', 'integer')).to.be.equal(1);

            expect(schema.cast(Number, 'integer')).to.be.a('number');
            expect(Number.isInteger(schema.cast(Number, 'integer'))).to.be.true;
            expect(schema.cast(Number, 'integer')).to.be.equal(0);

            expect(schema.cast(NaN, 'integer')).to.be.a('number');
            expect(Number.isInteger(schema.cast(NaN, 'integer'))).to.be.true;
            expect(schema.cast(NaN, 'integer')).to.be.equal(0);

            expect(schema.cast(Infinity, 'integer')).to.be.a('number');
            expect(Number.isInteger(schema.cast(Infinity, 'integer'))).to.be.true;
            expect(schema.cast(Infinity, 'integer')).to.be.equal(0);

            expect(schema.cast({}, 'integer')).to.be.a('number');
            expect(Number.isInteger(schema.cast({}, 'integer'))).to.be.true;
            expect(schema.cast({}, 'integer')).to.be.equal(0);

            expect(schema.cast(true, 'integer')).to.be.a('number');
            expect(Number.isInteger(schema.cast(true, 'integer'))).to.be.true;
            expect(schema.cast(true, 'integer')).to.be.equal(1);

            expect(schema.cast(()=>{}, 'integer')).to.be.a('number');
            expect(Number.isInteger(schema.cast(()=>{}, 'integer'))).to.be.true;
            expect(schema.cast(()=>{}, 'integer')).to.be.equal(0);
        });

        it('should properly cast given value to float', () => {
            let schema = new Schema();

            expect(schema.cast('1.1', 'float')).to.be.a('number');
            expect(Number.isInteger(schema.cast('1.1', 'float'))).to.be.false;
            expect(schema.cast('1.1', 'float')).to.be.equal(1.1);

            expect(schema.cast(Number, 'float')).to.be.a('number');
            expect(schema.cast(Number, 'float')).to.be.equal(0);

            expect(schema.cast(NaN, 'float')).to.be.a('number');
            expect(schema.cast(NaN, 'float')).to.be.equal(0);

            expect(schema.cast(Infinity, 'float')).to.be.a('number');
            expect(schema.cast(Infinity, 'float')).to.be.equal(0);

            expect(schema.cast({}, 'float')).to.be.a('number');
            expect(schema.cast({}, 'float')).to.be.equal(0);

            expect(schema.cast(true, 'float')).to.be.a('number');
            expect(schema.cast(true, 'float')).to.be.equal(1);

            expect(schema.cast(()=>{}, 'float')).to.be.a('number');
            expect(schema.cast(()=>{}, 'float')).to.be.equal(0);
        });

        it('should properly cast given value to number', () => {
            let schema = new Schema();

            expect(schema.cast('1', 'number')).to.be.a('number');
            expect(schema.cast('1', 'number')).to.be.equal(1);

            expect(schema.cast(Number, 'number')).to.be.a('number');
            expect(schema.cast(Number, 'number')).to.be.equal(0);

            expect(schema.cast(NaN, 'number')).to.be.a('number');
            expect(schema.cast(NaN, 'number')).to.be.equal(0);

            expect(schema.cast(Infinity, 'number')).to.be.a('number');
            expect(schema.cast(Infinity, 'number')).to.be.equal(0);

            expect(schema.cast({}, 'number')).to.be.a('number');
            expect(schema.cast({}, 'number')).to.be.equal(0);

            expect(schema.cast(true, 'number')).to.be.a('number');
            expect(schema.cast(true, 'number')).to.be.equal(1);

            expect(schema.cast(()=>{}, 'number')).to.be.a('number');
            expect(schema.cast(()=>{}, 'number')).to.be.equal(0);
        });

        it('should properly cast given value to boolean', () => {
            let schema = new Schema();

            expect(schema.cast('true', 'boolean')).to.be.a('boolean');
            expect(schema.cast(Boolean, 'boolean')).to.be.false;
            expect(schema.cast('true', 'boolean')).to.be.true;
            expect(schema.cast('false', 'boolean')).to.be.true;
            expect(schema.cast(true, 'boolean')).to.be.true;
            expect(schema.cast(false, 'boolean')).to.be.false;
            expect(schema.cast(NaN, 'boolean')).to.be.false;
            expect(schema.cast(Infinity, 'boolean')).to.be.true;
            expect(schema.cast(-Infinity, 'boolean')).to.be.true;
            expect(schema.cast({}, 'boolean')).to.be.true;
            expect(schema.cast([], 'boolean')).to.be.true;
            expect(schema.cast('', 'boolean')).to.be.false;
            expect(schema.cast(null, 'boolean')).to.be.false;
            expect(schema.cast(void 0, 'boolean')).to.be.false;
            expect(schema.cast(undefined, 'boolean')).to.be.false;
        });

        it('should properly cast given value to function', () => {
            let schema = new Schema();
            let func = ()=>{};

            expect(schema.cast(func, 'function')).to.be.a('function');
            expect(schema.cast(func, 'function')).to.be.equal(func);

            expect(schema.cast({}, 'function')).to.be.a('function');
            // expect(schema.cast({}, 'function').toString())
            //     .to.be.equal(func.toString());

            expect(schema.cast(false, 'function')).to.be.a('function');
            // expect(schema.cast(false, 'function').toString())
            //     .to.be.equal(func.toString());

            expect(schema.cast(Date, 'function')).to.be.a('function');
            expect(schema.cast(Date, 'function')).to.be.equal(Date);
        });

        it('should properly cast given value to object', () => {
            let schema = new Schema();

            expect(schema.cast(null, 'object')).to.be.an('object');
            expect(schema.cast(undefined, 'object')).to.be.an('object');
            expect(schema.cast(void 0, 'object')).to.be.an('object');
            expect(schema.cast(Date, 'object')).to.be.an('object');
            expect(schema.cast(Object, 'object')).to.be.an('object');
            expect(schema.cast(false, 'object')).to.be.an('object');
            expect(schema.cast('', 'object')).to.be.an('object');
            expect(schema.cast({}, 'object')).to.be.an('object');
        });

        it('should properly cast given value to an array', () => {
            let schema = new Schema();

            expect(schema.cast(Array, 'array')).to.be.instanceof(Array);
            expect(schema.cast(Array, 'array').length).to.be.equal(0);

            expect(schema.cast('123', 'array')).to.be.eql(['1', '2', '3']);

            expect(schema.cast([], 'array')).to.be.instanceof(Array);
            expect(schema.cast([], 'array')).to.be.eql([]);

            expect(schema.cast({}, 'array')).to.be.instanceof(Array);
            expect(schema.cast({}, 'array')).to.be.eql([]);

            expect(schema.cast(null, 'array')).to.be.instanceof(Array);
            expect(schema.cast(null, 'array')).to.be.eql([]);

            expect(schema.cast(void 0, 'array')).to.be.instanceof(Array);
            expect(schema.cast(void 0, 'array')).to.be.eql([]);

            expect(schema.cast(false, 'array')).to.be.instanceof(Array);
            expect(schema.cast(false, 'array')).to.be.eql([]);

            expect(schema.cast([1, 2, 3, 4], 'array')).to.be.instanceof(Array);
            expect(schema.cast([1, 2, 3, 4], 'array')).to.be.eql([1, 2, 3, 4]);
        });
    });

    describe('Schema.toJSON()', () => {
        it('should return valid json', () => {
            let schema = new Schema(jsSchemas[0]);
            let json = schema.toJSON();

            expect(json).to.be.an('object');
            expect(() => JSON.stringify(json)).to.not.throw(Error);
            expect(() => schema.toJSON(2)).to.not.throw(Error);
            expect(schema.toJSON(2)).to.be.a('string');
            expect(() => JSON.parse(schema.toJSON(2))).to.not.throw(Error);
        });

        it('should be automatically called on serialization', () => {
            let schema = new Schema(jsSchemas[0]);
            let spy = sinon.spy(schema, 'toJSON');
            let json = JSON.stringify(schema);

            expect(spy.called).to.be.true;
            expect(() => JSON.parse(json)).to.not.throw(Error);
            expect(json).to.be.equal(JSON.stringify(schema.toJSON()));
        });
    });

    describe('Schema.parse()', () => {
        it('should mark properties, begining with "?" char as not ' +
            'required', () =>
        {
            let schema = Schema.parse(jsSchemas[0]);

            expect(schema.properties.email.required).to.be.false;
            expect(schema.properties.addresses.items.properties.country.required)
                .to.be.false;
        });
    });

    describe('Schema.typeOf()', () => {

    });
});
