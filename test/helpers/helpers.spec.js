const { assert } = require('chai'),
      helpers = require('../../helpers/helpers.js');

describe('Helpers', () => {

  describe('sleep', () => {
    it('waits X amount of milliseconds before returning a resolved promise', async () => {
      const res = await helpers.sleep(100);
      return assert.equal(res, 'Awake!');
    });
  });

});
