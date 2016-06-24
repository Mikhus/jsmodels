const expect = require('chai').expect;
const sinon = require('sinon');
const Schema = require('../../lib/Schema');
const Observer = require('../../lib/Observer');
const Subscriber = require('../mocks/Subscriber');
const jsSchemas = require('../data/js-schemas');
const fs = require('fs');

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

        it('should observe complex data recursively', () => {
            let schema = Schema.create(jsSchemas[0]);
            let errors = [];
            let subscriber = new Subscriber();
            let data = Observer.observe({
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            }, schema, errors, subscriber);

            expect(data.__isObserved__).to.be.true;
            expect(data.rates.__isObserved__).to.be.true;
            expect(data.addresses.__isObserved__).to.be.true;
        });

        it('should raise proper errors on data invalidate', () => {
            let schema = Schema.create(jsSchemas[0]);
            let errors = [];
            let subscriber = new Subscriber();
            let data = Observer.observe({
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            }, schema, errors, subscriber);

            data.firstName = 20;

            expect(errors[0].code).to.be.equal(Observer.ERROR_TYPE);

            delete data.lastName;

            expect(errors[1].code).to.be.equal(Observer.ERROR_REQUIRED);
        });

        it('should emit invalidate events on subscribes when invalid data is ' +
            'assigned', () =>
        {
            let schema = Schema.create(jsSchemas[0]);
            let errors = [];
            let subscriber = new Subscriber();
            let data = Observer.observe({
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            }, schema, errors, subscriber);
            let spy = sinon.spy(subscriber, 'emit');

            data.firstName = 20;

            expect(spy.calledWith('invalidate', errors[0])).to.be.true;
        });

        it('should generate errors with full trace if specified', () => {
            Observer.options.fullTrace = true;

            let schema = Schema.create(jsSchemas[0]);
            let errors = [];
            let subscriber = new Subscriber();
            let data = Observer.observe({
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            }, schema, errors, subscriber);

            data.firstName = 20;

            expect(errors[0]).to.have.property('stack');
            expect(errors[0].stack).to.be.instanceof(Array);
            expect(errors[0].stack.length).to.be.above(0);
            Observer.options.fullTrace = false;
        });
        
        it('should not generate any trace info if it is forbidden', () => {
            Observer.options.traceErrors = false;
            Observer.options.fullTrace = true;

            let schema = Schema.create(jsSchemas[0]);
            let errors = [];
            let subscriber = new Subscriber();
            let data = Observer.observe({
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            }, schema, errors, subscriber);

            data.firstName = 20;

            expect(errors[0]).not.to.have.property('fileName');
            expect(errors[0]).not.to.have.property('lineNumber');
            expect(errors[0]).not.to.have.property('columnNumber');
            expect(errors[0]).not.to.have.property('stack');

            Observer.options.traceErrors = true;
            Observer.options.fullTrace = false;
        });
        
        it('should raise error with the proper trace', () => {
            let schema = Schema.create(jsSchemas[0]);
            let errors = [];
            let subscriber = new Subscriber();
            let data = Observer.observe({
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            }, schema, errors, subscriber);

            data.firstName = 20;

            expect(errors[0].fileName).to.be.equal(fs.realpathSync(__filename));
            expect(errors[0].lineNumber).to.be.equal(162);
            expect(errors[0].columnNumber).to.be.equal(28);
        });

        it('should raise errors for internal recursively for complex ' +
            'schemas', () =>
        {
            let schema = Schema.create(jsSchemas[0]);
            let errors = [];
            let subscriber = new Subscriber();
            let data = Observer.observe({
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            }, schema, errors, subscriber);

            data.addresses.push({});

            expect(errors.length).to.be.equal(3);
            errors.forEach(err =>
                expect(err.code).to.be.equal(Observer.ERROR_REQUIRED));
        });
    });

    describe('Observer.merge()', () => {

    });
});
