var EventEmitter = require("events");

class Stopwatch extends EventEmitter {
  constructor(countDownMS, options) {
    super();

    this.STATUS = {
      STOPPED: 0,
      RUNNING: 1,
      COMPLETE: 2
    };

    this.stoptime = 0; // the time the clock has been paused at
    this.refTime = 0; // reference time when started

    this.tickTimer = 0; // interval timer for updateTime

    this.almostDoneFired = false; // true if almostDone event has been fired (prevent mlti hits)
    this.doneFired = false; // true if done event has been fired (prevent multi hits)

    this.countDownMS = countDownMS || false;
    this.ms = this.countDownMS || 0;
    this._elapsedMS = 0; // number if elapsed milliseconds
    this.state = this.STATUS.STOPPED; // current status of the timer-stopwatch

    //// options
    if (!options) {
      options = {};
    }
    this.refreshRateMS = options.refreshRateMS || 50;
    this.almostDoneMS = options.almostDoneMS || 10000;

    //// init
    this.reset(countDownMS);

    return this; // for chaining
  }

  /**
   * Start the timer
   */
  start() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
    this.state = this.STATUS.RUNNING;

    this.refTime = new Date().getTime();
    this.refTime -= this._elapsedMS;

    this.tickTimer = setInterval(() => {
      this._updateTime();
    }, this.refreshRateMS);

    this._updateTime();
  }

  /**
   * Stops the timer
   *
   * Emits the event forcestop,
   * with one parameter passed to the callback,
   * that consists of the elapsed time.
   */
  stop() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }
    if (this.state === this.STATUS.RUNNING) {
      this.state = this.STATUS.STOPPED; // prevents updatedTime being called in an infinite loop
      this._updateTime();
      this.emit("stop");
      this.emit("forcestop"); // for backwards compatability. Will be depreciated
    }
  }

  /**
   * Stop a timer, and reset it to it's defaults.
   * Change the countdown value, if a paramter is provided.
   *
   * @param {Integer} Milliseconds to set the timer to.
   */
  reset(countDownMS) {
    this.stop();
    this.state = this.STATUS.STOPPED;
    this.doneFired = false;
    this.almostDoneFired = false;
    this._elapsedMS = 0;
    this.refTime = new Date().getTime();

    if (countDownMS) {
      this.countDownMS = countDownMS;
    }
    this.ms = this.countDownMS || 0;

    this.emit("time", { ms: this.ms, seconds: Math.round(this.ms / 1000) });
  }

  /**
   * Toggle the state of the timer.
   * If one of start or stop is given as a argument to the
   * function then the timer will be forced into that state.
   *
   * If no argument is given, then the timer's state will be toggled
   * between start and stop.
   * i.e. The timer will be stopped, if it is running, and the timer
   * will be started if the timer is already stopped.
   *
   * @param {String} start|stop Optional paramter.
   * @returns {Boolean} true if the timer is running, false otherwise.
   */

  startstop() {
    if (this.isStopped()) {
      this.start();
      return true;
    } else {
      this.stop();
      return false;
    }
  }

  /**
   * Updates the time
   * @private
   */
  _updateTime() {
    if (this.countDownMS > 0) {
      this._timerCountdown();
    } else {
      this._stopwatchCountup();
    }
  }

  /**
   * Updates the time for timer
   * @private
   */
  _timerCountdown() {
    var currentTime = new Date().getTime();
    //Find the difference between current time and start time.
    this._elapsedMS = currentTime - this.refTime;

    var remainingSeconds = this.countDownMS - this._elapsedMS;
    if (remainingSeconds < 0) {
      remainingSeconds = 0;
    }

    this.ms = remainingSeconds;
    this.emit("time", { ms: this.ms, seconds: Math.round(this.ms / 1000) });
    if (remainingSeconds <= 0 && !this.isStopped()) {
      this.stop(); // stop the clock
      if (!this.doneFired) {
        this.doneFired = true;
        this.state = this.STATUS.COMPLETE;
        this.emit("done");
      }
    } else if (remainingSeconds < this.almostDoneMS) {
      if (!this.almostDoneFired) {
        this.almostDoneFired = true;
        this.emit("almostdone");
      }
    }
  }

  /**
   * Updates the time for stopwatch
   * @private
   */
  _stopwatchCountup() {
    var currentTime = new Date().getTime();

    this._elapsedMS = currentTime - this.refTime;
    this.ms = this._elapsedMS;
    this.emit("time", { ms: this.ms, seconds: Math.round(this.ms / 1000) });
  }

  getState() {
    return this.state;
  }

  isStopped() {
    return this.state === this.STATUS.STOPPED;
  }

  isRunning() {
    return this.state === this.STATUS.RUNNING;
  }

  isComplete() {
    return this.state === this.STATUS.COMPLETE;
  }

  /**
   * Adds a callback to be fired on the done event
   * @returns {Object} itself for chaining
   */
  onDone(cb) {
    this.on("done", cb);
    return this;
  }

  /**
   * Adds a callback to be fired on the almostdone event
   * @returns {Object} itself for chaining
   */
  onAlmostDone(cb) {
    this.on("almostdone", cb);
    return this;
  }

  /**
   * Adds a callback to be fired on the time event
   * @returns {Object} itself for chaining
   */
  onTime(cb) {
    this.on("time", cb);
    return this;
  }

  /**
   * Adds a callback to be fired on the stop event
   * @returns {Object} itself for chaining
   */
  onStop(cb) {
    this.on("stop", cb);
    return this;
  }
}

module.exports = Stopwatch;
