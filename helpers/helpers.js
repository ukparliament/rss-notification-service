const helpers = {
  /**
   * Returns a promise after a set amount of time
   * @param  {integer} ms Time in MS to wait before returning a promise
   * @return {Promise}
   */
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(() => resolve('Awake!'), ms);
    });
  }
};

module.exports = helpers;
