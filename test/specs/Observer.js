const expect = require('chai').expect;
const sinon = require('sinon');
const Schema = require('../../lib/Schema');
const Observer = require('../../lib/Observer');
const Subscriber = require('../mocks/Subscriber');

describe('Observer', () => {
    it('should have options defined', () => {
        expect(Observer).to.have.property('options');
        expect(Observer.options).to.be.an('object');
    });
    it('should automatically merge options on assign', () => {
        let spy = sinon.spy(Object, 'assign');

        Observer.options = {};

        expect(Object.assign.called).to.be.true;
        expect(Observer.options).to.have.all.keys([
            'traceErrors',
            'fullTrace',
            'allowInvalid'
        ]);
    });

    describe('Observer.observe()', () => {
        it('should throw if invalid schema given', () => {
            expect(() => Observer.observe()).to.throw(TypeError);
        });

        it('should throw if invalid subscriber given', () => {
            expect(() => Observer.observe('', new Schema(''))).to.throw(TypeError);
        });

        it('should not throw if valid data, schema and subscriber are ' +
            'bypassed', () =>
        {
            expect(() => Observer.observe(
                '', Schema.create(''), [], new Subscriber()
            )).to.not.throw(Error);
        });

        it('should return primitive value for primitive schemas', () => {

        });

        it('should return observed proxy for complex schemas', () => {
            
        });
    });

    describe('Observer.merge()', () => {

    });
});
