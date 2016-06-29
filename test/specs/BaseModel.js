const expect = require('chai').expect;
const sinon = require('sinon');
const BaseModel = require('../../lib/BaseModel');
const Schema = require('../../lib/Schema');
const Log = require('../../lib/Log');
const Model = require('../mocks/Model');
const jsSchemas = require('../data/js-schemas');

describe('BaseModel', () => {
    it('should be abstract and throw on attempt to directly instantiate', () =>
    {
        expect(() => new BaseModel()).to.throw(SyntaxError);
    });

    it('should throw if schema is not bypassed', () => {
        expect(() => new Model()).to.throw(TypeError);
    });

    it('should accept schema definition and Schema as well', () => {
        expect(() => new Model(jsSchemas[0])).to.not.throw(Error);
        expect(() => new Model(Schema.create(jsSchemas[0]))).to.not.throw(Error);
    });

    describe('BaseModel.uuid', () => {
        it('should automatically assign read-only UUID to model object', () => {
            let regex = new RegExp(
                '^' +
                '[0-9a-f]{8}' +
                '-' +
                '[0-9a-f]{4}' +
                '-' +
                '[1-5][0-9a-f]{3}' +
                '-' +
                '[89ab][0-9a-f]{3}' +
                '-' +
                '[0-9a-f]{12}' +
                '$',
                'i'
            );
            let model = new Model(jsSchemas[0]);

            expect(model).to.have.property('uuid');
            expect(regex.test(model.uuid)).to.be.true;

            let oldId = model.uuid;

            expect(() => model.uuid = '123').not.to.throw(Error);
            expect(model.uuid).to.be.equal(oldId);
        });

        it('should be non-removable', () => {
            let model = new Model(jsSchemas[0]);
            let oldId = model.uuid;

            expect(() => { delete model.uuid; }).not.to.throw(Error);
            expect(model.uuid).to.be.equal(oldId);
        });
    });

    describe('BaseModel.data', () => {
        it('should automatically create default data', () => {
            let model = new Model(jsSchemas[0]);
            let expected = {
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            };

            expect(model.data).to.be.eql(expected);
        });

        it('should be non-removable', () => {
            it('should be non-removable', () => {
                let model = new Model(jsSchemas[0]);
                let oldData = JSON.stringify(model.data);

                expect(() => { delete model.data; }).not.to.throw(Error);
                expect(model.data).to.be.eql(oldData);
            });
        });

        it('should simply replace value if model data is primitive', () => {
            let model = new Model('');
            console.log(model.schema, model.isPrimitive)

            expect(model.data).to.be.equal('');

            model.data = 'foo';

            expect(model.data).to.be.equal('foo');
        });

        it('should automatically merge complex data on assignment', () => {
            let model = new Model(jsSchemas[0]);
            let newData = {
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            };
            let oldData = model.data;

            model.data = newData;

            expect(newData).to.be.not.equal(oldData);
            expect(newData).to.be.not.equal(model.data);
            expect(oldData).to.be.equal(model.data);
            expect(newData).to.be.eql(model.data);
        });
    });

    describe('BaseModel.defaults()', () => {
        it('should return valid default data object', () => {
            let model = new Model(jsSchemas[0]);
            let expected = {
                firstName: '',
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            };

            expect(model.defaults()).to.be.eql(expected);
        });
    });

    describe('BaseModel.create()', () => {
        it('should automatically instantiate very basic model from a given ' +
            'schema', () =>
        {
            let model = BaseModel.create(jsSchemas[0]);
            expect(model.constructor.name).to.be.equal('Model');
            expect(model).to.be.instanceof(BaseModel);
        });

        it('should log invalidate errors if debug mode is on', () => {
            let oldLevel = Log.LEVEL;
            let spy = sinon.spy(Log, 'debug');

            Log.LEVEL = Log.DEBUG;

            BaseModel.create(jsSchemas[0], {
                firstName: 20,
                lastName: '',
                email: '',
                rates: [],
                addresses: []
            });

            expect(Log.debug.called).to.be.true;

            Log.LEVEL = oldLevel;
        });
    });
});
