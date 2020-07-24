import {isNodeJS} from '../../dist/isNodeJS.js';

describe('isNodeJS', function() {
    it('should return `false` when running in the browser', function() {
        chai.expect(isNodeJS()).to.equal(false);
    });
});
