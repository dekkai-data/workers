import chai from 'chai';
import {isNodeJS} from '../../dist/isNodeJS.js';

describe('isNodeJS', function() {
    it('should return `true` when running in node', function() {
        chai.expect(isNodeJS()).to.equal(true);
    });
});
