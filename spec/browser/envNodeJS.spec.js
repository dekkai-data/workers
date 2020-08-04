/* global chai */

import {isNodeJS} from '../../build/lib/envNodeJS.js';

describe('envNodeJS', function() {
    it('isNodeJS should return `false` when running in the browser', function() {
        chai.expect(isNodeJS()).to.equal(false);
    });
});
