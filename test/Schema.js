const expect = require('chai').expect;
const sinon = require('sinon');
const Schema = require('../lib/Schema');
const Log = require('../lib/Log');

const schemaKeywords = [
    'name',
    'type',
    'items',
    'properties',
    'default',
    'validate'
];

describe('Schema', () => {
    it('should have options defined', () => {
        expect(Schema.options).not.to.be.undefined;
    });

    describe('Schema.create()', () => {
        it('Should return object of type Schema', () => {
            expect(Schema.create({}) instanceof Schema).to.be.true;
        });
        it('should construct different schemas correctly', () => {
            expect(new Schema({}).type).to.be.equal('object');
            expect(new Schema([]).type).to.be.equal('array');
            expect(new Schema(Number).type).to.be.equal('number');
            expect(new Schema().type).to.be.equal('object');
            expect(new Schema(null).type).to.be.equal('object');
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
