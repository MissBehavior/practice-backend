const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
// client.connect().then(() => {
//   console.log("Redis connected");
// }).catch((err) => {
//   console.log("Redis error");
//   console.log(err);
// })
client.on("connect", () => {
  console.log("Redis connected");
});

client.on("ready", () => {
  console.log("Redis ready");
});

client.on("error", (err) => {
  console.log("redis error");
  console.log(err);
});

client.on("reconnecting", () => {
  console.log("Redis reconnecting");
});
client.on("end", () => {
  console.log("Redis disconnected");
});
process.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
