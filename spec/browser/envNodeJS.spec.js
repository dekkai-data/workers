/* global chai */

import {isNodeJS} from '../../dist/envNodeJS.js';

describe('envNodeJS', function() {
    it('isNodeJS should return `false` when running in the browser', function() {
        chai.expect(isNodeJS()).to.equal(false);
    });
});
