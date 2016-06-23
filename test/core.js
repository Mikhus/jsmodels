const expect = require('chai').expect;
const sinon = require('sinon');
const core = require('../lib/core');

describe('Core API', () => {
    describe('core.isPrimitive()', () => {
        it('should return true if given type name is primitive', () => {
            expect(core.isPrimitive('number')).to.be.true;
            expect(core.isPrimitive('undefined')).to.be.true;
            expect(core.isPrimitive('boolean')).to.be.true;
            expect(core.isPrimitive('string')).to.be.true;
        });
        it('should return false if a given type name is not primitive', () => {
            expect(core.isPrimitive('object')).to.be.false;
            expect(core.isPrimitive('array')).to.be.false;
            expect(core.isPrimitive('function')).to.be.false;
        });
    });

    describe('core.isNumeric()', () => {
        it('should return true if given value could be converted to number ' +
            'type', () =>
        {
            expect(core.isNumeric('123')).to.be.true;
            expect(core.isNumeric('1.23')).to.be.true;
            expect(core.isNumeric(1)).to.be.true;
            expect(core.isNumeric(1.7)).to.be.true;
            expect(core.isNumeric(0x23)).to.be.true;
            expect(core.isNumeric(1e27)).to.be.true;
            expect(core.isNumeric('0xff')).to.be.true;
        });
        it('should return false if a given value can not be converted to ' +
            'number type', () =>
        {
            expect(core.isNumeric('string')).to.be.false;
            expect(core.isNumeric({})).to.be.false;
            expect(core.isNumeric([])).to.be.false;
            expect(core.isNumeric(void 0)).to.be.false;
            expect(core.isNumeric(false)).to.be.false;
            expect(core.isNumeric(() => {})).to.be.false;
        });
    });

    describe('core.isPlainObject()', () => {
        it('should return true if a given value is plain JavaScript ' +
            'object', () =>
        {
            expect(core.isPlainObject({})).to.be.true;
            expect(core.isPlainObject({ a: 1, b: 2 })).to.be.true;
            expect(core.isPlainObject(Object())).to.be.true;
            expect(core.isPlainObject(Object.create({}))).to.be.true;
            expect(core.isPlainObject(new Object())).to.be.true;
        });

        it('should be falsy if a given value is not pure object', () => {
            expect(core.isPlainObject(null)).to.be.false;
            expect(core.isPlainObject(new Function())).to.be.false;
            expect(core.isPlainObject(void 0)).to.be.false;
            expect(core.isPlainObject(true)).to.be.false;
            expect(core.isPlainObject([])).to.be.false;
            expect(core.isPlainObject(new (class A {}))).to.be.false;
            expect(core.isPlainObject(new Date())).to.be.false;
            expect(core.isPlainObject(new Boolean())).to.be.false;
            expect(core.isPlainObject(String())).to.be.false;
        });
    });

    describe('core.isEmptyObject()', () => {
        it('should return true if given value is a plain javascript object ' +
            'which contains no properties, false otherwise', () =>
        {
            expect(core.isEmptyObject({})).to.be.true;
            expect(core.isEmptyObject({ a: 1 })).to.be.false;
        });
    });

    describe('core.isPlainObject()', () => {
        it('should return true if given path in a given object ' +
            'properties', () =>
        {
            let obj = {
                a: { b: { c: { d: '' } } },
                2.35: undefined,
                75: null
            };
            obj[void 0] = { '': 123 };

            expect(core.hasProperty(obj, 'a.b.c.d')).to.be.true;
            expect(core.hasProperty(obj, 2.35)).to.be.true;
            expect(core.hasProperty(obj, 75)).to.be.true;
            expect(core.hasProperty(obj, undefined)).to.be.true;
        });

        it('should return false if given object is not defined', () => {
            expect(core.hasProperty()).to.be.false;
            expect(core.hasProperty(void 0)).to.be.false;
            expect(core.hasProperty(undefined)).to.be.false;
        });

        it('should return false if given path is not in a given object', () => {
            let obj = {
                a: { b: { c: { d: '' } } },
                2.35: undefined,
                75: null
            };

            expect(core.hasProperty(obj, 'a.c.d.b')).to.be.false;
            expect(core.hasProperty(obj, 3.15)).to.be.false;
            expect(core.hasProperty(obj, undefined)).to.be.false;
        });
    });
});
