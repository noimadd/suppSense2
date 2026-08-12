const bcrypt = require('bcryptjs');

bcrypt.hash('password', 10).then(console.log);