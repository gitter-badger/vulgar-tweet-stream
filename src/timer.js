var value = 0;

module.exports = function(){ 

  var value = 0,
  timer = function(callback, time){ 
    time = time || 1000;
    var loop = function() { 
      callback(value); 
      value = 0; 
      setTimeout(loop, time); 
    };
    loop();
  }, increment = function() { value += 1; };
  return { timer: timer, increment: increment };
};
