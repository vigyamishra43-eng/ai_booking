const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Tokens are sent in the header like: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      token = authHeader.split(' ')[1]; // extract just the token part

      // Verify the token using our secret — throws an error if invalid/expired
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to the request so later code can use req.user
      req.user = decoded; // decoded = { id: userId, iat: ..., exp: ... }

      next(); // move on to the actual route handler
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = protect;