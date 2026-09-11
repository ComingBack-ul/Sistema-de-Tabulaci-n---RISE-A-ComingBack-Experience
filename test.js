const jwt = require('jsonwebtoken');
console.log(jwt.sign({ role: 'admin' }, 'secret'));
