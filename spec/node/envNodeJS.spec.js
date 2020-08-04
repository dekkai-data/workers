import chai from 'chai';
import {isNodeJS, getModule} from '../../build/lib/envNodeJS.js';

describe('envNodeJS', function() {
    it('isNodeJS should return `true` when running in node', function() {
        chai.expect(isNodeJS()).to.equal(true);
    });

    it('can load modules at runtime', async function() {
        const loadedFS = await getModule('fs');
        chai.expect(typeof loadedFS.readFile).to.equal('function');
    });
});
