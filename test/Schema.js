const expect = require('chai').expect;
const sinon = require('sinon');
const Schema = require('../lib/Schema');
const Log = require('../lib/Log');

describe('Schema', () => {
    it('should have options defined', () => {
        expect(Schema.options).not.to.be.undefined;
    });
    it('should have refer Log through read-only log property', () => {
        expect(Schema.log).to.equal(Log);
        expect(() => Schema.log = console).to.not.throw;
        expect(Schema.log).to.equal(Log);
    });

    describe('Schema.create()', () => {
        it('Should return object of type Schema', () => {
            expect(Schema.create({}) instanceof Schema).to.be.true;
        });
    });

    describe('Schema.parse()', () => {

    });

    describe('Schema.typeOf()', () => {

    });

    describe('Schema.definitionOf()', () => {

    });

    describe('Schema.toJSON()', () => {

    });

    describe('Schema.validate()', () => {

    });

    describe('Schema.constructor()', () => {

    });
});
