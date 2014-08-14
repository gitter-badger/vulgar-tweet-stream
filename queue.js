exports.Queue = function(flushTarget, limit) {
  var queue = [],
  queueSize = limit || 96;

  this.add = function(item) {
    queue.push(item);
    if (queue.length >= queueSize)
      this.flush();
  };

  this.flush = function(){
    console.log("Flushing ", limit, " items..");
    flushTarget(queue);
    queue = [];
  };
};
