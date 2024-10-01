const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis");

module.exports = {
  signAccessToken: (name, userId, isAdmin = false, isEmployee = false, email, profileImgUrl = "", profileImgPath = "", telefon = "") => {
    return new Promise((resolve, reject) => {
      const payload = {
        isAdmin: isAdmin,
        isEmployee: isEmployee,
        name: name,
        telefon: telefon,
        email: email,
        profileImgUrl: profileImgUrl,
        profileImgPath: profileImgPath,
      };
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "1h",
        issuer: "practice.domain.com",
        audience: userId,
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          return reject(createError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  verifyIsUserEmployee: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      if (!payload.isEmployee) {
        return next(createError.Unauthorized("Unauthorized"));
      }
      req.payload = payload;
      next();
    });
  },

  signRefreshToken: (name, userId, isAdmin = false, isEmployee = false, email, profileImgUrl = "", profileImgPath = "", telefon = "") => {
    return new Promise((resolve, reject) => {
      const payload = {
        isAdmin: isAdmin,
        isEmployee: isEmployee,
        name: name,
        telefon: telefon,
        email: email,
        profileImgUrl: profileImgUrl,
        profileImgPath: profileImgPath,
      };
      const secret = process.env.REFRESH_TOKEN_SECRET;
      const options = {
        expiresIn: "1y",
        issuer: "practice.domain.com",
        audience: userId,
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          return reject(createError.InternalServerError());
        }

        (async () => {
          try {
            await client.SET(userId, token, "EX", 365 * 24 * 60 * 60, (err, reply) => {
              if (err) {
                console.log(err);
                reject(createError.InternalServerError());
                return;
              }
              console.log(reply);
            });
          } catch (err) {
            console.error(err);
            reject(createError.InternalServerError());
            return;
          }
        })();
        console.log("refresh token set");

        resolve(token);
      });
    });
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, payload) => {
        if (err) return reject(createError.Unauthorized());
        const userId = payload.aud;
        const userIsAdmin = payload.isAdmin;
        const userIsEmployee = payload.isEmployee;
        const userName = payload.name;
        const userEmail = payload.email;
        const userTelefon = payload.telefon;
        const userImgUrl = payload.profileImgUrl;
        const userImgPath = payload.profileImgPath;
        try {
          client.GET(userId, (err, result) => {
            if (err) {
              // console.log(err.message);
              reject(createError.InternalServerError());
              return;
            }

            if (refreshToken === result) {
              resolve({ userId, userIsAdmin, userName, userIsEmployee, userEmail, userImgPath, userImgUrl, userTelefon });
            } else {
              reject(createError.Unauthorized());
            }
          });
        } catch (err) {
          console.error(err);
          reject(createError.InternalServerError());
        }
      });
    });
  },
};
