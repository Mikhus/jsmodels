const expect = require('chai').expect;
const sinon = require('sinon');
const BaseModel = require('../../lib/BaseModel');

describe('BaseModel', () => {
    it('should be abstract and throw on attempt to directly instantiate', () => {
        expect(() => new BaseModel()).to.throw(SyntaxError);
    });
});
