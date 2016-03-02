[![Build Status](https://travis-ci.org/geggleto/circuit-breaker-js.svg?branch=master)](https://travis-ci.org/geggleto/circuit-breaker-js)

# circuit-breaker-js

This package implements the Circuit Breaker pattern. Circuit breakers are useful for stopping and raising events/notifications about system problems. In complex distrubuted applications it is hard to gracefully handle remote dependent failures. 

# Services

The breaker allows you to register multiple "services". The states of each service are held in memory

Each service has 5 properties.
  - State
  - Retry Threshold (milliseconds)
  - Failure Threshold
  - Tripped Handler
  - Failure Counter

# Process Flow
  To use the breaker, you simply register your services and execute code via the .try(service, callback) method.
  Your callback should return either TRUE for success, or FALSE in the even there was a problem.
  try will return a boolean value representing the success or failure of the callback.
  
  When the Failure Threshold is hit, the following will happen.
    - The breaker will go from CLOSED ==> OPEN
    - If a handler is present, it will be excuted.
    - A timer basd on Retry Threshold will be executed
      - This will set the breaker from OPEN to RETRY
      - The fail count remains at maximum. The system will now execute one more request through the breaker
      - Upon success the failcount will return to 0 and the state will be RETRY ==> CLOSED
      - If the next request fails, then the process will repeat until it is successful.
      - ***PLEASE NOTE THAT THE TRIPPED HANDLER WILL BE EXECUTED EACH TIME THE BREAKER IS RESET TO "RETRY"***


# Example Breaker Usage

```js
var breaker = require('circuit-breaker-js');

breaker.registerService('MyService', 100, 5000); //100 fails, 5 seconds

breaker.registerHandler('MyService', function () {
  //I should alert someone with this code
});

var result = breaker.try('MyService', service.action());
```
  
  
